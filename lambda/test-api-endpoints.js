/**
 * API Gateway Endpoint Testing Script
 * 
 * This script tests the three API Gateway endpoints with valid and invalid JWT tokens.
 * It verifies that:
 * - POST /logs endpoint is connected to StoreLogFunction
 * - GET /logs endpoint is connected to GetLogsFunction
 * - GET /logs/{logId} endpoint is connected to GetLogFunction
 * - Cognito User Pool authorizer is attached to all endpoints
 * - Endpoints properly reject invalid JWT tokens
 * - Endpoints properly accept valid JWT tokens
 * 
 * Prerequisites:
 * - AWS infrastructure must be deployed (sam deploy)
 * - Environment variables must be set (see below)
 * 
 * Usage:
 *   node test-api-endpoints.js
 * 
 * Environment Variables:
 *   API_ENDPOINT - API Gateway endpoint URL (e.g., https://xxx.execute-api.us-east-1.amazonaws.com/prod)
 *   USER_POOL_ID - Cognito User Pool ID
 *   CLIENT_ID - Cognito User Pool Client ID
 *   TEST_EMAIL - Test user email (will be created if doesn't exist)
 *   TEST_PASSWORD - Test user password (must meet password policy)
 */

const https = require('https');
const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand, InitiateAuthCommand, AdminDeleteUserCommand } = require('@aws-sdk/client-cognito-identity-provider');

// Configuration from environment variables
const config = {
  apiEndpoint: process.env.API_ENDPOINT || '',
  userPoolId: process.env.USER_POOL_ID || '',
  clientId: process.env.CLIENT_ID || '',
  testEmail: process.env.TEST_EMAIL || 'test@example.com',
  testPassword: process.env.TEST_PASSWORD || 'TestPassword123!',
  region: process.env.AWS_REGION || 'us-east-1'
};

// Validate configuration
function validateConfig() {
  const missing = [];
  if (!config.apiEndpoint) missing.push('API_ENDPOINT');
  if (!config.userPoolId) missing.push('USER_POOL_ID');
  if (!config.clientId) missing.push('CLIENT_ID');
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('\nPlease set the following environment variables:');
    console.error('  export API_ENDPOINT="https://xxx.execute-api.us-east-1.amazonaws.com/prod"');
    console.error('  export USER_POOL_ID="us-east-1_XXXXXXXXX"');
    console.error('  export CLIENT_ID="XXXXXXXXXXXXXXXXXXXXXXXXXX"');
    console.error('\nOptional:');
    console.error('  export TEST_EMAIL="test@example.com"');
    console.error('  export TEST_PASSWORD="TestPassword123!"');
    console.error('  export AWS_REGION="us-east-1"');
    process.exit(1);
  }
}

// Cognito client
const cognitoClient = new CognitoIdentityProviderClient({ region: config.region });

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (message) {
    console.log(`   ${message}`);
  }
  results.tests.push({ name, passed, message });
  if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }
}

// HTTP request helper
function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, config.apiEndpoint);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ statusCode: res.statusCode, body: parsed, headers: res.headers });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Create test user in Cognito
async function createTestUser() {
  try {
    console.log('\n📝 Creating test user...');
    
    // Try to delete existing user first
    try {
      await cognitoClient.send(new AdminDeleteUserCommand({
        UserPoolId: config.userPoolId,
        Username: config.testEmail
      }));
      console.log('   Deleted existing test user');
    } catch (e) {
      // User doesn't exist, that's fine
    }

    // Create user
    await cognitoClient.send(new AdminCreateUserCommand({
      UserPoolId: config.userPoolId,
      Username: config.testEmail,
      UserAttributes: [
        { Name: 'email', Value: config.testEmail },
        { Name: 'email_verified', Value: 'true' }
      ],
      MessageAction: 'SUPPRESS'
    }));

    // Set permanent password
    await cognitoClient.send(new AdminSetUserPasswordCommand({
      UserPoolId: config.userPoolId,
      Username: config.testEmail,
      Password: config.testPassword,
      Permanent: true
    }));

    console.log('   ✅ Test user created successfully');
    return true;
  } catch (error) {
    console.error('   ❌ Failed to create test user:', error.message);
    return false;
  }
}

