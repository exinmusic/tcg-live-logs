# Implementation Plan: AWS Deployment

## Overview

This implementation plan creates AWS infrastructure and deployment automation for the Pokemon TCG log visualizer React application. The deployment uses AWS SAM for infrastructure as code, with two S3 buckets (app and images), CloudFront CDN for HTTPS, and automated scripts for deployment and image management. The architecture separates application code from card images to enable fast deployments and independent image updates.

## Tasks

- [ ] 1. Create SAM template for AWS infrastructure
  - [ ] 1.1 Create template.yaml with basic structure and parameters
    - Define AWSTemplateFormatVersion, Transform, and Description
    - Add parameters for stack configuration if needed
    - _Requirements: 5.1, 5.2_
  
  - [ ] 1.2 Define App Bucket resource with static website hosting
    - Create S3 bucket resource for React application
    - Configure static website hosting with index.html and error document
    - Set up bucket for CloudFront-only access (no public website endpoint)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ] 1.3 Define Image Bucket resource with public read access
    - Create S3 bucket resource for card images
    - Configure public read access policy for all objects
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ] 1.4 Define CloudFront Origin Access Control
    - Create OAC resource for secure S3 access
    - Configure for S3 origin type
    - _Requirements: 3.1, 3.2_
  
  - [ ] 1.5 Define CloudFront distribution with HTTPS and caching
    - Create CloudFront distribution pointing to App Bucket
    - Configure HTTPS-only (redirect HTTP to HTTPS)
    - Set default root object to index.html
    - Configure custom error response: 404 → index.html (200 status) for client-side routing
    - Set standard caching behavior for static assets
    - Use default price class (all edge locations)
    - Link to Origin Access Control
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [ ] 1.6 Define bucket policies for access control
    - Create App Bucket policy allowing CloudFront OAC access only
    - Create Image Bucket policy allowing public read access
    - _Requirements: 3.1, 3.2, 3.3, 7.2_
  
  - [ ] 1.7 Add template outputs for deployment information
    - Output CloudFront distribution URL (WebsiteURL)
    - Output CloudFront distribution ID for cache invalidation
    - Output App Bucket name
    - Output Image Bucket name
    - Output Image Bucket URL
    - _Requirements: 5.3, 5.4, 6.6, 7.6_
  
  - [ ]* 1.8 Write unit tests for SAM template structure
    - Test template is valid YAML
    - Test all required resources are defined (App Bucket, Image Bucket, CloudFront, policies)
    - Test output definitions exist
    - Test bucket policies have correct permissions
    - Test CloudFront configuration matches requirements
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.3, 5.4, 7.1, 7.2_
  
  - [ ]* 1.9 Write property test for SAM template validation
    - **Property 4: SAM template validation**
    - **Validates: Requirements 5.2**
    - Generate template variations and verify all pass AWS SAM validation rules

- [ ] 2. Update Vite configuration to exclude card images from build
  - [ ] 2.1 Modify vite.config.ts to exclude public/card-images directory
    - Configure build to exclude card images from output
    - Verify build output only contains HTML, CSS, JS files
    - Document the configuration change
    - _Requirements: 1.5, 7.4_
  
  - [ ]* 2.2 Write property test for build artifact content correctness
    - **Property 2: Build artifact content correctness**
    - **Validates: Requirements 1.4, 1.5, 7.4**
    - Generate various build outputs and verify compiled files are present and card images are absent

- [ ] 3. Create environment configuration for image bucket URL
  - [ ] 3.1 Add VITE_IMAGE_BASE_URL environment variable support
    - Create or update .env.example with VITE_IMAGE_BASE_URL
    - Document environment variable in comments
    - _Requirements: 7.5, 10.1_
  
  - [ ] 3.2 Update image loading logic to use environment variable
    - Modify code to use VITE_IMAGE_BASE_URL for image paths
    - Fallback to local /card-images path in development
    - Update manifest loading to fetch from Image Bucket URL
    - _Requirements: 7.5, 9.3, 9.4_

