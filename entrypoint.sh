#!/bin/sh
set -e

# Alkalmazzuk az adatbázis migrációkat
npx prisma migrate deploy

# Futtatjuk az alapértelmezett parancsot (npm start)
exec "$@" 