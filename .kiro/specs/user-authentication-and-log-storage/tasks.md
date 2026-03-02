# Implementation Plan: User Authentication and Log Storage

## Overview

This implementation plan adds user authentication via AWS Cognito and persistent game log storage via DynamoDB to the Pokemon TCG Log Visualizer. The implementation follows a serverless architecture using AWS managed services and maintains backward compatibility for unauthenticated users. Tasks are organized to build incrementally, with early validation through property-based tests.

## Tasks

- [x] 1. Set up AWS infrastructure and configuration
  - Create AWS Cognito User Pool with email/password authentication
  - Configure password policy (8+ chars, uppercase, lowercase, numbers)
  - Create DynamoDB table `GameLogs` with userId (partition key) and logId (sort key)
  - Set up API Gateway with Cognito authorizer
  - Configure CORS headers for CloudFront distribution
  - Create IAM roles for Lambda functions with DynamoDB access
  - _Requirements: 1.1, 5.1, 5.7_

- [ ] 2. Implement backend Lambda functions
  - [x] 2.1 Create StoreLogFunction Lambda handler
    - Implement handler to extract user ID from JWT claims
    - Generate unique log ID using UUID
    - Store log in DynamoDB with userId, logId, content, timestamp, createdAt
    - Return 201 response with logId and timestamp
    - Handle DynamoDB errors and return appropriate status codes
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_
  
  - [ ]* 2.2 Write property test for StoreLogFunction
    - **Property 6: Log storage round-trip preserves content**
    - **Property 7: Stored logs include timestamps**
    - **Property 8: Each stored log has a unique identifier**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
  
  - [x] 2.3 Create GetLogsFunction Lambda handler
    - Implement handler to extract user ID from JWT claims
    - Query DynamoDB for all logs with matching userId
    - Sort results by timestamp descending
    - Return 200 response with logs array
    - Handle empty results and DynamoDB errors
    - _Requirements: 3.2, 3.4, 5.5_
  
  - [ ]* 2.4 Write property test for GetLogsFunction
    - **Property 10: Retrieved logs belong to authenticated user**
    - **Property 12: Past games sorted by timestamp descending**
    - **Validates: Requirements 3.2, 3.4, 5.5**
  
  - [x] 2.5 Create GetLogFunction Lambda handler
    - Implement handler to extract user ID from JWT claims
    - Retrieve specific log from DynamoDB by userId and logId
    - Verify log belongs to requesting user (userId match)
    - Return 200 response with log data or 403 if ownership mismatch
    - Handle not found errors (404) and DynamoDB errors
    - _Requirements: 5.4, 5.5_
  
  - [ ]* 2.6 Write unit tests for Lambda error handling
    - Test authentication errors (missing/invalid JWT)
    - Test authorization errors (user accessing another user's log)
    - Test DynamoDB errors (service unavailable, capacity exceeded)
    - Test validation errors (empty content, malformed requests)
    - _Requirements: 2.5, 5.6, 6.4_

- [x] 3. Deploy API Gateway endpoints
  - Create POST /logs endpoint connected to StoreLogFunction
  - Create GET /logs endpoint connected to GetLogsFunction
  - Create GET /logs/{logId} endpoint connected to GetLogFunction
  - Attach Cognito User Pool authorizer to all endpoints
  - Configure request/response transformations
  - Test endpoints with valid and invalid JWT tokens
  - _Requirements: 5.2, 5.3, 5.4, 5.6_

- [X] 4. Checkpoint - Verify backend functionality
  - Ensure all Lambda functions deploy successfully
  - Test API endpoints with Postman or curl
  - Verify JWT validation works correctly
  - Verify DynamoDB operations (store, retrieve, query)
  - Ask the user if questions arise

- [x] 5. Implement frontend authentication context
  - [x] 5.1 Create AuthContext with React Context API
    - Define AuthState interface (isAuthenticated, user, tokens, isLoading, error)
    - Define AuthContextValue interface (state, signUp, signIn, signOut, getCurrentUser)
    - Implement AuthProvider component with state management
    - Initialize AWS Amplify with Cognito User Pool configuration
    - _Requirements: 1.1, 4.1_
  
  - [x] 5.2 Implement signUp function
    - Call Amplify Auth.signUp with email and password
    - Handle validation errors (weak password, invalid email)
    - Handle network errors with user-friendly messages
    - Update AuthState on success or error
    - _Requirements: 1.2, 6.1, 6.4_
  
  - [x] 5.3 Implement signIn function
    - Call Amplify Auth.signIn with email and password
    - Extract user ID and tokens from Cognito response
    - Store tokens securely in browser storage
    - Update AuthState with authenticated user
    - Handle invalid credentials with descriptive error messages
    - Handle network errors with user-friendly messages
    - _Requirements: 1.3, 1.4, 1.5, 4.1, 6.1, 6.4_
  
  - [ ]* 5.4 Write property tests for authentication
    - **Property 1: Authentication with valid credentials returns user identity**
    - **Property 2: Invalid credentials produce error messages**
    - **Property 14: Authentication stores tokens securely**
    - **Validates: Requirements 1.4, 1.5, 4.1**
  
  - [x] 5.5 Implement signOut function
    - Call Amplify Auth.signOut to end session
    - Clear tokens from browser storage
    - Reset AuthState to unauthenticated
    - Update UI to reflect unauthenticated state
    - _Requirements: 1.6, 1.7_
  
  - [ ]* 5.6 Write property test for logout
    - **Property 3: Logout transitions to unauthenticated state**
    - **Validates: Requirements 1.7**
  
  - [x] 5.7 Implement session persistence
    - Implement getCurrentUser function to check for existing session
    - Call on application load to restore authenticated session
    - Validate stored tokens and refresh if needed
    - Handle expired tokens by prompting re-authentication
    - Update AuthState based on session validity
    - _Requirements: 1.8, 4.2, 4.3, 4.4_
  
  - [ ]* 5.8 Write property tests for session persistence
    - **Property 4: Authentication persists across browser refresh**
    - **Property 15: Valid tokens restore authenticated session**
    - **Property 16: Expired tokens trigger re-authentication**
    - **Validates: Requirements 1.8, 4.3, 4.4**

- [x] 6. Implement authentication UI components
  - [x] 6.1 Create AuthUI component
    - Build login form with email and password inputs
    - Build signup form with email, password, and confirm password inputs
    - Add toggle to switch between login and signup modes
    - Add submit buttons with loading states
    - Display error messages inline for validation errors
    - Display banner errors for network and service errors
    - Connect to AuthContext signIn and signUp functions
    - _Requirements: 1.2, 1.3, 1.5, 6.1, 6.4, 6.5_
  
  - [x] 6.2 Add logout button to application header
    - Display logout button when user is authenticated
    - Hide logout button when user is not authenticated
    - Connect to AuthContext signOut function
    - Show loading indicator during logout
    - _Requirements: 1.6, 6.5_
  
  - [x] 6.3 Implement UI state updates on authentication changes
    - Subscribe to AuthContext state changes
    - Update header to show/hide logout button
    - Update main view to show/hide past games list
    - Display success confirmation on successful login/signup
    - _Requirements: 1.9, 6.6_
  
  - [ ]* 6.4 Write property test for UI state updates
    - **Property 5: UI reflects authentication state changes**
    - **Validates: Requirements 1.9**
  
  - [ ]* 6.5 Write unit tests for AuthUI component
    - Test login form rendering and submission
    - Test signup form rendering and submission
    - Test toggle between login and signup modes
    - Test error message display
    - Test loading state display
    - _Requirements: 1.2, 1.3, 1.5, 6.5_

- [ ] 7. Implement log storage service
  - [ ] 7.1 Create LogStorageService class
    - Implement storeLog method to POST log content to API
    - Include JWT token in Authorization header
    - Handle 401 errors (unauthorized) by prompting re-authentication
    - Handle network errors with user-friendly messages
    - Return logId and timestamp on success
    - _Requirements: 2.1, 5.2, 6.2, 6.4_
  
  - [ ] 7.2 Implement getLogs method
    - Send GET request to /logs endpoint with JWT token
    - Handle 401 errors by prompting re-authentication
    - Handle network errors with user-friendly messages
    - Return array of GameLog objects
    - _Requirements: 3.2, 5.3, 6.3, 6.4_
  
  - [ ] 7.3 Implement getLog method
    - Send GET request to /logs/{logId} endpoint with JWT token
    - Handle 401 errors by prompting re-authentication
    - Handle 403 errors (forbidden) with appropriate message
    - Handle 404 errors (not found) with appropriate message
    - Handle network errors with user-friendly messages
    - Return GameLog object on success
    - _Requirements: 5.4, 5.5, 6.3, 6.4_
  
  - [ ]* 7.4 Write property tests for log storage service
    - **Property 9: Storage failures return error messages**
    - **Property 17: Unauthorized access returns authentication error**
    - **Property 18: Network errors display user-friendly messages**
    - **Validates: Requirements 2.5, 5.6, 6.1, 6.2, 6.3**

- [ ] 8. Integrate log storage with existing log submission
  - [ ] 8.1 Update log submission handler
    - Check if user is authenticated using AuthContext
    - If authenticated, call LogStorageService.storeLog after visualization
    - Display loading indicator during storage operation
    - Display success confirmation when log is stored
    - Display error message if storage fails
    - If not authenticated, visualize without storing (existing behavior)
    - _Requirements: 2.1, 6.2, 6.5, 6.6, 7.1, 7.4_
  
  - [ ]* 8.2 Write property test for log storage integration
    - **Property 21: Successful operations show confirmation**
    - **Validates: Requirements 6.6**
  
  - [ ]* 8.3 Write unit tests for authenticated vs unauthenticated behavior
    - Test log storage for authenticated users
    - Test log visualization without storage for unauthenticated users
    - Test error handling during storage
    - _Requirements: 7.1, 7.3, 7.4_

- [ ] 9. Implement past games list component
  - [ ] 9.1 Create PastGamesList component
    - Display component only when user is authenticated
    - Call LogStorageService.getLogs on component mount
    - Display loading indicator while fetching logs
    - Display logs with timestamp in reverse chronological order
    - Display "No past games available" message when list is empty
    - Handle errors with user-friendly messages
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7, 6.3, 6.5_
  
  - [ ] 9.2 Implement log selection functionality
    - Add click handler to each log item
    - Call LogStorageService.getLog when log is clicked
    - Load log content into visualization area
    - Display loading indicator during fetch
    - Handle errors with user-friendly messages
    - _Requirements: 3.5, 6.3, 6.5_
  
  - [ ]* 9.3 Write property tests for past games list
    - **Property 11: Past games display includes timestamps**
    - **Property 13: Clicking a past game loads and visualizes it**
    - **Property 20: Operations display loading indicators**
    - **Validates: Requirements 3.3, 3.5, 6.5**
  
  - [ ]* 9.4 Write unit tests for PastGamesList component
    - Test component rendering when authenticated
    - Test component hidden when not authenticated
    - Test log list display with timestamps
    - Test empty state message
    - Test log selection and visualization
    - Test error handling
    - _Requirements: 3.1, 3.6, 3.7_

- [ ] 10. Add unauthenticated user messaging
  - Display message encouraging account creation below log input area
  - Show message only when user is not authenticated
  - Hide message when user is authenticated
  - Include benefits of creating an account (log storage, history)
  - _Requirements: 7.2_

- [ ] 11. Implement comprehensive error handling
  - [ ] 11.1 Create error categorization utility
    - Distinguish between authentication, authorization, and system errors
    - Map HTTP status codes to error categories
    - Generate user-friendly error messages for each category
    - _Requirements: 6.4_
  
  - [ ] 11.2 Add retry logic for transient failures
    - Implement exponential backoff for network errors
    - Retry 5xx errors up to 3 times
    - Do not retry 4xx errors (client errors)
    - Display retry attempts to user
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ]* 11.3 Write property test for error handling
    - **Property 19: Error messages distinguish error types**
    - **Validates: Requirements 6.4**
  
  - [ ]* 11.4 Write unit tests for error scenarios
    - Test authentication errors (401)
    - Test authorization errors (403)
    - Test not found errors (404)
    - Test server errors (500, 503)
    - Test network timeout errors
    - Test retry logic for transient failures
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 12. Checkpoint - Verify end-to-end functionality
  - Test complete signup flow (create account, verify email if required)
  - Test complete login flow (authenticate, restore session)
  - Test log submission and storage for authenticated users
  - Test past games list display and log selection
  - Test logout flow and return to unauthenticated state
  - Test unauthenticated user can still visualize logs
  - Verify all error messages are user-friendly
  - Verify all loading indicators display correctly
  - Ask the user if questions arise