// Get JWT token for test user
async function getAuthToken() {
  try {
    console.log('\n🔐 Authenticating test user...');
    
    const response = await cognitoClient.send(new InitiateAuthCommand({
      ClientId: config.clientId,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: config.testEmail,
        PASSWORD: config.testPassword
      }
    }));

    const idToken = response.AuthenticationResult.IdToken;
    console.log('   ✅ Authentication successful');
    return idToken;
  } catch (error) {
    console.error('   ❌ Authentication failed:', error.message);
    return null;
  }
}

// Test 1: POST /logs without authentication (should fail with 401)
async function testStoreLogUnauthorized() {
  console.log('\n🧪 Test 1: POST /logs without authentication');
  try {
    const response = await makeRequest('POST', '/logs', {}, {
      content: 'Test game log content'
    });

    if (response.statusCode === 401) {
      logTest('POST /logs rejects unauthenticated requests', true, 'Returned 401 Unauthorized as expected');
    } else {
      logTest('POST /logs rejects unauthenticated requests', false, `Expected 401, got ${response.statusCode}`);
    }
  } catch (error) {
    logTest('POST /logs rejects unauthenticated requests', false, error.message);
  }
}

// Test 2: POST /logs with invalid token (should fail with 401)
async function testStoreLogInvalidToken() {
  console.log('\n🧪 Test 2: POST /logs with invalid JWT token');
  try {
    const response = await makeRequest('POST', '/logs', {
      'Authorization': 'Bearer invalid.jwt.token'
    }, {
      content: 'Test game log content'
    });

    if (response.statusCode === 401 || response.statusCode === 403) {
      logTest('POST /logs rejects invalid JWT tokens', true, `Returned ${response.statusCode} as expected`);
    } else {
      logTest('POST /logs rejects invalid JWT tokens', false, `Expected 401/403, got ${response.statusCode}`);
    }
  } catch (error) {
    logTest('POST /logs rejects invalid JWT tokens', false, error.message);
  }
}

// Test 3: POST /logs with valid token (should succeed with 201)
async function testStoreLogAuthorized(token) {
  console.log('\n🧪 Test 3: POST /logs with valid JWT token');
  try {
    const testContent = `Test game log created at ${new Date().toISOString()}`;
    const response = await makeRequest('POST', '/logs', {
      'Authorization': `Bearer ${token}`
    }, {
      content: testContent
    });

    if (response.statusCode === 201) {
      const logId = response.body.logId;
      if (logId) {
        logTest('POST /logs accepts valid JWT and stores log', true, `Created log with ID: ${logId}`);
        return logId;
      } else {
        logTest('POST /logs accepts valid JWT and stores log', false, 'No logId in response');
        return null;
      }
    } else {
      logTest('POST /logs accepts valid JWT and stores log', false, `Expected 201, got ${response.statusCode}: ${JSON.stringify(response.body)}`);
      return null;
    }
  } catch (error) {
    logTest('POST /logs accepts valid JWT and stores log', false, error.message);
    return null;
  }
}

// Test 4: GET /logs without authentication (should fail with 401)
async function testGetLogsUnauthorized() {
  console.log('\n🧪 Test 4: GET /logs without authentication');
  try {
    const response = await makeRequest('GET', '/logs');

    if (response.statusCode === 401) {
      logTest('GET /logs rejects unauthenticated requests', true, 'Returned 401 Unauthorized as expected');
    } else {
      logTest('GET /logs rejects unauthenticated requests', false, `Expected 401, got ${response.statusCode}`);
    }
  } catch (error) {
    logTest('GET /logs rejects unauthenticated requests', false, error.message);
  }
}

// Test 5: GET /logs with valid token (should succeed with 200)
async function testGetLogsAuthorized(token) {
  console.log('\n🧪 Test 5: GET /logs with valid JWT token');
  try {
    const response = await makeRequest('GET', '/logs', {
      'Authorization': `Bearer ${token}`
    });

    if (response.statusCode === 200) {
      const logs = response.body.logs;
      if (Array.isArray(logs)) {
        logTest('GET /logs accepts valid JWT and returns logs', true, `Retrieved ${logs.length} log(s)`);
        return logs;
      } else {
        logTest('GET /logs accepts valid JWT and returns logs', false, 'Response body.logs is not an array');
        return [];
      }
    } else {
      logTest('GET /logs accepts valid JWT and returns logs', false, `Expected 200, got ${response.statusCode}: ${JSON.stringify(response.body)}`);
      return [];
    }
  } catch (error) {
    logTest('GET /logs accepts valid JWT and returns logs', false, error.message);
    return [];
  }
}

