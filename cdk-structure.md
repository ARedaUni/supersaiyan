# AWS CDK Infrastructure Structure

## Overview
The CDK (Cloud Development Kit) directory contains Infrastructure as Code (IaC) definitions for deploying the Bedrock Chat application to AWS. It uses TypeScript and AWS CDK v2 to define cloud resources, constructs, and deployment stacks.

## Folder Structure

```
cdk/
├── bin/
├── custom-resources/
│   └── cognito-trigger/
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
mkdir -p cdk/{bin,custom-resources/cognito-trigger,lib/{constants,constructs,utils},rules,test/utils}

echo "CDK folder structure created successfully!"
```

## Key Components

### Entry Point (`/bin/`)
- CDK application entry point and stack initialization

### Core Infrastructure (`/lib/`)
- **Main Stacks**:
  - `bedrock-chat-stack.ts` - Main application stack
  - `bedrock-custom-bot-stack.ts` - Custom bot infrastructure
  - `api-publishment-stack.ts` - API publication infrastructure
  - `frontend-waf-stack.ts` - Frontend Web Application Firewall
  - `bedrock-region-resources.ts` - Region-specific resources

### Reusable Constructs (`/lib/constructs/`)
- **Core Services**:
  - `api.ts` - REST API Gateway and Lambda functions
  - `auth.ts` - Cognito authentication setup
  - `database.ts` - RDS/DynamoDB database resources
  - `frontend.ts` - CloudFront and S3 for web hosting
  - `websocket.ts` - WebSocket API Gateway

- **AI/ML Components**:
  - `embedding.ts` - Vector embedding infrastructure
  - `bot-store.ts` - Bot storage and management
  - `usage-analysis.ts` - Analytics and monitoring

- **Build & Deployment**:
  - `api-publish-codebuild.ts` - API publishing pipeline
  - `bedrock-custom-bot-codebuild.ts` - Bot deployment pipeline

- **Security**:
  - `webacl-for-published-api.ts` - WAF rules for APIs

### Configuration (`/lib/constants/`)
- `docker.ts` - Docker configuration constants

### Utilities (`/lib/utils/`)
- `generate-physical-name.ts` - Resource naming utilities
- `identity-provider.ts` - Identity provider configurations
- `parameter-models.ts` - Parameter validation and models
- `bedrock-guardrails.ts` - Bedrock service guardrails
- `bedrock-knowledge-base-args.ts` - Knowledge base configuration

### Custom Resources (`/custom-resources/`)
- `cognito-trigger/` - Custom Cognito trigger Lambda functions
  - `index.py` - Python-based Lambda handler

### Configuration Files
- `cdk.json` - CDK configuration and feature flags
- `parameter.ts` - Stack parameter definitions
- `tsconfig.json` - TypeScript configuration
- `jest.config.js` - Jest testing configuration

### Compliance (`/rules/`)
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
- **@cdklabs/generative-ai-cdk-constructs** - AI/ML constructs
- **@aws-cdk/aws-lambda-python-alpha** - Python Lambda constructs
- **@aws-cdk/aws-glue-alpha** - AWS Glue constructs
- **cdk-aws-lambda-powertools-layer** - Lambda utilities

### Development Tools
- **TypeScript** - Type-safe infrastructure code
- **Jest** - Testing framework
- **@aws-prototyping-sdk/pdk-nag** - Best practices validation
- **deploy-time-build** - Build-time utilities

### Utility Libraries
- **zod** - Runtime type validation
- **effect** - Functional programming utilities

## Architecture Patterns
- **Multi-Stack Architecture** - Separation of concerns across stacks
- **Reusable Constructs** - Modular infrastructure components
- **Environment-Agnostic** - Parameterized deployments
- **Security-First** - WAF, IAM, and encryption by default
- **Monitoring & Analytics** - Built-in observability
- **CI/CD Ready** - CodeBuild integration
- **Serverless-First** - Lambda and managed services
- **Multi-Region Support** - Regional resource deployment

## Stack Relationships
1. **bedrock-chat-stack** - Main application infrastructure
2. **bedrock-custom-bot-stack** - Bot-specific resources
3. **api-publishment-stack** - API management and publishing
4. **frontend-waf-stack** - Security layer for frontend
5. **bedrock-region-resources** - Region-specific services

## Deployment Features
- **Infrastructure as Code** - Version-controlled infrastructure
- **Blue/Green Deployments** - Zero-downtime deployments
- **Auto-scaling** - Dynamic resource scaling
- **Cost Optimization** - Serverless and managed services
- **Compliance** - Built-in governance and logging
- **Disaster Recovery** - Multi-AZ and backup strategies