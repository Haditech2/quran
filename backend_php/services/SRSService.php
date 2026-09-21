<?php

namespace App\Services;

use App\Config\Database;
use PDO;

class SRSService {
    public static function getOrCreateProgress(int $userId, int $ayahId): array {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM memorization_progress WHERE user_id = ? AND ayah_id = ?");
        $stmt->execute([$userId, $ayahId]);
        $row = $stmt->fetch();

        if (!$row) {
            $ayah = QuranService::getAyahById($ayahId);
            if (!$ayah) throw new \Exception("Ayah not found");

            $ins = $db->prepare("
                INSERT INTO memorization_progress 
                (user_id, ayah_id, verse_key, strength_score, difficulty_level, ease_factor, interval_days, memorized_status)
                VALUES (?, ?, ?, 0.0, 1, 2.5, 1, 'learning')
            ");
            $ins->execute([$userId, $ayahId, $ayah['verse_key']]);
            $id = (int)$db->lastInsertId();

            $stmt->execute([$userId, $ayahId]);
            $row = $stmt->fetch();
        }

        return $row;
    }

    public static function processRevisionGrade(int $userId, int $ayahId, string $grade, ?int $sessionId = null): array {
        $db = Database::getConnection();
        $progress = self::getOrCreateProgress($userId, $ayahId);

        $strengthBefore = (float)$progress['strength_score'];
        $timesReviewed = (int)$progress['times_reviewed'] + 1;
        $timesCorrect = (int)$progress['times_correct'];
        $timesIncorrect = (int)$progress['times_incorrect'];
        $easeFactor = (float)$progress['ease_factor'];
        $intervalDays = (int)$progress['interval_days'];
        $difficultyLevel = (int)$progress['difficulty_level'];
        $memorizedStatus = $progress['memorized_status'];
        $strengthAfter = $strengthBefore;

        if ($grade === 'correct') {
            $timesCorrect++;
            $easeFactor = min(3.0, max(1.3, $easeFactor + 0.1));

            if ($timesCorrect === 1) $intervalDays = 1;
            elseif ($timesCorrect === 2) $intervalDays = 3;
            elseif ($timesCorrect === 3) $intervalDays = 7;
            elseif ($timesCorrect === 4) $intervalDays = 14;
            elseif ($timesCorrect === 5) $intervalDays = 30;
            else $intervalDays = (int)round($intervalDays * $easeFactor);

            $strengthAfter = min(100.0, $strengthBefore + 15.0);
            if ($strengthAfter >= 80.0) {
                $memorizedStatus = 'memorized';
                $difficultyLevel = max(1, $difficultyLevel - 1);
            }
        } elseif ($grade === 'difficult') {
            $easeFactor = max(1.3, $easeFactor - 0.15);
            $intervalDays = max(1, (int)round($intervalDays * 0.6));
            $difficultyLevel = min(5, $difficultyLevel + 1);
            $strengthAfter = max(30.0, min(75.0, $strengthBefore));
            $memorizedStatus = 'struggling';
        } elseif ($grade === 'mistake') {
            $timesIncorrect++;
            $easeFactor = max(1.3, $easeFactor - 0.25);
            $intervalDays = 1;
            $difficultyLevel = min(5, $difficultyLevel + 1);
            $strengthAfter = max(10.0, $strengthBefore - 25.0);
            $memorizedStatus = 'struggling';
        }

        $now = date('Y-m-d H:i:s');
        $nextReview = date('Y-m-d H:i:s', strtotime("+{$intervalDays} days"));

        $upd = $db->prepare("
            UPDATE memorization_progress SET
                times_reviewed = ?,
                times_correct = ?,
                times_incorrect = ?,
                ease_factor = ?,
                interval_days = ?,
                difficulty_level = ?,
                strength_score = ?,
                memorized_status = ?,
                last_reviewed_at = ?,
                next_review_at = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        $upd->execute([
            $timesReviewed, $timesCorrect, $timesIncorrect,
            $easeFactor, $intervalDays, $difficultyLevel,
            $strengthAfter, $memorizedStatus, $now, $nextReview,
            $progress['id']
        ]);

        // Record revision result
        if ($sessionId) {
            $resStmt = $db->prepare("
                INSERT INTO revision_results 
                (session_id, user_id, ayah_id, verse_key, grade, strength_before, strength_after, reviewed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $resStmt->execute([
                $sessionId, $userId, $ayahId, $progress['verse_key'],
                $grade, $strengthBefore, $strengthAfter, $now
            ]);

            // Update session aggregates
            $sessUpd = $db->prepare("
                UPDATE revision_sessions SET
                    total_reviewed = total_reviewed + 1,
                    total_correct = total_correct + CASE WHEN ? = 'correct' THEN 1 ELSE 0 END,
                    total_incorrect = total_incorrect + CASE WHEN ? = 'mistake' THEN 1 ELSE 0 END,
                    total_difficult = total_difficult + CASE WHEN ? = 'difficult' THEN 1 ELSE 0 END
                WHERE id = ?
            ");
            $sessUpd->execute([$grade, $grade, $grade, $sessionId]);
        }

        return [
            'progress' => self::getOrCreateProgress($userId, $ayahId),
            'grade' => $grade,
            'strength_before' => round($strengthBefore, 1),
            'strength_after' => round($strengthAfter, 1),
            'interval_days' => $intervalDays,
            'next_review_at' => $nextReview
        ];
    }

    public static function getTodayRevisions(int $userId, int $limit = 30): array {
        $db = Database::getConnection();
        $now = date('Y-m-d H:i:s');
        $stmt = $db->prepare("
            SELECT p.*, a.text_arabic, a.text_translation, a.surah_number, a.ayah_number, s.name_english as surah_name_english 
            FROM memorization_progress p
            JOIN ayahs a ON a.id = p.ayah_id
            JOIN surahs s ON s.id = a.surah_id
            WHERE p.user_id = ? AND (p.next_review_at <= ? OR p.strength_score < 60.0)
            ORDER BY p.strength_score ASC, p.times_incorrect DESC, p.next_review_at ASC
            LIMIT ?
        ");
        $stmt->execute([$userId, $now, $limit]);
        return $stmt->fetchAll();
    }

    public static function getWeakAyahs(int $userId, float $threshold = 65.0, int $limit = 50): array {
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT p.*, a.text_arabic, a.text_translation, a.surah_number, a.ayah_number, s.name_english as surah_name_english 
            FROM memorization_progress p
            JOIN ayahs a ON a.id = p.ayah_id
            JOIN surahs s ON s.id = a.surah_id
            WHERE p.user_id = ? AND (p.strength_score < ? OR p.times_incorrect > 0)
            ORDER BY p.strength_score ASC, p.times_incorrect DESC
            LIMIT ?
        ");
        $stmt->execute([$userId, $threshold, $limit]);
        return $stmt->fetchAll();
    }

    public static function getRecentlyMemorized(int $userId, int $limit = 20): array {
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT p.*, a.text_arabic, a.text_translation, a.surah_number, a.ayah_number, s.name_english as surah_name_english 
            FROM memorization_progress p
            JOIN ayahs a ON a.id = p.ayah_id
            JOIN surahs s ON s.id = a.surah_id
            WHERE p.user_id = ?
            ORDER BY p.created_at DESC
            LIMIT ?
        ");
        $stmt->execute([$userId, $limit]);
        return $stmt->fetchAll();
    }

    public static function getRandomRevisions(int $userId, int $count = 10): array {
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT p.*, a.text_arabic, a.text_translation, a.surah_number, a.ayah_number, s.name_english as surah_name_english 
            FROM memorization_progress p
            JOIN ayahs a ON a.id = p.ayah_id
            JOIN surahs s ON s.id = a.surah_id
            WHERE p.user_id = ? AND p.strength_score > 0
            ORDER BY RANDOM()
            LIMIT ?
        ");
        $stmt->execute([$userId, $count]);
        return $stmt->fetchAll();
    }

    public static function startRevisionSession(int $userId, string $type = 'scheduled'): array {
        $db = Database::getConnection();
        $stmt = $db->prepare("INSERT INTO revision_sessions (user_id, session_type) VALUES (?, ?)");
        $stmt->execute([$userId, $type]);
        $id = (int)$db->lastInsertId();

        $fetch = $db->prepare("SELECT * FROM revision_sessions WHERE id = ?");
        $fetch->execute([$id]);
        return $fetch->fetch();
    }

    public static function completeRevisionSession(int $userId, int $sessionId, int $durationSeconds = 0): array {
        $db = Database::getConnection();
        $now = date('Y-m-d H:i:s');
        $stmt = $db->prepare("
            UPDATE revision_sessions SET completed_at = ?, duration_seconds = ? 
            WHERE id = ? AND user_id = ?
        ");
        $stmt->execute([$now, $durationSeconds, $sessionId, $userId]);

        $fetch = $db->prepare("SELECT * FROM revision_sessions WHERE id = ?");
        $fetch->execute([$sessionId]);
        $session = $fetch->fetch();

        // Fetch results
        $resStmt = $db->prepare("SELECT * FROM revision_results WHERE session_id = ?");
        $resStmt->execute([$sessionId]);
        $session['results'] = $resStmt->fetchAll();

        return $session;
    }

    public static function getRevisionHistory(int $userId, int $limit = 20): array {
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT * FROM revision_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT ?
        ");
        $stmt->execute([$userId, $limit]);
        return $stmt->fetchAll();
    }
}
