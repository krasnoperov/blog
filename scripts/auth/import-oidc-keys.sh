#!/usr/bin/env bash

set -euo pipefail

if [[ ${1:-} == "" || ${2:-} == "" || ${3:-} == "" || ${4:-} == "" ]]; then
  cat <<'USAGE'
Usage: scripts/auth/import-oidc-keys.sh <environment|default> <private-key.pem> <public-key.pem> <key-id> [issuer] [audience] [allowed-client-ids]

Parameters:
  environment            Wrangler environment name (e.g. stage, production). Use "default" for top-level worker.
  private-key.pem        Path to ES256 private key in PKCS8 PEM format.
  public-key.pem         Path to ES256 public key in SPKI PEM format.
  key-id                 Identifier embedded in JWT header (kid).
  issuer                 Optional issuer URL (defaults to https://whitelabel.krasnoperov.me for production, https://whitelabel-stage.krasnoperov.me otherwise).
  audience               Optional audience claim (defaults to lrsr-api).
  allowed-client-ids     Optional JSON array string of allowed client IDs (defaults to ["lrsr-cli"]).
USAGE
  exit 1
fi

ENVIRONMENT="$1"
PRIVATE_KEY_PATH="$2"
PUBLIC_KEY_PATH="$3"
KEY_ID="$4"
ISSUER="${5:-}"
AUDIENCE="${6:-lrsr-api}"
ALLOWED_CLIENT_IDS="${7:-[\"lrsr-cli\"]}"

if [[ ! -f "$PRIVATE_KEY_PATH" ]]; then
  echo "Private key file not found: $PRIVATE_KEY_PATH" >&2
  exit 1
fi

if [[ ! -f "$PUBLIC_KEY_PATH" ]]; then
  echo "Public key file not found: $PUBLIC_KEY_PATH" >&2
  exit 1
fi

if [[ -z "$ISSUER" ]]; then
  if [[ "$ENVIRONMENT" == "production" ]]; then
    ISSUER="https://whitelabel.krasnoperov.me"
  else
    ISSUER="https://whitelabel-stage.krasnoperov.me"
  fi
fi

if [[ "$ENVIRONMENT" == "default" ]]; then
  WRANGLER_ENV_ARGS=()
else
  WRANGLER_ENV_ARGS=(--env "$ENVIRONMENT")
fi

printf '%s' "$(cat "$PRIVATE_KEY_PATH")" | wrangler secret put OIDC_PRIVATE_KEY "${WRANGLER_ENV_ARGS[@]}"
printf '%s' "$(cat "$PUBLIC_KEY_PATH")" | wrangler secret put OIDC_PUBLIC_KEY "${WRANGLER_ENV_ARGS[@]}"
printf '%s' "$KEY_ID" | wrangler secret put OIDC_KEY_ID "${WRANGLER_ENV_ARGS[@]}"
printf '%s' "$ISSUER" | wrangler secret put OIDC_ISSUER "${WRANGLER_ENV_ARGS[@]}"
printf '%s' "$AUDIENCE" | wrangler secret put OIDC_AUDIENCE "${WRANGLER_ENV_ARGS[@]}"
printf '%s' "$ALLOWED_CLIENT_IDS" | wrangler secret put OIDC_ALLOWED_CLIENT_IDS "${WRANGLER_ENV_ARGS[@]}"

echo "Secrets updated for environment: $ENVIRONMENT"
