#!/usr/bin/env sh
# Stop Quran app dev servers (Expo + Django) started from this project.
USER_NAME=$(id -un)

pkill -u "$USER_NAME" -f 'expo start' 2>/dev/null || true
pkill -u "$USER_NAME" -f 'manage.py runserver' 2>/dev/null || true

for port in 8081 8082 8083 8000; do
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" 2>/dev/null || true
  fi
done

sleep 1
echo "Stopped Expo/Metro and Django (ports 8081–8083, 8000)."
