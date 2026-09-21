#!/usr/bin/env sh
# Re-apply USB port forwarding (run if you unplug/replug the cable).
EXPO_PORT="${EXPO_PORT:-8082}"
adb reverse --remove-all 2>/dev/null || true
adb reverse "tcp:${EXPO_PORT}" "tcp:${EXPO_PORT}"
adb reverse tcp:8081 "tcp:${EXPO_PORT}"
adb reverse tcp:8000 tcp:8000
adb reverse tcp:5000 tcp:5000
echo "USB forwarding active:"
adb reverse --list
