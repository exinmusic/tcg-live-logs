const { handler } = require('./storeLog');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { mockClient } = require('aws-sdk-client-mock');

// Mock the DynamoDB client
const ddbMock = mockClient(DynamoDBDocumentClient);

describe('StoreLogFunction Lambda Handler', () => {
  beforeEach(() => {
    ddbMock.reset();
    process.env.TABLE_NAME = 'TestGameLogs';
  });

  afterEach(() => {
    delete process.env.TABLE_NAME;
  });

  it('should store a log and return 201 with logId and timestamp', async () => {
    // Mock successful DynamoDB put
    ddbMock.on(PutCommand).resolves({});

    const event = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'test-user-123',
          },
        },
      },
      body: JSON.stringify({
        content: 'Turn 1: Player 1 played Pikachu',
      }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(201);
    expect(response.headers['Content-Type']).toBe('application/json');
    expect(response.headers['Access-Control-Allow-Origin']).toBe('*');

    const body = JSON.parse(response.body);
    expect(body.logId).toBeDefined();
    expect(body.timestamp).toBeDefined();
    expect(body.createdAt).toBeDefined();
    expect(typeof body.logId).toBe('string');
    expect(typeof body.timestamp).toBe('number');
    expect(typeof body.createdAt).toBe('string');
  });

  it('should return 401 when user ID is missing', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {},
        },
      },
      body: JSON.stringify({
        content: 'Turn 1: Player 1 played Pikachu',
      }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('Unauthorized');
  });

  it('should return 400 when content is empty', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'test-user-123',
          },
        },
      },
      body: JSON.stringify({
        content: '',
      }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('Invalid log content');
  });

  it('should return 400 when content is not a string', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'test-user-123',
          },
        },
      },
      body: JSON.stringify({
        content: 123,
      }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('Invalid log content');
  });

  it('should return 400 when content is only whitespace', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'test-user-123',
          },
        },
      },
      body: JSON.stringify({
        content: '   ',
      }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('Invalid log content');
  });

  it('should return 500 when DynamoDB operation fails', async () => {
    // Mock DynamoDB error
    ddbMock.on(PutCommand).rejects(new Error('DynamoDB service error'));

    const event = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'test-user-123',
          },
        },
      },
      body: JSON.stringify({
        content: 'Turn 1: Player 1 played Pikachu',
      }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('Failed to store log');
  });

  it('should store correct data structure in DynamoDB', async () => {
    let capturedParams;
    ddbMock.on(PutCommand).callsFake((params) => {
      capturedParams = params;
      return {};
    });

    const event = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'test-user-123',
          },
        },
      },
      body: JSON.stringify({
        content: 'Turn 1: Player 1 played Pikachu',
      }),
    };

    await handler(event);

    expect(capturedParams.TableName).toBe('TestGameLogs');
    expect(capturedParams.Item.userId).toBe('test-user-123');
    expect(capturedParams.Item.logId).toBeDefined();
    expect(capturedParams.Item.content).toBe('Turn 1: Player 1 played Pikachu');
    expect(capturedParams.Item.timestamp).toBeDefined();
    expect(capturedParams.Item.createdAt).toBeDefined();
    expect(typeof capturedParams.Item.timestamp).toBe('number');
    expect(typeof capturedParams.Item.createdAt).toBe('string');
  });

  it('should generate unique log IDs for multiple requests', async () => {
    ddbMock.on(PutCommand).resolves({});

    const event = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'test-user-123',
          },
        },
      },
      body: JSON.stringify({
        content: 'Turn 1: Player 1 played Pikachu',
      }),
    };

    const response1 = await handler(event);
    const response2 = await handler(event);

    const body1 = JSON.parse(response1.body);
    const body2 = JSON.parse(response2.body);

    expect(body1.logId).not.toBe(body2.logId);
  });
});
