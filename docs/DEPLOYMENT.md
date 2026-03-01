# Deployment Guide

This guide covers deploying the Pokemon TCG Log Visualizer to AWS using AWS SAM. The app is hosted on S3 with CloudFront for HTTPS and global CDN delivery.

## Architecture Overview

- **App Bucket** – S3 bucket hosting the compiled React app (HTML, CSS, JS)
- **Image Bucket** – S3 bucket storing 4270+ card images, separate from the app
- **CloudFront** – CDN distribution providing HTTPS and caching

Separating the app and image buckets means you can redeploy the app without re-uploading thousands of images, and update images without redeploying the app.

---

## Prerequisites

### Required Tools

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | https://nodejs.org/ |
| npm | 9+ | Included with Node.js |
| AWS CLI | v2 | https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html |
| SAM CLI | latest | https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html |

Verify your installations:

```bash
node --version
npm --version
aws --version
sam --version
```

### Required AWS Permissions

Your AWS credentials need the following permissions:

**S3**
- `s3:CreateBucket`, `s3:DeleteBucket`
- `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`
- `s3:PutBucketPolicy`, `s3:PutBucketWebsite`
- `s3:ListBucket`

**CloudFront**
- `cloudfront:CreateDistribution`, `cloudfront:UpdateDistribution`
- `cloudfront:CreateInvalidation`
- `cloudfront:CreateOriginAccessControl`

**CloudFormation**
- `cloudformation:CreateStack`, `cloudformation:UpdateStack`, `cloudformation:DescribeStacks`
- `cloudformation:CreateChangeSet`, `cloudformation:ExecuteChangeSet`

**IAM**
- `iam:CreateRole`, `iam:AttachRolePolicy`, `iam:PassRole`
- Required for SAM to manage resource permissions

### AWS Credential Configuration

Configure credentials using one of these methods:

**Option 1 – AWS CLI (recommended for local development)**
```bash
aws configure
# Enter: AWS Access Key ID, Secret Access Key, default region, output format
```

**Option 2 – Environment variables**
```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-1
```

**Option 3 – AWS SSO / IAM Identity Center**
```bash
aws sso login --profile your-profile
export AWS_PROFILE=your-profile
```

Verify credentials are working:
```bash
aws sts get-caller-identity
```

---

## Initial Deployment

### Step-by-Step

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run the deployment command**
   ```bash
   npm run deploy
   ```

   This single command will:
   - Validate AWS credentials and required tools
   - Build the React app (`npm run build`)
   - Package the SAM template
   - Deploy infrastructure via CloudFormation (creates S3 buckets and CloudFront)
   - Sync build artifacts to the App Bucket
   - Invalidate the CloudFront cache
   - Print the live website URL

3. **Upload card images** (first time only, or when images change)
   ```bash
   npm run upload:images
   ```

The first deployment takes 5–15 minutes because CloudFront distribution creation is slow. Subsequent deployments are faster.

### Deployment Parameters

Both scripts accept optional parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `--stack-name` | `pokemon-tcg-visualizer` | CloudFormation stack name |
| `--region` | `us-east-1` | AWS region |

### Example Commands

```bash
# Deploy with defaults
npm run deploy

# Deploy to a custom stack name
npm run deploy -- --stack-name my-tcg-app

# Deploy to a different region
npm run deploy -- --region eu-west-1

# Deploy with both custom stack name and region
npm run deploy -- --stack-name my-tcg-app --region eu-west-1
```

After a successful deployment, the script prints:

```
╔══════════════════════════════════════════════════════════════╗
║           Deployment completed successfully!                 ║
╠══════════════════════════════════════════════════════════════╣
║  Website URL    : https://xxxxxxxxxxxx.cloudfront.net        ║
║  Image Bucket   : https://your-image-bucket.s3.amazonaws.com ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Updating an Existing Deployment

To deploy code changes, run the same deploy command:

```bash
npm run deploy
```

SAM deploy is idempotent — it only updates resources that have changed. The script will:
- Rebuild the app
- Update the CloudFormation stack if the template changed
- Sync only changed files to S3
- Invalidate the CloudFront cache so users see the new version immediately

> Note: CloudFront cache invalidation is initiated automatically but may take a few minutes to propagate globally.

---

## Image Management

### Uploading Images

Card images are stored in the Image Bucket separately from the app. Upload them independently using:

```bash
npm run upload:images
```

The script:
- Retrieves the Image Bucket name from the CloudFormation stack
- Syncs all PNG and SVG files from `public/card-images/` to S3
- Sets correct content-type headers (`image/png`, `image/svg+xml`)
- Uploads `manifest.json` to the bucket root
- Only uploads changed files (efficient for large image sets)

### Image Upload Parameters

| Parameter | Description |
|-----------|-------------|
| `--stack-name <name>` | Target a specific CloudFormation stack |
| `--dry-run` | Preview what would be uploaded without actually uploading |

### Example Commands

```bash
# Upload images to the default stack
npm run upload:images

# Upload to a specific stack
npm run upload:images -- --stack-name my-tcg-app

# Preview what would be uploaded (no changes made)
npm run upload:images -- --dry-run