- [ ] 13. Integration and final wiring
  - [ ] 13.1 Wire AuthProvider into application root
    - Wrap application with AuthProvider component
    - Ensure all components have access to AuthContext
    - Initialize Amplify configuration on app load
    - _Requirements: 1.1, 4.2_
  
  - [ ] 13.2 Position PastGamesList below log input area
    - Add PastGamesList component to main view
    - Position below existing log input textarea
    - Ensure responsive layout on mobile devices
    - _Requirements: 3.1_
  
  - [ ] 13.3 Update application to handle authentication state
    - Show AuthUI when user is not authenticated
    - Show logout button when user is authenticated
    - Show PastGamesList when user is authenticated
    - Show unauthenticated messaging when user is not authenticated
    - _Requirements: 1.9, 3.7, 7.2_
  
  - [ ]* 13.4 Write integration tests for complete user flows
    - Test signup → login → submit log → view past games → logout flow
    - Test session persistence across page refresh
    - Test unauthenticated user experience
    - Test error recovery flows
    - _Requirements: 1.8, 7.1, 7.3_

- [ ] 14. Final checkpoint - Comprehensive testing
  - Run all unit tests and verify >80% coverage
  - Run all property-based tests (22 properties)
  - Test on multiple browsers (Chrome, Firefox, Safari)
  - Test on mobile devices (responsive design)
  - Verify AWS infrastructure is properly configured
  - Verify CORS headers allow CloudFront requests
  - Test with real AWS Cognito and DynamoDB (not mocks)
  - Ensure all tests pass, ask the user if questions arise

- [ ]* 15. Write property test for unauthenticated user experience
  - **Property 22: Unauthenticated users can visualize logs**
  - **Validates: Requirements 7.1, 7.3, 7.4**

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples, edge cases, and error conditions
- AWS infrastructure setup (task 1) should be completed before backend implementation
- Frontend can be developed in parallel with backend after API contracts are defined
- All 22 correctness properties from the design document are covered by property tests
- Unauthenticated user experience is preserved throughout implementation
