<?php

namespace App\Services;

use App\Config\Database;
use PDO;

class AchievementService {
    public static function getAllAchievements(int $userId): array {
        $db = Database::getConnection();
        $achievements = $db->query("SELECT * FROM achievements ORDER BY id ASC")->fetchAll();

        $uStmt = $db->prepare("SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = ?");
        $uStmt->execute([$userId]);
        $unlocked = $uStmt->fetchAll(PDO::FETCH_KEY_PAIR);

        $result = [];
        foreach ($achievements as $a) {
            $isUnlocked = isset($unlocked[$a['id']]);
            $a['unlocked'] = $isUnlocked;
            $a['unlocked_at'] = $isUnlocked ? $unlocked[$a['id']] : null;
            $result[] = $a;
        }
        return $result;
    }

    public static function checkAndUnlock(int $userId): array {
        $db = Database::getConnection();
        $stats = ProgressService::getDetailedStatistics($userId);

        $currentStreak = $stats['current_streak'];
        $memorizedAyahs = $stats['total_memorized_ayahs'];
        $completedSurahs = $stats['completed_surahs'];
        $completedJuz = $stats['completed_juz'];
        $totalRevisions = $stats['total_revision_sessions'];

        $uStmt = $db->prepare("SELECT achievement_id FROM user_achievements WHERE user_id = ?");
        $uStmt->execute([$userId]);
        $alreadyUnlocked = array_flip($uStmt->fetchAll(PDO::FETCH_COLUMN));

        $achievements = $db->query("SELECT * FROM achievements")->fetchAll();
        $newlyUnlocked = [];

        foreach ($achievements as $a) {
            if (isset($alreadyUnlocked[$a['id']])) continue;

            $type = $a['requirement_type'];
            $val = (int)$a['requirement_value'];
            $earned = false;

            if ($type === 'ayahs_memorized' && $memorizedAyahs >= $val) $earned = true;
            elseif ($type === 'streak_days' && $currentStreak >= $val) $earned = true;
            elseif ($type === 'surahs_completed' && $completedSurahs >= $val) $earned = true;
            elseif ($type === 'juz_completed' && $completedJuz >= $val) $earned = true;
            elseif ($type === 'revisions_completed' && $totalRevisions >= $val) $earned = true;

            if ($earned) {
                $ins = $db->prepare("INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)");
                $ins->execute([$userId, $a['id']]);
                $newlyUnlocked[] = $a;
            }
        }

        return $newlyUnlocked;
    }
}
