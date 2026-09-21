# Qur'an Platform - Flask Backend

A lightweight, high-performance Python Flask backend for the Quran Memorization & Islamic Learning Platform. Fully compatible with SQLite, Vercel Serverless Functions, and CORS-enabled for web & mobile apps.

---

## 📂 Folder Structure

```
backend_flask/
├── app.py                 # Standalone Flask entrypoint (for local running)
├── db.py                  # SQLite connection manager with /tmp write-safety for Vercel
├── prayer_calc.py         # Astronomical prayer times, Qibla azimuth, & Hijri date calculation
├── quran_hifz.sqlite      # Complete pre-seeded database (Surahs, Ayahs, Tajweed, Tafsir, Hadith, etc.)
├── requirements.txt       # Python dependencies (Flask, flask-cors, PyJWT, werkzeug)
├── vercel.json            # Vercel Serverless Function deployment configuration
├── run.bat                # 1-click local launch script
└── api/
    ├── index.py           # Vercel entrypoint matching Vercel Python conventions
    ├── db.py
    ├── prayer_calc.py
    └── quran_hifz.sqlite
```

---

## 🚀 How to Run Locally

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Start the server:
   - Double-click `run.bat`, or
   - Run in terminal:
     ```bash
     python app.py
     ```
3. The server will be active at **http://127.0.0.1:5000**.
   - API endpoints: `http://127.0.0.1:5000/api/...`
   - Overview: `http://127.0.0.1:5000/api/dashboard/overview`

---

## ☁️ How to Deploy to Vercel

### Option 1: Deploying with Vercel CLI
```bash
cd backend_flask
vercel
```
Follow prompts (accept defaults). For production:
```bash
vercel --prod
```

### Option 2: Deploying Whole Repo
If deploying the parent project repository, the root `vercel.json` automatically connects `api/index.py` and the static frontend in `public/`.
