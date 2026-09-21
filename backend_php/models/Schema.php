<?php

namespace App\Models;

use App\Config\Database;

class Schema {
    public static function createTables(): void {
        $db = Database::getConnection();

        $sql = "
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(80) NOT NULL UNIQUE,
            email VARCHAR(120) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            name VARCHAR(120),
            role VARCHAR(20) DEFAULT 'user',
            profile_image VARCHAR(255),
            memorization_goal VARCHAR(255) DEFAULT 'Memorize the Holy Quran',
            daily_goal_ayahs INTEGER DEFAULT 5,
            daily_revision_goal_ayahs INTEGER DEFAULT 15,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS surahs (
            id INTEGER PRIMARY KEY,
            number INTEGER NOT NULL UNIQUE,
            name_arabic VARCHAR(100) NOT NULL,
            name_english VARCHAR(100) NOT NULL,
            name_translation VARCHAR(100),
            revelation_type VARCHAR(20),
            total_ayahs INTEGER NOT NULL,
            juz_start INTEGER,
            page_start INTEGER
        );

        CREATE TABLE IF NOT EXISTS juz (
            id INTEGER PRIMARY KEY,
            number INTEGER NOT NULL UNIQUE,
            name_arabic VARCHAR(100),
            start_surah_number INTEGER NOT NULL,
            start_ayah_number INTEGER NOT NULL,
            end_surah_number INTEGER NOT NULL,
            end_ayah_number INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS ayahs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            surah_id INTEGER NOT NULL,
            surah_number INTEGER NOT NULL,
            ayah_number INTEGER NOT NULL,
            verse_key VARCHAR(20) NOT NULL UNIQUE,
            text_arabic TEXT NOT NULL,
            text_translation TEXT NOT NULL,
            juz_number INTEGER,
            page_number INTEGER,
            hizb_number INTEGER,
            audio_url VARCHAR(500),
            FOREIGN KEY (surah_id) REFERENCES surahs(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS reciters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(120) NOT NULL,
            identifier VARCHAR(80) NOT NULL UNIQUE,
            style VARCHAR(80) DEFAULT 'Murattal',
            audio_base_url VARCHAR(255) NOT NULL,
            subfolder VARCHAR(120),
            is_default INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS memorization_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title VARCHAR(150) NOT NULL,
            start_date DATE NOT NULL,
            target_date DATE,
            start_surah INTEGER NOT NULL,
            start_ayah INTEGER NOT NULL,
            end_surah INTEGER NOT NULL,
            end_ayah INTEGER NOT NULL,
            ayahs_per_day INTEGER DEFAULT 5,
            pages_per_day REAL,
            days_per_week INTEGER DEFAULT 5,
            rest_days VARCHAR(100) DEFAULT 'Friday',
            status VARCHAR(20) DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS memorization_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            ayah_id INTEGER NOT NULL,
            verse_key VARCHAR(20) NOT NULL,
            strength_score REAL DEFAULT 0.0,
            times_reviewed INTEGER DEFAULT 0,
            times_correct INTEGER DEFAULT 0,
            times_incorrect INTEGER DEFAULT 0,
            difficulty_level INTEGER DEFAULT 1,
            memorized_status VARCHAR(20) DEFAULT 'learning',
            ease_factor REAL DEFAULT 2.5,
            interval_days INTEGER DEFAULT 1,
            last_reviewed_at DATETIME,
            next_review_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, ayah_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (ayah_id) REFERENCES ayahs(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS practice_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            surah_number INTEGER NOT NULL,
            start_ayah INTEGER NOT NULL,
            end_ayah INTEGER NOT NULL,
            mode VARCHAR(30) NOT NULL,
            ayahs_practiced INTEGER DEFAULT 0,
            duration_seconds INTEGER DEFAULT 0,
            notes TEXT,
            started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS revision_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            session_type VARCHAR(30) DEFAULT 'scheduled',
            total_reviewed INTEGER DEFAULT 0,
            total_correct INTEGER DEFAULT 0,
            total_incorrect INTEGER DEFAULT 0,
            total_difficult INTEGER DEFAULT 0,
            duration_seconds INTEGER DEFAULT 0,
            started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS revision_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            ayah_id INTEGER NOT NULL,
            verse_key VARCHAR(20) NOT NULL,
            grade VARCHAR(20) NOT NULL,
            strength_before REAL NOT NULL,
            strength_after REAL NOT NULL,
            reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES revision_sessions(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (ayah_id) REFERENCES ayahs(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS bookmarks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            ayah_id INTEGER NOT NULL,
            verse_key VARCHAR(20) NOT NULL,
            category VARCHAR(50) DEFAULT 'favorite',
            note TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, ayah_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (ayah_id) REFERENCES ayahs(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            ayah_id INTEGER NOT NULL,
            verse_key VARCHAR(20) NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (ayah_id) REFERENCES ayahs(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS audio_recordings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            ayah_id INTEGER,
            verse_key VARCHAR(20),
            file_path VARCHAR(255) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_size INTEGER,
            duration_seconds REAL,
            recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (ayah_id) REFERENCES ayahs(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code VARCHAR(50) NOT NULL UNIQUE,
            title VARCHAR(100) NOT NULL,
            description VARCHAR(255) NOT NULL,
            icon VARCHAR(50) DEFAULT 'trophy',
            requirement_type VARCHAR(50) NOT NULL,
            requirement_value INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS user_achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            achievement_id INTEGER NOT NULL,
            unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, achievement_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS notification_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            daily_hifz_reminder INTEGER DEFAULT 1,
            revision_reminder INTEGER DEFAULT 1,
            streak_reminder INTEGER DEFAULT 1,
            due_revision_reminder INTEGER DEFAULT 1,
            reminder_time VARCHAR(10) DEFAULT '09:00',
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- =============================================================
        -- 1. TAJWEED MODULE TABLES
        -- =============================================================
        CREATE TABLE IF NOT EXISTS tajweed_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            name_arabic VARCHAR(100),
            description TEXT,
            order_index INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS tajweed_lessons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER NOT NULL,
            title VARCHAR(150) NOT NULL,
            title_arabic VARCHAR(150),
            summary TEXT,
            content TEXT NOT NULL,
            audio_url VARCHAR(500),
            order_index INTEGER DEFAULT 0,
            FOREIGN KEY (category_id) REFERENCES tajweed_categories(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS tajweed_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lesson_id INTEGER NOT NULL,
            name VARCHAR(100) NOT NULL,
            name_arabic VARCHAR(100),
            color_code VARCHAR(20) DEFAULT '#059669',
            explanation TEXT NOT NULL,
            FOREIGN KEY (lesson_id) REFERENCES tajweed_lessons(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS tajweed_examples (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rule_id INTEGER NOT NULL,
            text_arabic TEXT NOT NULL,
            text_transliteration TEXT,
            surah_number INTEGER,
            ayah_number INTEGER,
            explanation TEXT,
            audio_url VARCHAR(500),
            FOREIGN KEY (rule_id) REFERENCES tajweed_rules(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS tajweed_quizzes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lesson_id INTEGER NOT NULL,
            question TEXT NOT NULL,
            option_a TEXT NOT NULL,
            option_b TEXT NOT NULL,
            option_c TEXT NOT NULL,
            option_d TEXT NOT NULL,
            correct_option VARCHAR(5) NOT NULL,
            explanation TEXT,
            FOREIGN KEY (lesson_id) REFERENCES tajweed_lessons(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS user_tajweed_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            lesson_id INTEGER NOT NULL,
            is_completed INTEGER DEFAULT 0,
            quiz_score INTEGER DEFAULT 0,
            completed_at DATETIME,
            UNIQUE(user_id, lesson_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (lesson_id) REFERENCES tajweed_lessons(id) ON DELETE CASCADE
        );

        -- =============================================================
        -- 2. TAFSIR MODULE TABLES
        -- =============================================================
        CREATE TABLE IF NOT EXISTS tafsir_sources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            author VARCHAR(150) NOT NULL,
            language VARCHAR(50) DEFAULT 'en',
            methodology TEXT,
            is_default INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS tafsir_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_id INTEGER NOT NULL,
            surah_number INTEGER NOT NULL,
            ayah_number INTEGER NOT NULL,
            verse_key VARCHAR(20) NOT NULL,
            text_arabic TEXT,
            text_translation TEXT,
            content TEXT NOT NULL,
            source_attribution VARCHAR(150),
            related_verses VARCHAR(255),
            FOREIGN KEY (source_id) REFERENCES tafsir_sources(id) ON DELETE CASCADE
        );

        -- =============================================================
        -- 3. TAWHID & AQEEDAH MODULE TABLES
        -- =============================================================
        CREATE TABLE IF NOT EXISTS tawhid_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            name_arabic VARCHAR(100),
            description TEXT,
            order_index INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS tawhid_lessons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER NOT NULL,
            title VARCHAR(150) NOT NULL,
            introduction TEXT,
            main_lesson TEXT NOT NULL,
            evidence_quran_hadith TEXT,
            key_points TEXT,
            order_index INTEGER DEFAULT 0,
            FOREIGN KEY (category_id) REFERENCES tawhid_categories(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS tawhid_quizzes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lesson_id INTEGER NOT NULL,
            question TEXT NOT NULL,
            option_a TEXT NOT NULL,
            option_b TEXT NOT NULL,
            option_c TEXT NOT NULL,
            option_d TEXT NOT NULL,
            correct_option VARCHAR(5) NOT NULL,
            explanation TEXT,
            FOREIGN KEY (lesson_id) REFERENCES tawhid_lessons(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS user_tawhid_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            lesson_id INTEGER NOT NULL,
            is_completed INTEGER DEFAULT 0,
            quiz_score INTEGER DEFAULT 0,
            completed_at DATETIME,
            UNIQUE(user_id, lesson_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (lesson_id) REFERENCES tawhid_lessons(id) ON DELETE CASCADE
        );

        -- =============================================================
        -- 4. PRAYER TIMES & ADHAN SETTINGS
        -- =============================================================
        CREATE TABLE IF NOT EXISTS prayer_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            city VARCHAR(100) DEFAULT 'Abuja',
            country VARCHAR(100) DEFAULT 'Nigeria',
            latitude REAL DEFAULT 9.0765,
            longitude REAL DEFAULT 7.3986,
            calculation_method VARCHAR(50) DEFAULT 'MWL',
            asr_juristic VARCHAR(20) DEFAULT 'Standard',
            time_format VARCHAR(10) DEFAULT '12h',
            adhan_audio VARCHAR(50) DEFAULT 'makkah',
            fajr_notification INTEGER DEFAULT 1,
            fajr_adhan INTEGER DEFAULT 1,
            dhuhr_notification INTEGER DEFAULT 1,
            dhuhr_adhan INTEGER DEFAULT 1,
            asr_notification INTEGER DEFAULT 1,
            asr_adhan INTEGER DEFAULT 1,
            maghrib_notification INTEGER DEFAULT 1,
            maghrib_adhan INTEGER DEFAULT 1,
            isha_notification INTEGER DEFAULT 1,
            isha_adhan INTEGER DEFAULT 1,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- =============================================================
        -- 5. ADHKAR & DUAS TABLES
        -- =============================================================
        CREATE TABLE IF NOT EXISTS adhkar_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            name_arabic VARCHAR(100),
            icon VARCHAR(50) DEFAULT 'moon-stars',
            order_index INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS adhkar_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER NOT NULL,
            text_arabic TEXT NOT NULL,
            transliteration TEXT,
            translation TEXT NOT NULL,
            virtue TEXT,
            reference VARCHAR(150),
            target_count INTEGER DEFAULT 1,
            audio_url VARCHAR(500),
            FOREIGN KEY (category_id) REFERENCES adhkar_categories(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS user_adhkar_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            dhikr_id INTEGER NOT NULL,
            completed_count INTEGER DEFAULT 0,
            last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (dhikr_id) REFERENCES adhkar_items(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS dua_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            name_arabic VARCHAR(100),
            icon VARCHAR(50) DEFAULT 'heart',
            order_index INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS dua_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER NOT NULL,
            title VARCHAR(150) NOT NULL,
            text_arabic TEXT NOT NULL,
            transliteration TEXT,
            translation TEXT NOT NULL,
            reference VARCHAR(150),
            audio_url VARCHAR(500),
            FOREIGN KEY (category_id) REFERENCES dua_categories(id) ON DELETE CASCADE
        );

        -- =============================================================
        -- 6. HADITH COLLECTION TABLES
        -- =============================================================
        CREATE TABLE IF NOT EXISTS hadith_collections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            author VARCHAR(100) NOT NULL,
            total_hadith INTEGER DEFAULT 0,
            description TEXT
        );

        CREATE TABLE IF NOT EXISTS hadith_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            collection_id INTEGER NOT NULL,
            hadith_number INTEGER NOT NULL,
            chapter_name VARCHAR(150),
            text_arabic TEXT NOT NULL,
            translation TEXT NOT NULL,
            narrator VARCHAR(100),
            grading VARCHAR(50) DEFAULT 'Sahih',
            reference VARCHAR(150),
            FOREIGN KEY (collection_id) REFERENCES hadith_collections(id) ON DELETE CASCADE
        );

        -- =============================================================
        -- 7. 99 NAMES OF ALLAH TABLE
        -- =============================================================
        CREATE TABLE IF NOT EXISTS names_of_allah (
            id INTEGER PRIMARY KEY,
            number INTEGER NOT NULL UNIQUE,
            name_arabic VARCHAR(100) NOT NULL,
            transliteration VARCHAR(100) NOT NULL,
            meaning_english VARCHAR(150) NOT NULL,
            explanation TEXT,
            quran_reference VARCHAR(255)
        );

        -- =============================================================
        -- 8. UNIFIED BOOKMARKS & DIGITAL TASBIH
        -- =============================================================
        CREATE TABLE IF NOT EXISTS unified_bookmarks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            item_type VARCHAR(50) NOT NULL,
            item_id VARCHAR(50) NOT NULL,
            title VARCHAR(200) NOT NULL,
            subtitle VARCHAR(200),
            extra_data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, item_type, item_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS tasbih_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            dhikr_phrase VARCHAR(150) NOT NULL,
            target_count INTEGER DEFAULT 33,
            completed_count INTEGER DEFAULT 33,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        ";

        $db->exec($sql);
    }
}
