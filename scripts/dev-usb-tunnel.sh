#!/usr/bin/env sh
# Tunnel fallback when USB Metro will not connect. Requires internet for ngrok.
set -e

unset CI
export CI=false

EXPO_PORT=8082

sh "$(dirname "$0")/stop-dev.sh"

if command -v adb >/dev/null 2>&1 && adb devices | grep -qE '[[:space:]]device$'; then
  adb reverse --remove-all 2>/dev/null || true
  adb reverse tcp:8000 tcp:8000
  export EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
  echo "Backend API via USB: ${EXPO_PUBLIC_API_BASE_URL}"
else
  LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
  export EXPO_PUBLIC_API_BASE_URL="http://${LAN_IP:-127.0.0.1}:8000"
  echo "Backend API: ${EXPO_PUBLIC_API_BASE_URL}"
fi

echo ""
echo "=== Tunnel mode ==="
echo "  Scan the QR code below with Expo Go."
echo "  (Needs internet; ngrok can fail on some networks.)"
echo ""

npm run backend &
BACKEND_PID=$!
trap 'kill $BACKEND_PID 2>/dev/null' EXIT INT TERM

exec expo start --tunnel --port "${EXPO_PORT}"
