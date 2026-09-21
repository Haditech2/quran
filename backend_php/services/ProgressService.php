<?php

namespace App\Services;

use App\Config\Database;
use PDO;

class ProgressService {
    const TOTAL_QURAN_AYAHS = 6236;

    public static function calculateStreaks(int $userId): array {
        $db = Database::getConnection();

        $stmt1 = $db->prepare("SELECT DISTINCT date(started_at) as session_date FROM practice_sessions WHERE user_id = ?");
        $stmt1->execute([$userId]);
        $d1 = $stmt1->fetchAll(PDO::FETCH_COLUMN);

        $stmt2 = $db->prepare("SELECT DISTINCT date(started_at) as session_date FROM revision_sessions WHERE user_id = ?");
        $stmt2->execute([$userId]);
        $d2 = $stmt2->fetchAll(PDO::FETCH_COLUMN);

        $allDates = array_unique(array_filter(array_merge($d1, $d2)));
        if (empty($allDates)) {
            return [0, 0];
        }

        rsort($allDates);
        $today = date('Y-m-d');
        $yesterday = date('Y-m-d', strtotime('-1 day'));

        $currentStreak = 0;
        if ($allDates[0] === $today || $allDates[0] === $yesterday) {
            $checkDate = $allDates[0];
            foreach ($allDates as $d) {
                if ($d === $checkDate) {
                    $currentStreak++;
                    $checkDate = date('Y-m-d', strtotime($checkDate . ' -1 day'));
                } elseif ($d < $checkDate) {
                    break;
                }
            }
        }

        // Longest streak
        sort($allDates);
        $longestStreak = 0;
        $temp = 0;
        $prev = null;
        foreach ($allDates as $d) {
            if ($prev === null || $d === date('Y-m-d', strtotime($prev . ' +1 day'))) {
                $temp++;
            } else {
                $temp = 1;
            }
            if ($temp > $longestStreak) $longestStreak = $temp;
            $prev = $d;
        }

        return [$currentStreak, $longestStreak];
    }

    public static function getDashboardSummary(int $userId): array {
        $db = Database::getConnection();
        $plan = MemorizationService::getActivePlanDetails($userId);
        [$currentStreak, $longestStreak] = self::calculateStreaks($userId);

        $memStmt = $db->prepare("SELECT COUNT(*) FROM memorization_progress WHERE user_id = ? AND strength_score >= 70.0");
        $memStmt->execute([$userId]);
        $memorizedCount = (int)$memStmt->fetchColumn();

        $overallPct = round(($memorizedCount / self::TOTAL_QURAN_AYAHS) * 100, 2);

        $dueRevisions = SRSService::getTodayRevisions($userId, 100);
        $dueCount = count($dueRevisions);

        $weakAyahs = SRSService::getWeakAyahs($userId, 60.0, 50);
        $weakCount = count($weakAyahs);

        $currentSurah = 'Al-Fatihah';
        $currentJuz = 1;
        if ($plan) {
            $s = QuranService::getSurahById((int)$plan['start_surah']);
            if ($s) {
                $currentSurah = $s['name_english'];
                $currentJuz = $s['juz_start'] ?: 1;
            }
        }

        // Weekly memorized
        $weekAgo = date('Y-m-d H:i:s', strtotime('-7 days'));
        $weekStmt = $db->prepare("SELECT COUNT(*) FROM memorization_progress WHERE user_id = ? AND created_at >= ? AND strength_score >= 70.0");
        $weekStmt->execute([$userId, $weekAgo]);
        $weeklyMemorized = (int)$weekStmt->fetchColumn();

        return [
            'active_plan' => $plan,
            'current_surah' => $currentSurah,
            'current_juz' => $currentJuz,
            'memorized_ayahs' => $memorizedCount,
            'total_quran_ayahs' => self::TOTAL_QURAN_AYAHS,
            'overall_percentage' => $overallPct,
            'today_revision_target' => $dueCount,
            'current_streak' => $currentStreak,
            'longest_streak' => $longestStreak,
            'weekly_memorized' => $weeklyMemorized,
            'weak_verses_count' => $weakCount
        ];
    }

