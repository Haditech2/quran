<?php

namespace App\Services;

use App\Config\Database;
use PDO;

class MemorizationService {
    public static function createPlan(int $userId, array $data): array {
        $db = Database::getConnection();
        $title = $data['title'] ?? 'My Hifz Plan';
        $startSurah = (int)($data['start_surah'] ?? 1);
        $startAyah = (int)($data['start_ayah'] ?? 1);
        $endSurah = (int)($data['end_surah'] ?? $startSurah);
        $endAyah = (int)($data['end_ayah'] ?? 7);
        $ayahsPerDay = max(1, (int)($data['ayahs_per_day'] ?? 5));
        $daysPerWeek = min(7, max(1, (int)($data['days_per_week'] ?? 5)));
        $restDays = $data['rest_days'] ?? 'Friday';
        $startDate = date('Y-m-d');
        $targetDate = $data['target_date'] ?? null;

        $stmt = $db->prepare("
            INSERT INTO memorization_plans 
            (user_id, title, start_date, target_date, start_surah, start_ayah, end_surah, end_ayah, ayahs_per_day, days_per_week, rest_days, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        ");
        $stmt->execute([
            $userId, $title, $startDate, $targetDate,
            $startSurah, $startAyah, $endSurah, $endAyah,
            $ayahsPerDay, $daysPerWeek, $restDays
        ]);

        $id = (int)$db->lastInsertId();
        $fetch = $db->prepare("SELECT * FROM memorization_plans WHERE id = ?");
        $fetch->execute([$id]);
        return $fetch->fetch();
    }

    public static function getUserPlans(int $userId): array {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM memorization_plans WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public static function getActivePlanDetails(int $userId): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM memorization_plans WHERE user_id = ? AND status = 'active' LIMIT 1");
        $stmt->execute([$userId]);
        $plan = $stmt->fetch();
        if (!$plan) return null;

        // Calculate total ayahs in plan range
        $sStmt = $db->prepare("SELECT number, total_ayahs FROM surahs WHERE number >= ? AND number <= ? ORDER BY number ASC");
        $sStmt->execute([$plan['start_surah'], $plan['end_surah']]);
        $surahs = $sStmt->fetchAll();

        $targetVerseKeys = [];
        $totalAyahs = 0;
        foreach ($surahs as $s) {
            $sNum = (int)$s['number'];
            $sStart = ($sNum === (int)$plan['start_surah']) ? (int)$plan['start_ayah'] : 1;
            $sEnd = ($sNum === (int)$plan['end_surah']) ? (int)$plan['end_ayah'] : (int)$s['total_ayahs'];
            for ($a = $sStart; $a <= $sEnd; $a++) {
                $targetVerseKeys[] = "{$sNum}:{$a}";
                $totalAyahs++;
            }
        }

        // Count memorized within this plan
        $memCount = 0;
        $memorizedKeys = [];
        if (!empty($targetVerseKeys)) {
            $placeholders = implode(',', array_fill(0, count($targetVerseKeys), '?'));
            $params = array_merge([$userId], $targetVerseKeys);
            $cStmt = $db->prepare("SELECT verse_key FROM memorization_progress WHERE user_id = ? AND strength_score >= 70.0 AND verse_key IN ($placeholders)");
            $cStmt->execute($params);
            $rows = $cStmt->fetchAll();
            $memCount = count($rows);
            $memorizedKeys = array_column($rows, 'verse_key');
        }

        $remaining = max(0, $totalAyahs - $memCount);
        $completionPct = $totalAyahs > 0 ? round(($memCount / $totalAyahs) * 100, 1) : 0.0;

        // Today's target ayahs
        $memSet = array_flip($memorizedKeys);
        $todaysKeys = [];
        foreach ($targetVerseKeys as $k) {
            if (!isset($memSet[$k])) {
                $todaysKeys[] = $k;
                if (count($todaysKeys) >= (int)$plan['ayahs_per_day']) break;
            }
        }

        $todaysAyahs = [];
        if (!empty($todaysKeys)) {
            $inClause = implode(',', array_fill(0, count($todaysKeys), '?'));
            $aStmt = $db->prepare("SELECT a.*, s.name_english as surah_name_english FROM ayahs a JOIN surahs s ON s.id = a.surah_id WHERE a.verse_key IN ($inClause)");
            $aStmt->execute($todaysKeys);
            $todaysAyahs = $aStmt->fetchAll();
        }

        $daysNeeded = (int)$plan['ayahs_per_day'] > 0 ? ($remaining / (int)$plan['ayahs_per_day']) * (7.0 / (int)$plan['days_per_week']) : 0;
        $expectedCompletion = date('Y-m-d', strtotime("+" . (int)$daysNeeded . " days"));

        $plan['total_ayahs'] = $totalAyahs;
        $plan['memorized_ayahs'] = $memCount;
        $plan['remaining_ayahs'] = $remaining;
        $plan['completion_percentage'] = $completionPct;
        $plan['todays_target_keys'] = $todaysKeys;
        $plan['todays_target_ayahs'] = $todaysAyahs;
        $plan['expected_completion_date'] = $expectedCompletion;

        return $plan;
    }

    public static function updatePlanStatus(int $userId, int $planId, string $newStatus): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("UPDATE memorization_plans SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?");
        $stmt->execute([$newStatus, $planId, $userId]);

        $fetch = $db->prepare("SELECT * FROM memorization_plans WHERE id = ?");
        $fetch->execute([$planId]);
        $row = $fetch->fetch();
        return $row ?: null;
    }

    public static function deletePlan(int $userId, int $planId): bool {
        $db = Database::getConnection();
        $stmt = $db->prepare("DELETE FROM memorization_plans WHERE id = ? AND user_id = ?");
        $stmt->execute([$planId, $userId]);
        return $stmt->rowCount() > 0;
    }

    public static function markAyahMemorized(int $userId, int $ayahId, float $initialStrength = 80.0): array {
        $db = Database::getConnection();
        $ayah = QuranService::getAyahById($ayahId);
        if (!$ayah) throw new \Exception("Ayah not found");

        $progress = SRSService::getOrCreateProgress($userId, $ayahId);
        $now = date('Y-m-d H:i:s');
        $nextReview = date('Y-m-d H:i:s', strtotime("+1 day"));

        $newStrength = max((float)$progress['strength_score'], $initialStrength);
        $timesCorrect = (int)$progress['times_correct'] + 1;
        $timesReviewed = (int)$progress['times_reviewed'] + 1;

        $upd = $db->prepare("
            UPDATE memorization_progress SET
                strength_score = ?,
                memorized_status = 'memorized',
                times_correct = ?,
                times_reviewed = ?,
                last_reviewed_at = ?,
                next_review_at = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        $upd->execute([$newStrength, $timesCorrect, $timesReviewed, $now, $nextReview, $progress['id']]);

        return SRSService::getOrCreateProgress($userId, $ayahId);
    }

    public static function markAyahDifficult(int $userId, int $ayahId): array {
        $db = Database::getConnection();
        $ayah = QuranService::getAyahById($ayahId);
        if (!$ayah) throw new \Exception("Ayah not found");

        $progress = SRSService::getOrCreateProgress($userId, $ayahId);
        $now = date('Y-m-d H:i:s');
        $nextReview = date('Y-m-d H:i:s', strtotime("+1 day"));

        $newStrength = max(20.0, (float)$progress['strength_score'] - 20.0);
        $difficulty = min(5, (int)$progress['difficulty_level'] + 1);
        $timesIncorrect = (int)$progress['times_incorrect'] + 1;
        $timesReviewed = (int)$progress['times_reviewed'] + 1;

        $upd = $db->prepare("
            UPDATE memorization_progress SET
                strength_score = ?,
                difficulty_level = ?,
                memorized_status = 'struggling',
                times_incorrect = ?,
                times_reviewed = ?,
                interval_days = 1,
                last_reviewed_at = ?,
                next_review_at = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        $upd->execute([$newStrength, $difficulty, $timesIncorrect, $timesReviewed, $now, $nextReview, $progress['id']]);

        return SRSService::getOrCreateProgress($userId, $ayahId);
    }

    public static function recordPracticeSession(int $userId, array $data): array {
        $db = Database::getConnection();
        $surahNum = (int)($data['surah_number'] ?? 1);
        $startA = (int)($data['start_ayah'] ?? 1);
        $endA = (int)($data['end_ayah'] ?? 1);
        $mode = $data['mode'] ?? 'read';
        $practiced = (int)($data['ayahs_practiced'] ?? 0);
        $duration = (int)($data['duration_seconds'] ?? 0);
        $notes = $data['notes'] ?? null;
        $now = date('Y-m-d H:i:s');

        $stmt = $db->prepare("
            INSERT INTO practice_sessions 
            (user_id, surah_number, start_ayah, end_ayah, mode, ayahs_practiced, duration_seconds, notes, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$userId, $surahNum, $startA, $endA, $mode, $practiced, $duration, $notes, $now]);
        $id = (int)$db->lastInsertId();

        $fetch = $db->prepare("SELECT * FROM practice_sessions WHERE id = ?");
        $fetch->execute([$id]);
        return $fetch->fetch();
    }
}
