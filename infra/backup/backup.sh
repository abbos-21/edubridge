#!/bin/sh
# Encrypted database backup. Reads PGHOST/PGUSER/PGPASSWORD/PGDATABASE and BACKUP_PASSPHRASE from the environment.
#   backup.sh            -> /backups/edubridge-YYYYmmdd-HHMMSS.dump.enc (+ .sha256), copy to S3 if configured, prune > 14 days
set -eu
DIR="${BACKUP_DIR:-/backups}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE is required}"
mkdir -p "$DIR"
NAME="edubridge-$(date -u +%Y%m%d-%H%M%S).dump.enc"
OUT="$DIR/$NAME"
TMP="$OUT.partial"

# custom-format dump (compressed, restorable table by table) -> AES-256 with a key derived from the passphrase
pg_dump --format=custom --no-owner --no-privileges | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass env:BACKUP_PASSPHRASE -out "$TMP"
mv "$TMP" "$OUT"
( cd "$DIR" && sha256sum "$NAME" > "$NAME.sha256" )
echo "backup written: $OUT ($(wc -c < "$OUT") bytes)"

if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
  EP=""
  [ -n "${BACKUP_S3_ENDPOINT:-}" ] && EP="--endpoint-url $BACKUP_S3_ENDPOINT"
  # shellcheck disable=SC2086
  aws $EP s3 cp "$OUT" "s3://$BACKUP_S3_BUCKET/$NAME" --only-show-errors
  # shellcheck disable=SC2086
  aws $EP s3 cp "$OUT.sha256" "s3://$BACKUP_S3_BUCKET/$NAME.sha256" --only-show-errors
  echo "copied off-server to s3://$BACKUP_S3_BUCKET/$NAME (set a 14-day lifecycle rule on the bucket)"
else
  echo "WARNING: BACKUP_S3_BUCKET is not set; this backup exists only on this server" >&2
fi

# keep 14 days locally
find "$DIR" -name 'edubridge-*.dump.enc*' -mtime +"$KEEP_DAYS" -delete
