#!/bin/sh
# Restore drill: take a real backup, restore it into a scratch database, compare it with the live one, then drop the scratch copy.
#   docker compose -f docker-compose.prod.yml exec backup drill.sh
# Run it after setup and after every change to the backup process. Never touches the live database.
set -eu
SCRATCH="${DRILL_DB:-edubridge_restore_drill}"
FAIL=0
echo "== 1. take a backup"
backup.sh
FILE=$(ls -1t /backups/edubridge-*.dump.enc | head -1)
echo "using $FILE"

echo "== 2. a wrong passphrase must fail"
if BACKUP_PASSPHRASE="not-the-passphrase" restore.sh "$FILE" "$SCRATCH" >/dev/null 2>&1; then echo "FAIL: restore worked with a wrong passphrase"; FAIL=1; else echo "ok: refused"; fi

echo "== 3. a damaged file must be detected"
cp "$FILE" /tmp/damaged.dump.enc; cp "$FILE.sha256" /tmp/damaged.dump.enc.sha256
sed -i "s#$(basename "$FILE")#damaged.dump.enc#" /tmp/damaged.dump.enc.sha256
printf 'x' >> /tmp/damaged.dump.enc
if restore.sh /tmp/damaged.dump.enc "$SCRATCH" >/dev/null 2>&1; then echo "FAIL: damaged backup was accepted"; FAIL=1; else echo "ok: refused"; fi
rm -f /tmp/damaged.dump.enc /tmp/damaged.dump.enc.sha256

echo "== 4. restore into a scratch database"
psql -d postgres -v ON_ERROR_STOP=1 -qc "DROP DATABASE IF EXISTS \"$SCRATCH\"" -c "CREATE DATABASE \"$SCRATCH\""
restore.sh "$FILE" "$SCRATCH"

echo "== 5. compare row counts (live vs restored)"
for t in User AuthIdentity Session University UniversityLevel Grant Country Source CatalogueRevision CatalogueMeta AuditLog AiUsage Reminder Profile SavedItem; do
  a=$(psql -d "$PGDATABASE" -Atc "SELECT count(*) FROM \"$t\"")
  b=$(psql -d "$SCRATCH" -Atc "SELECT count(*) FROM \"$t\"")
  if [ "$a" = "$b" ]; then echo "ok   $t: $a"; else echo "FAIL $t: live=$a restored=$b"; FAIL=1; fi
done
va=$(psql -d "$PGDATABASE" -Atc 'SELECT version FROM "CatalogueMeta" WHERE id=1')
vb=$(psql -d "$SCRATCH" -Atc 'SELECT version FROM "CatalogueMeta" WHERE id=1')
[ "$va" = "$vb" ] && echo "ok   catalogue version: $va" || { echo "FAIL catalogue version live=$va restored=$vb"; FAIL=1; }
ha=$(psql -d "$PGDATABASE" -Atc "SELECT md5(string_agg(id || name || coalesce(\"lastChecked\",''), ',' ORDER BY id)) FROM \"University\"")
hb=$(psql -d "$SCRATCH" -Atc "SELECT md5(string_agg(id || name || coalesce(\"lastChecked\",''), ',' ORDER BY id)) FROM \"University\"")
[ "$ha" = "$hb" ] && echo "ok   university content fingerprint matches" || { echo "FAIL university fingerprint differs"; FAIL=1; }

echo "== 6. clean up the scratch database"
psql -d postgres -qc "DROP DATABASE \"$SCRATCH\""
[ "$FAIL" = 0 ] && echo "DRILL PASSED" || { echo "DRILL FAILED"; exit 1; }
