#!/usr/bin/env bash
#
# 01-roles.sh
#
# Creates the two non-owning roles the application connects as. Run by the
# postgres image's entrypoint, which executes everything in
# /docker-entrypoint-initdb.d in filename order — but *only* when it initialises
# an empty data directory.
#
# That is the thing to know about this file: editing it does nothing to a volume
# that already exists. To apply a change, either drop the volume
# (`make down && docker volume rm minerva_postgres-data`, which destroys the
# data) or run the equivalent statements by hand.
#
# A shell script rather than a .sql file because the passwords arrive as
# environment variables, and psql cannot read those into a plain .sql.
#
# Three roles, per infra/README.md:
#
#   minerva_app  the owner (created by the image from POSTGRES_USER); owns the
#                schema and every table in it, and is what migrations run as
#   minerva_rw   read and write on every table, now and later, but no DDL
#   minerva_ro   SELECT only
#
# @see https://github.com/docker-library/docs/blob/master/postgres/README.md#initialization-scripts

set -euo pipefail

: "${POSTGRES_USER:?}"
: "${POSTGRES_DB:?}"
: "${POSTGRES_RW_PASSWORD:?}"
: "${POSTGRES_RO_PASSWORD:?}"

# --single-transaction so a failure half way through leaves no half-privileged
# role behind. ON_ERROR_STOP because psql's default is to carry on after an
# error and exit 0, which would let a broken init look like a successful one.
#
# The passwords are passed as psql variables and quoted with :'name' at the point
# of use, so a character that is special to SQL cannot end the string early.
psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
	--set ON_ERROR_STOP=on --single-transaction \
	--set rw_password="$POSTGRES_RW_PASSWORD" \
	--set ro_password="$POSTGRES_RO_PASSWORD" <<-'SQL'
	-- Both roles can connect and nothing else yet. NOINHERIT is not wanted here:
	-- these are login roles, not group roles.
	CREATE ROLE minerva_rw LOGIN PASSWORD :'rw_password';
	CREATE ROLE minerva_ro LOGIN PASSWORD :'ro_password';

	GRANT CONNECT ON DATABASE :"DBNAME" TO minerva_rw, minerva_ro;

	-- Since Postgres 15 the public schema is no longer writable by everyone, and
	-- USAGE has to be granted explicitly. Neither role gets CREATE: adding a
	-- table is the owner's job.
	GRANT USAGE ON SCHEMA public TO minerva_rw, minerva_ro;

	-- What exists right now. On a fresh database that is nothing at all, which is
	-- exactly why the ALTER DEFAULT PRIVILEGES below matter more.
	GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO minerva_rw;
	GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO minerva_rw;
	GRANT SELECT ON ALL TABLES IN SCHEMA public TO minerva_ro;
	GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO minerva_ro;

	-- And what the owner creates from now on. Without this, every migration that
	-- adds a table would have to remember to grant on it, and the first one that
	-- forgot would surface as a permission error in production.
	--
	-- "FOR ROLE" is what ties it to the owner: default privileges are recorded
	-- against whoever creates the object, so naming the role here is what makes
	-- this apply to migrations rather than to this session.
	ALTER DEFAULT PRIVILEGES FOR ROLE :"USER" IN SCHEMA public
		GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO minerva_rw;
	ALTER DEFAULT PRIVILEGES FOR ROLE :"USER" IN SCHEMA public
		GRANT USAGE, SELECT ON SEQUENCES TO minerva_rw;
	ALTER DEFAULT PRIVILEGES FOR ROLE :"USER" IN SCHEMA public
		GRANT SELECT ON TABLES TO minerva_ro;
	ALTER DEFAULT PRIVILEGES FOR ROLE :"USER" IN SCHEMA public
		GRANT SELECT ON SEQUENCES TO minerva_ro;
SQL

echo "01-roles.sh: created minerva_rw (read/write) and minerva_ro (read-only) in ${POSTGRES_DB}"
