const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { getCorsHeaders } = require('./corsHeaders');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  const corsHeaders = getCorsHeaders(event);

  try {
    // Extract user ID from Cognito authorizer claims
    const userId = event.requestContext.authorizer.claims.sub;
    
    if (!userId) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Unauthorized: User ID not found' }),
      };
    }

    // Query DynamoDB for all logs with matching userId
    const params = {
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    };

    const result = await docClient.send(new QueryCommand(params));

    // Sort results by timestamp descending (most recent first)
    const logs = (result.Items || []).sort((a, b) => b.timestamp - a.timestamp);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        logs,
      }),
    };
  } catch (error) {
    console.error('Error retrieving logs:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to retrieve logs' }),
    };
  }
};
