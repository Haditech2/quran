#!/usr/bin/env bash
set -euo pipefail

echo "Running preflight checks for quran project..."
echo
# Node + npm
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node is not installed. Install Node.js (recommended LTS)."
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm is not installed. Install Node.js which includes npm."
  exit 1
fi

echo "Node: $(node -v)"
echo "npm: $(npm -v)"

# Expo CLI
if ! command -v npx >/dev/null 2>&1; then
  echo "ERROR: npx not found. Install npm >= 5.2.0"
  exit 1
fi

EXPO_CLI_VERSION="$(npx --no-install expo --version 2>/dev/null || true)"
if [ -z "$EXPO_CLI_VERSION" ]; then
  echo "expo CLI: not installed as global, will use npx"
else
  echo "expo CLI: $EXPO_CLI_VERSION"
fi

# Ensure node_modules
if [ ! -d "node_modules" ]; then
  echo "node_modules missing — installing dependencies (this may take a while)..."
  npm install --legacy-peer-deps
else
  echo "node_modules present"
fi

# Run expo doctor to auto-fix issues
echo
echo "Running 'npx expo doctor --fix' to detect and fix common problems..."
npx expo doctor --fix || true

# Check adb
if ! command -v adb >/dev/null 2>&1; then
  echo "WARNING: adb not found on PATH. USB debugging won't work until adb is installed."
else
  echo "adb: $(adb version 2>&1 | head -n1)"
  echo "Connected devices:"
  adb devices -l || true
fi

# Configure adb reverse for common Expo ports
if command -v adb >/dev/null 2>&1; then
  echo
  echo "Setting adb reverse mappings for Expo ports..."
  adb reverse tcp:8000 tcp:8000 || true
  adb reverse tcp:19000 tcp:19000 || true
  adb reverse tcp:19001 tcp:19001 || true
  adb reverse tcp:8081 tcp:8081 || true
  echo "adb reverse --list:"
  adb reverse --list || true
fi

echo
echo "Preflight finished." 
echo "Next steps:"
echo "  1) Start backend (if required): 'cd backend && python3 manage.py runserver 0.0.0.0:8000'"
echo "  2) Start Expo Metro in project root: 'npx expo start --localhost -c'"
echo "  3) In Expo Go (device), open the exp:// URL shown in the Metro terminal or use 'Open from URL' and paste 'exp://127.0.0.1:19000'"

echo
echo "If you still get errors, run:\n  adb logcat -d | grep -A 200 ReactNativeJS"

exit 0
