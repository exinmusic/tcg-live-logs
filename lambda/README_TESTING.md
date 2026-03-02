# API Gateway Endpoint Testing

This directory contains a comprehensive test script for verifying the API Gateway endpoints.

## Test Script

**File:** `test-api-endpoints.js`

This script performs automated testing of all three API Gateway endpoints with various authentication scenarios.

## Prerequisites

1. AWS infrastructure must be deployed:
   ```bash
   sam build && sam deploy
   ```

2. AWS CLI must be configured with credentials:
   ```bash
   aws configure
   ```

3. Node.js dependencies must be installed:
   ```bash
   npm install
   ```

## Running the Tests

### 1. Get Stack Outputs

First, retrieve the required configuration values from your deployed stack:

```bash
aws cloudformation describe-stacks \
  --stack-name tcg-log-visualizer \
  --region us-east-1 \
  --query 'Stacks[0].Outputs' \
  --output table
```

### 2. Set Environment Variables

Export the required environment variables:

```bash
export API_ENDPOINT="https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod"
export USER_POOL_ID="us-east-1_XXXXXXXXX"
export CLIENT_ID="XXXXXXXXXXXXXXXXXXXXXXXXXX"
export AWS_REGION="us-east-1"
```

Optional variables:
```bash
export TEST_EMAIL="test@example.com"
export TEST_PASSWORD="TestPassword123!"
```

### 3. Run the Test Script

```bash
node test-api-endpoints.js
```

## What the Script Tests

The script performs 8 comprehensive tests:

### Test 1: POST /logs without authentication
- **Expected:** 401 Unauthorized
- **Validates:** Endpoint rejects unauthenticated requests

### Test 2: POST /logs with invalid JWT token
- **Expected:** 401 Unauthorized
- **Validates:** Endpoint rejects invalid tokens

### Test 3: POST /logs with valid JWT token
- **Expected:** 201 Created with logId
- **Validates:** Endpoint accepts valid tokens and stores logs

### Test 4: GET /logs without authentication
- **Expected:** 401 Unauthorized
- **Validates:** Endpoint rejects unauthenticated requests

### Test 5: GET /logs with valid JWT token
- **Expected:** 200 OK with logs array
- **Validates:** Endpoint accepts valid tokens and returns logs

### Test 6: GET /logs/{logId} without authentication
- **Expected:** 401 Unauthorized
- **Validates:** Endpoint rejects unauthenticated requests

### Test 7: GET /logs/{logId} with valid JWT token
- **Expected:** 200 OK with log object
- **Validates:** Endpoint accepts valid tokens and returns specific log

### Test 8: Verify CORS headers
- **Expected:** CORS headers present in response
- **Validates:** CORS configuration is working

## Expected Output

```
═══════════════════════════════════════════════════════════
  API Gateway Endpoint Testing
═══════════════════════════════════════════════════════════

Configuration:
  API Endpoint: https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod
  User Pool ID: us-east-1_XXXXXXXXX
  Client ID: XXXXXXXXXXXXXXXXXXXXXXXXXX
  Region: us-east-1
  Test Email: test@example.com

📝 Creating test user...
   ✅ Test user created successfully

🔐 Authenticating test user...
   ✅ Authentication successful

🧪 Test 1: POST /logs without authentication
✅ PASS: POST /logs rejects unauthenticated requests
   Returned 401 Unauthorized as expected

🧪 Test 2: POST /logs with invalid JWT token
✅ PASS: POST /logs rejects invalid JWT tokens
   Returned 401 as expected

🧪 Test 3: POST /logs with valid JWT token
✅ PASS: POST /logs accepts valid JWT and stores log
   Created log with ID: 12345678-1234-1234-1234-123456789abc

🧪 Test 4: GET /logs without authentication
✅ PASS: GET /logs rejects unauthenticated requests
   Returned 401 Unauthorized as expected

🧪 Test 5: GET /logs with valid JWT token
✅ PASS: GET /logs accepts valid JWT and returns logs
   Retrieved 1 log(s)

🧪 Test 6: GET /logs/{logId} without authentication
✅ PASS: GET /logs/{logId} rejects unauthenticated requests
   Returned 401 Unauthorized as expected

🧪 Test 7: GET /logs/{logId} with valid JWT token
✅ PASS: GET /logs/{logId} accepts valid JWT and returns log
   Retrieved log: 12345678-1234-1234-1234-123456789abc

🧪 Test 8: Verify CORS headers
✅ PASS: API returns CORS headers
   Origin: https://d1234567890abc.cloudfront.net

🧹 Cleaning up test user...
   ✅ Test user deleted

═══════════════════════════════════════════════════════════
  Test Summary
═══════════════════════════════════════════════════════════
  Total Tests: 8
  ✅ Passed: 8
  ❌ Failed: 0
═══════════════════════════════════════════════════════════
```

## Troubleshooting

### Missing Environment Variables

If you see:
```
❌ Missing required environment variables: API_ENDPOINT, USER_POOL_ID, CLIENT_ID
```

Make sure you've exported all required environment variables.

### AWS Credentials Not Configured

If you see:
```
❌ Failed to create test user: Unable to locate credentials
```

Configure AWS CLI:
```bash
aws configure
```

### Test User Creation Failed

If the test user creation fails, you may need to manually delete an existing test user:

```bash
aws cognito-idp admin-delete-user \
  --user-pool-id us-east-1_XXXXXXXXX \
  --username test@example.com \
  --region us-east-1
```

### Authentication Failed

If authentication fails, verify:
1. The test password meets the password policy (8+ chars, uppercase, lowercase, numbers)
2. The User Pool Client ID is correct
3. The User Pool allows USER_PASSWORD_AUTH flow

### API Endpoint Tests Fail

If API tests fail with 401/403:
1. Verify the API endpoint URL is correct
2. Check that the Cognito authorizer is attached to the endpoints
3. Verify the User Pool ARN in template.yaml is correct
4. Check CloudWatch Logs for API Gateway and Lambda errors

### CORS Test Fails

If CORS headers are missing:
1. Verify CORS configuration in template.yaml
2. Ensure Lambda functions return CORS headers
3. Redeploy: `sam deploy`

## Manual Cleanup

If the script fails to clean up the test user, you can manually delete it:

```bash
aws cognito-idp admin-delete-user \
  --user-pool-id us-east-1_XXXXXXXXX \
  --username test@example.com \
  --region us-east-1
```

## Integration with CI/CD

This test script can be integrated into CI/CD pipelines:

```bash
#!/bin/bash
set -e

# Deploy infrastructure
sam build
sam deploy --no-confirm-changeset

# Get stack outputs
export API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name tcg-log-visualizer \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`LogsApiUrl`].OutputValue' \
  --output text)

export USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name tcg-log-visualizer \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text)

export CLIENT_ID=$(aws cloudformation describe-stacks \
  --stack-name tcg-log-visualizer \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
  --output text)

# Run tests
cd lambda
npm install
node test-api-endpoints.js
```

## Related Documentation

- `docs/API_GATEWAY_DEPLOYMENT.md` - Detailed deployment and testing guide
- `docs/TASK_3_DEPLOYMENT_GUIDE.md` - Task 3 completion guide
- `docs/AUTHENTICATION_SETUP.md` - Authentication setup guide
- `template.yaml` - CloudFormation/SAM template with API Gateway configuration