    public static function getDetailedStatistics(int $userId): array {
        $db = Database::getConnection();

        $mStmt = $db->prepare("SELECT COUNT(*) FROM memorization_progress WHERE user_id = ? AND strength_score >= 70.0");
        $mStmt->execute([$userId]);
        $memorized = (int)$mStmt->fetchColumn();

        $lStmt = $db->prepare("SELECT COUNT(*) FROM memorization_progress WHERE user_id = ? AND strength_score < 70.0");
        $lStmt->execute([$userId]);
        $learning = (int)$lStmt->fetchColumn();

        // Accuracy
        $totRevStmt = $db->prepare("SELECT COUNT(*) FROM revision_results WHERE user_id = ?");
        $totRevStmt->execute([$userId]);
        $totalRev = (int)$totRevStmt->fetchColumn();

        $corRevStmt = $db->prepare("SELECT COUNT(*) FROM revision_results WHERE user_id = ? AND grade = 'correct'");
        $corRevStmt->execute([$userId]);
        $corRev = (int)$corRevStmt->fetchColumn();

        $accuracy = $totalRev > 0 ? round(($corRev / $totalRev) * 100, 1) : 100.0;

        [$currentStreak, $longestStreak] = self::calculateStreaks($userId);

        $pSessStmt = $db->prepare("SELECT COUNT(*) FROM practice_sessions WHERE user_id = ?");
        $pSessStmt->execute([$userId]);
        $totalPracticeSessions = (int)$pSessStmt->fetchColumn();

        $rSessStmt = $db->prepare("SELECT COUNT(*) FROM revision_sessions WHERE user_id = ?");
        $rSessStmt->execute([$userId]);
        $totalRevisionSessions = (int)$rSessStmt->fetchColumn();

        // Weekly chart
        $dayOfWeek = date('w'); // 0 (Sun) to 6 (Sat)
        $startOfWeek = date('Y-m-d', strtotime('-' . (($dayOfWeek + 6) % 7) . ' days'));
        $dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        $weeklyChart = [];

        for ($i = 0; $i < 7; $i++) {
            $d = date('Y-m-d', strtotime("{$startOfWeek} +{$i} days"));

            $cntStmt = $db->prepare("SELECT COUNT(*) FROM practice_sessions WHERE user_id = ? AND date(started_at) = ?");
            $cntStmt->execute([$userId, $d]);
            $pCnt = (int)$cntStmt->fetchColumn();

            $rCntStmt = $db->prepare("SELECT COUNT(*) FROM revision_results WHERE user_id = ? AND date(reviewed_at) = ?");
            $rCntStmt->execute([$userId, $d]);
            $rCnt = (int)$rCntStmt->fetchColumn();

            $weeklyChart[] = [
                'day' => $dayNames[$i],
                'date' => $d,
                'memorized' => $pCnt,
                'revisions' => $rCnt
            ];
        }

        return [
            'total_memorized_ayahs' => $memorized,
            'learning_ayahs' => $learning,
            'completed_surahs' => (int)floor($memorized / 20),
            'total_surahs' => 114,
            'completed_juz' => (int)floor($memorized / (self::TOTAL_QURAN_AYAHS / 30)),
            'total_juz' => 30,
            'overall_percentage' => round(($memorized / self::TOTAL_QURAN_AYAHS) * 100, 2),
            'revision_accuracy' => $accuracy,
            'current_streak' => $currentStreak,
            'longest_streak' => $longestStreak,
            'total_practice_sessions' => $totalPracticeSessions,
            'total_revision_sessions' => $totalRevisionSessions,
            'weekly_chart' => $weeklyChart
        ];
    }

