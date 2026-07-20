#!/bin/bash
# Creates least-privilege application roles:
#   minerva_rw — DML + DDL in schema public (used by the API and migrations)
#   minerva_ro — SELECT only (used by the API read connection)
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  -- CREATEDB is required locally for Prisma's shadow database ('prisma migrate dev').
  -- Production migrations use 'prisma migrate deploy', which needs no shadow database.
  CREATE ROLE minerva_rw LOGIN CREATEDB PASSWORD '${MINERVA_RW_PASSWORD}';
  CREATE ROLE minerva_ro LOGIN PASSWORD '${MINERVA_RO_PASSWORD}';

  REVOKE ALL ON DATABASE ${POSTGRES_DB} FROM PUBLIC;
  GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO minerva_rw, minerva_ro;

  GRANT USAGE, CREATE ON SCHEMA public TO minerva_rw;
  GRANT USAGE ON SCHEMA public TO minerva_ro;

  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO minerva_rw;
  GRANT SELECT ON ALL TABLES IN SCHEMA public TO minerva_ro;

  -- Tables created later by minerva_rw (e.g. Prisma migrations) stay readable for minerva_ro.
  ALTER DEFAULT PRIVILEGES FOR ROLE minerva_rw IN SCHEMA public GRANT SELECT ON TABLES TO minerva_ro;
  ALTER DEFAULT PRIVILEGES FOR ROLE minerva_rw IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO minerva_ro;
EOSQL
