#!/usr/bin/env sh
set -e

unset CI
export CI=false

EXPO_PORT=8082

if ! command -v adb >/dev/null 2>&1; then
  echo "adb not found. Install: sudo apt install android-tools-adb"
  exit 1
fi

if ! adb devices | grep -qE '[[:space:]]device$'; then
  echo "No Android device on USB. Enable USB debugging and run: adb devices"
  exit 1
fi

sh "$(dirname "$0")/stop-dev.sh"

adb reverse --remove-all 2>/dev/null || true
adb reverse "tcp:${EXPO_PORT}" "tcp:${EXPO_PORT}"
adb reverse tcp:8081 "tcp:${EXPO_PORT}"
adb reverse tcp:8000 tcp:8000

export EXPO_PORT
export RCT_METRO_PORT="${EXPO_PORT}"
export REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1
export EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000

DEVICE=$(adb devices | awk 'NR>1 && /device$/ {print $1; exit}')

echo ""
echo "=== USB mode (Android) ==="
echo "  Device: ${DEVICE}"
echo "  URL:    exp://127.0.0.1:${EXPO_PORT}"
echo "  API:    ${EXPO_PUBLIC_API_BASE_URL}"
adb reverse --list | sed 's/^/    /'
echo ""
echo "  1. Wait for Metro to show the menu below."
echo "  2. Press  a  to open on your phone."
echo "  3. Keep this terminal open — do NOT press Ctrl+C."
echo "  4. You should see: Android Bundling... → Android Bundled"
echo ""

npm run backend &
BACKEND_PID=$!
trap 'kill $BACKEND_PID 2>/dev/null' EXIT INT TERM

exec expo start --port "${EXPO_PORT}" --android
