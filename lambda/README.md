# Lambda Functions for TCG Log Visualizer

This directory contains the Lambda functions that power the authentication and log storage backend for the Pokemon TCG Log Visualizer.

## Functions

### storeLog.js
Stores a new game log for an authenticated user.

**Endpoint:** `POST /logs`

**Request:**
```json
{
  "content": "Game log text content..."
}
```

**Response:**
```json
{
  "logId": "uuid-v4",
  "timestamp": 1234567890,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### getLogs.js
Retrieves all game logs for an authenticated user, sorted by timestamp (most recent first).

**Endpoint:** `GET /logs`

**Response:**
```json
{
  "logs": [
    {
      "userId": "cognito-user-id",
      "logId": "uuid-v4",
      "content": "Game log text...",
      "timestamp": 1234567890,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### getLog.js
Retrieves a specific game log by ID for an authenticated user.

**Endpoint:** `GET /logs/{logId}`

**Response:**
```json
{
  "userId": "cognito-user-id",
  "logId": "uuid-v4",
  "content": "Game log text...",
  "timestamp": 1234567890,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## Authentication

All endpoints require a valid JWT token from AWS Cognito User Pool in the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

The Lambda functions extract the user ID from the `sub` claim in the JWT token.

## Environment Variables

- `TABLE_NAME`: DynamoDB table name for storing game logs (set by CloudFormation)

## Dependencies

- `@aws-sdk/client-dynamodb`: AWS SDK v3 DynamoDB client
- `@aws-sdk/lib-dynamodb`: AWS SDK v3 DynamoDB Document Client

## Deployment

These functions are deployed automatically via AWS SAM/CloudFormation using the `template.yaml` file in the project root.

To deploy:
```bash
sam build
sam deploy --guided
```

## Error Handling

All functions return appropriate HTTP status codes:
- `200`: Success (GET requests)
- `201`: Created (POST requests)
- `400`: Bad Request (invalid input)
- `401`: Unauthorized (missing or invalid JWT)
- `403`: Forbidden (attempting to access another user's logs)
- `404`: Not Found (log doesn't exist)
- `500`: Internal Server Error (DynamoDB or Lambda errors)

## CORS

All responses include CORS headers to allow requests from the CloudFront distribution:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Credentials: true`
