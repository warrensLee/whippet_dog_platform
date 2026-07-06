FROM mysql:8.0.44@sha256:9c3380eac945af0736031b200027f581925927c81e010056214a4bd6b6693714

# Latest releases available at https://github.com/aptible/supercronic/releases
ENV SUPERCRONIC_URL=https://github.com/aptible/supercronic/releases/download/v0.2.47/supercronic-linux-amd64 \
    SUPERCRONIC_SHA1SUM=712d2ece75da6f6e530192a151488578153e4e96 \
    SUPERCRONIC=supercronic-linux-amd64

RUN curl -fsSLO "$SUPERCRONIC_URL" \
 && echo "${SUPERCRONIC_SHA1SUM}  ${SUPERCRONIC}" | sha1sum -c - \
 && chmod +x "$SUPERCRONIC" \
 && mv "$SUPERCRONIC" "/usr/local/bin/${SUPERCRONIC}" \
 && ln -s "/usr/local/bin/${SUPERCRONIC}" /usr/local/bin/supercronic

RUN microdnf install -y \
    zstd \
    && microdnf clean all

COPY backup.sh /backup.sh
COPY crontab /crontab
RUN chmod +x /backup.sh

COPY init/* docker-entrypoint-initdb.d/

RUN mkdir -p /backups

HEALTHCHECK --interval=30s --timeout=3s \
  --start-period=180s --retries=3 \
  CMD mysql --user=root --password=${MYSQL_ROOT_PASSWORD} --execute="SHOW DATABASES;"

CMD ["sh", "-c", "supercronic /crontab & docker-entrypoint.sh mysqld"]