# Dry run against a specific stack
npm run upload:images -- --stack-name my-tcg-app --dry-run
```

### When to Upload Images vs Full Deployment

| Scenario | Command |
|----------|---------|
| Code changes (React app, styles, logic) | `npm run deploy` |
| New or updated card images | `npm run upload:images` |
| First-time setup | `npm run deploy` then `npm run upload:images` |
| Infrastructure changes (template.yaml) | `npm run deploy` |
| Both code and image changes | `npm run deploy` then `npm run upload:images` |

---

## Cost Information

This deployment is designed to be cost-effective with no upfront costs.

### S3 Storage

Both the App Bucket and Image Bucket use **S3 Standard** storage class. You pay only for:
- Storage used (GB/month)
- Data transfer out
- PUT/GET requests

For a typical deployment, S3 costs are minimal (usually under $1/month for the app bucket).

### CloudFront

CloudFront uses **pay-as-you-go pricing with no minimum fees and no upfront costs**. You are billed based on:
- Data transfer out to the internet (per GB)
- Number of HTTP/HTTPS requests

There is no reserved capacity or commitment required. If the app has no traffic, CloudFront costs nothing beyond the free tier.

### Cost Optimization Benefits

Separating the App Bucket and Image Bucket provides cost benefits:
- **Faster, cheaper app deployments** – redeploying the app doesn't re-upload 4270+ card images, saving S3 PUT request costs and time
- **Independent image updates** – updating images doesn't trigger a full app rebuild or CloudFront invalidation for app files
- **Efficient syncing** – `aws s3 sync` with `--size-only` only uploads changed files, minimizing unnecessary transfer costs

### Estimated Monthly Costs (low-traffic app)

| Service | Estimated Cost |
|---------|---------------|
| S3 (app + images storage) | ~$0.10–$0.50 |
| CloudFront (usage-based) | ~$0.00–$1.00 |
| Data transfer | Varies by traffic |

Actual costs depend on traffic volume and data transfer. Use the [AWS Pricing Calculator](https://calculator.aws/) for a detailed estimate.

---

## Troubleshooting

### Common Errors

**"AWS credentials not found"**
```
ERROR: AWS credentials not found. Please configure credentials using 'aws configure'
```
Run `aws configure` or set the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables. Verify with `aws sts get-caller-identity`.

---

**"Required tool is not installed"**
```
ERROR: Required tool 'sam' is not installed or not on PATH.
```
Install the missing tool (see Prerequisites section). Ensure it's on your `PATH` by running `sam --version`.

---

**"CloudFormation stack not found" (during image upload)**
```
ERROR: CloudFormation stack 'pokemon-tcg-visualizer' not found. Please deploy the infrastructure first using 'npm run deploy'.
```
Run `npm run deploy` before running `npm run upload:images`. The image upload script needs the stack to exist to find the Image Bucket name.

---

**"Could not retrieve AppBucketName from stack"**
The stack may be in a failed state. Check the stack status (see below) and look at the CloudFormation events for the root cause.

---

**Build failures**
```
ERROR: Build failed: /dist directory not found after build.
```
Fix TypeScript or build errors first. Run `npm run build` manually to see the full error output, then re-run `npm run deploy`.

---

**CloudFront 403 / Access Denied**
The bucket policy may not be correctly configured for CloudFront OAC access. Check that the CloudFormation stack deployed successfully and that the bucket policy references the correct CloudFront distribution.

### Check CloudFormation Stack Status

```bash
# View stack status
aws cloudformation describe-stacks \
  --stack-name pokemon-tcg-visualizer \
  --query "Stacks[0].StackStatus"

# View stack events (useful for diagnosing failures)
aws cloudformation describe-stack-events \
  --stack-name pokemon-tcg-visualizer \
  --query "StackEvents[?ResourceStatus=='CREATE_FAILED' || ResourceStatus=='UPDATE_FAILED']"
```

If the stack is in `ROLLBACK_COMPLETE` state, you need to delete it before redeploying:
```bash
aws cloudformation delete-stack --stack-name pokemon-tcg-visualizer
# Wait for deletion, then re-run npm run deploy
```

### Manually Invalidate CloudFront Cache

If you need to force a cache refresh without redeploying:

```bash
# Get the CloudFront distribution ID
DIST_ID=$(aws cloudformation describe-stacks \
  --stack-name pokemon-tcg-visualizer \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text)

# Create an invalidation for all files
aws cloudfront create-invalidation \
  --distribution-id "$DIST_ID" \
  --paths "/*"
```

Invalidations typically take 1–5 minutes to propagate globally.

### Verify S3 Bucket Contents

```bash
# Get bucket names from the stack
aws cloudformation describe-stacks \
  --stack-name pokemon-tcg-visualizer \
  --query "Stacks[0].Outputs[?OutputKey=='AppBucketName' || OutputKey=='ImageBucketName']"

# List app bucket contents
aws s3 ls s3://your-app-bucket-name/

# List image bucket contents (top-level)
aws s3 ls s3://your-image-bucket-name/

# Count total files in image bucket
aws s3 ls s3://your-image-bucket-name/ --recursive | wc -l
```

### Deployment is Idempotent

Both `npm run deploy` and `npm run upload:images` are safe to re-run. If a deployment fails partway through, fix the issue and run the command again — it will pick up where it left off without duplicating work.
