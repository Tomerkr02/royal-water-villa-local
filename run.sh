#!/usr/bin/env sh
set -eu

OPTIONS_FILE="/data/options.json"

echo "[Royal Water Villa Add-on] starting"

if [ -f "$OPTIONS_FILE" ]; then
  export HOME_ASSISTANT_BASE_URL="$(jq -r '.HOME_ASSISTANT_BASE_URL // "http://homeassistant.local:8123"' "$OPTIONS_FILE")"
  export HOME_ASSISTANT_TOKEN="$(jq -r '.HOME_ASSISTANT_TOKEN // ""' "$OPTIONS_FILE")"
else
  export HOME_ASSISTANT_BASE_URL="${HOME_ASSISTANT_BASE_URL:-http://homeassistant.local:8123}"
  export HOME_ASSISTANT_TOKEN="${HOME_ASSISTANT_TOKEN:-}"
fi

export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-3000}"

if [ -z "$HOME_ASSISTANT_TOKEN" ]; then
  echo "[Royal Water Villa Add-on] warning: HOME_ASSISTANT_TOKEN is empty"
fi

echo "[Royal Water Villa Add-on] serving UI on ${HOST}:${PORT}"
echo "[Royal Water Villa Add-on] Home Assistant API target: ${HOME_ASSISTANT_BASE_URL}"

exec node /app/server/addon-server.mjs
