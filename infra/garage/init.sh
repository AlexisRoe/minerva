#!/usr/bin/env sh
#
# init.sh
#
# Brings a fresh Garage node into service, then exits. Started by the
# `garage-init` service in infra/docker/docker-compose.yml, which every backend
# service waits on with `condition: service_completed_successfully` — so if this
# fails, nothing starts against a half-configured store.
#
# A brand new Garage node holds no data and refuses every request: it has no
# cluster layout, so there is nowhere to put an object. Four things have to
# happen once, and this script makes each of them idempotent, because
# `make infra` is run far more often than a volume is created:
#
#   1. assign the node a layout        (skipped if the node already has a role)
#   2. create the buckets              (`bucket create` on an existing one is an error)
#   3. import the access key           (from .env, so it survives a rebuild)
#   4. grant the key its permissions   (re-granting is a no-op)
#
# The admin API is what this talks to first, not the CLI. Run anywhere other than
# on the node itself, `garage` has to be told which node to address —
# `-h <node-id>@host:port` — and that id is only knowable at runtime, because it
# is derived from the key pair the node generated on its first boot. Without it
# the CLI assumes it is local and fails looking for a node key in a metadata
# directory this container does not have.
#
# @see https://garagehq.deuxfleurs.fr/documentation/quick-start/

set -eu

: "${GARAGE_HOST:?GARAGE_HOST is required}"
: "${GARAGE_ADMIN_TOKEN:?GARAGE_ADMIN_TOKEN is required}"
: "${GARAGE_ACCESS_KEY_ID:?GARAGE_ACCESS_KEY_ID is required}"
: "${GARAGE_SECRET_ACCESS_KEY:?GARAGE_SECRET_ACCESS_KEY is required}"

ADMIN_URL="http://${GARAGE_HOST}:3903"
RPC_PORT=3901
KEY_NAME="minerva"
PUBLIC_BUCKET="assets"
PRIVATE_BUCKET="artifacts"

# Capacity the single node advertises. Garage will not accept objects beyond it,
# and it is metadata only — no space is reserved — so this is a ceiling to raise
# when a local stack starts holding real volumes of screenshots.
NODE_CAPACITY="10G"
ZONE="minerva-local"

log() {
	echo "garage-init: $*"
}

# The whole cluster state in one document: the node id, whether it is up, and
# whether a role has been assigned to it. Every decision below is made from this.
cluster_status() {
	curl --silent --fail --show-error \
		--header "Authorization: Bearer ${GARAGE_ADMIN_TOKEN}" \
		"${ADMIN_URL}/v2/GetClusterStatus"
}

# ---- 1. wait for the node -------------------------------------------------
# compose already gates this container on the node's healthcheck, but that check
# passes as soon as the daemon answers, which is a moment before the admin API
# will serve. Retrying here is cheaper than a flaky first boot.
log "waiting for ${GARAGE_HOST}"
attempt=0
until cluster_status >/dev/null 2>&1; do
	attempt=$((attempt + 1))
	if [ "$attempt" -ge 30 ]; then
		log "giving up after ${attempt} attempts — the admin API never answered"
		cluster_status || true
		exit 1
	fi
	sleep 2
done

STATUS="$(cluster_status)"
NODE_ID="$(echo "$STATUS" | jq --raw-output '.nodes[0].id')"

if [ -z "$NODE_ID" ] || [ "$NODE_ID" = "null" ]; then
	log "the admin API answered but named no node"
	echo "$STATUS"
	exit 1
fi

log "node ${NODE_ID} is up"

# Every CLI call from here on. `-c` for the RPC secret, `-h` for which node to
# address — see the note at the top for why the second one is not optional.
garage_cli() {
	garage -c /etc/garage.toml -h "${NODE_ID}@${GARAGE_HOST}:${RPC_PORT}" "$@"
}

# ---- 2. cluster layout ----------------------------------------------------
# A node with a role assigned is a cluster that has been laid out already.
# Re-assigning would stage a second identical change and `layout apply` would
# then fail on the version number, so this is the check that makes step 1 safe to
# repeat.
if echo "$STATUS" | jq --exit-status '.nodes[0].role != null' >/dev/null; then
	log "layout already applied, leaving it alone"
else
	log "assigning layout to ${NODE_ID} (zone ${ZONE}, capacity ${NODE_CAPACITY})"
	garage_cli layout assign -z "$ZONE" -c "$NODE_CAPACITY" "$NODE_ID"
	# Version 1 because this only ever runs on a cluster that has none.
	garage_cli layout apply --version 1
fi

# ---- 3. buckets -----------------------------------------------------------
# `bucket create` on an existing bucket exits non-zero, and `set -e` would take
# the script down with it, so ask first.
create_bucket() {
	if garage_cli bucket info "$1" >/dev/null 2>&1; then
		log "bucket ${1} already exists"
	else
		log "creating bucket ${1}"
		garage_cli bucket create "$1"
	fi
}

create_bucket "$PUBLIC_BUCKET"
create_bucket "$PRIVATE_BUCKET"

# What makes `assets` public: the website endpoint serves a bucket to anyone,
# with no signature, and only if it has been marked this way. `artifacts` is
# never marked, which is the whole of the distinction between the two.
log "exposing ${PUBLIC_BUCKET} as a website"
garage_cli bucket website --allow --index-document index.html "$PUBLIC_BUCKET"

# ---- 4. access key --------------------------------------------------------
# Imported with the id and secret from .env rather than created, so that the
# credentials the backend is configured with keep working across a rebuild. A
# generated key would have to be copied out of a log by hand every time the
# volume was dropped.
if garage_cli key info "$GARAGE_ACCESS_KEY_ID" >/dev/null 2>&1; then
	log "key ${KEY_NAME} already imported"
else
	log "importing key ${KEY_NAME}"
	# --yes because the command otherwise asks for confirmation: importing a key
	# whose secret is known to whoever typed it is unusual outside a setup like
	# this one.
	garage_cli key import --yes -n "$KEY_NAME" "$GARAGE_ACCESS_KEY_ID" "$GARAGE_SECRET_ACCESS_KEY"
fi

# Read and write on both buckets, and no --owner: the backend puts and gets
# objects, it does not delete buckets or change their website configuration.
# Granting twice is a no-op, so there is nothing to guard here.
log "granting ${KEY_NAME} read/write on both buckets"
garage_cli bucket allow --read --write --key "$GARAGE_ACCESS_KEY_ID" "$PUBLIC_BUCKET"
garage_cli bucket allow --read --write --key "$GARAGE_ACCESS_KEY_ID" "$PRIVATE_BUCKET"

log "done"
