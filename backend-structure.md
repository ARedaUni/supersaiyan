# FastAPI Backend Structure

## Overview
The backend is a FastAPI-based application that provides REST APIs for a Bedrock Chat application. It supports both regular operations and published API modes.

## Folder Structure

```
backend/
├── app/
│   ├── agents/
│   │   └── tools/
│   ├── repositories/
│   │   └── models/
│   ├── routes/
│   │   └── schemas/
│   ├── usecases/
├── auth/
│   ├── add_user_to_groups/
│   └── check_email_domain/
├── embedding_statemachine/
│   ├── bedrock_knowledge_base/
│   └── guardrails/
├── s3_exporter/
└── tests/
    ├── test_agent/
    │   └── test_tools/
    ├── test_repositories/
    │   ├── test_models/
    │   └── utils/
    ├── test_routes/
    │   └── test_schemas/
    ├── test_stream/
    ├── test_usecases/
    │   └── utils/
    └── test_utils/
```

## Script to Generate Backend Folder Structure

```bash
#!/bin/bash

# Create backend folder structure
mkdir -p backend/{app/{agents/tools,repositories/models,routes/schemas,usecases},auth/{add_user_to_groups,check_email_domain},embedding_statemachine/{bedrock_knowledge_base,guardrails},s3_exporter,tests/{test_agent/test_tools,test_repositories/{test_models,utils},test_routes/test_schemas,test_stream,test_usecases/utils,test_utils}}

echo "Backend folder structure created successfully!"
```

## Key Components

### Core Application (`/app/`)
- **Main Files**: FastAPI app setup, config, auth, dependencies
- **Routes**: API endpoints organized by domain (admin, bot, conversation, etc.)
- **Schemas**: Request/response data models
- **Repositories**: Data access layer with models
- **Use Cases**: Business logic layer
- **Agents**: AI agent system with tools

### Authentication (`/auth/`)
- Lambda functions for user management and email validation

### State Machines (`/embedding_statemachine/`)
- Knowledge base and guardrails management functions

### Utilities
- **s3_exporter/**: S3 export functionality
- **tests/**: Comprehensive test suite

### Key Dependencies
- FastAPI, Pydantic, Boto3, OpenSearch, PostgreSQL, Python-Jose, Uvicorn