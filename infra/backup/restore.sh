#!/bin/sh
# Restore an encrypted backup into a database.
#   restore.sh /backups/edubridge-....dump.enc <target-database> [--clean]
# --clean drops and recreates objects in the target (use for a real restore). Without it the target must be empty.
set -eu
FILE="${1:?usage: restore.sh <file.dump.enc> <target-database> [--clean]}"
TARGET="${2:?target database name}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE is required}"
CLEAN=""
[ "${3:-}" = "--clean" ] && CLEAN="--clean --if-exists"

if [ -f "$FILE.sha256" ]; then ( cd "$(dirname "$FILE")" && sha256sum -c "$(basename "$FILE").sha256" ); fi
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:BACKUP_PASSPHRASE -in "$FILE" | pg_restore --no-owner --no-privileges $CLEAN --dbname="$TARGET" --exit-on-error
echo "restored $FILE into $TARGET"
