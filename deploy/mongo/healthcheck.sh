#!/usr/bin/env bash
set -euo pipefail

# Accept a replica-set process that is ready for rs.initiate(), too. Requiring an
# initialized set here would prevent the dependent mongo-init service from running.
# The official image's temporary standalone server returns error 76, not 94.
exec mongosh --host 127.0.0.1 --quiet \
  --username "$MONGO_INITDB_ROOT_USERNAME" \
  --password "$MONGO_INITDB_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --eval '
    let status;
    try {
      status = rs.status();
    } catch (error) {
      if (error.code === 94) quit(0);
      throw error;
    }
    if (status.set !== "rs0") {
      print("Unexpected replica set: " + status.set);
      quit(1);
    }
    quit(0);
  '
