#!/usr/bin/env bash
set -euo pipefail
if [ ! -s /data/configdb/replica-key ]; then
  head -c 756 /dev/urandom | base64 > /data/configdb/replica-key
fi
chown mongodb:mongodb /data/configdb/replica-key
chmod 400 /data/configdb/replica-key
exec /usr/local/bin/docker-entrypoint.sh mongod --replSet rs0 --keyFile /data/configdb/replica-key --bind_ip_all \
  --wiredTigerCacheSizeGB "${MONGO_CACHE_GB:-0.25}"
