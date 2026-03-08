const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');
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

    // Parse request body
    const body = JSON.parse(event.body);
    const { content } = body;

    // Validate content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid log content' }),
      };
    }

    // Generate unique log ID and timestamp
    const logId = randomUUID();
    const timestamp = Date.now();
    const createdAt = new Date(timestamp).toISOString();

    // Store log in DynamoDB
    const params = {
      TableName: process.env.TABLE_NAME,
      Item: {
        userId,
        logId,
        content,
        timestamp,
        createdAt,
      },
    };

    await docClient.send(new PutCommand(params));

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        logId,
        timestamp,
        createdAt,
      }),
    };
  } catch (error) {
    console.error('Error storing log:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to store log' }),
    };
  }
};
