# Requirements Document

## Introduction

This document defines requirements for deploying the Pokemon TCG log visualizer React application to AWS using AWS SAM (Serverless Application Model) for infrastructure as code. The deployment will host the static React application on S3 with CloudFront CDN for improved performance and HTTPS support.

## Glossary

- **Deployment_System**: The AWS SAM-based infrastructure and automation that deploys the application
- **React_App**: The Pokemon TCG log visualizer frontend application built with Vite
- **App_Bucket**: AWS S3 bucket configured for static website hosting of the React application
- **Image_Bucket**: AWS S3 bucket dedicated to storing card images separately from the application
- **CloudFront_Distribution**: AWS CloudFront CDN distribution for content delivery
- **SAM_Template**: AWS SAM template file defining infrastructure resources
- **Build_Artifact**: The compiled static files in the /dist directory after running the build command (excludes card images)
- **Static_Asset**: HTML, CSS, and JavaScript files served to users
- **Card_Image**: PNG or SVG image files for Pokemon TCG cards stored in the Image_Bucket
- **Image_Upload_Script**: Script that uploads Card_Image files to the Image_Bucket independently from app deployment
- **Image_Manifest**: JSON file listing available Card_Image files, stored in Image_Bucket and fetched by React_App at runtime

## Requirements

### Requirement 1: Build React Application

**User Story:** As a developer, I want the deployment process to build the React application, so that the latest code changes are included in the deployment

#### Acceptance Criteria

1. WHEN the deployment process starts, THE Deployment_System SHALL execute the build command "npm run build"
2. THE Deployment_System SHALL verify that the Build_Artifact directory exists after the build completes
3. IF the build command fails, THEN THE Deployment_System SHALL halt deployment and report the error
4. THE Build_Artifact SHALL include all compiled JavaScript, CSS, and HTML files
5. THE Build_Artifact SHALL NOT include Card_Image files from the public/card-images directory

### Requirement 2: Create S3 Static Website Hosting

**User Story:** As a developer, I want to host the application on S3, so that I have a simple and cost-effective hosting solution

#### Acceptance Criteria

1. THE SAM_Template SHALL define an App_Bucket configured for static website hosting
2. THE App_Bucket SHALL have index document set to "index.html"
3. THE App_Bucket SHALL have error document set to "index.html" for client-side routing support
4. WHEN the SAM_Template is deployed, THE Deployment_System SHALL create the App_Bucket with public read access for website content
5. THE Deployment_System SHALL upload all files from the Build_Artifact directory to the App_Bucket

### Requirement 3: Configure Bucket Access Policy

**User Story:** As a developer, I want the S3 bucket to have appropriate access controls, so that the website is publicly accessible while maintaining security

#### Acceptance Criteria

1. THE SAM_Template SHALL define a bucket policy restricting direct access and allowing only CloudFront access
2. THE bucket policy SHALL prevent public direct access to the App_Bucket
3. THE Deployment_System SHALL apply the bucket policy during deployment

### Requirement 4: CloudFront Distribution

**User Story:** As a developer, I want to deploy with CloudFront, so that I can provide HTTPS and improved performance

#### Acceptance Criteria

1. THE SAM_Template SHALL define a CloudFront_Distribution pointing to the App_Bucket
2. THE CloudFront_Distribution SHALL use HTTPS for all client connections
3. THE CloudFront_Distribution SHALL cache Static_Asset files according to standard caching rules
4. THE CloudFront_Distribution SHALL have a default root object of "index.html"
5. THE CloudFront_Distribution SHALL handle 404 errors by serving "index.html" with 200 status for client-side routing
6. THE CloudFront_Distribution SHALL use pay-as-you-go pricing with no upfront costs

### Requirement 5: SAM Template Infrastructure Definition

**User Story:** As a developer, I want infrastructure defined as code in a SAM template, so that deployments are repeatable and version-controlled

#### Acceptance Criteria

1. THE Deployment_System SHALL include a SAM_Template file named "template.yaml" in the project root
2. THE SAM_Template SHALL define all required AWS resources using SAM or CloudFormation syntax
3. THE SAM_Template SHALL output the CloudFront distribution domain name after successful deployment
4. THE SAM_Template SHALL output the website URL after successful deployment

### Requirement 6: Deployment Automation

**User Story:** As a developer, I want automated deployment commands, so that I can deploy with a single command

#### Acceptance Criteria

