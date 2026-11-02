#!/bin/sh
set -eu
umask 077
: "${POSTGRES_DB:?}" "${POSTGRES_USER:?}" "${BACKUP_DIR:=/backups}"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
target="$BACKUP_DIR/esoteric_library_$stamp.dump"
pg_dump --format=custom --no-owner --dbname="$POSTGRES_DB" --username="$POSTGRES_USER" --file="$target"
sha256sum "$target" > "$target.sha256"
find "$BACKUP_DIR" -name 'esoteric_library_*.dump' -mtime +14 -delete
find "$BACKUP_DIR" -name 'esoteric_library_*.dump.sha256' -mtime +14 -delete
echo "$target"
