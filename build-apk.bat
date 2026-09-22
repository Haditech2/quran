@echo off
title Build Quran Memorization APK (Expo EAS)
set "PATH=C:\Program Files\nodejs;%USERPROFILE%\AppData\Local\Programs\nodejs;%PATH%"

echo ===================================================
echo   Quran Memorization App - Android APK Builder
echo   Official Expo Build Service (EAS)
echo ===================================================
echo.

echo [1/2] Checking Expo Account Login...
call node node_modules\expo\bin\cli whoami
if %errorlevel% neq 0 (
  echo.
  echo ---------------------------------------------------
  echo Please log in to your Expo account:
  echo (Free signup at: https://expo.dev/signup)
  echo ---------------------------------------------------
  echo.
  call node node_modules\expo\bin\cli login
)

echo.
echo [2/2] Launching Expo APK Cloud Build (Profile: preview)...
echo ---------------------------------------------------
call npx -y eas-cli build -p android --profile preview

echo.
echo Build command finished.
pause
