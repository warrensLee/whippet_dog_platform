FROM mysql:8.0.44

COPY  init/* docker-entrypoint/initdb.d/

HEALTHCHECK --interval=30s --timeout=3s \
  --start-period=30s --retries=3 \
  CMD mysql --user=root --password=${MYSQL_ROOT_PASSWORD} --execute="SHOW DATABASES;"