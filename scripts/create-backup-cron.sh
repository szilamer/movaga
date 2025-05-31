#!/bin/bash

# Movaga PostgreSQL Backup Script for Render Cron Job
# This script creates daily backups and uploads them to S3

set -e

# Environment variables (to be set in Render Dashboard)
# AWS_ACCESS_KEY_ID
# AWS_SECRET_ACCESS_KEY  
# AWS_REGION
# S3_BUCKET_NAME
# DATABASE_URL
# POSTGRES_VERSION

# Create timestamp for backup file
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILENAME="movaga_backup_${TIMESTAMP}.sql"
COMPRESSED_FILENAME="movaga_backup_${TIMESTAMP}.sql.gz"

echo "Starting backup process at $(date)"
echo "Creating backup: $BACKUP_FILENAME"

# Create backup directory if it doesn't exist
mkdir -p /tmp/backups

# Create PostgreSQL backup
pg_dump $DATABASE_URL \
    --verbose \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    --format=custom \
    --file="/tmp/backups/$BACKUP_FILENAME"

echo "Backup created successfully"

# Compress the backup
echo "Compressing backup..."
gzip "/tmp/backups/$BACKUP_FILENAME"

echo "Backup compressed to: $COMPRESSED_FILENAME"

# Install AWS CLI if not present
if ! command -v aws &> /dev/null; then
    echo "Installing AWS CLI..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    ./aws/install
fi

# Configure AWS CLI
aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
aws configure set default.region $AWS_REGION

# Create S3 bucket if it doesn't exist
echo "Ensuring S3 bucket exists..."
aws s3 mb s3://$S3_BUCKET_NAME --region $AWS_REGION || echo "Bucket already exists or creation failed"

# Upload to S3
echo "Uploading backup to S3..."
aws s3 cp "/tmp/backups/$COMPRESSED_FILENAME" "s3://$S3_BUCKET_NAME/daily-backups/$COMPRESSED_FILENAME"

echo "Backup uploaded successfully to s3://$S3_BUCKET_NAME/daily-backups/$COMPRESSED_FILENAME"

# Clean up old backups (keep last 30 days)
echo "Cleaning up old backups..."
aws s3 ls s3://$S3_BUCKET_NAME/daily-backups/ | \
    awk '{print $4}' | \
    head -n -30 | \
    while read file; do
        if [ ! -z "$file" ]; then
            echo "Deleting old backup: $file"
            aws s3 rm "s3://$S3_BUCKET_NAME/daily-backups/$file"
        fi
    done

# Clean up local files
rm -f "/tmp/backups/$COMPRESSED_FILENAME"

echo "Backup process completed successfully at $(date)"

# Optional: Send notification (if email is configured)
if [ ! -z "$NOTIFICATION_EMAIL" ]; then
    echo "Backup completed successfully for Movaga database on $(date)" | \
        mail -s "Movaga DB Backup Success - $(date +%Y-%m-%d)" $NOTIFICATION_EMAIL
fi 