// Test 6: GET /logs/{logId} without authentication (should fail with 401)
async function testGetLogUnauthorized(logId) {
  console.log('\n🧪 Test 6: GET /logs/{logId} without authentication');
  try {
    const response = await makeRequest('GET', `/logs/${logId}`);

    if (response.statusCode === 401) {
      logTest('GET /logs/{logId} rejects unauthenticated requests', true, 'Returned 401 Unauthorized as expected');
    } else {
      logTest('GET /logs/{logId} rejects unauthenticated requests', false, `Expected 401, got ${response.statusCode}`);
    }
  } catch (error) {
    logTest('GET /logs/{logId} rejects unauthenticated requests', false, error.message);
  }
}

// Test 7: GET /logs/{logId} with valid token (should succeed with 200)
async function testGetLogAuthorized(token, logId) {
  console.log('\n🧪 Test 7: GET /logs/{logId} with valid JWT token');
  try {
    const response = await makeRequest('GET', `/logs/${logId}`, {
      'Authorization': `Bearer ${token}`
    });

    if (response.statusCode === 200) {
      const log = response.body;
      if (log.logId === logId) {
        logTest('GET /logs/{logId} accepts valid JWT and returns log', true, `Retrieved log: ${logId}`);
      } else {
        logTest('GET /logs/{logId} accepts valid JWT and returns log', false, 'Returned log ID does not match requested ID');
      }
    } else {
      logTest('GET /logs/{logId} accepts valid JWT and returns log', false, `Expected 200, got ${response.statusCode}: ${JSON.stringify(response.body)}`);
    }
  } catch (error) {
    logTest('GET /logs/{logId} accepts valid JWT and returns log', false, error.message);
  }
}

// Test 8: Verify CORS headers
async function testCorsHeaders(token) {
  console.log('\n🧪 Test 8: Verify CORS headers');
  try {
    const response = await makeRequest('GET', '/logs', {
      'Authorization': `Bearer ${token}`
    });

    const corsHeaders = {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-headers': response.headers['access-control-allow-headers'],
      'access-control-allow-methods': response.headers['access-control-allow-methods']
    };

    if (corsHeaders['access-control-allow-origin']) {
      logTest('API returns CORS headers', true, `Origin: ${corsHeaders['access-control-allow-origin']}`);
    } else {
      logTest('API returns CORS headers', false, 'No Access-Control-Allow-Origin header found');
    }
  } catch (error) {
    logTest('API returns CORS headers', false, error.message);
  }
}

// Cleanup test user
async function cleanupTestUser() {
  try {
    console.log('\n🧹 Cleaning up test user...');
    await cognitoClient.send(new AdminDeleteUserCommand({
      UserPoolId: config.userPoolId,
      Username: config.testEmail
    }));
    console.log('   ✅ Test user deleted');
  } catch (error) {
    console.log('   ⚠️  Could not delete test user:', error.message);
  }
}

// Main test execution
async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  API Gateway Endpoint Testing');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\nConfiguration:');
  console.log(`  API Endpoint: ${config.apiEndpoint}`);
  console.log(`  User Pool ID: ${config.userPoolId}`);
  console.log(`  Client ID: ${config.clientId}`);
  console.log(`  Region: ${config.region}`);
  console.log(`  Test Email: ${config.testEmail}`);

  // Validate configuration
  validateConfig();

  // Create test user
  const userCreated = await createTestUser();
  if (!userCreated) {
    console.error('\n❌ Cannot proceed without test user');
    process.exit(1);
  }

  // Get authentication token
  const token = await getAuthToken();
  if (!token) {
    console.error('\n❌ Cannot proceed without authentication token');
    await cleanupTestUser();
    process.exit(1);
  }

  // Run tests
  await testStoreLogUnauthorized();
  await testStoreLogInvalidToken();
  const logId = await testStoreLogAuthorized(token);
  await testGetLogsUnauthorized();
  await testGetLogsAuthorized(token);
  
  if (logId) {
    await testGetLogUnauthorized(logId);
    await testGetLogAuthorized(token, logId);
  } else {
    console.log('\n⚠️  Skipping GET /logs/{logId} tests (no log ID available)');
  }
  
  await testCorsHeaders(token);

  // Cleanup
  await cleanupTestUser();

  // Print summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Test Summary');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Total Tests: ${results.passed + results.failed}`);
  console.log(`  ✅ Passed: ${results.passed}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
