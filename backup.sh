TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="/backups"
BACKUP_FILE="$BACKUP_DIR/cwa_db_$TIMESTAMP.sql"

echo "Starting backup at $TIMESTAMP"

mysqldump \
  -h db \
  -u root \
  -pdogs \
  cwa_db > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "Backup completed successfully: $BACKUP_FILE"
else
  echo "Backup failed"
  exit 1
fi

