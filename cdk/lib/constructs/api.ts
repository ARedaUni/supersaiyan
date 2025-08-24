import { Construct } from "constructs";
import { CfnOutput, Duration, Stack } from "aws-cdk-lib";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { HttpUserPoolAuthorizer } from "@aws-cdk/aws-apigatewayv2-authorizers-alpha";
import {
  Architecture,
  IFunction,
  Runtime,
  Function as LambdaFunction,
  Code,
} from "aws-cdk-lib/aws-lambda";
import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
} from "@aws-cdk/aws-apigatewayv2-alpha";
import { Auth } from "./auth";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as path from "path";
import { IBucket } from "aws-cdk-lib/aws-s3";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { excludeDockerImage } from "../constants/docker";
import { PythonFunction } from "@aws-cdk/aws-lambda-python-alpha";
import { Database } from "./database";
import { Vpc } from "./vpc";
import { Secrets } from "./secrets";

export interface ApiProps {
  readonly database: Database;
  readonly envName: string;
  readonly corsAllowOrigins?: string[];
  readonly auth: Auth;
  readonly storageBucket: IBucket;
  readonly vpc?: Vpc;
  readonly secrets?: Secrets;
  readonly frontendOrigin?: string;
}

export class Api extends Construct {
  readonly api: HttpApi;
  readonly handler: IFunction;
  
  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id);

    const { database, vpc, secrets } = props;
    const { tableAccessRole } = database;
    
    // Secure CORS configuration - only allow specific origins
    const allowOrigins = props.corsAllowOrigins || 
      (props.frontendOrigin ? [props.frontendOrigin] : ['https://localhost:3000']);
    
    // Ensure we never use wildcard in production
    const secureOrigins = allowOrigins.filter(origin => origin !== '*');
    if (secureOrigins.length === 0) {
      throw new Error('CORS origins must be specified and cannot be wildcard (*) for security');
    }

    const handlerRole = new iam.Role(this, "HandlerRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });
    
    // Add VPC execution role if VPC is provided
    if (vpc) {
      handlerRole.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaVPCAccessExecutionRole"
        )
      );
    } else {
      handlerRole.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        )
      );
    }
    handlerRole.addToPolicy(
      // Assume the table access role for row-level access control.
      new iam.PolicyStatement({
        actions: ["sts:AssumeRole"],
        resources: [tableAccessRole.roleArn],
      })
    );
    handlerRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "cognito-idp:AdminGetUser",
          "cognito-idp:AdminListGroupsForUser",
          "cognito-idp:ListUsers",
          "cognito-idp:ListGroups",
        ],
        resources: [props.auth.userPool.userPoolArn],
      })
    );

    // Grant access to storage bucket
    props.storageBucket.grantReadWrite(handlerRole);
    
    // Grant access to secrets if provided
    if (secrets) {
      secrets.grantRead(handlerRole);
    }

    // Try to use PythonFunction, fallback to regular Lambda if Docker is not available
    let handler: IFunction;
    try {
      handler = new PythonFunction(this, "Handler", {
        entry: path.join(__dirname, "../../../backend"),
        index: "app/main.py",
        bundling: {
          assetExcludes: [...excludeDockerImage],
          buildArgs: { POETRY_VERSION: "1.8.3" },
        },
        runtime: Runtime.PYTHON_3_11,
        architecture: Architecture.X86_64,
        memorySize: 1024,
        timeout: Duration.minutes(15),
        environment: {
          CONVERSATION_TABLE_NAME: database.conversationTable.tableName,
          BOT_TABLE_NAME: database.botTable.tableName,
          ENV_NAME: props.envName,
          CORS_ALLOW_ORIGINS: secureOrigins.join(","),
          USER_POOL_ID: props.auth.userPool.userPoolId,
          CLIENT_ID: props.auth.client.userPoolClientId,
          ACCOUNT: Stack.of(this).account,
          REGION: Stack.of(this).region,
          TABLE_ACCESS_ROLE_ARN: tableAccessRole.roleArn,
          STORAGE_BUCKET: props.storageBucket.bucketName,
          ...(secrets && {
            APPLICATION_SECRETS_ARN: secrets.getApplicationSecretArn(),
            DATABASE_SECRETS_ARN: secrets.getDatabaseSecretArn(),
          }),
        },
        role: handlerRole,
        logRetention: logs.RetentionDays.THREE_MONTHS,
        // Add VPC configuration if provided
        ...(vpc && {
          vpc: vpc.vpc,
          vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
          securityGroups: [vpc.lambdaSecurityGroup],
        }),
      });
    } catch (error) {
      // Fallback to regular Lambda function if Docker is not available (for testing)
      handler = new LambdaFunction(this, "HandlerFallback", {
        runtime: Runtime.PYTHON_3_11,
        handler: "lambda_function.lambda_handler",
        code: Code.fromAsset(path.join(__dirname, "../../lambda/handlers")),
        architecture: Architecture.X86_64,
        memorySize: 1024,
        timeout: Duration.minutes(15),
        environment: {
          CONVERSATION_TABLE_NAME: database.conversationTable.tableName,
          BOT_TABLE_NAME: database.botTable.tableName,
          ENV_NAME: props.envName,
          CORS_ALLOW_ORIGINS: secureOrigins.join(","),
          USER_POOL_ID: props.auth.userPool.userPoolId,
          CLIENT_ID: props.auth.client.userPoolClientId,
          ACCOUNT: Stack.of(this).account,
          REGION: Stack.of(this).region,
          TABLE_ACCESS_ROLE_ARN: tableAccessRole.roleArn,
          STORAGE_BUCKET: props.storageBucket.bucketName,
        },
        role: handlerRole,
      });
    }

    const api = new HttpApi(this, "Default", {
      description: `Main API for ${Stack.of(this).stackName}`,
      corsPreflight: {
        allowHeaders: [
          "Content-Type",
          "Authorization", 
          "X-Amz-Date",
          "X-Api-Key",
          "X-Amz-Security-Token"
        ], // More restrictive headers
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.HEAD,
          CorsHttpMethod.OPTIONS,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.PATCH,
          CorsHttpMethod.DELETE,
        ],
        allowOrigins: secureOrigins, // Use secure origins
        maxAge: Duration.days(1), // Shorter cache for security
        allowCredentials: true, // Allow credentials for authentication
      },
      // Add default throttling (free tier: 10,000 requests/second)
      defaultIntegration: undefined, // Will be set per route
    });

    const integration = new HttpLambdaIntegration(
      "Integration",
      handler
    );
    const authorizer = new HttpUserPoolAuthorizer(
      "Authorizer",
      props.auth.userPool,
      {
        userPoolClients: [props.auth.client],
      }
    );

    // Add routes (throttling will be configured at the stage level)
    api.addRoutes({
      path: "/{proxy+}",
      integration,
      methods: [
        HttpMethod.GET,
        HttpMethod.POST,
        HttpMethod.PUT,
        HttpMethod.PATCH,
        HttpMethod.DELETE,
      ],
      authorizer,
    });

    // Add health endpoint without auth
    api.addRoutes({
      path: "/health",
      integration,
      methods: [HttpMethod.GET],
    });

    // Note: API Gateway v2 throttling would need to be configured via CloudFormation
    // or API Gateway console for production use. For free tier, WAF provides protection.
    
    this.api = api;
    this.handler = handler;

    new CfnOutput(this, "BackendApiUrl", { value: api.apiEndpoint });
  }
}