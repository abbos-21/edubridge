FROM postgres:16-alpine
RUN apk add --no-cache openssl aws-cli tzdata
COPY backup.sh restore.sh loop.sh drill.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/restore.sh /usr/local/bin/loop.sh /usr/local/bin/drill.sh
VOLUME /backups
CMD ["loop.sh"]
