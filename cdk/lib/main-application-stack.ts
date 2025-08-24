import * as cdk from 'aws-cdk-lib';
import { CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { Database } from './constructs/database';
import { Auth } from './constructs/auth';
import { Api } from './constructs/api';
import { Frontend } from './constructs/frontend';
import { Vpc } from './constructs/vpc';
import { Secrets } from './constructs/secrets';
import { Monitoring } from './constructs/monitoring';
import { ApiWafStack } from './stacks/api-waf-stack';
import { FrontendWafStack } from './stacks/frontend-waf-stack';
import { identityProvider } from './utils/identity-provider';

export interface MainApplicationStackProps extends StackProps {
  readonly stage?: string;
  readonly envPrefix?: string;
  readonly allowedIpV4AddressRanges?: string[];
  readonly allowedIpV6AddressRanges?: string[];
  readonly enableIpV6?: boolean;
  readonly alternateDomainName?: string;
  readonly hostedZoneId?: string;
}

export class MainApplicationStack extends Stack {
  public readonly vpc: Vpc;
  public readonly secrets: Secrets;
  public readonly database: Database;
  public readonly auth: Auth;
  public readonly api: Api;
  public readonly frontend: Frontend;
  public readonly monitoring: Monitoring;
  public readonly storageBucket: s3.Bucket;
  public readonly apiWaf: ApiWafStack;
  public readonly frontendWaf: FrontendWafStack;

  constructor(scope: Construct, id: string, props?: MainApplicationStackProps) {
    super(scope, id, props);

    const stage = props?.stage || 'dev';
    const envPrefix = props?.envPrefix || stage;
    const enableIpV6 = props?.enableIpV6 ?? false;

    // Create VPC for secure networking
    this.vpc = new Vpc(this, 'Vpc', {
      // Enable NAT Gateway only in production (costs money)
      enableNatGateway: stage === 'prod',
    });

    // Create secrets for secure configuration management
    this.secrets = new Secrets(this, 'Secrets', {
      envPrefix,
    });

    // Create WAF stacks first
    this.apiWaf = new ApiWafStack(this, 'ApiWaf', {
      envPrefix,
      allowedIpV4AddressRanges: props?.allowedIpV4AddressRanges,
      allowedIpV6AddressRanges: props?.allowedIpV6AddressRanges,
    });

    this.frontendWaf = new FrontendWafStack(this, 'FrontendWaf', {
      envPrefix,
      allowedIpV4AddressRanges: props?.allowedIpV4AddressRanges || [],
      allowedIpV6AddressRanges: props?.allowedIpV6AddressRanges || [],
    });

    // S3 bucket for file storage
    this.storageBucket = new s3.Bucket(this, 'StorageBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      serverAccessLogsPrefix: 'access-logs/',
    });

    // Create Database construct with KMS encryption
    this.database = new Database(this, 'Database', {
      pointInTimeRecovery: stage === 'prod',
      kmsKey: this.secrets.kmsKey,
    });

    // Create identity provider configuration
    const idp = identityProvider([]); // Empty array means no external providers

    // Create Auth construct
    this.auth = new Auth(this, 'Auth', {
      origin: 'https://localhost:3000', // Will be updated after frontend is created
      userPoolDomainPrefixKey: `${envPrefix}-professional-practice`,
      idp,
      allowedSignUpEmailDomains: [], // No domain restrictions
      autoJoinUserGroups: [],
      selfSignUpEnabled: true,
      tokenValidity: Duration.hours(24),
    });

    // Create API construct with enhanced security
    this.api = new Api(this, 'Api', {
      database: this.database,
      envName: stage,
      auth: this.auth,
      storageBucket: this.storageBucket,
      vpc: this.vpc,
      secrets: this.secrets,
      // Will be set after frontend is created
      frontendOrigin: undefined,
    });

    // Create Frontend construct
    this.frontend = new Frontend(this, 'Frontend', {
      webAclId: this.frontendWaf.webAclArn.value,
      enableIpV6: enableIpV6,
      alternateDomainName: props?.alternateDomainName,
      hostedZoneId: props?.hostedZoneId,
    });

    // Create monitoring and security alerting
    this.monitoring = new Monitoring(this, 'Monitoring', {
      envPrefix,
      kmsKey: this.secrets.kmsKey,
      apiGatewayId: this.api.api.apiId,
      lambdaFunction: this.api.handler,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.api.apiEndpoint,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: this.frontend.getOrigin(),
      description: 'Frontend URL',
    });

    new cdk.CfnOutput(this, 'StorageBucketName', {
      value: this.storageBucket.bucketName,
      description: 'S3 storage bucket name',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.auth.userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.auth.client.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });
  }
}