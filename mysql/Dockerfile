FROM mysql:8.0.44@sha256:9c3380eac945af0736031b200027f581925927c81e010056214a4bd6b6693714

RUN microdnf install -y \
    cronie \
    zstd \
    && microdnf clean all

COPY backup.sh /backup.sh
RUN chmod +x /backup.sh

RUN (crontab -l 2>/dev/null; echo "0 0 * * * /backup.sh") | crontab -

COPY  init/* docker-entrypoint-initdb.d/

RUN mkdir -p /backups

HEALTHCHECK --interval=30s --timeout=3s \
  --start-period=180s --retries=3 \
  CMD mysql --user=root --password=${MYSQL_ROOT_PASSWORD} --execute="SHOW DATABASES;"

CMD ["sh", "-c", "crond && docker-entrypoint.sh mysqld"]