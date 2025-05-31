#!/bin/bash

# Simple PostgreSQL Backup Script for Render (No AWS)
# Creates a backup and logs the process

set -e

DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="movaga-backup-$DATE.sql"

echo "=== Movaga Database Backup Started at $(date) ==="
echo "Backup file: $BACKUP_FILE"

# Create backup directory
mkdir -p /tmp/backups

# Create PostgreSQL backup
echo "Creating database backup..."
pg_dump $DATABASE_URL \
    --verbose \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    --format=custom \
    --file="/tmp/backups/$BACKUP_FILE"

# Check if backup was successful
if [ -f "/tmp/backups/$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "/tmp/backups/$BACKUP_FILE" | cut -f1)
    echo "✅ Backup completed successfully!"
    echo "📁 File: /tmp/backups/$BACKUP_FILE"
    echo "📊 Size: $BACKUP_SIZE"
    
    # Basic backup validation
    echo "🔍 Validating backup..."
    pg_restore --list "/tmp/backups/$BACKUP_FILE" > /tmp/backup_contents.txt
    TABLES_COUNT=$(grep "TABLE DATA" /tmp/backup_contents.txt | wc -l)
    echo "📋 Tables found in backup: $TABLES_COUNT"
    
    # Log some statistics
    echo "📈 Backup Statistics:"
    echo "   - Created: $(date)"
    echo "   - Size: $BACKUP_SIZE" 
    echo "   - Tables: $TABLES_COUNT"
    echo "   - Format: PostgreSQL custom format"
    
else
    echo "❌ Backup failed!"
    exit 1
fi

echo "=== Backup Process Completed at $(date) ==="

# Note about temporary storage
echo ""
echo "📝 IMPORTANT NOTES:"
echo "   - This backup is stored temporarily on Render's server"
echo "   - File will be deleted when the cron job container stops"
echo "   - For permanent backups, use Render's Export feature in Dashboard"
echo "   - Or download backups locally using your own scripts"

# Optional: Send notification email if configured
if [ ! -z "$NOTIFICATION_EMAIL" ] && command -v mail &> /dev/null; then
    echo "Movaga database backup completed successfully on $(date). Size: $BACKUP_SIZE, Tables: $TABLES_COUNT" | \
        mail -s "Movaga DB Backup Success - $DATE" $NOTIFICATION_EMAIL
    echo "📧 Notification sent to: $NOTIFICATION_EMAIL"
fi

echo "✨ Backup process finished!" 