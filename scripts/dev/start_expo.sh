#!/usr/bin/env bash
set -euo pipefail

# Detect a suitable host IP for LAN mode
HOST_IP=""
if command -v ip >/dev/null 2>&1; then
  HOST_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") {print $(i+1); exit}}')
fi
if [ -z "$HOST_IP" ]; then
  HOST_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi
if [ -z "$HOST_IP" ]; then
  echo "Unable to detect host IP. Falling back to 127.0.0.1"
  HOST_IP=127.0.0.1
fi

echo "Using HOST_IP=$HOST_IP"

# Run preflight and adb reverse (script created earlier)
if [ -x "./scripts/dev/preflight_and_reverse.sh" ]; then
  ./scripts/dev/preflight_and_reverse.sh
else
  echo "Preflight script not found or not executable: ./scripts/dev/preflight_and_reverse.sh"
  echo "Proceeding without preflight..."
fi

# Start Expo in LAN mode bound to the detected IP
echo "Starting Expo (LAN) bound to $HOST_IP — keep this terminal open"
REACT_NATIVE_PACKAGER_HOSTNAME=$HOST_IP EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 npx expo start --lan -c