1. THE Deployment_System SHALL provide a deployment script or npm command that executes the full deployment process
2. WHEN the deployment command is executed, THE Deployment_System SHALL build the React_App
3. WHEN the deployment command is executed, THE Deployment_System SHALL package the SAM_Template
4. WHEN the deployment command is executed, THE Deployment_System SHALL deploy the SAM_Template to AWS
5. WHEN the deployment command is executed, THE Deployment_System SHALL sync Build_Artifact files to the App_Bucket
6. WHEN deployment completes successfully, THE Deployment_System SHALL output the application URL
7. IF any deployment step fails, THEN THE Deployment_System SHALL report the error and halt execution

### Requirement 7: Separate Image Storage

**User Story:** As a developer, I want card images stored separately from the application deployment, so that deployments are fast and image updates are independent

#### Acceptance Criteria

1. THE SAM_Template SHALL define an Image_Bucket for storing Card_Image files
2. THE Image_Bucket SHALL have public read access for all Card_Image files
3. THE Image_Bucket SHALL be separate from the App_Bucket
4. THE Build_Artifact SHALL NOT include Card_Image files
5. THE React_App SHALL fetch Card_Image files from the Image_Bucket at runtime
6. THE Deployment_System SHALL output the Image_Bucket URL after deployment

### Requirement 8: Image Upload Script

**User Story:** As a developer, I want a script to upload card images independently, so that I can update images without redeploying the application

#### Acceptance Criteria

1. THE Deployment_System SHALL provide an Image_Upload_Script for uploading Card_Image files
2. WHEN the Image_Upload_Script is executed, THE Image_Upload_Script SHALL upload all Card_Image files from the public/card-images directory to the Image_Bucket
3. THE Image_Upload_Script SHALL preserve the directory structure when uploading to the Image_Bucket
4. THE Image_Upload_Script SHALL set appropriate content-type headers for PNG and SVG files
5. WHEN uploading files, THE Image_Upload_Script SHALL handle the 4270+ Card_Image files efficiently
6. THE Image_Upload_Script SHALL be executable independently from the main deployment process
7. IF the Image_Bucket does not exist, THEN THE Image_Upload_Script SHALL report an error with instructions

### Requirement 9: Image Manifest Management

**User Story:** As a developer, I want the image manifest stored in S3, so that the application can dynamically discover available images

#### Acceptance Criteria

1. THE Image_Upload_Script SHALL upload the Image_Manifest file (manifest.json) to the Image_Bucket
2. THE Image_Manifest SHALL be stored at the root level of the Image_Bucket
3. THE React_App SHALL fetch the Image_Manifest from the Image_Bucket at runtime
4. THE Image_Manifest SHALL list all available Card_Image files with their paths
5. WHEN Card_Image files are updated, THE Image_Upload_Script SHALL update the Image_Manifest in the Image_Bucket
6. THE Image_Manifest SHALL be accessible via a public URL from the Image_Bucket

### Requirement 10: Environment Configuration

**User Story:** As a developer, I want to configure AWS credentials and deployment settings, so that the deployment targets the correct AWS account and region

#### Acceptance Criteria

1. THE Deployment_System SHALL use AWS credentials from the standard AWS credential chain
2. THE Deployment_System SHALL support specifying the AWS region via SAM configuration or parameter
3. THE Deployment_System SHALL support specifying a unique stack name for the CloudFormation stack
4. THE Deployment_System SHALL validate that AWS credentials are configured before attempting deployment
5. IF AWS credentials are not configured, THEN THE Deployment_System SHALL report an error with instructions

### Requirement 11: Deployment Documentation

**User Story:** As a developer, I want clear documentation for the deployment process, so that I can deploy and maintain the application

#### Acceptance Criteria

1. THE Deployment_System SHALL include a README or documentation file describing deployment prerequisites
2. THE documentation SHALL list required AWS permissions for deployment
3. THE documentation SHALL provide step-by-step deployment instructions
4. THE documentation SHALL document the deployment command and available parameters
5. THE documentation SHALL include instructions for updating an existing deployment
6. THE documentation SHALL explain how to use the Image_Upload_Script to manage Card_Image files independently

### Requirement 12: Cost Optimization

**User Story:** As a developer, I want the deployment to be cost-effective, so that hosting costs remain minimal

#### Acceptance Criteria

1. THE SAM_Template SHALL use S3 Standard storage class for Static_Asset files in both App_Bucket and Image_Bucket
2. THE CloudFront_Distribution SHALL use pay-as-you-go pricing with no upfront costs or reserved capacity
3. THE SAM_Template SHALL use the default CloudFront price class for standard global distribution
4. THE Deployment_System SHALL not create unnecessary AWS resources beyond those required for static hosting
5. THE documentation SHALL explain that CloudFront uses usage-based billing with no minimum fees
6. THE separation of App_Bucket and Image_Bucket SHALL enable independent updates without redeploying all assets
