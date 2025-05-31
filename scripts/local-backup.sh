#!/bin/bash

# Local PostgreSQL Backup Script for Movaga
# Creates backups and stores them locally with rotation

set -e

# Configuration
BACKUP_DIR="/backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILENAME="movaga_backup_${TIMESTAMP}.sql"

echo "Starting local backup process at $(date)"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create PostgreSQL backup
echo "Creating backup: $BACKUP_FILENAME"
pg_dump $DATABASE_URL \
    --verbose \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    --format=custom \
    --file="$BACKUP_DIR/$BACKUP_FILENAME"

echo "Backup created successfully at: $BACKUP_DIR/$BACKUP_FILENAME"

# Compress the backup
echo "Compressing backup..."
gzip "$BACKUP_DIR/$BACKUP_FILENAME"

echo "Backup compressed to: $BACKUP_DIR/${BACKUP_FILENAME}.gz"

# Clean up old backups (keep only last 30 days)
echo "Cleaning up old backups..."
find $BACKUP_DIR -name "movaga_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

echo "Backup process completed successfully at $(date)"

# Optional: Send notification
if [ ! -z "$NOTIFICATION_EMAIL" ] && command -v mail &> /dev/null; then
    echo "Local backup completed successfully for Movaga database on $(date)" | \
        mail -s "Movaga DB Local Backup Success - $(date +%Y-%m-%d)" $NOTIFICATION_EMAIL
fi 