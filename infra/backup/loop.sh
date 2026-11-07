#!/bin/sh
# Runs backup.sh every night at 02:00 UTC.
set -eu
while true; do
  now=$(date -u +%s)
  next=$(date -u -d "$(date -u +%Y-%m-%d) 02:00:00" +%s 2>/dev/null || echo $((now + 86400)))
  [ "$next" -le "$now" ] && next=$((next + 86400))
  echo "next backup in $((next - now)) seconds"
  sleep $((next - now))
  backup.sh || echo "BACKUP FAILED at $(date -u)" >&2
done
