# AWS CDK Infrastructure Structure

## Overview
The CDK (Cloud Development Kit) directory contains Infrastructure as Code (IaC) definitions for deploying the security-focused professional practice application to AWS. It uses TypeScript and AWS CDK v2 to define cloud resources, constructs, and deployment stacks for Lambda functions, RDS PostgreSQL database, and S3 storage.

## Folder Structure

```
cdk/
├── bin/
├── lambda/
│   └── handlers/
├── lib/
│   ├── constants/
│   ├── constructs/
│   └── utils/
├── rules/
└── test/
    └── utils/
```

## Script to Generate CDK Folder Structure

```bash
#!/bin/bash

# Create CDK folder structure
mkdir -p cdk/{bin,lambda/handlers,lib/{constants,constructs,utils},rules,test/utils}

echo "CDK folder structure created successfully!"
```

## Key Components

### Entry Point (`/bin/`)
- CDK application entry point and stack initialization

### Core Infrastructure (`/lib/`)
- **Main Stacks**:
  - `main-application-stack.ts` - Main application stack
  - `lambda-api-stack.ts` - FastAPI Lambda functions and API Gateway
  - `database-stack.ts` - RDS PostgreSQL infrastructure
  - `storage-stack.ts` - S3 buckets for file storage
  - `frontend-stack.ts` - Frontend hosting with CloudFront
  - `security-stack.ts` - WAF, IAM roles, and security components

### Reusable Constructs (`/lib/constructs/`)
- **Core Services**:
  - `api-gateway.ts` - REST API Gateway with Lambda integration
  - `lambda-functions.ts` - FastAPI Lambda functions
  - `database.ts` - RDS PostgreSQL with security groups
  - `storage.ts` - S3 buckets for file storage and static assets
  - `frontend.ts` - CloudFront and S3 for React app hosting
  - `auth.ts` - Cognito authentication setup

- **Security & Monitoring**:
  - `security-groups.ts` - VPC security group configurations
  - `waf.ts` - Web Application Firewall rules
  - `monitoring.ts` - CloudWatch logs and metrics
  - `secrets.ts` - Secrets Manager for credentials

- **Build & Deployment**:
  - `lambda-deployment.ts` - Lambda deployment pipeline
  - `frontend-deployment.ts` - Frontend deployment pipeline

### Configuration (`/lib/constants/`)
- `environment.ts` - Environment-specific configuration
- `security.ts` - Security policy constants

### Utilities (`/lib/utils/`)
- `generate-physical-name.ts` - Resource naming utilities
- `identity-provider.ts` - Identity provider configurations
- `parameter-models.ts` - Parameter validation and models
- `vpc-config.ts` - VPC and networking configuration

### Lambda Functions (`/lambda/`)
- `handlers/` - FastAPI Lambda function handlers
  - `main.py` - Main FastAPI application entry point
  - `requirements.txt` - Python dependencies

### Configuration Files
- `cdk.json` - CDK configuration and feature flags
- `parameter.ts` - Stack parameter definitions
- `tsconfig.json` - TypeScript configuration
- `jest.config.js` - Jest testing configuration

### Compliance (`/rules/`)
- `security-compliance.ts` - Security and compliance rules
- `log-retention-checker.ts` - CloudWatch log retention compliance

### Testing (`/test/`)
- Unit tests for CDK constructs and utilities
- Infrastructure testing and validation

## Key Dependencies

### CDK Core
- **aws-cdk-lib** - CDK core library
- **constructs** - CDK constructs framework
- **aws-cdk** - CDK CLI tool

### Specialized Constructs
- **@aws-cdk/aws-lambda-python-alpha** - Python Lambda constructs
- **@aws-cdk/aws-rds-alpha** - RDS database constructs
- **cdk-aws-lambda-powertools-layer** - Lambda utilities
- **@aws-cdk/aws-apigatewayv2** - API Gateway v2 constructs

### Development Tools
- **TypeScript** - Type-safe infrastructure code
- **Jest** - Testing framework
- **@aws-prototyping-sdk/pdk-nag** - Best practices validation
- **deploy-time-build** - Build-time utilities

### Utility Libraries
- **zod** - Runtime type validation
- **dotenv** - Environment variable management

## Architecture Patterns
- **Multi-Stack Architecture** - Separation of concerns across stacks
- **Reusable Constructs** - Modular infrastructure components
- **Environment-Agnostic** - Parameterized deployments
- **Security-First** - WAF, IAM, VPC, and encryption by default
- **Monitoring & Analytics** - Built-in observability with CloudWatch
- **CI/CD Ready** - Pipeline integration
- **Serverless-First** - Lambda functions and managed services
- **Database Security** - RDS in private subnets with encryption

## Stack Relationships
1. **main-application-stack** - Main application infrastructure and coordination
2. **lambda-api-stack** - FastAPI Lambda functions and API Gateway
3. **database-stack** - RDS PostgreSQL with security and networking
4. **storage-stack** - S3 buckets for file storage and static assets
5. **frontend-stack** - React app hosting with CloudFront
6. **security-stack** - WAF, security groups, and IAM roles

## Deployment Features
- **Infrastructure as Code** - Version-controlled infrastructure
- **Serverless Functions** - Lambda-based FastAPI deployment
- **Database Management** - RDS PostgreSQL with automated backups
- **Static Asset Hosting** - S3 + CloudFront for React frontend
- **Security by Default** - VPC isolation, encryption, WAF protection
- **Auto-scaling** - Lambda concurrency and RDS scaling
- **Cost Optimization** - Pay-per-use serverless architecture
- **Monitoring** - CloudWatch logs, metrics, and alarms
- **Compliance** - Built-in governance and security best practices