    public static function getActivityCalendar(int $userId, int $days = 35): array {
        $db = Database::getConnection();
        $startDate = date('Y-m-d', strtotime("-{$days} days"));

        $pStmt = $db->prepare("
            SELECT date(started_at) as d, COUNT(*) as cnt 
            FROM practice_sessions 
            WHERE user_id = ? AND started_at >= ? 
            GROUP BY date(started_at)
        ");
        $pStmt->execute([$userId, $startDate]);
        $practiceDays = $pStmt->fetchAll(PDO::FETCH_KEY_PAIR);

        $rStmt = $db->prepare("
            SELECT date(reviewed_at) as d, COUNT(*) as cnt 
            FROM revision_results 
            WHERE user_id = ? AND reviewed_at >= ? 
            GROUP BY date(reviewed_at)
        ");
        $rStmt->execute([$userId, $startDate]);
        $revisionDays = $rStmt->fetchAll(PDO::FETCH_KEY_PAIR);

        $calendar = [];
        for ($i = 0; $i < $days; $i++) {
            $d = date('Y-m-d', strtotime("{$startDate} +{$i} days"));
            $pCnt = (int)($practiceDays[$d] ?? 0);
            $rCnt = (int)($revisionDays[$d] ?? 0);
            $tot = $pCnt + $rCnt;

            $calendar[] = [
                'date' => $d,
                'day' => date('D', strtotime($d)),
                'memorization_count' => $pCnt,
                'revision_count' => $rCnt,
                'active' => $tot > 0,
                'intensity' => min(4, intdiv($tot, 3) + ($tot > 0 ? 1 : 0))
            ];
        }

        return $calendar;
    }

    public static function getPlatformOverview(int $userId): array {
        $db = Database::getConnection();
        $quranDash = self::getDashboardSummary($userId);
        $tajProg = TajweedService::getUserProgress($userId);
        $tawProg = TawhidService::getUserProgress($userId);
        
        // Prayer Times & Worship
        $prayerSettings = PrayerTimeService::getUserSettings($userId);
        $todayTimes = PrayerTimeService::calculate(
            (float)($prayerSettings['latitude'] ?? 9.0765),
            (float)($prayerSettings['longitude'] ?? 7.3986),
            date('Y-m-d'),
            1.0,
            $prayerSettings['calculation_method'] ?? 'MWL',
            $prayerSettings['asr_juristic'] ?? 'Standard'
        );
        $prayerStatus = PrayerTimeService::getCurrentAndNext($todayTimes);

        // Adhkar today status
        $adhkarStmt = $db->prepare("
            SELECT COUNT(DISTINCT dhikr_id) 
            FROM user_adhkar_progress 
            WHERE user_id = :uid AND DATE(last_read_at) = DATE('now')
        ");
        $adhkarStmt->execute(['uid' => $userId]);
        $adhkarCompletedCount = (int)$adhkarStmt->fetchColumn();

        // Hijri date today
        $hijriToday = HijriService::getToday();

        return [
            'quran' => [
                'memorized_count' => $quranDash['memorized_ayahs'],
                'completion_percentage' => $quranDash['overall_percentage'],
                'current_streak' => $quranDash['current_streak'],
                'due_reviews_count' => $quranDash['today_revision_target'],
                'daily_goal' => 5,
            ],
            'learning' => [
                'tajweed' => $tajProg,
                'tawhid' => $tawProg,
            ],
            'worship' => [
                'prayer_settings' => $prayerSettings,
                'prayer_times' => $todayTimes,
                'current_prayer' => $prayerStatus['current_prayer'],
                'next_prayer' => $prayerStatus['next_prayer'],
                'countdown_formatted' => $prayerStatus['countdown_formatted'],
                'adhkar_read_today' => $adhkarCompletedCount,
                'hijri' => $hijriToday
            ],
            'tajweed' => $tajProg,
            'tawhid' => $tawProg,
            'next_prayer' => $prayerStatus['next_prayer'],
            'hijri' => $hijriToday
        ];
    }
}
