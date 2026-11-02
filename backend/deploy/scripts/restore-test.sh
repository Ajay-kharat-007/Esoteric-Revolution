#!/bin/sh
set -eu
: "${1:?backup dump path required}" "${POSTGRES_USER:?}"
dump=$1
test_db="esoteric_restore_test_$(date +%s)"
sha256sum -c "$dump.sha256"
createdb --username="$POSTGRES_USER" "$test_db"
trap 'dropdb --if-exists --username="$POSTGRES_USER" "$test_db"' EXIT
pg_restore --exit-on-error --no-owner --username="$POSTGRES_USER" --dbname="$test_db" "$dump"
psql --username="$POSTGRES_USER" --dbname="$test_db" -v ON_ERROR_STOP=1 -c 'SELECT count(*) FROM _prisma_migrations;'
