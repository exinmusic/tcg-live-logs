const { handler } = require('./getLog');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { mockClient } = require('aws-sdk-client-mock');

// Mock the DynamoDB client
const ddbMock = mockClient(DynamoDBDocumentClient);

describe('GetLogFunction Lambda Handler', () => {
  beforeEach(() => {
    ddbMock.reset();
    process.env.TABLE_NAME = 'TestGameLogs';
  });

  afterEach(() => {
    delete process.env.TABLE_NAME;
  });

  it('should retrieve a log and return 200 with log data', async () => {
    const mockLog = {
      userId: 'test-user-123',
      logId: 'test-log-456',
      content: 'Turn 1: Player 1 played Pikachu',
      timestamp: 1234567890,
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    // Mock successful DynamoDB get
    ddbMock.on(GetCommand).resolves({
      Item: mockLog,
    });

    const event = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'test-user-123',
          },
        },
      },
      pathParameters: {
        logId: 'test-log-456',
      },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(response.headers['Content-Type']).toBe('application/json');
    expect(response.headers['Access-Control-Allow-Origin']).toBe('*');

    const body = JSON.parse(response.body);
    expect(body.userId).toBe('test-user-123');
    expect(body.logId).toBe('test-log-456');
    expect(body.content).toBe('Turn 1: Player 1 played Pikachu');
    expect(body.timestamp).toBe(1234567890);
    expect(body.createdAt).toBe('2024-01-01T00:00:00.000Z');
  });

  it('should return 401 when user ID is missing', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {},
        },
      },
      pathParameters: {
        logId: 'test-log-456',
      },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('Unauthorized');
  });

  it('should return 400 when logId parameter is missing', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'test-user-123',
          },
        },
      },
      pathParameters: {},
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('Missing logId parameter');
  });

  it('should return 404 when log does not exist', async () => {
    // Mock DynamoDB returning no item
    ddbMock.on(GetCommand).resolves({
      Item: undefined,
    });

    const event = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'test-user-123',
          },
        },
      },
      pathParameters: {
        logId: 'non-existent-log',
      },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('Log not found');
  });

  it('should return 403 when user tries to access another user\'s log', async () => {
    const mockLog = {
      userId: 'other-user-999',
      logId: 'test-log-456',
      content: 'Turn 1: Player 1 played Pikachu',
      timestamp: 1234567890,
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    // Mock DynamoDB returning a log belonging to a different user
    ddbMock.on(GetCommand).resolves({
      Item: mockLog,
    });

    const event = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'test-user-123',
          },
        },
      },
      pathParameters: {
        logId: 'test-log-456',
      },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('Forbidden');
  });

  it('should return 500 when DynamoDB operation fails', async () => {
    // Mock DynamoDB error
    ddbMock.on(GetCommand).rejects(new Error('DynamoDB service error'));

    const event = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'test-user-123',
          },
        },
      },
      pathParameters: {
        logId: 'test-log-456',
      },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('Failed to retrieve log');
  });

  it('should query DynamoDB with correct composite key', async () => {
    let capturedParams;
    ddbMock.on(GetCommand).callsFake((params) => {
      capturedParams = params;
      return {
        Item: {
          userId: 'test-user-123',
          logId: 'test-log-456',
          content: 'Test content',
          timestamp: 1234567890,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      };
    });

    const event = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'test-user-123',
          },
        },
      },
      pathParameters: {
        logId: 'test-log-456',
      },
    };

    await handler(event);

    expect(capturedParams.TableName).toBe('TestGameLogs');
    expect(capturedParams.Key.userId).toBe('test-user-123');
    expect(capturedParams.Key.logId).toBe('test-log-456');
  });

  it('should handle pathParameters being null', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'test-user-123',
          },
        },
      },
      pathParameters: null,
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('Missing logId parameter');
  });

  it('should return complete log data structure', async () => {
    const mockLog = {
      userId: 'test-user-123',
      logId: 'test-log-456',
      content: 'Turn 1: Player 1 played Pikachu\nTurn 2: Player 2 played Charizard',
      timestamp: 1704067200000,
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    ddbMock.on(GetCommand).resolves({
      Item: mockLog,
    });

    const event = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'test-user-123',
          },
        },
      },
      pathParameters: {
        logId: 'test-log-456',
      },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    
    // Verify all fields are present
    expect(body).toHaveProperty('userId');
    expect(body).toHaveProperty('logId');
    expect(body).toHaveProperty('content');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('createdAt');
    
    // Verify field values match
    expect(body).toEqual(mockLog);
  });
});
