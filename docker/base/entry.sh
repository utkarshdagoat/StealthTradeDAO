#!/bin/bash

if [[ ${PROTOKIT_SHOULD_ATTEMPT_DB_MIGRATION} ]]; then
  echo "Migrating on ${DATABASE_URL}"
  cd packages/chain/node_modules/@proto-kit/persistance
  pnpm dlx prisma migrate deploy
  cd ../../../../..
fi

echo $@
# We can't use start:headless here bcs that task hardcodes the .js file, we want it to be extensible
node --experimental-vm-modules --experimental-wasm-modules --experimental-wasm-threads --es-module-specifier-resolution=node $@