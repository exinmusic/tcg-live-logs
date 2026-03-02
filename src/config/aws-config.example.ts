// AWS Configuration for TCG Log Visualizer
// Copy this file to aws-config.ts and fill in the values from your CloudFormation stack outputs

export const awsConfig = {
  // Cognito Configuration
  cognito: {
    userPoolId: 'YOUR_USER_POOL_ID', // From CloudFormation output: UserPoolId
    userPoolClientId: 'YOUR_USER_POOL_CLIENT_ID', // From CloudFormation output: UserPoolClientId
    region: 'YOUR_AWS_REGION', // e.g., 'us-east-1'
  },
  
  // API Gateway Configuration
  api: {
    endpoint: 'YOUR_API_GATEWAY_URL', // From CloudFormation output: LogsApiUrl
    region: 'YOUR_AWS_REGION', // e.g., 'us-east-1'
  },
};
