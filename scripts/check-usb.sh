#!/usr/bin/env sh
PORT="${1:-8082}"

echo "=== USB / Metro check ==="
echo ""
echo "adb devices:"
adb devices 2>/dev/null || echo "  adb not available"
echo ""
echo "adb reverse:"
adb reverse --list 2>/dev/null || echo "  (none)"
echo ""
printf "Metro /status on 127.0.0.1:%s ... " "$PORT"
if curl -sf --max-time 3 "http://127.0.0.1:${PORT}/status" >/dev/null; then
  echo "OK (Metro is running)"
else
  echo "FAIL — run: npm run dev:usb"
fi
echo ""
printf "Bundle request (should trigger 'Bundled' in Metro) ... "
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 90 \
  "http://127.0.0.1:${PORT}/node_modules/expo/AppEntry.bundle?platform=android&dev=true" 2>/dev/null || echo "000")
echo "HTTP $CODE"
if [ "$CODE" = "200" ]; then
  echo "  Bundle builds OK on your PC."
else
  echo "  Bundle failed — check Metro terminal for errors."
fi