- [ ] 4. Checkpoint - Verify infrastructure and configuration
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Create deployment automation script
  - [ ] 5.1 Create scripts/deploy.sh with AWS credential validation
    - Create scripts directory if it doesn't exist
    - Add shebang and set -e for error handling
    - Validate AWS credentials are configured before proceeding
    - Check for required tools (AWS CLI, SAM CLI, npm)
    - _Requirements: 6.1, 10.1, 10.4, 10.5_
  
  - [ ] 5.2 Add build step to deployment script
    - Execute npm run build
    - Verify /dist directory exists after build
    - Exit with error if build fails
    - _Requirements: 1.1, 1.2, 6.2_
  
  - [ ] 5.3 Add SAM package and deploy steps
    - Execute sam package to package template
    - Execute sam deploy with stack name and region parameters
    - Support --stack-name and --region command-line arguments
    - Use defaults if not specified
    - _Requirements: 6.3, 6.4, 10.2, 10.3_
  
  - [ ] 5.4 Add S3 sync step to upload build artifacts
    - Retrieve App Bucket name from CloudFormation stack outputs
    - Execute aws s3 sync to upload /dist contents to App Bucket
    - Delete removed files (--delete flag)
    - _Requirements: 2.5, 6.5_
  
  - [ ] 5.5 Add CloudFront cache invalidation step
    - Retrieve CloudFront distribution ID from stack outputs
    - Execute aws cloudfront create-invalidation for /* path
    - Wait for invalidation to complete or report invalidation ID
    - _Requirements: 6.5_
  
  - [ ] 5.6 Add output display for deployment results
    - Retrieve and display CloudFront URL from stack outputs
    - Display Image Bucket URL
    - Display deployment success message
    - _Requirements: 6.6, 7.6_
  
  - [ ] 5.7 Add comprehensive error handling
    - Exit immediately on any command failure (set -e)
    - Provide specific error messages for each failure type
    - Include remediation instructions in error messages
    - _Requirements: 1.3, 6.7_
  
  - [ ]* 5.8 Write unit tests for deployment script logic
    - Test AWS credential validation
    - Test command execution order
    - Test build failure handling
    - Test SAM deployment failure handling
    - Test CloudFront URL output
    - Test parameter parsing (stack name, region)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 5.9 Write property test for build failure halts deployment
    - **Property 3: Build failure halts deployment**
    - **Validates: Requirements 1.3**
    - Generate various build failure scenarios and verify deployment halts
  
  - [ ]* 5.10 Write property test for deployment failure handling
    - **Property 5: Deployment failure handling**
    - **Validates: Requirements 6.7**
    - Generate failures at different deployment steps and verify system halts with specific errors
  
  - [ ]* 5.11 Write property test for deployment success output
    - **Property 6: Deployment success output**
    - **Validates: Requirements 6.6**
    - Generate various successful deployment scenarios and verify CloudFront URL is output
  
  - [ ]* 5.12 Write property test for AWS region configuration
    - **Property 10: AWS region configuration**
    - **Validates: Requirements 10.2**
    - Generate various region parameters and verify region is used for all AWS operations
  
  - [ ]* 5.13 Write property test for stack name configuration
    - **Property 11: Stack name configuration**
    - **Validates: Requirements 10.3**
    - Generate various stack name parameters and verify stack name is used
  
  - [ ]* 5.14 Write property test for AWS credentials validation
    - **Property 12: AWS credentials validation**
    - **Validates: Requirements 10.4, 10.5**
    - Generate scenarios with missing/invalid credentials and verify validation occurs

- [ ] 6. Create image upload automation script
  - [ ] 6.1 Create scripts/upload-images.sh with bucket validation
    - Create script with shebang and error handling
    - Validate AWS credentials are configured
    - Accept --stack-name and --dry-run command-line arguments
    - Retrieve Image Bucket name from CloudFormation stack outputs
    - Check if stack exists and report error with instructions if not
    - _Requirements: 8.1, 8.6, 8.7, 10.1_
  
  - [ ] 6.2 Add image upload logic with directory structure preservation
    - Execute aws s3 sync from public/card-images/ to Image Bucket
    - Preserve directory structure in S3 paths
    - Set content-type headers: image/png for .png, image/svg+xml for .svg
    - Use --size-only for efficient uploads (only changed files)
    - Support --dry-run flag for preview
    - _Requirements: 8.2, 8.3, 8.4, 8.5_
  
  - [ ] 6.3 Add manifest upload logic
    - Check if manifest.json exists in public/card-images/
    - Upload manifest.json to Image Bucket root
    - Set content-type to application/json
    - _Requirements: 9.1, 9.2, 9.5_
  
  - [ ] 6.4 Add upload statistics and progress reporting
    - Display number of files uploaded
    - Display number of files skipped (unchanged)
    - Display total upload size
    - Display upload duration
    - _Requirements: 8.5_
  
  - [ ]* 6.5 Write unit tests for image upload script
    - Test bucket existence validation
    - Test missing bucket error handling
    - Test manifest upload to correct location
    - Test content-type header setting
    - Test directory structure preservation
    - Test dry-run mode
    - _Requirements: 8.1, 8.3, 8.4, 8.7, 9.1, 9.2_
  
  - [ ]* 6.6 Write property test for directory structure preservation
    - **Property 7: Image upload directory structure preservation**
    - **Validates: Requirements 8.3**
    - Generate various directory structures and verify structure is preserved in S3
  
  - [ ]* 6.7 Write property test for content-type headers
    - **Property 8: Image upload content-type headers**
    - **Validates: Requirements 8.4**
    - Generate various image file types and verify correct content-type headers
  
  - [ ]* 6.8 Write property test for image bucket missing error
    - **Property 9: Image bucket missing error**
    - **Validates: Requirements 8.7**
    - Generate scenarios where bucket doesn't exist and verify error with instructions

- [ ] 7. Add npm scripts for deployment commands
  - [ ] 7.1 Add deploy script to package.json
    - Add "deploy" script that executes scripts/deploy.sh
    - Support passing arguments to script (stack name, region)
    - Make script executable (chmod +x)
    - _Requirements: 6.1_
  
  - [ ] 7.2 Add upload:images script to package.json
    - Add "upload:images" script that executes scripts/upload-images.sh
    - Support passing arguments to script (stack name, dry-run)
    - Make script executable (chmod +x)
    - _Requirements: 8.1, 8.6_

- [ ] 8. Checkpoint - Verify deployment automation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Create deployment documentation
  - [ ] 9.1 Create docs/DEPLOYMENT.md with prerequisites and setup
    - Document required tools (AWS CLI, SAM CLI, Node.js, npm)
    - Document required AWS permissions (S3, CloudFront, CloudFormation, IAM)
    - Document AWS credential configuration steps
    - _Requirements: 11.1, 11.2_
  
  - [ ] 9.2 Add deployment instructions to documentation
    - Document step-by-step initial deployment process
    - Document deployment command and available parameters
    - Document how to update an existing deployment
    - Include example commands with different configurations
    - _Requirements: 11.3, 11.4, 11.5_
  
  - [ ] 9.3 Add image management instructions to documentation
    - Document how to upload images independently using upload:images script
    - Document when to use image upload vs full deployment
    - Include example commands for image uploads
    - _Requirements: 11.6_
  
  - [ ] 9.4 Add cost information to documentation
    - Explain S3 Standard storage class usage
    - Explain CloudFront pay-as-you-go pricing with no minimum fees
    - Explain benefits of separating app and image buckets for cost optimization
    - Document that CloudFront uses usage-based billing
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_
  
  - [ ] 9.5 Add troubleshooting section to documentation
    - Document common deployment errors and solutions
    - Document how to check CloudFormation stack status
    - Document how to manually invalidate CloudFront cache
    - Document how to verify S3 bucket contents

- [ ]* 10. Write property test for build artifact directory existence
  - **Property 1: Build artifact directory existence**
  - **Validates: Requirements 1.2**
  - Generate various build scenarios and verify /dist directory exists after successful builds

- [ ]* 11. Create integration tests for full deployment flow
  - [ ]* 11.1 Write integration test for full deployment with CloudFront
    - Deploy infrastructure to test AWS account
    - Verify S3 buckets are created
    - Verify CloudFront distribution is created
    - Verify HTTPS access works
    - Upload test images
    - Verify images are accessible
    - Clean up test resources
    - _Requirements: 2.1, 2.4, 4.1, 4.2, 7.1, 7.2_
  
  - [ ]* 11.2 Write integration test for update deployment
    - Deploy initial version
    - Make code changes
    - Deploy update
    - Verify changes are live after cache invalidation
    - Verify images were not re-uploaded
    - Clean up test resources
    - _Requirements: 6.5, 7.4_
  
  - [ ]* 11.3 Write integration test for independent image update
    - Deploy infrastructure
    - Upload initial images
    - Add new test images
    - Run image upload script
    - Verify new images are accessible
    - Verify application was not redeployed
    - Clean up test resources
    - _Requirements: 8.2, 8.6, 9.5_

- [ ] 12. Final checkpoint - Complete deployment system verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end deployment flows in a test AWS account
- The deployment script and image upload script should be idempotent (safe to run multiple times)
- CloudFront is mandatory in this design for HTTPS support
