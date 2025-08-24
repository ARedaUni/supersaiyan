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

    // Verify VPC is created
    template.hasResourceProperties("AWS::EC2::VPC", {
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });

    // Verify RDS database is created
    template.hasResourceProperties("AWS::RDS::DBInstance", {
      Engine: "postgres",
      StorageEncrypted: true,
      DeletionProtection: false, // test environment
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
      Handler: "main.handler",
      Timeout: 30,
    });

    // Verify API Gateway is created
    template.hasResourceProperties("AWS::ApiGateway::RestApi", {
      Name: "Professional Practice API",
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

    // Verify WAF is created and associated
    template.hasResourceProperties("AWS::WAFv2::WebACL", {
      Scope: "REGIONAL",
      DefaultAction: { Allow: {} },
      Rules: Match.arrayWith([
        Match.objectLike({
          Name: "AWS-AWSManagedRulesCommonRuleSet",
          Priority: 1,
        }),
        Match.objectLike({
          Name: "AWS-AWSManagedRulesKnownBadInputsRuleSet", 
          Priority: 2,
        }),
      ]),
    });

    template.hasResourceProperties("AWS::WAFv2::WebACLAssociation", {
      ResourceArn: Match.anyValue(),
      WebAclArn: Match.anyValue(),
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

    // Verify deletion protection is enabled in production
    template.hasResourceProperties("AWS::RDS::DBInstance", {
      DeletionProtection: true,
    });
  });

  test("security groups are properly configured", () => {
    const app = new cdk.App();
    
    const stack = new MainApplicationStack(app, "SecurityTestStack", {
      env: {
        region: "us-east-1",
        account: "123456789012",
      },
      stage: "test",
    });
    
    const template = Template.fromStack(stack);

    // Verify database security group restricts access
    template.hasResourceProperties("AWS::EC2::SecurityGroup", {
      GroupDescription: "Security group for RDS database",
      VpcId: Match.anyValue(),
      SecurityGroupEgress: [],
    });

    // Verify Lambda security group allows outbound
    template.hasResourceProperties("AWS::EC2::SecurityGroup", {
      GroupDescription: "Security group for Lambda functions",
      VpcId: Match.anyValue(),
    });

    // Verify security group ingress rule for database
    template.hasResourceProperties("AWS::EC2::SecurityGroupIngress", {
      IpProtocol: "tcp",
      FromPort: 5432,
      ToPort: 5432,
      SourceSecurityGroupId: Match.anyValue(),
    });
  });

  test("secrets manager is configured", () => {
    const app = new cdk.App();
    
    const stack = new MainApplicationStack(app, "SecretsTestStack", {
      env: {
        region: "us-east-1",
        account: "123456789012",
      },
      stage: "test",
    });
    
    const template = Template.fromStack(stack);

    // Verify Secrets Manager secret is created
    template.hasResourceProperties("AWS::SecretsManager::Secret", {
      Description: "RDS PostgreSQL credentials",
      GenerateSecretString: {
        SecretStringTemplate: '{"username":"postgres"}',
        GenerateStringKey: "password",
        ExcludeCharacters: '"@/\\',
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
        "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
      ],
    });

    // Verify S3 bucket policies are attached
    template.hasResourceProperties("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: "Allow",
            Action: Match.arrayWith([
              "s3:GetObject*",
              "s3:GetBucket*",
              "s3:List*",
              "s3:DeleteObject*",
              "s3:PutObject*",
              "s3:Abort*",
            ]),
          }),
        ]),
      },
    });

    // Verify Secrets Manager access policy
    template.hasResourceProperties("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: "Allow",
            Action: Match.arrayWith([
              "secretsmanager:GetSecretValue",
              "secretsmanager:DescribeSecret",
            ]),
          }),
        ]),
      },
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
      RetentionInDays: 7,
    });

    // Verify RDS log exports are enabled
    template.hasResourceProperties("AWS::RDS::DBInstance", {
      EnableCloudwatchLogsExports: ["postgresql"],
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
      Description: "CloudFront distribution domain name",
    });

    template.hasOutput("DatabaseEndpoint", {
      Description: "RDS database endpoint",
    });

    template.hasOutput("StorageBucket", {
      Description: "S3 storage bucket name",
    });
  });

  test("VPC subnets are properly configured", () => {
    const app = new cdk.App();
    
    const stack = new MainApplicationStack(app, "VPCTestStack", {
      env: {
        region: "us-east-1",
        account: "123456789012",
      },
      stage: "test",
    });
    
    const template = Template.fromStack(stack);

    // Should have public, private, and isolated subnets
    template.resourceCountIs("AWS::EC2::Subnet", 6); // 2 AZs * 3 subnet types

    // Verify NAT gateway for private subnet egress
    template.resourceCountIs("AWS::EC2::NatGateway", 1);

    // Verify internet gateway for public subnets
    template.resourceCountIs("AWS::EC2::InternetGateway", 1);
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