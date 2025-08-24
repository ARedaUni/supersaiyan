import * as cdk from "aws-cdk-lib";
import { MainApplicationStack } from "../lib/main-application-stack";
import { Template } from "aws-cdk-lib/assertions";
import { Match } from "aws-cdk-lib/assertions";

describe("Professional Practice Application Stack Tests", () => {
  test("default stack creation", () => {
    const app = new cdk.App();

    const stack = new MainApplicationStack(app, "TestStack", {
      env: {
        region: "us-east-1",
        account: "123456789012",
      },
      stage: "test",
    });
    
    const template = Template.fromStack(stack);

    // Verify DynamoDB tables are created
    template.hasResourceProperties("AWS::DynamoDB::Table", {
      BillingMode: "PAY_PER_REQUEST",
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: false,
      },
    });

    // Verify S3 buckets are created with encryption
    template.hasResourceProperties("AWS::S3::Bucket", {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: "AES256",
            },
          },
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });

    // Verify Lambda function is created
    template.hasResourceProperties("AWS::Lambda::Function", {
      Runtime: "python3.11",
      Timeout: 900, // 15 minutes
    });

    // Verify API Gateway v2 is created
    template.hasResourceProperties("AWS::ApiGatewayV2::Api", {
      ProtocolType: "HTTP",
    });

    // Verify CloudFront distribution is created
    template.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: {
        DefaultRootObject: "index.html",
        Origins: Match.arrayWith([
          Match.objectLike({
            S3OriginConfig: Match.anyValue(),
          }),
        ]),
      },
    });

    // Verify WAF is created for both API and Frontend
    template.hasResourceProperties("AWS::WAFv2::WebACL", {
      Scope: "REGIONAL",
      DefaultAction: { Allow: {} },
      Rules: Match.arrayWith([
        Match.objectLike({
          Name: "AWSManagedRulesCommonRuleSet",
          Priority: 1,
        }),
      ]),
    });

    template.hasResourceProperties("AWS::WAFv2::WebACL", {
      Scope: "CLOUDFRONT",
      Rules: Match.arrayWith([
        Match.objectLike({
          Name: "AWSManagedRulesCommonRuleSet",
          Priority: 1,
        }),
      ]),
    });

    // Verify Cognito User Pool is created
    template.hasResourceProperties("AWS::Cognito::UserPool", {
      Policies: {
        PasswordPolicy: {
          RequireUppercase: true,
          RequireSymbols: true,
          RequireNumbers: true,
          MinimumLength: 8,
        },
      },
    });

    // Verify User Pool Client
    template.hasResourceProperties("AWS::Cognito::UserPoolClient", {
      ExplicitAuthFlows: Match.arrayWith(["ALLOW_USER_PASSWORD_AUTH", "ALLOW_USER_SRP_AUTH"]),
    });
  });

  test("production environment configuration", () => {
    const app = new cdk.App();
    
    const stack = new MainApplicationStack(app, "ProdStack", {
      env: {
        region: "us-east-1",
        account: "123456789012",
      },
      stage: "prod",
    });
    
    const template = Template.fromStack(stack);

    // Verify point-in-time recovery is enabled in production for DynamoDB
    template.hasResourceProperties("AWS::DynamoDB::Table", {
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true,
      },
    });
  });

  test("cognito and authentication are properly configured", () => {
    const app = new cdk.App();
    
    const stack = new MainApplicationStack(app, "AuthTestStack", {
      env: {
        region: "us-east-1",
        account: "123456789012",
      },
      stage: "test",
    });
    
    const template = Template.fromStack(stack);

    // Verify Cognito User Pool is created
    template.hasResourceProperties("AWS::Cognito::UserPool", {
      Policies: {
        PasswordPolicy: {
          RequireUppercase: true,
          RequireSymbols: true,
          RequireNumbers: true,
          MinimumLength: 8,
        },
      },
    });

    // Verify User Pool Client
    template.hasResourceProperties("AWS::Cognito::UserPoolClient", {
      ExplicitAuthFlows: Match.arrayWith(["ALLOW_USER_PASSWORD_AUTH", "ALLOW_USER_SRP_AUTH"]),
    });

    // Verify User Pool Groups are created
    template.hasResourceProperties("AWS::Cognito::UserPoolGroup", {
      GroupName: "Admin",
    });

    template.hasResourceProperties("AWS::Cognito::UserPoolGroup", {
      GroupName: "CreatingBotAllowed",
    });

    template.hasResourceProperties("AWS::Cognito::UserPoolGroup", {
      GroupName: "PublishAllowed",
    });
  });

  test("database tables are configured", () => {
    const app = new cdk.App();
    
    const stack = new MainApplicationStack(app, "DatabaseTestStack", {
      env: {
        region: "us-east-1",
        account: "123456789012",
      },
      stage: "test",
    });
    
    const template = Template.fromStack(stack);

    // Verify IAM role for table access is created
    template.hasResourceProperties("AWS::IAM::Role", {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              AWS: Match.anyValue(),
            },
          },
        ],
      },
    });
  });

  test("IAM roles and policies are properly configured", () => {
    const app = new cdk.App();
    
    const stack = new MainApplicationStack(app, "IAMTestStack", {
      env: {
        region: "us-east-1",
        account: "123456789012",
      },
      stage: "test",
    });
    
    const template = Template.fromStack(stack);

    // Verify Lambda execution role
    template.hasResourceProperties("AWS::IAM::Role", {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "lambda.amazonaws.com",
            },
          },
        ],
      },
      ManagedPolicyArns: [
        "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
      ],
    });
  });

  test("CloudWatch logging is configured", () => {
    const app = new cdk.App();
    
    const stack = new MainApplicationStack(app, "LoggingTestStack", {
      env: {
        region: "us-east-1",
        account: "123456789012",
      },
      stage: "test",
    });
    
    const template = Template.fromStack(stack);

    // Verify CloudWatch log group is created
    template.hasResourceProperties("AWS::Logs::LogGroup", {
      RetentionInDays: 90,
    });
  });

  test("outputs are created", () => {
    const app = new cdk.App();
    
    const stack = new MainApplicationStack(app, "OutputTestStack", {
      env: {
        region: "us-east-1",
        account: "123456789012",
      },
      stage: "test",
    });
    
    const template = Template.fromStack(stack);

    // Verify all required outputs exist
    template.hasOutput("ApiUrl", {
      Description: "API Gateway URL",
    });

    template.hasOutput("FrontendUrl", {
      Description: "Frontend URL",
    });

    template.hasOutput("StorageBucketName", {
      Description: "S3 storage bucket name",
    });

    template.hasOutput("UserPoolId", {
      Description: "Cognito User Pool ID",
    });

    template.hasOutput("UserPoolClientId", {
      Description: "Cognito User Pool Client ID",
    });
  });

  test("database and resources are properly configured", () => {
    const app = new cdk.App();
    
    const stack = new MainApplicationStack(app, "ResourceTestStack", {
      env: {
        region: "us-east-1",
        account: "123456789012",
      },
      stage: "test",
    });
    
    const template = Template.fromStack(stack);

    // Verify DynamoDB tables are created (conversation and bot tables)
    template.resourceCountIs("AWS::DynamoDB::Table", 3); // ConversationTable, BotTable, WebsocketSessionTable

    // Verify both WAF stacks create WebACLs
    template.resourceCountIs("AWS::WAFv2::WebACL", 2); // API WAF and Frontend WAF
  });

  test("stack synthesis succeeds", () => {
    const app = new cdk.App();
    
    const stack = new MainApplicationStack(app, "SynthTestStack", {
      env: {
        region: "us-east-1",
        account: "123456789012",
      },
      stage: "test",
    });

    // This will throw if synthesis fails
    expect(() => {
      app.synth();
    }).not.toThrow();
  });

  test("security configurations are properly set up", () => {
    const app = new cdk.App();
    
    const stack = new MainApplicationStack(app, "SecurityTestStack", {
      env: {
        region: "us-east-1",
        account: "123456789012",
      },
      stage: "test",
    });
    
    const template = Template.fromStack(stack);

    // Verify VPC is created
    template.hasResourceProperties("AWS::EC2::VPC", {
      CidrBlock: "10.0.0.0/16",
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });

    // Verify VPC Endpoints are created (for free tier cost optimization)
    template.hasResourceProperties("AWS::EC2::VPCEndpoint", {
      ServiceName: Match.stringLikeRegexp(".*dynamodb.*"),
      VpcEndpointType: "Gateway",
    });

    template.hasResourceProperties("AWS::EC2::VPCEndpoint", {
      ServiceName: Match.stringLikeRegexp(".*s3.*"),
      VpcEndpointType: "Gateway",
    });

    // Verify Secrets Manager secrets are created
    template.hasResourceProperties("AWS::SecretsManager::Secret", {
      Name: Match.stringLikeRegexp(".*/application/secrets"),
    });

    template.hasResourceProperties("AWS::SecretsManager::Secret", {
      Name: Match.stringLikeRegexp(".*/database/credentials"),
    });

    // Verify KMS key is created with key rotation
    template.hasResourceProperties("AWS::KMS::Key", {
      EnableKeyRotation: true,
    });

    // Verify DynamoDB tables use customer-managed encryption
    template.hasResourceProperties("AWS::DynamoDB::Table", {
      SSESpecification: {
        SSEEnabled: true,
        KMSMasterKeyId: Match.anyValue(),
      },
    });

    // Verify Lambda function is in VPC
    template.hasResourceProperties("AWS::Lambda::Function", {
      VpcConfig: {
        SecurityGroupIds: Match.anyValue(),
        SubnetIds: Match.anyValue(),
      },
    });

    // Verify Security Groups are restrictive
    template.hasResourceProperties("AWS::EC2::SecurityGroup", {
      GroupDescription: "Security group for Lambda functions",
      SecurityGroupEgress: [
        {
          CidrIp: "0.0.0.0/0",
          IpProtocol: "tcp",
          FromPort: 443,
          ToPort: 443,
        },
      ],
    });

    // Verify CloudWatch Log Groups are encrypted
    template.hasResourceProperties("AWS::Logs::LogGroup", {
      KmsKeyId: Match.anyValue(),
    });

    // Verify CloudWatch Alarms are created for security monitoring
    template.hasResourceProperties("AWS::CloudWatch::Alarm", {
      AlarmName: Match.stringLikeRegexp(".*throttle.*"),
      ComparisonOperator: "GreaterThanThreshold",
    });

    // Verify SNS topic for security alerts
    template.hasResourceProperties("AWS::SNS::Topic", {
      DisplayName: "Security Alerts",
    });
  });

  test("CORS is configured securely", () => {
    const app = new cdk.App();
    
    const stack = new MainApplicationStack(app, "CorsTestStack", {
      env: {
        region: "us-east-1",
        account: "123456789012",
      },
      stage: "prod", // Use prod to ensure no wildcards
    });
    
    const template = Template.fromStack(stack);

    // Verify API Gateway CORS doesn't use wildcard
    template.hasResourceProperties("AWS::ApiGatewayV2::Api", {
      CorsConfiguration: {
        AllowOrigins: Match.not(Match.arrayWith(["*"])),
        AllowCredentials: true,
        AllowHeaders: Match.arrayWith([
          "Content-Type",
          "Authorization",
          "X-Amz-Date",
          "X-Api-Key",
          "X-Amz-Security-Token"
        ]),
        MaxAge: 86400, // 1 day
      },
    });
  });

  test("error responses are configured for SPA", () => {
    const app = new cdk.App();
    
    const stack = new MainApplicationStack(app, "SPATestStack", {
      env: {
        region: "us-east-1",
        account: "123456789012",
      },
      stage: "test",
    });
    
    const template = Template.fromStack(stack);

    // Verify CloudFront error responses for SPA routing
    template.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: {
        CustomErrorResponses: [
          {
            ErrorCode: 404,
            ResponseCode: 200,
            ResponsePagePath: "/index.html",
          },
        ],
      },
    });
  });
});