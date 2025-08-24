import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { CfnOutput } from 'aws-cdk-lib';

export interface VpcProps {
  readonly enableNatGateway?: boolean; // Default false for free tier
}

export class Vpc extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly privateSubnets: ec2.ISubnet[];
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;
  public readonly vpcEndpointSecurityGroup: ec2.SecurityGroup;
  public readonly dynamodbVpcEndpoint: ec2.VpcEndpoint;
  public readonly s3VpcEndpoint: ec2.VpcEndpoint;
  public readonly secretsManagerVpcEndpoint: ec2.VpcEndpoint;

  constructor(scope: Construct, id: string, props?: VpcProps) {
    super(scope, id);

    // Create VPC with 2 AZs (minimum for RDS if needed later)
    this.vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      // For free tier: only private subnets, no NAT gateway
      natGateways: props?.enableNatGateway ? 1 : 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        // Only add public subnet if NAT Gateway is enabled
        ...(props?.enableNatGateway ? [{
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        }] : []),
      ],
      // Enable DNS resolution for VPC endpoints
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    this.privateSubnets = this.vpc.privateSubnets;

    // Security Group for VPC endpoints (create once and reuse)
    this.vpcEndpointSecurityGroup = new ec2.SecurityGroup(this, 'VpcEndpointSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for VPC endpoints',
      allowAllOutbound: false,
    });

    // Security Group for Lambda functions
    this.lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Lambda functions',
      allowAllOutbound: false, // Explicit outbound rules for security
    });

    // Allow HTTPS outbound for AWS services
    this.lambdaSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS outbound for AWS services'
    );

    // Allow HTTPS inbound from Lambda security group to VPC endpoints
    this.vpcEndpointSecurityGroup.addIngressRule(
      this.lambdaSecurityGroup,
      ec2.Port.tcp(443),
      'HTTPS from Lambda functions'
    );

    // VPC Endpoints (avoid NAT Gateway costs)
    // DynamoDB VPC Endpoint (Gateway endpoint - free)
    this.dynamodbVpcEndpoint = this.vpc.addGatewayEndpoint('DynamoDBEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }],
    });

    // S3 VPC Endpoint (Gateway endpoint - free)
    this.s3VpcEndpoint = this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }],
    });

    // Secrets Manager VPC Endpoint (Interface endpoint - small cost but critical for security)
    this.secretsManagerVpcEndpoint = this.vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [this.vpcEndpointSecurityGroup],
    });

    // CloudWatch Logs VPC Endpoint (for secure logging)
    this.vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [this.vpcEndpointSecurityGroup],
    });

    // Outputs
    new CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });

    new CfnOutput(this, 'PrivateSubnetIds', {
      value: this.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private Subnet IDs',
    });
  }


  /**
   * Get the private subnet IDs for Lambda configuration
   */
  public getPrivateSubnetIds(): string[] {
    return this.privateSubnets.map(subnet => subnet.subnetId);
  }

  /**
   * Get security group ID for Lambda functions
   */
  public getLambdaSecurityGroupId(): string {
    return this.lambdaSecurityGroup.securityGroupId;
  }
}