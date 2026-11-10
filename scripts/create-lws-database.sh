#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  printf 'Erreur : le client PostgreSQL psql doit être installé.\n' >&2
  exit 1
fi

: "${LWS_ADMIN_DATABASE_URL:?Définir LWS_ADMIN_DATABASE_URL (connexion à une base de maintenance, généralement postgres).}"
: "${LWS_DATABASE_URL:?Définir LWS_DATABASE_URL (connexion de l’application à la base à créer).}"
: "${LWS_DATABASE_NAME:?Définir LWS_DATABASE_NAME (nom PostgreSQL de la base à créer).}"

if [[ ! "$LWS_DATABASE_NAME" =~ ^[A-Za-z_][A-Za-z0-9_]{0,62}$ ]]; then
  printf 'Erreur : LWS_DATABASE_NAME doit être un identifiant PostgreSQL simple de 1 à 63 caractères.\n' >&2
  exit 1
fi

if [[ -n "${LWS_DATABASE_OWNER:-}" && ! "$LWS_DATABASE_OWNER" =~ ^[A-Za-z_][A-Za-z0-9_]{0,62}$ ]]; then
  printf 'Erreur : LWS_DATABASE_OWNER doit être un identifiant PostgreSQL simple de 1 à 63 caractères.\n' >&2
  exit 1
fi

schema_file="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/00_lws_complete_schema.sql"
if [[ ! -f "$schema_file" ]]; then
  printf 'Erreur : schéma introuvable : %s\n' "$schema_file" >&2
  exit 1
fi
library_schema_file="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/25_create_library.sql"
if [[ ! -f "$library_schema_file" ]]; then
  printf 'Erreur : schéma de bibliothèque introuvable : %s\n' "$library_schema_file" >&2
  exit 1
fi

database_exists="$(
  psql "$LWS_ADMIN_DATABASE_URL" \
    --no-psqlrc \
    --set=ON_ERROR_STOP=1 \
    --tuples-only \
    --no-align \
    --command="SELECT 1 FROM pg_database WHERE datname = '$LWS_DATABASE_NAME'"
)"

if [[ "$database_exists" != "1" ]]; then
  if [[ -n "${LWS_DATABASE_OWNER:-}" ]]; then
    create_database_sql="CREATE DATABASE \"$LWS_DATABASE_NAME\" OWNER \"$LWS_DATABASE_OWNER\""
  else
    create_database_sql="CREATE DATABASE \"$LWS_DATABASE_NAME\""
  fi
  psql "$LWS_ADMIN_DATABASE_URL" \
    --no-psqlrc \
    --set=ON_ERROR_STOP=1 \
    --command="$create_database_sql"
  printf 'Base PostgreSQL créée : %s\n' "$LWS_DATABASE_NAME"
else
  printf 'La base PostgreSQL existe déjà ; elle ne sera pas supprimée : %s\n' "$LWS_DATABASE_NAME"
fi

connected_database="$(
  psql "$LWS_DATABASE_URL" \
    --no-psqlrc \
    --set=ON_ERROR_STOP=1 \
    --tuples-only \
    --no-align \
    --command='SELECT current_database()'
)"
if [[ "$connected_database" != "$LWS_DATABASE_NAME" ]]; then
  printf 'Erreur : LWS_DATABASE_URL se connecte à "%s", mais LWS_DATABASE_NAME vaut "%s".\n' \
    "$connected_database" "$LWS_DATABASE_NAME" >&2
  exit 1
fi

psql "$LWS_DATABASE_URL" \
  --no-psqlrc \
  --set=ON_ERROR_STOP=1 \
  --file="$schema_file"
psql "$LWS_DATABASE_URL" \
  --no-psqlrc \
  --set=ON_ERROR_STOP=1 \
  --file="$library_schema_file"

printf 'Schéma complet et bibliothèque appliqués à la base : %s\n' "$LWS_DATABASE_NAME"
