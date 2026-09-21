# Qur’an Memorization (Hifz) & Muraja'ah Platform

A complete, production-ready Qur’an Memorization & Spaced-Repetition Revision platform with authentic Uthmani Arabic script, Sahih International English translations, multi-CDN recitation streaming, and mobile app integration.

---

## 🌟 Live Production Deployment
* **Web Application**: 👉 **[https://quran.hadisub.online](https://quran.hadisub.online)**
* **Mobile REST API Base**: 👉 **`https://quran.hadisub.online/api`**
* **Hosting**: NairaHost (cPanel) with PHP 8.3 & Let's Encrypt SSL

---

## 📁 Architecture Overview

```
quran/
├── backend_php/             # Production PHP 8.3 REST API & Web SPA
│   ├── api/router.php       # RESTful API routing (/api/auth, /api/quran, /api/memorization, etc.)
│   ├── config/              # Database (SQLite & MySQL PDO), JWT auth, Response helpers
│   ├── models/              # Relational 16-table schema
│   ├── services/            # Quran live streaming, SRS engine, Memorization, Achievements
│   ├── public/              # Web SPA shell, styles, player engine, static assets
│   ├── quran_hifz.sqlite    # Pre-seeded database with all 114 Surahs, Juz, reciters, accounts
│   └── index.php            # Front controller with automatic HTTPS redirect
│
├── quran_backend_php.zip    # Standalone 1-click deployment bundle for cPanel / NairaHost
├── php8/                    # Portable native PHP 8.3.33 environment for Windows
│
├── src/                     # React Native / Expo Mobile App
│   ├── config.ts            # Dynamic API endpoint resolution (targeting live PHP backend)
│   ├── services/            # Mobile API client & audio player
│   └── screens/             # Reading, Memorization, Revision, and Profile screens
│
├── App.tsx                  # Mobile entry component
├── package.json             # Mobile app dependencies
└── .env                     # Mobile environment configuration (EXPO_PUBLIC_API_BASE_URL)
```

---

## 🚀 Getting Started

### 1. Web Application & PHP Backend

#### Running Locally:
```powershell
# Starts the PHP 8.3 dev server on port 8000:
.\php8\php.exe -S 0.0.0.0:8000 -t backend_php/public backend_php/public/index.php
```
Access at: `http://localhost:8000`

#### Deploying to NairaHost (cPanel):
1. In cPanel File Manager, open `/quran.hadisub.online/`.
2. Upload `quran_backend_php.zip`.
3. Right-click and **Extract**.

---

### 2. Mobile App (React Native Expo)

The mobile app is pre-configured to communicate directly with your live PHP API:

```bash
# 1. Install dependencies:
npm install --legacy-peer-deps

# 2. Start Expo:
npx expo start
```
Scan the QR code with **Expo Go** on your Android or iOS device.

---

## 🔑 Test Accounts
* **Demo Student**: `student@quran.com` / `Student123!`
* **Admin**: `admin@quran.com` / `Admin123!`

---

## ✨ Key Features
* **Spaced Repetition System (SRS)**: Adaptive intervals (1d → 3d → 7d → 14d → 30d) based on recall grading.
* **Recitation Repetition**: Configurable verse repetitions (1x, 2x, 3x, 5x, 10x, ∞ Loop) with customizable pause delays (0–5s).
* **Dual-Stream CDN**: Fallback streaming between Islamic Network Global CDN and EveryAyah.
* **Live Quran Streaming**: On-demand retrieval for all 114 Surahs and 6,236 Ayahs directly from the official Al-Quran Cloud API.
