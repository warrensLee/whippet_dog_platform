TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="/backups"
RETENTION_DAYS=30
BACKUP_FILE="$BACKUP_DIR/cwa_db_$TIMESTAMP.sql"

echo "Starting backup at $TIMESTAMP"

mysqldump \
  -h db \
  -u root \
  -pdogs \
  cwa_db > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "Backup completed successfully: $BACKUP_FILE"

  echo "Removing backups older than $RETENTION_DAYS days..."
  find "$BACKUP_DIR" -type f -name "cwa_db_*.sql" -mtime +$RETENTION_DAYS -delete
  echo "Retention cleanup complete"
else
  echo "Backup failed"
  exit 1
fi


