# AWS CDK Infrastructure Structure

## Overview
The CDK (Cloud Development Kit) directory contains Infrastructure as Code (IaC) definitions for deploying a security-focused web application to AWS using cost-optimized, serverless architecture. It uses TypeScript and AWS CDK v2 to define cloud resources within AWS free tier limits.

## Folder Structure

```
cdk/
├── bin/
│   └── app.ts                    # CDK app entry point
├── lib/
│   ├── stacks/
│   │   ├── main-stack.ts         # Main orchestration stack
│   │   ├── auth-stack.ts         # Cognito authentication
│   │   ├── api-stack.ts          # API Gateway + Lambda
│   │   ├── database-stack.ts     # DynamoDB tables
│   │   └── frontend-stack.ts     # S3 + CloudFront
│   ├── constructs/
│   │   ├── lambda-api.ts         # Lambda function constructs
│   │   ├── cognito-auth.ts       # Cognito user pool setup
│   │   ├── dynamodb-tables.ts    # Database table definitions
│   │   └── static-site.ts        # S3 static hosting
│   ├── lambdas/
│   │   ├── auth/                 # Authentication Lambda functions
│   │   ├── api/                  # API Lambda functions
│   │   └── shared/               # Shared utilities
│   └── utils/
│       └── config.ts             # Environment configurations
├── config/
│   └── environment.ts            # Environment-specific settings
└── test/
    └── constructs/               # Unit tests for constructs
```

## Script to Generate CDK Folder Structure

```bash
#!/bin/bash

# Create CDK folder structure for serverless application
mkdir -p cdk/{bin,lib/{stacks,constructs,lambdas/{auth,api,shared},utils},config,test/constructs}

echo "CDK folder structure created successfully!"
```

## Key Components

### Entry Point (`/bin/`)
- `app.ts` - CDK application entry point and stack initialization

### Core Infrastructure Stacks (`/lib/stacks/`)
- **main-stack.ts** - Primary orchestration stack that coordinates all resources
- **auth-stack.ts** - Cognito User Pool, Identity Pool, and authentication resources
- **api-stack.ts** - API Gateway with Lambda integration and CORS configuration
- **database-stack.ts** - DynamoDB tables with GSI and encryption
- **frontend-stack.ts** - S3 static hosting with CloudFront distribution

### Reusable Constructs (`/lib/constructs/`)
- **lambda-api.ts** - Lambda function constructs for API endpoints
- **cognito-auth.ts** - Cognito authentication setup with user pools and RBAC
- **dynamodb-tables.ts** - DynamoDB table definitions with GSI and encryption
- **static-site.ts** - S3 bucket and CloudFront distribution for static hosting

### Lambda Functions (`/lib/lambdas/`)
- **auth/** - Authentication Lambda functions
  - `login.py` - User login and token generation
  - `register.py` - User registration with validation
  - `refresh.py` - JWT token refresh
  - `logout.py` - User logout and session cleanup
- **api/** - API Lambda functions
  - `users.py` - User CRUD operations
  - `health.py` - Health check endpoint
- **shared/** - Shared utilities and libraries
  - `auth_utils.py` - JWT validation and user context
  - `database.py` - DynamoDB connection utilities
  - `response.py` - Standardized API response formatting

### Utilities (`/lib/utils/`)
- `config.ts` - Environment configurations and constants

### Environment Configuration (`/config/`)
- `environment.ts` - Environment-specific settings (dev, staging, prod)

### Configuration Files
- `cdk.json` - CDK configuration and feature flags
- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `jest.config.js` - Jest testing configuration

### Testing (`/test/constructs/`)
- Unit tests for CDK constructs and utilities
- Infrastructure validation and compliance tests

## Key Dependencies

### CDK Core
- **aws-cdk-lib** - CDK core library (v2)
- **constructs** - CDK constructs framework
- **aws-cdk** - CDK CLI tool

### Lambda and Compute
- **@aws-cdk/aws-lambda-python-alpha** - Python Lambda constructs
- **aws-lambda-powertools** - Lambda utilities and observability

### Development Tools
- **TypeScript** - Type-safe infrastructure code
- **Jest** - Testing framework
- **ts-jest** - TypeScript testing configuration
- **@types/node** - Node.js type definitions

### Utility Libraries
- **zod** - Runtime type validation for configurations

## Architecture Patterns
- **Multi-Stack Architecture** - Separation of concerns across authentication, API, database, and frontend
- **Serverless-First** - Lambda functions and managed services for cost optimization
- **Security-First** - IAM roles, encryption at rest/transit, and Cognito authentication
- **Free Tier Optimized** - Designed to stay within AWS free tier limits
- **Environment-Agnostic** - Parameterized deployments for dev/staging/prod
- **Infrastructure as Code** - Version-controlled, reproducible deployments

## Stack Relationships
1. **main-stack** - Orchestrates and coordinates all other stacks
2. **auth-stack** - Provides Cognito authentication for API and frontend
3. **database-stack** - DynamoDB tables for application data storage
4. **api-stack** - Lambda functions and API Gateway endpoints
5. **frontend-stack** - S3 and CloudFront for React application hosting

## Cost-Optimized Features
- **AWS Free Tier Focus** - All services chosen to maximize free tier usage
- **Serverless Architecture** - Pay-per-use Lambda functions and API Gateway
- **DynamoDB On-Demand** - Pay-per-request pricing for unpredictable workloads
- **S3 Standard Storage** - Cost-effective static website hosting
- **CloudFront CDN** - Global content delivery within free tier limits
- **Cognito User Pools** - Free authentication up to 50,000 MAUs

## Security Features
- **Encryption at Rest** - DynamoDB and S3 encryption enabled by default
- **Encryption in Transit** - HTTPS/TLS for all communications
- **IAM Least Privilege** - Minimal permissions for Lambda execution roles
- **CORS Configuration** - Proper cross-origin resource sharing setup
- **JWT Authentication** - Secure token-based authentication via Cognito
- **Input Validation** - API Gateway request validation and Lambda input sanitization

## Monitoring & Observability (Free Tier)
- **CloudWatch Logs** - Lambda function logging and debugging
- **CloudWatch Metrics** - Basic service metrics and alarms
- **X-Ray Tracing** - Distributed tracing for Lambda functions (100K traces/month free)
- **Health Checks** - API Gateway and Lambda health monitoring