#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# deploy.sh – Full deployment script for Pokemon TCG Log Visualizer
# ---------------------------------------------------------------------------

# ── Helpers ────────────────────────────────────────────────────────────────

log()  { echo "[deploy] $*"; }
error() { echo "[deploy] ERROR: $*" >&2; }

# ── Error trap ─────────────────────────────────────────────────────────────

trap 'error "Deployment failed. The deployment is idempotent — you can safely re-run this script after fixing the issue."' ERR

# ── Tool validation ────────────────────────────────────────────────────────

check_required_tools() {
  local missing=0

  for tool in aws sam npm; do
    if ! command -v "$tool" &>/dev/null; then
      error "Required tool '$tool' is not installed or not on PATH."
      missing=1
    fi
  done

  if [[ $missing -ne 0 ]]; then
    error "Please install the missing tools and try again:"
    error "  aws  – https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
    error "  sam  – https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
    error "  npm  – https://nodejs.org/"
    exit 1
  fi
}

# ── AWS credential validation ──────────────────────────────────────────────

validate_aws_credentials() {
  log "Validating AWS credentials..."
  if ! aws sts get-caller-identity &>/dev/null; then
    error "AWS credentials not found. Please configure credentials using 'aws configure' or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables."
    exit 1
  fi
  log "AWS credentials validated."
}

# ── Build ──────────────────────────────────────────────────────────────────

build_app() {
  log "Building React application..."
  npm run build
  if [[ ! -d "dist" ]]; then
    error "Build failed: /dist directory not found after build."
    exit 1
  fi
  log "Build complete."
}

# ── SAM package ────────────────────────────────────────────────────────────

sam_package() {
  log "Packaging SAM template (region: $REGION)..."
  sam package --output-template-file packaged.yaml --region "$REGION"
  log "SAM package complete."
}

# ── SAM deploy ─────────────────────────────────────────────────────────────

sam_deploy() {
  log "Deploying stack '$STACK_NAME' to region '$REGION'..."
  sam deploy \
    --template-file packaged.yaml \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --no-fail-on-empty-changeset
  log "SAM deploy complete."
}

# ── S3 sync ────────────────────────────────────────────────────────────────

sync_to_s3() {
  log "Retrieving App Bucket name from CloudFormation stack '$STACK_NAME'..."
  APP_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='AppBucketName'].OutputValue" \
    --output text)

  if [[ -z "$APP_BUCKET" || "$APP_BUCKET" == "None" ]]; then
    error "Could not retrieve AppBucketName from stack '$STACK_NAME'. Ensure the stack deployed successfully."
    exit 1
  fi

  log "Syncing dist/ to s3://$APP_BUCKET ..."
  aws s3 sync dist/ "s3://$APP_BUCKET" --delete --region "$REGION"
  log "S3 sync complete."
}

# ── CloudFront invalidation ────────────────────────────────────────────────

invalidate_cloudfront() {
  log "Retrieving CloudFront distribution ID from stack '$STACK_NAME'..."
  CF_DIST_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
    --output text)

  if [[ -z "$CF_DIST_ID" || "$CF_DIST_ID" == "None" ]]; then
    error "Could not retrieve CloudFrontDistributionId from stack '$STACK_NAME'. Ensure the stack deployed successfully."
    exit 1
  fi

  log "Creating CloudFront invalidation for distribution '$CF_DIST_ID'..."
  INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$CF_DIST_ID" \
    --paths "/*" \
    --query "Invalidation.Id" \
    --output text)

  log "CloudFront invalidation initiated. Invalidation ID: $INVALIDATION_ID"
}

# ── Print results ─────────────────────────────────────────────────────────

print_results() {
  log "Retrieving deployment outputs from stack '$STACK_NAME'..."

  WEBSITE_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='WebsiteURL'].OutputValue" \
    --output text)

  IMAGE_BUCKET_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='ImageBucketURL'].OutputValue" \
    --output text)

  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║           Deployment completed successfully!                 ║"
  echo "╠══════════════════════════════════════════════════════════════╣"
  echo "║  Website URL    : ${WEBSITE_URL}"
  echo "║  Image Bucket   : ${IMAGE_BUCKET_URL}"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""
}

# ── Main ───────────────────────────────────────────────────────────────────

main() {
  # Parse arguments
  STACK_NAME="pokemon-tcg-visualizer"
  REGION="us-east-1"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --stack-name)
        STACK_NAME="$2"
        shift 2
        ;;
      --region)
        REGION="$2"
        shift 2
        ;;
      *)
        error "Unknown argument: $1"
        exit 1
        ;;
    esac
  done

  check_required_tools
  validate_aws_credentials
  build_app
  sam_package
  sam_deploy
  sync_to_s3
  invalidate_cloudfront
  print_results
}

main "$@"
