import { Construct } from 'constructs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';

export interface SecretsProps {
  readonly envPrefix: string;
}

export class Secrets extends Construct {
  public readonly applicationSecrets: secretsmanager.Secret;
  public readonly databaseSecret: secretsmanager.Secret;
  public readonly kmsKey: kms.Key;

  constructor(scope: Construct, id: string, props: SecretsProps) {
    super(scope, id);

    // Create KMS key for secrets encryption
    this.kmsKey = new kms.Key(this, 'SecretsKmsKey', {
      description: `KMS key for ${props.envPrefix} application secrets`,
      enableKeyRotation: true, // Automatic key rotation
      removalPolicy: RemovalPolicy.DESTROY, // For dev/test environments
    });

    // Application secrets (API keys, JWT secrets, etc.)
    this.applicationSecrets = new secretsmanager.Secret(this, 'ApplicationSecrets', {
      secretName: `${props.envPrefix}/application/secrets`,
      description: 'Application secrets for API keys, JWT, etc.',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          jwt_secret: '',
          api_key: '',
          encryption_key: '',
        }),
        generateStringKey: 'jwt_secret',
        excludeCharacters: '"@/\\\'',
        passwordLength: 32,
      },
      encryptionKey: this.kmsKey,
    });

    // Database connection secrets (even though using DynamoDB, good for future PostgreSQL migration)
    this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `${props.envPrefix}/database/credentials`,
      description: 'Database connection credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'admin',
          dbname: 'professionalpractice',
          engine: 'postgres',
          host: '',
          port: 5432,
        }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\\'`',
        passwordLength: 16,
      },
      encryptionKey: this.kmsKey,
    });

    // Grant CloudWatch Logs access to KMS key for log encryption
    this.kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowCloudWatchLogs',
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal(`logs.${this.node.tryGetContext('region') || 'us-east-1'}.amazonaws.com`)
        ],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:DescribeKey'
        ],
        resources: ['*'],
      })
    );

    // Outputs
    new CfnOutput(this, 'ApplicationSecretsArn', {
      value: this.applicationSecrets.secretArn,
      description: 'ARN of application secrets',
    });

    new CfnOutput(this, 'DatabaseSecretArn', {
      value: this.databaseSecret.secretArn,
      description: 'ARN of database secrets',
    });

    new CfnOutput(this, 'KmsKeyId', {
      value: this.kmsKey.keyId,
      description: 'KMS Key ID for secrets encryption',
    });

    new CfnOutput(this, 'KmsKeyArn', {
      value: this.kmsKey.keyArn,
      description: 'KMS Key ARN for secrets encryption',
    });
  }

  /**
   * Get the application secret ARN for Lambda environment variables
   */
  public getApplicationSecretArn(): string {
    return this.applicationSecrets.secretArn;
  }

  /**
   * Get the database secret ARN for Lambda environment variables
   */
  public getDatabaseSecretArn(): string {
    return this.databaseSecret.secretArn;
  }

  /**
   * Grant read access to secrets for a given principal
   */
  public grantRead(principal: iam.IPrincipal): void {
    this.applicationSecrets.grantRead(principal);
    this.databaseSecret.grantRead(principal);
    this.kmsKey.grantDecrypt(principal);
  }
}