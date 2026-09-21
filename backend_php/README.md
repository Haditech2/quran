# Qur’an Memorization (Hifz) & Muraja'ah Application (PHP Backend)

A complete, production-ready Qur’an Memorization and Spaced-Repetition Revision (Muraja'ah) application rewritten in **PHP 8.3+** with **PDO**, **JWT Authentication**, and a modern, responsive Islamic-styled web/mobile interface.

---

## 1. Technology Stack

### Backend
- **PHP 8.3+**
- **PDO Database Abstraction** (Supports **PostgreSQL** in production and **SQLite** for zero-configuration local development)
- **Stateless JWT Authentication** (HMAC-SHA256 with access tokens and refresh tokens)
- **Bcrypt Password Hashing** (`PASSWORD_BCRYPT`)
- **Strict SQL Injection Protection** via prepared statements
- **RESTful Architecture** with clean JSON responses (`success`, `message`, `data`, `errors`)

### Frontend
- Responsive Islamic design system (Deep Forest Emerald `#064e3b`, Warm Cream `#f8faf9`, Amber Gold `#d97706`)
- Authentic Arabic calligraphy via Google Fonts `Amiri` and clean UI with `Plus Jakarta Sans`
- Desktop sidebar + 5-item mobile bottom navigation
- Global sticky audio player bar with EveryAyah reciter streams (Mishary Al-Afasy, Al-Husary, AbdulBaset, Al-Shatri)
- In-browser voice recitation recorder via `MediaRecorder` API with server upload

---

## 2. Directory Structure

```
backend_php/
├── config/
│   ├── Database.php          # PDO connection (PostgreSQL / SQLite)
│   ├── JWT.php               # HMAC-SHA256 JWT encoder/decoder
│   └── Response.php          # CORS and standardized JSON responses
├── models/
│   └── Schema.php            # Creates all 16 relational database tables
├── services/
│   ├── AuthService.php       # Registration, login, profile management
│   ├── QuranService.php      # 114 Surahs, 30 Juz, verified Ayahs, search
│   ├── SRSService.php        # Spaced repetition, 0-100% strength score, adaptive intervals
│   ├── MemorizationService.php # Hifz plans, practice tracking, marking verses
│   ├── ProgressService.php   # Streaks, dashboard summary, statistics, 35-day calendar heatmap
│   └── AchievementService.php# Automated milestone unlocks
├── api/
│   └── router.php            # REST router handling all endpoints with JWT authorization
├── public/
│   ├── index.php             # Front controller serving API routes and the SPA frontend
│   ├── index.html            # Islamic UI layout shell
│   └── static/               # CSS, JS, audio players, recorder
├── seed.php                  # Database migration & seed CLI script
├── quran_hifz.sqlite         # Local database file
└── README.md
```

---

## 3. Quick Start & Running Locally

### 1. Run the Database Seed Script
```bash
php seed.php
```
This initializes all 16 tables and seeds:
- All 114 Surahs metadata
- 30 Juz boundaries
- Verified Ayahs (Uthmani authentic Arabic and Sahih International translation)
- 4 audio reciters
- 9 achievements
- Demo Accounts:
  - **Admin**: `admin@quran.com` / `Admin123!`
  - **Demo Student**: `student@quran.com` / `Student123!` (with pre-populated 7-day streak and active plan)

### 2. Start the PHP Built-in Server
```bash
php -S 0.0.0.0:8000 -t public public/index.php
```

Visit **http://127.0.0.1:8000** in your browser to experience the application.

---

## 4. Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `sqlite:quran_hifz.sqlite` | SQLite file path or PostgreSQL DSN (`postgresql://user:pass@host:5432/dbname`) |
| `JWT_SECRET_KEY` | `php-hifz-jwt-secret-key-production-ready-2026` | Secret key used for signing HMAC-SHA256 JWTs |

---

## 5. End-to-End Verification

You can verify the complete user flow using the automated test suite:
```bash
python test_php_backend.py
```
This validates all 9 steps:
1. Student Registration (201 Created)
2. Student Login (200 OK + JWT access token)
3. Qur'an Browsing (All 114 Surahs & Ayahs loaded)
4. Hifz Plan Creation & Active Plan pacing
5. Memorization Session start & marking Ayah memorized (strength 85%)
6. Muraja'ah Revision Session start, grading (*correct* -> strength 100%), and completion
7. Dashboard Summary & Streak calculation
8. Bookmarks & Private Notes CRUD
9. Responsive HTML SPA shell serving (200 OK)
