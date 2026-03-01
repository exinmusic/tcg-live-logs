#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# upload-images.sh – Upload card images to the Image Bucket independently
# Note: make this file executable with: chmod +x scripts/upload-images.sh
# ---------------------------------------------------------------------------

# ── Helpers ────────────────────────────────────────────────────────────────

log()   { echo "[upload-images] $*"; }
error() { echo "[upload-images] ERROR: $*" >&2; }

# ── Error trap ─────────────────────────────────────────────────────────────

trap 'error "Image upload failed. The upload is idempotent — you can safely re-run this script after fixing the issue."' ERR

# ── AWS credential validation ──────────────────────────────────────────────

validate_aws_credentials() {
  log "Validating AWS credentials..."
  if ! aws sts get-caller-identity &>/dev/null; then
    error "AWS credentials not found. Please configure credentials using 'aws configure' or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables."
    exit 1
  fi
  log "AWS credentials validated."
}

# ── Retrieve Image Bucket from CloudFormation ──────────────────────────────

get_image_bucket() {
  log "Retrieving Image Bucket name from CloudFormation stack '$STACK_NAME'..."

  if ! aws cloudformation describe-stacks --stack-name "$STACK_NAME" &>/dev/null; then
    error "CloudFormation stack '$STACK_NAME' not found. Please deploy the infrastructure first using 'npm run deploy'."
    exit 1
  fi

  IMAGE_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='ImageBucketName'].OutputValue" \
    --output text)

  if [[ -z "$IMAGE_BUCKET" || "$IMAGE_BUCKET" == "None" ]]; then
    error "Could not retrieve ImageBucketName from stack '$STACK_NAME'. Ensure the stack deployed successfully."
    exit 1
  fi

  log "Image Bucket: $IMAGE_BUCKET"
}

# ── Upload images ──────────────────────────────────────────────────────────

upload_images() {
  local source_dir="public/card-images"
  local dry_run_flag=""

  if [[ "$DRY_RUN" == "true" ]]; then
    dry_run_flag="--dryrun"
    log "Dry-run mode enabled — no files will be uploaded."
  fi

  if [[ ! -d "$source_dir" ]]; then
    error "Source directory '$source_dir' not found."
    exit 1
  fi

  local dest="s3://$IMAGE_BUCKET"
  local tmp_output
  tmp_output=$(mktemp)

  log "Uploading PNG files from $source_dir/ to $dest ..."
  aws s3 sync "$source_dir" "$dest" \
    --exclude "*" \
    --include "*.png" \
    --content-type "image/png" \
    --size-only \
    $dry_run_flag \
    2>&1 | tee -a "$tmp_output"

  log "Uploading SVG files from $source_dir/ to $dest ..."
  aws s3 sync "$source_dir" "$dest" \
    --exclude "*" \
    --include "*.svg" \
    --content-type "image/svg+xml" \
    --size-only \
    $dry_run_flag \
    2>&1 | tee -a "$tmp_output"

  SYNC_OUTPUT_FILE="$tmp_output"
}

# ── Upload manifest ────────────────────────────────────────────────────────

upload_manifest() {
  local manifest="public/card-images/manifest.json"

  if [[ ! -f "$manifest" ]]; then
    log "manifest.json not found in public/card-images/ — skipping manifest upload."
    return
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    log "(dryrun) Would upload manifest.json to s3://$IMAGE_BUCKET/manifest.json"
    return
  fi

  log "Uploading manifest.json to s3://$IMAGE_BUCKET/manifest.json ..."
  aws s3 cp "$manifest" "s3://$IMAGE_BUCKET/manifest.json" \
    --content-type "application/json"
  log "manifest.json uploaded."
}

# ── Print statistics ───────────────────────────────────────────────────────

print_statistics() {
  local end_time
  end_time=$(date +%s)
  local duration=$(( end_time - START_TIME ))

  local uploaded=0
  local skipped=0

  if [[ -n "${SYNC_OUTPUT_FILE:-}" && -f "$SYNC_OUTPUT_FILE" ]]; then
    if [[ "$DRY_RUN" == "true" ]]; then
      uploaded=$(grep -c "(dryrun) upload:" "$SYNC_OUTPUT_FILE" 2>/dev/null || true)
    else
      uploaded=$(grep -c "^upload:" "$SYNC_OUTPUT_FILE" 2>/dev/null || true)
    fi
    # Lines that are not uploads are skipped/already in sync
    local total_lines
    total_lines=$(grep -c "." "$SYNC_OUTPUT_FILE" 2>/dev/null || true)
    skipped=$(( total_lines - uploaded ))
    if [[ $skipped -lt 0 ]]; then skipped=0; fi
    rm -f "$SYNC_OUTPUT_FILE"
  fi

  local total_size
  total_size=$(du -sh "public/card-images" 2>/dev/null | cut -f1 || echo "unknown")

  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║           Image upload complete!                             ║"
  echo "╠══════════════════════════════════════════════════════════════╣"
  printf "║  Files uploaded : %-43s║\n" "$uploaded"
  printf "║  Files skipped  : %-43s║\n" "$skipped"
  printf "║  Total size     : %-43s║\n" "$total_size"
  printf "║  Duration       : %-43s║\n" "${duration}s"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""
}

# ── Main ───────────────────────────────────────────────────────────────────

main() {
  STACK_NAME="pokemon-tcg-visualizer"
  DRY_RUN="false"
  SYNC_OUTPUT_FILE=""
  START_TIME=$(date +%s)

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --stack-name)
        STACK_NAME="$2"
        shift 2
        ;;
      --dry-run)
        DRY_RUN="true"
        shift
        ;;
      *)
        error "Unknown argument: $1"
        exit 1
        ;;
    esac
  done

  validate_aws_credentials
  get_image_bucket
  upload_images
  upload_manifest
  print_statistics
}

main "$@"
