#!/usr/bin/env sh
set -e

unset CI
export CI=false

EXPO_PORT=""
for port in 8081 8082 8083 8084 8085; do
  if command -v lsof >/dev/null 2>&1; then
    lsof -i:"$port" >/dev/null 2>&1 || EXPO_PORT=$port
  elif command -v ss >/dev/null 2>&1; then
    ss -tln | grep -q ":$port " || EXPO_PORT=$port
  else
    EXPO_PORT=8082
    break
  fi
  [ -n "$EXPO_PORT" ] && break
done

if [ -z "$EXPO_PORT" ]; then
  echo "No free port found (8081–8085). Close other Expo/Metro windows or reboot."
  exit 1
fi

if [ "$EXPO_PORT" != "8081" ]; then
  echo "Port 8081 is in use — starting Expo on port $EXPO_PORT"
fi

LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -n "$LAN_IP" ]; then
  export EXPO_PUBLIC_API_BASE_URL="${EXPO_PUBLIC_API_BASE_URL:-http://${LAN_IP}:8000}"
fi

echo ""
echo "=== Expo Go (same Wi-Fi) ==="
echo "  exp://${LAN_IP:-localhost}:${EXPO_PORT}"
echo "  API: ${EXPO_PUBLIC_API_BASE_URL:-http://localhost:8000}"
echo ""

export EXPO_PORT

npm run backend &
BACKEND_PID=$!
trap 'kill $BACKEND_PID 2>/dev/null' EXIT INT TERM

exec expo start --lan --port "$EXPO_PORT"
