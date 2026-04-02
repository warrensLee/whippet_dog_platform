TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="/backups"
BACKUP_THRESHOLD=$((10 * 1024 * 1024 * 1024)) # 10 GB
BACKUP_FILE="$BACKUP_DIR/cwa_db_$TIMESTAMP.sql.zst"

echo "Starting backup at $TIMESTAMP"

mysqldump \
  -h db \
  -u root \
  -pdogs \
  cwa_db | zstd -10 > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "Backup completed successfully: $BACKUP_FILE"
while [ "$(du -sb "$BACKUP_DIR" | awk '{print $1}')" -gt "$BACKUP_THRESHOLD" ]; do
    OLDEST_FILE=$(find "$BACKUP_DIR" -type f -printf '%T+ %p\n' | sort | head -n 1 | awk '{print $2}')
    echo "Backup Size Exceded, Removing $OLDEST_FILE"
    rm -f "$OLDEST_FILE"
done
else
  echo "Backup failed"
  exit 1
fi


