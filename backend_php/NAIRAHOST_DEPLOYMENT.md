# Deploying to NairaHost (cPanel)

This guide walks you through deploying the Qur’an Memorization & Muraja'ah PHP application to your **NairaHost** cPanel account.

---

## Why PHP on NairaHost is Ideal
1. **Zero Python/WSGI Headaches**: NairaHost is optimized for PHP.
2. **Instant SQLite Support**: The pre-seeded database file `quran_hifz.sqlite` contains all 114 Surahs, 30 Juz, authentic Ayahs, reciters, and demo accounts. You do **not** even need to create a MySQL database unless you want to!
3. **Apache / LiteSpeed `.htaccess` Ready**: Includes rules for JWT Bearer token authentication so mobile apps can connect without headers being blocked by Apache.

---

## Step-by-Step Deployment Options

### Option A: Subdomain Setup (Recommended)
This gives you a clean URL like `https://quran.yourdomain.com` or `https://api.yourdomain.com`.

1. **Log in to your NairaHost cPanel**.
2. Go to **Domains** > **Domains** (or **Subdomains**).
3. Create a new domain/subdomain:
   * **Domain**: `quran.yourdomain.com`
   * **Document Root**: `/home/username/quran/public`
4. In **File Manager**, upload the files:
   * Put all project files (`api/`, `config/`, `models/`, `services/`, `public/`, `quran_hifz.sqlite`) into `/home/username/quran/`.
   * Ensure `public/index.php`, `public/.htaccess`, and `public/static/` are inside the `public/` directory.
5. In cPanel, search for **MultiPHP Manager** and ensure your domain is set to **PHP 8.2 or 8.3**.
6. That's it! Your API is live at:
   `https://quran.yourdomain.com/api`

---

### Option B: Subfolder Setup (e.g. `yourdomain.com/quran`)

If you want to place it inside your existing website without creating a subdomain:

1. In **File Manager**, create a folder inside `public_html/`, for example `public_html/quran/`.
2. Upload the contents of `backend_php/` into `public_html/quran/`.
3. Move the contents of `public_html/quran/public/` directly into `public_html/quran/` (so `index.php` and `.htaccess` are directly under `public_html/quran/`), and update the path in `index.php` to `$baseDir = __DIR__;`.
4. Your API is now live at:
   `https://yourdomain.com/quran/api`

---

## Database Configuration

### 1. Using SQLite (Easiest - Default)
* The app automatically detects and uses `quran_hifz.sqlite`.
* Make sure `quran_hifz.sqlite` and the directory it resides in have write permissions (`644` or `664` for the file, `755` for the directory).
* No MySQL database setup is required.

### 2. Using MySQL (Optional)
If you prefer to use cPanel's MySQL:
1. Go to **MySQL® Databases** in cPanel.
2. Create a new database (e.g. `cpaneluser_quran`) and user with full privileges.
3. In `config/`, copy `database.local.php.example` to `database.local.php`.
4. Enter your MySQL details:
   ```php
   return [
       'DATABASE_URL' => 'mysql:host=localhost;dbname=cpaneluser_quran;charset=utf8mb4',
       'DB_USER' => 'cpaneluser_dbuser',
       'DB_PASS' => 'YourPassword123!',
   ];
   ```
5. Run the seeding script once via cPanel Terminal or browser:
   `php seed.php`

---

## Connecting Your Mobile App

In your Flutter / React Native / Android / iOS app, set:

```javascript
// If using Option A (Subdomain):
export const API_BASE_URL = "https://quran.yourdomain.com/api";

// If using Option B (Subfolder):
export const API_BASE_URL = "https://yourdomain.com/quran/api";
```

All endpoints (`/api/auth/register`, `/api/auth/login`, `/api/quran/surahs`, `/api/memorization/start`, `/api/revision/result`, etc.) will respond immediately over HTTPS.
