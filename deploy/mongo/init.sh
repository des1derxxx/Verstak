#!/usr/bin/env bash
set -euo pipefail
mongosh --host mongo --quiet --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --eval '
  try { rs.status(); }
  catch (error) {
    if (error.code !== 94) throw error;
    rs.initiate({_id: "rs0", members: [{_id: 0, host: "mongo:27017"}]});
  }
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (db.hello().isWritablePrimary) { ready = true; break; }
    sleep(1000);
  }
  if (!ready) throw new Error("Replica set did not elect a primary");
  const app = db.getSiblingDB(process.env.MONGODB_DATABASE);
  if (!app.getUser("verstak_app")) {
    app.createUser({user: "verstak_app", pwd: process.env.MONGO_APP_PASSWORD, roles: [{role: "readWrite", db: process.env.MONGODB_DATABASE}]});
  }
'
