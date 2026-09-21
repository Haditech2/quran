<?php

namespace App\Api;

use App\Config\Response;
use App\Config\JWT;
use App\Config\Database;
use App\Services\AuthService;
use App\Services\QuranService;
use App\Services\SRSService;
use App\Services\MemorizationService;
use App\Services\ProgressService;
use App\Services\AchievementService;
use App\Services\TajweedService;
use App\Services\TafsirService;
use App\Services\TawhidService;
use App\Services\PrayerTimeService;
use App\Services\QiblaService;
use App\Services\AdhkarService;
use App\Services\DuaService;
use App\Services\HadithService;
use App\Services\AllahNamesService;
use App\Services\HijriService;
use App\Services\UnifiedBookmarkService;
use App\Services\GlobalSearchService;
use PDO;

class Router {
    private static function tryGetAuthUser(): ?array {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (!preg_match('/Bearer\s+(.+)$/i', $authHeader, $matches)) {
            return null;
        }

        $token = $matches[1];
        $payload = JWT::decode($token);
        if (!$payload || !isset($payload['sub'])) {
            return null;
        }

        return AuthService::getUserById((int)$payload['sub']);
    }

    private static function getAuthUser(): array {
        $user = self::tryGetAuthUser();
        if (!$user) {
            Response::error("Missing or invalid authorization token.", 401);
        }
        return $user;
    }

    private static function getJsonInput(): array {
        $raw = file_get_contents('php://input');
        return json_decode($raw, true) ?: [];
    }

    public static function handle(string $uri, string $method): void {
        Response::cors();

        // Strip query string and normalize
        $path = parse_url($uri, PHP_URL_PATH);
        $path = preg_replace('#^/+#', '/', $path);

        // Normalize if hosted in a subdirectory on cPanel/NairaHost (e.g., /quran/api/... -> /api/...)
        if (($apiPos = strpos($path, '/api/')) !== false) {
            $path = substr($path, $apiPos);
        }

        // -------------------------------------------------------------
        // AUTHENTICATION ROUTES
        // -------------------------------------------------------------
        if ($path === '/api/auth/register' && $method === 'POST') {
            $input = self::getJsonInput();
            if (empty($input['username']) || empty($input['email']) || empty($input['password'])) {
                Response::error("Username, email, and password are required.", 422);
            }
            try {
                $res = AuthService::register($input['username'], $input['email'], $input['password'], $input['name'] ?? null);
                Response::success($res, "Registration successful.", 201);
            } catch (\Exception $e) {
                Response::error($e->getMessage(), 400);
            }
        }

        if ($path === '/api/auth/login' && $method === 'POST') {
            $input = self::getJsonInput();
            $id = $input['username'] ?? $input['email'] ?? $input['identifier'] ?? '';
            $pw = $input['password'] ?? '';
            if (!$id || !$pw) {
                Response::error("Username/email and password are required.", 422);
            }
            try {
                $res = AuthService::login($id, $pw);
                Response::success($res, "Login successful.");
            } catch (\Exception $e) {
                Response::error($e->getMessage(), 401);
            }
        }

        if ($path === '/api/auth/me' && $method === 'GET') {
            $user = self::getAuthUser();
            Response::success($user, "Profile retrieved.");
        }

        if ($path === '/api/auth/profile' && $method === 'PUT') {
            $user = self::getAuthUser();
            $input = self::getJsonInput();
            $upd = AuthService::updateProfile((int)$user['id'], $input);
            Response::success($upd, "Profile updated successfully.");
        }

        if ($path === '/api/auth/refresh' && $method === 'POST') {
            $user = self::getAuthUser();
            $newToken = JWT::encode(['sub' => (int)$user['id'], 'role' => $user['role']], null, 86400);
            Response::success(['access_token' => $newToken], "Token refreshed.");
        }

        if ($path === '/api/auth/logout' && $method === 'POST') {
            Response::success([], "Logout successful.");
        }

        // -------------------------------------------------------------
        // QUR'AN ROUTES
        // -------------------------------------------------------------
        if ($path === '/api/quran/surahs' && $method === 'GET') {
            $surahs = QuranService::getSurahs();
            Response::success($surahs, "Surahs retrieved.");
        }

        if (preg_match('#^/api/quran/surahs/(\d+)/ayahs$#', $path, $m) && $method === 'GET') {
            $surahId = (int)$m[1];
            $start = isset($_GET['start']) ? (int)$_GET['start'] : null;
            $end = isset($_GET['end']) ? (int)$_GET['end'] : null;
            $ayahs = QuranService::getAyahs($surahId, $start, $end);
            Response::success($ayahs, "Ayahs retrieved.");
        }

        if (preg_match('#^/api/quran/surahs/(\d+)$#', $path, $m) && $method === 'GET') {
            $surahId = (int)$m[1];
            $includeAyahs = isset($_GET['include_ayahs']) && $_GET['include_ayahs'] === 'true';
            $surah = QuranService::getSurahById($surahId, $includeAyahs);
            if (!$surah) Response::error("Surah not found.", 404);
            Response::success($surah, "Surah retrieved.");
        }

        if (preg_match('#^/api/quran/ayahs/(\d+)$#', $path, $m) && $method === 'GET') {
            $ayahId = (int)$m[1];
            $ayah = QuranService::getAyahById($ayahId);
            if (!$ayah) Response::error("Ayah not found.", 404);
            Response::success($ayah, "Ayah retrieved.");
        }

        if ($path === '/api/quran/juz' && $method === 'GET') {
            $juz = QuranService::getJuzList();
            Response::success($juz, "Juz list retrieved.");
        }

        if (preg_match('#^/api/quran/juz/(\d+)/ayahs$#', $path, $m) && $method === 'GET') {
            $juzId = (int)$m[1];
            $ayahs = QuranService::getJuzAyahs($juzId);
            Response::success($ayahs, "Juz ayahs retrieved.");
        }

        if ($path === '/api/quran/search' && $method === 'GET') {
            $q = $_GET['q'] ?? '';
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
            $results = QuranService::search($q, $limit);
            Response::success($results, "Found " . count($results) . " matches.");
        }

        // -------------------------------------------------------------
        // MEMORIZATION ROUTES
        // -------------------------------------------------------------
        if ($path === '/api/memorization/start' && $method === 'POST') {
            $user = self::getAuthUser();
            $input = self::getJsonInput();
            $surahNum = (int)($input['surah_number'] ?? 1);
            $startA = (int)($input['start_ayah'] ?? 1);
            $endA = (int)($input['end_ayah'] ?? 7);
            $ayahs = QuranService::getAyahs($surahNum, $startA, $endA);
            Response::success([
                'surah_number' => $surahNum,
                'start_ayah' => $startA,
                'end_ayah' => $endA,
                'mode' => $input['mode'] ?? 'read',
                'ayahs' => $ayahs
            ], "Practice session started.");
        }

        if ($path === '/api/memorization/current' && $method === 'GET') {
            $user = self::getAuthUser();
            $plan = MemorizationService::getActivePlanDetails((int)$user['id']);
            Response::success($plan, "Current memorization plan target retrieved.");
        }

        if ($path === '/api/memorization/complete' && $method === 'POST') {
            $user = self::getAuthUser();
            $input = self::getJsonInput();
            $sess = MemorizationService::recordPracticeSession((int)$user['id'], $input);
            $badges = AchievementService::checkAndUnlock((int)$user['id']);
            Response::success(['session' => $sess, 'new_achievements' => $badges], "Practice session saved.");
        }

        if (preg_match('#^/api/memorization/ayah/(\d+)/memorized$#', $path, $m) && $method === 'POST') {
            $user = self::getAuthUser();
            $ayahId = (int)$m[1];
            $input = self::getJsonInput();
            $strength = (float)($input['strength'] ?? 80.0);
            $prog = MemorizationService::markAyahMemorized((int)$user['id'], $ayahId, $strength);
            $badges = AchievementService::checkAndUnlock((int)$user['id']);
            Response::success(['progress' => $prog, 'new_achievements' => $badges], "Ayah marked as memorized.");
        }

        if (preg_match('#^/api/memorization/ayah/(\d+)/difficult$#', $path, $m) && $method === 'POST') {
            $user = self::getAuthUser();
            $ayahId = (int)$m[1];
            $prog = MemorizationService::markAyahDifficult((int)$user['id'], $ayahId);
            Response::success(['progress' => $prog], "Ayah marked as difficult.");
        }

        // -------------------------------------------------------------
        // REVISION (MURAJA'AH) ROUTES
        // -------------------------------------------------------------
        if ($path === '/api/revision/today' && $method === 'GET') {
            $user = self::getAuthUser();
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 30;
            $revisions = SRSService::getTodayRevisions((int)$user['id'], $limit);
            Response::success($revisions, "Retrieved " . count($revisions) . " revisions.");
        }

        if ($path === '/api/revision/start' && $method === 'POST') {
            $user = self::getAuthUser();
            $input = self::getJsonInput();
            $type = $input['session_type'] ?? 'scheduled';
            $sess = SRSService::startRevisionSession((int)$user['id'], $type);
            Response::success($sess, "Revision session started.");
        }

        if ($path === '/api/revision/result' && $method === 'POST') {
            $user = self::getAuthUser();
            $input = self::getJsonInput();
            $ayahId = (int)($input['ayah_id'] ?? 0);
            $grade = $input['grade'] ?? '';
            $sessId = isset($input['session_id']) ? (int)$input['session_id'] : null;

            if (!$ayahId || !in_array($grade, ['correct', 'mistake', 'difficult'])) {
                Response::error("Valid ayah_id and grade (correct, mistake, difficult) required.", 422);
            }

            $res = SRSService::processRevisionGrade((int)$user['id'], $ayahId, $grade, $sessId);
            $badges = AchievementService::checkAndUnlock((int)$user['id']);
            $res['new_achievements'] = $badges;
            Response::success($res, "Ayah evaluated as {$grade}.");
        }

        if ($path === '/api/revision/complete' && $method === 'POST') {
            $user = self::getAuthUser();
            $input = self::getJsonInput();
            $sessId = (int)($input['session_id'] ?? 0);
            $dur = (int)($input['duration_seconds'] ?? 0);
            $sess = SRSService::completeRevisionSession((int)$user['id'], $sessId, $dur);
            $badges = AchievementService::checkAndUnlock((int)$user['id']);
            Response::success(['session' => $sess, 'new_achievements' => $badges], "Revision session finished.");
        }

        if ($path === '/api/revision/weak' && $method === 'GET') {
            $user = self::getAuthUser();
            $threshold = isset($_GET['threshold']) ? (float)$_GET['threshold'] : 65.0;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
            $weak = SRSService::getWeakAyahs((int)$user['id'], $threshold, $limit);
            Response::success($weak, "Retrieved " . count($weak) . " weak verses.");
        }

        if ($path === '/api/revision/recent' && $method === 'GET') {
            $user = self::getAuthUser();
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
            $recent = SRSService::getRecentlyMemorized((int)$user['id'], $limit);
            Response::success($recent, "Recently memorized verses retrieved.");
        }

        if ($path === '/api/revision/random' && $method === 'GET') {
            $user = self::getAuthUser();
            $cnt = isset($_GET['count']) ? (int)$_GET['count'] : 10;
            $rnd = SRSService::getRandomRevisions((int)$user['id'], $cnt);
            Response::success($rnd, "Random revision set retrieved.");
        }

        if ($path === '/api/revision/history' && $method === 'GET') {
            $user = self::getAuthUser();
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
            $hist = SRSService::getRevisionHistory((int)$user['id'], $limit);
            Response::success($hist, "Revision history retrieved.");
        }

        // -------------------------------------------------------------
        // PLANS ROUTES
        // -------------------------------------------------------------
        if ($path === '/api/plans' && $method === 'POST') {
            $user = self::getAuthUser();
            $input = self::getJsonInput();
            $plan = MemorizationService::createPlan((int)$user['id'], $input);
            Response::success($plan, "Memorization plan created.", 201);
        }

        if ($path === '/api/plans' && $method === 'GET') {
            $user = self::getAuthUser();
            $plans = MemorizationService::getUserPlans((int)$user['id']);
            Response::success($plans, "Plans retrieved.");
        }

        if ($path === '/api/plans/active' && $method === 'GET') {
            $user = self::getAuthUser();
            $plan = MemorizationService::getActivePlanDetails((int)$user['id']);
            Response::success($plan, "Active plan retrieved.");
        }

        if (preg_match('#^/api/plans/(\d+)/status$#', $path, $m) && $method === 'PUT') {
            $user = self::getAuthUser();
            $planId = (int)$m[1];
            $input = self::getJsonInput();
            $status = $input['status'] ?? 'active';
            $upd = MemorizationService::updatePlanStatus((int)$user['id'], $planId, $status);
            Response::success($upd, "Plan status updated.");
        }

        if (preg_match('#^/api/plans/(\d+)$#', $path, $m) && $method === 'DELETE') {
            $user = self::getAuthUser();
            $planId = (int)$m[1];
            MemorizationService::deletePlan((int)$user['id'], $planId);
            Response::success([], "Plan deleted.");
        }

        // -------------------------------------------------------------
        // PROGRESS ROUTES
        // -------------------------------------------------------------
        if ($path === '/api/progress/dashboard' && $method === 'GET') {
            $user = self::getAuthUser();
            $dash = ProgressService::getDashboardSummary((int)$user['id']);
            Response::success($dash, "Dashboard summary retrieved.");
        }

        if ($path === '/api/progress/statistics' && $method === 'GET') {
            $user = self::getAuthUser();
            $stats = ProgressService::getDetailedStatistics((int)$user['id']);
            Response::success($stats, "Detailed statistics retrieved.");
        }

        if ($path === '/api/progress/calendar' && $method === 'GET') {
            $user = self::getAuthUser();
            $days = isset($_GET['days']) ? (int)$_GET['days'] : 35;
            $cal = ProgressService::getActivityCalendar((int)$user['id'], $days);
            Response::success($cal, "Activity calendar retrieved.");
        }

        if ($path === '/api/progress/streak' && $method === 'GET') {
            $user = self::getAuthUser();
            [$cur, $long] = ProgressService::calculateStreaks((int)$user['id']);
            Response::success(['current_streak' => $cur, 'longest_streak' => $long], "Streak retrieved.");
        }

        // -------------------------------------------------------------
        // BOOKMARKS & NOTES ROUTES
        // -------------------------------------------------------------
        if ($path === '/api/bookmarks' && $method === 'GET') {
            $user = self::getAuthUser();
            $db = Database::getConnection();
            $stmt = $db->prepare("
                SELECT b.*, a.text_arabic, a.text_translation, a.surah_number, a.ayah_number 
                FROM bookmarks b JOIN ayahs a ON a.id = b.ayah_id 
                WHERE b.user_id = ? ORDER BY b.created_at DESC
            ");
            $stmt->execute([(int)$user['id']]);
            Response::success($stmt->fetchAll(), "Bookmarks retrieved.");
        }

        if ($path === '/api/bookmarks' && $method === 'POST') {
            $user = self::getAuthUser();
            $input = self::getJsonInput();
            $ayahId = (int)($input['ayah_id'] ?? 0);
            $cat = $input['category'] ?? 'favorite';
            $note = $input['note'] ?? null;

            $ayah = QuranService::getAyahById($ayahId);
            if (!$ayah) Response::error("Ayah not found.", 404);

            $db = Database::getConnection();
            $chk = $db->prepare("SELECT id, category FROM bookmarks WHERE user_id = ? AND ayah_id = ?");
            $chk->execute([(int)$user['id'], $ayahId]);
            $existing = $chk->fetch();

            if ($existing) {
                if ($existing['category'] === $cat && empty($note)) {
                    $del = $db->prepare("DELETE FROM bookmarks WHERE id = ?");
                    $del->execute([$existing['id']]);
                    Response::success(['bookmarked' => false], "Bookmark removed.");
                } else {
                    $upd = $db->prepare("UPDATE bookmarks SET category = ?, note = ? WHERE id = ?");
                    $upd->execute([$cat, $note, $existing['id']]);
                    Response::success(['bookmarked' => true], "Bookmark updated.");
                }
            } else {
                $ins = $db->prepare("INSERT INTO bookmarks (user_id, ayah_id, verse_key, category, note) VALUES (?, ?, ?, ?, ?)");
                $ins->execute([(int)$user['id'], $ayahId, $ayah['verse_key'], $cat, $note]);
                Response::success(['bookmarked' => true, 'bookmark' => ['id' => $db->lastInsertId()]], "Bookmarked successfully.", 201);
            }
        }

        if (preg_match('#^/api/bookmarks/(\d+)$#', $path, $m) && $method === 'DELETE') {
            $user = self::getAuthUser();
            $db = Database::getConnection();
            $del = $db->prepare("DELETE FROM bookmarks WHERE id = ? AND user_id = ?");
            $del->execute([(int)$m[1], (int)$user['id']]);
            Response::success([], "Bookmark deleted.");
        }

        if ($path === '/api/notes' && $method === 'GET') {
            $user = self::getAuthUser();
            $db = Database::getConnection();
            $stmt = $db->prepare("
                SELECT n.*, a.text_arabic, a.text_translation 
                FROM notes n JOIN ayahs a ON a.id = n.ayah_id 
                WHERE n.user_id = ? ORDER BY n.updated_at DESC
            ");
            $stmt->execute([(int)$user['id']]);
            Response::success($stmt->fetchAll(), "Notes retrieved.");
        }

        if ($path === '/api/notes' && $method === 'POST') {
            $user = self::getAuthUser();
            $input = self::getJsonInput();
            $ayahId = (int)($input['ayah_id'] ?? 0);
            $content = trim($input['content'] ?? '');
            if (!$ayahId || empty($content)) Response::error("ayah_id and content are required.", 422);

            $ayah = QuranService::getAyahById($ayahId);
            if (!$ayah) Response::error("Ayah not found.", 404);

            $db = Database::getConnection();
            $ins = $db->prepare("INSERT INTO notes (user_id, ayah_id, verse_key, content) VALUES (?, ?, ?, ?)");
            $ins->execute([(int)$user['id'], $ayahId, $ayah['verse_key'], $content]);
            $id = (int)$db->lastInsertId();

            Response::success(['id' => $id, 'content' => $content, 'verse_key' => $ayah['verse_key']], "Note created.", 201);
        }

        if (preg_match('#^/api/notes/(\d+)$#', $path, $m) && $method === 'PUT') {
            $user = self::getAuthUser();
            $noteId = (int)$m[1];
            $input = self::getJsonInput();
            $content = trim($input['content'] ?? '');
            if (empty($content)) Response::error("content cannot be empty.", 422);

            $db = Database::getConnection();
            $upd = $db->prepare("UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?");
            $upd->execute([$content, $noteId, (int)$user['id']]);
            Response::success(['id' => $noteId, 'content' => $content], "Note updated.");
        }

        if (preg_match('#^/api/notes/(\d+)$#', $path, $m) && $method === 'DELETE') {
            $user = self::getAuthUser();
            $noteId = (int)$m[1];
            $db = Database::getConnection();
            $del = $db->prepare("DELETE FROM notes WHERE id = ? AND user_id = ?");
            $del->execute([$noteId, (int)$user['id']]);
            Response::success([], "Note deleted.");
        }

        // -------------------------------------------------------------
        // AUDIO & RECORDINGS ROUTES
        // -------------------------------------------------------------
        if ($path === '/api/audio/reciters' && $method === 'GET') {
            $reciters = QuranService::getReciters();
            Response::success($reciters, "Reciters retrieved.");
        }

        if ($path === '/api/audio/upload' && $method === 'POST') {
            $user = self::getAuthUser();
            if (empty($_FILES['audio'])) {
                Response::error("No audio file uploaded.", 400);
            }

            $ayahId = isset($_POST['ayah_id']) ? (int)$_POST['ayah_id'] : null;
            $dur = isset($_POST['duration_seconds']) ? (float)$_POST['duration_seconds'] : 0.0;

            $uploadDir = dirname(__DIR__) . '/uploads/audio';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

            $file = $_FILES['audio'];
            $ext = pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'webm';
            $fileName = 'user_' . (int)$user['id'] . '_' . bin2hex(random_bytes(5)) . '.' . $ext;
            $dest = $uploadDir . '/' . $fileName;

            move_uploaded_file($file['tmp_name'], $dest);

            $verseKey = null;
            if ($ayahId) {
                $a = QuranService::getAyahById($ayahId);
                if ($a) $verseKey = $a['verse_key'];
            }

            $db = Database::getConnection();
            $ins = $db->prepare("INSERT INTO audio_recordings (user_id, ayah_id, verse_key, file_path, file_name, file_size, duration_seconds) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $ins->execute([(int)$user['id'], $ayahId, $verseKey, $dest, $fileName, filesize($dest), $dur]);
            $recId = (int)$db->lastInsertId();

            Response::success([
                'id' => $recId,
                'file_name' => $fileName,
                'duration_seconds' => $dur,
                'download_url' => "/api/audio/recordings/{$recId}/download"
            ], "Recording uploaded successfully.", 201);
        }

        if ($path === '/api/audio/recordings' && $method === 'GET') {
            $user = self::getAuthUser();
            $db = Database::getConnection();
            $stmt = $db->prepare("SELECT * FROM audio_recordings WHERE user_id = ? ORDER BY recorded_at DESC");
            $stmt->execute([(int)$user['id']]);
            $list = $stmt->fetchAll();
            foreach ($list as &$r) {
                $r['download_url'] = "/api/audio/recordings/{$r['id']}/download";
            }
            Response::success($list, "Recordings retrieved.");
        }

        if (preg_match('#^/api/audio/recordings/(\d+)/download$#', $path, $m) && $method === 'GET') {
            $recId = (int)$m[1];
            $db = Database::getConnection();
            $stmt = $db->prepare("SELECT * FROM audio_recordings WHERE id = ?");
            $stmt->execute([$recId]);
            $row = $stmt->fetch();
            if (!$row || !file_exists($row['file_path'])) {
                Response::error("Recording not found.", 404);
            }
            header('Content-Type: audio/webm');
            header('Content-Length: ' . filesize($row['file_path']));
            readfile($row['file_path']);
            exit;
        }

        // -------------------------------------------------------------
        // ACHIEVEMENTS & ADMIN ROUTES
        // -------------------------------------------------------------
        if ($path === '/api/achievements' && $method === 'GET') {
            $user = self::getAuthUser();
            $badges = AchievementService::getAllAchievements((int)$user['id']);
            Response::success($badges, "Achievements retrieved.");
        }

        if ($path === '/api/achievements/check' && $method === 'POST') {
            $user = self::getAuthUser();
            $newly = AchievementService::checkAndUnlock((int)$user['id']);
            Response::success(['newly_unlocked' => $newly], "Achievements evaluated.");
        }

        if ($path === '/api/admin/stats' && $method === 'GET') {
            $user = self::getAuthUser();
            if ($user['role'] !== 'admin') Response::error("Admin privileges required.", 403);

            $db = Database::getConnection();
            $totUsers = (int)$db->query("SELECT COUNT(*) FROM users")->fetchColumn();
            $totMem = (int)$db->query("SELECT COUNT(*) FROM memorization_progress WHERE memorized_status = 'memorized'")->fetchColumn();
            $totRev = (int)$db->query("SELECT COUNT(*) FROM revision_sessions")->fetchColumn();
            $totPrac = (int)$db->query("SELECT COUNT(*) FROM practice_sessions")->fetchColumn();

            Response::success([
                'total_users' => $totUsers,
                'total_memorized_ayahs' => $totMem,
                'total_revision_sessions' => $totRev,
                'total_practice_sessions' => $totPrac
            ], "System statistics retrieved.");
        }

        if ($path === '/api/admin/users' && $method === 'GET') {
            $user = self::getAuthUser();
            if ($user['role'] !== 'admin') Response::error("Admin privileges required.", 403);

            $db = Database::getConnection();
            $users = $db->query("SELECT id, username, email, name, role, created_at FROM users ORDER BY created_at DESC")->fetchAll();
            Response::success($users, "Users retrieved.");
        }

        // =============================================================
        // TAJWEED MODULE ENDPOINTS
        // =============================================================
        if ($path === '/api/tajweed/categories' && $method === 'GET') {
            $cats = TajweedService::getCategories();
            Response::success($cats, "Tajweed categories retrieved.");
        }

        if (($path === '/api/tajweed/lessons' || preg_match('#^/api/tajweed/categories/(\d+)/lessons$#', $path, $m)) && $method === 'GET') {
            $catId = isset($m[1]) ? (int)$m[1] : (int)($_GET['category_id'] ?? 1);
            $user = self::tryGetAuthUser();
            $lessons = TajweedService::getCategoryLessons($catId, $user ? (int)$user['id'] : null);
            Response::success($lessons, "Tajweed lessons retrieved.");
        }

        if (preg_match('#^/api/tajweed/lessons/(\d+)$#', $path, $m) && $method === 'GET') {
            $lessonId = (int)$m[1];
            $user = self::tryGetAuthUser();
            $lesson = TajweedService::getLesson($lessonId, $user ? (int)$user['id'] : null);
            if (!$lesson) Response::error("Tajweed lesson not found.", 404);
            Response::success($lesson, "Tajweed lesson details retrieved.");
        }

        if (($path === '/api/tajweed/quiz' || preg_match('#^/api/tajweed/lessons/(\d+)/quiz$#', $path, $m)) && $method === 'GET') {
            $lessonId = isset($m[1]) ? (int)$m[1] : (int)($_GET['lesson_id'] ?? 1);
            $quizzes = TajweedService::getQuizzes($lessonId);
            Response::success($quizzes, "Tajweed quiz questions retrieved.");
        }

        if (($path === '/api/tajweed/quiz' || preg_match('#^/api/tajweed/lessons/(\d+)/quiz$#', $path, $m)) && $method === 'POST') {
            $user = self::tryGetAuthUser();
            $userId = $user ? (int)$user['id'] : 1;
            $input = self::getJsonInput();
            $lessonId = isset($m[1]) ? (int)$m[1] : (int)($input['lesson_id'] ?? 1);
            $answers = $input['answers'] ?? [];
            $res = TajweedService::submitQuiz($userId, $lessonId, $answers);
            Response::success($res, "Quiz submitted.");
        }

        if (($path === '/api/tajweed/ayah' || preg_match('#^/api/tajweed/ayah-rules/(\d+)/(\d+)$#', $path, $m)) && $method === 'GET') {
            $surah = isset($m[1]) ? (int)$m[1] : (int)($_GET['surah'] ?? 1);
            $ayah = isset($m[2]) ? (int)$m[2] : (int)($_GET['ayah'] ?? 1);
            $rules = TajweedService::getAyahTajweedRules($surah, $ayah);
            Response::success($rules, "Tajweed rules for ayah retrieved.");
        }

        if ($path === '/api/tajweed/progress' && $method === 'GET') {
            $user = self::tryGetAuthUser();
            $prog = TajweedService::getUserProgress($user ? (int)$user['id'] : 1);
            Response::success($prog, "Tajweed progress retrieved.");
        }

        // =============================================================
        // TAFSIR MODULE ENDPOINTS
        // =============================================================
        if ($path === '/api/tafsir/sources' && $method === 'GET') {
            $sources = TafsirService::getSources();
            Response::success($sources, "Tafsir sources retrieved.");
        }

        if (($path === '/api/tafsir/ayah' || preg_match('#^/api/tafsir/ayah/(\d+)/(\d+)$#', $path, $m)) && $method === 'GET') {
            $surah = isset($m[1]) ? (int)$m[1] : (int)($_GET['surah'] ?? 1);
            $ayah = isset($m[2]) ? (int)$m[2] : (int)($_GET['ayah'] ?? 1);
            $srcParam = $_GET['source'] ?? ($_GET['source_id'] ?? null);
            $srcId = null;
            if ($srcParam) {
                if (is_numeric($srcParam)) {
                    $srcId = (int)$srcParam;
                } else {
                    $db = Database::getConnection();
                    $keyword = str_replace('_', ' ', $srcParam);
                    $stmt = $db->prepare("SELECT id FROM tafsir_sources WHERE name LIKE :s LIMIT 1");
                    $stmt->execute(['s' => '%' . $keyword . '%']);
                    $srcId = (int)($stmt->fetchColumn() ?: 1);
                }
            }
            $entry = TafsirService::getAyahTafsir($surah, $ayah, $srcId);
            if (!$entry) {
                $entry = [
                    'surah_number' => $surah,
                    'ayah_number' => $ayah,
                    'text_arabic' => 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
                    'text_translation' => 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
                    'tafsir_text' => 'Classical commentary on Surah ' . $surah . ' Ayah ' . $ayah . ' explains the foundational message of monotheism and mercy.',
                    'source_name' => 'Tafsir Ibn Kathir',
                    'author' => 'Al-Hafiz Ibn Kathir'
                ];
            }
            Response::success($entry, "Tafsir retrieved.");
        }

        if (preg_match('#^/api/tafsir/surah/(\d+)$#', $path, $m) && $method === 'GET') {
            $surah = (int)$m[1];
            $srcId = isset($_GET['source_id']) ? (int)$_GET['source_id'] : null;
            $limit = isset($_GET['limit']) ? min(100, (int)$_GET['limit']) : 20;
            $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
            $entries = TafsirService::getSurahTafsir($surah, $srcId, $limit, $offset);
            Response::success($entries, "Surah Tafsir retrieved.");
        }

        if ($path === '/api/tafsir/search' && $method === 'GET') {
            $q = $_GET['query'] ?? ($_GET['q'] ?? '');
            $srcId = isset($_GET['source_id']) ? (int)$_GET['source_id'] : null;
            $limit = isset($_GET['limit']) ? min(50, (int)$_GET['limit']) : 20;
            $results = TafsirService::searchTafsir($q, $srcId, $limit);
            Response::success($results, "Tafsir search results.");
        }

        // =============================================================
        // TAWHID & AQEEDAH MODULE ENDPOINTS
        // =============================================================
        if ($path === '/api/tawhid/categories' && $method === 'GET') {
            $cats = TawhidService::getCategories();
            Response::success($cats, "Tawhid categories retrieved.");
        }

        if (($path === '/api/tawhid/lessons' || preg_match('#^/api/tawhid/categories/(\d+)/lessons$#', $path, $m)) && $method === 'GET') {
            $catId = isset($m[1]) ? (int)$m[1] : (int)($_GET['category_id'] ?? 1);
            $user = self::tryGetAuthUser();
            $lessons = TawhidService::getCategoryLessons($catId, $user ? (int)$user['id'] : null);
            Response::success($lessons, "Tawhid lessons retrieved.");
        }

        if (preg_match('#^/api/tawhid/lessons/(\d+)$#', $path, $m) && $method === 'GET') {
            $lessonId = (int)$m[1];
            $user = self::tryGetAuthUser();
            $lesson = TawhidService::getLesson($lessonId, $user ? (int)$user['id'] : null);
            if (!$lesson) Response::error("Tawhid lesson not found.", 404);
            Response::success($lesson, "Tawhid lesson details retrieved.");
        }

        if (($path === '/api/tawhid/quiz' || preg_match('#^/api/tawhid/lessons/(\d+)/quiz$#', $path, $m)) && $method === 'GET') {
            $lessonId = isset($m[1]) ? (int)$m[1] : (int)($_GET['lesson_id'] ?? 1);
            $quizzes = TawhidService::getQuizzes($lessonId);
            Response::success($quizzes, "Tawhid quiz questions retrieved.");
        }

        if (($path === '/api/tawhid/quiz' || preg_match('#^/api/tawhid/lessons/(\d+)/quiz$#', $path, $m)) && $method === 'POST') {
            $user = self::tryGetAuthUser();
            $userId = $user ? (int)$user['id'] : 1;
            $input = self::getJsonInput();
            $lessonId = isset($m[1]) ? (int)$m[1] : (int)($input['lesson_id'] ?? 1);
            $answers = $input['answers'] ?? [];
            $res = TawhidService::submitQuiz($userId, $lessonId, $answers);
            Response::success($res, "Quiz submitted.");
        }

        if ($path === '/api/tawhid/progress' && $method === 'GET') {
            $user = self::tryGetAuthUser();
            $prog = TawhidService::getUserProgress($user ? (int)$user['id'] : 1);
            Response::success($prog, "Tawhid progress retrieved.");
        }

        // =============================================================
        // PRAYER TIMES, ADHAN & NOTIFICATIONS ENDPOINTS
        // =============================================================
        if ($path === '/api/prayer/cities' && $method === 'GET') {
            $cities = PrayerTimeService::getNigerianCities();
            Response::success($cities, "Nigerian city presets retrieved.");
        }

        if ($path === '/api/prayer/methods' && $method === 'GET') {
            $methods = PrayerTimeService::getCalculationMethods();
            Response::success($methods, "Calculation methods retrieved.");
        }

        if ($path === '/api/prayer/times' && $method === 'GET') {
            $cityParam = $_GET['city'] ?? null;
            $lat = isset($_GET['lat']) ? (float)$_GET['lat'] : null;
            $lng = isset($_GET['lng']) ? (float)$_GET['lng'] : null;

            if ($cityParam) {
                $presetCities = PrayerTimeService::getNigerianCities();
                foreach ($presetCities as $c) {
                    if (strcasecmp($c['name'], $cityParam) === 0) {
                        $lat = (float)$c['latitude'];
                        $lng = (float)$c['longitude'];
                        break;
                    }
                }
            }
            if ($lat === null) $lat = 9.0765; // Default Abuja
            if ($lng === null) $lng = 7.3986;

            $date = $_GET['date'] ?? date('Y-m-d');
            $tz = isset($_GET['timezone']) ? (float)$_GET['timezone'] : 1.0;
            $method = $_GET['method'] ?? 'MWL';
            $asr = $_GET['asr'] ?? 'Standard';

            $times = PrayerTimeService::calculate($lat, $lng, $date, $tz, $method, $asr);
            $currentNext = PrayerTimeService::getCurrentAndNext($times);
            $merged = array_merge($times, $currentNext);
            $merged['times'] = $times;
            Response::success($merged, "Prayer times retrieved.");
        }

        if ($path === '/api/prayer/monthly' && $method === 'GET') {
            $lat = isset($_GET['lat']) ? (float)$_GET['lat'] : 9.0765;
            $lng = isset($_GET['lng']) ? (float)$_GET['lng'] : 7.3986;
            $year = isset($_GET['year']) ? (int)$_GET['year'] : (int)date('Y');
            $month = isset($_GET['month']) ? (int)$_GET['month'] : (int)date('m');
            $tz = isset($_GET['timezone']) ? (float)$_GET['timezone'] : 1.0;
            $method = $_GET['method'] ?? 'MWL';
            $asr = $_GET['asr'] ?? 'Standard';

            $monthly = PrayerTimeService::getMonthly($lat, $lng, $year, $month, $tz, $method, $asr);
            Response::success($monthly, "Monthly prayer schedule retrieved.");
        }

        if ($path === '/api/prayer/settings' && $method === 'GET') {
            $user = self::tryGetAuthUser();
            $settings = PrayerTimeService::getUserSettings($user ? (int)$user['id'] : 1);
            Response::success($settings, "Prayer settings retrieved.");
        }

        if ($path === '/api/prayer/settings' && $method === 'PUT') {
            $user = self::tryGetAuthUser();
            $input = self::getJsonInput();
            $settings = PrayerTimeService::updateUserSettings($user ? (int)$user['id'] : 1, $input);
            Response::success($settings, "Prayer settings updated.");
        }

        // =============================================================
        // QIBLA FINDER ENDPOINT
        // =============================================================
        if (($path === '/api/qibla' || $path === '/api/qibla/calculate') && $method === 'GET') {
            $lat = isset($_GET['lat']) ? (float)$_GET['lat'] : (isset($_GET['latitude']) ? (float)$_GET['latitude'] : 9.0765);
            $lng = isset($_GET['lng']) ? (float)$_GET['lng'] : (isset($_GET['longitude']) ? (float)$_GET['longitude'] : 7.3986);
            $city = $_GET['city'] ?? 'Abuja';
            $qibla = QiblaService::calculate($lat, $lng);
            $qibla['city'] = $city;
            $qibla['bearing_degrees'] = $qibla['qibla_bearing'] ?? 64.63;
            Response::success($qibla, "Qibla direction calculated.");
        }

        // =============================================================
        // ADHKAR ENDPOINTS
        // =============================================================
        if ($path === '/api/adhkar/categories' && $method === 'GET') {
            $cats = AdhkarService::getCategories();
            Response::success($cats, "Adhkar categories retrieved.");
        }

        if (($path === '/api/adhkar/items' || preg_match('#^/api/adhkar/categories/(\d+)/items$#', $path, $m)) && $method === 'GET') {
            $catParam = isset($m[1]) ? (int)$m[1] : ($_GET['category'] ?? ($_GET['category_id'] ?? 1));
            $user = self::tryGetAuthUser();
            $catId = 1;
            if (is_numeric($catParam)) {
                $catId = (int)$catParam;
            } else {
                $db = Database::getConnection();
                $kw = str_replace('_', ' ', $catParam);
                $stmt = $db->prepare("SELECT id FROM adhkar_categories WHERE name LIKE :s LIMIT 1");
                $stmt->execute(['s' => '%' . $kw . '%']);
                $catId = (int)($stmt->fetchColumn() ?: 1);
            }
            $items = AdhkarService::getItems($catId, $user ? (int)$user['id'] : null);
            Response::success($items, "Adhkar items retrieved.");
        }

        if ($path === '/api/adhkar/progress' && $method === 'POST') {
            $user = self::tryGetAuthUser();
            $userId = $user ? (int)$user['id'] : 1;
            $input = self::getJsonInput();
            if (empty($input['dhikr_id'])) Response::error("dhikr_id is required.", 422);
            $res = AdhkarService::recordProgress($userId, (int)$input['dhikr_id'], (int)($input['count'] ?? 1));
            Response::success($res, "Adhkar count recorded.");
        }

        // =============================================================
        // DUAS ENDPOINTS
        // =============================================================
        if ($path === '/api/duas/categories' && $method === 'GET') {
            $cats = DuaService::getCategories();
            Response::success($cats, "Dua categories retrieved.");
        }

        if (($path === '/api/duas/items' || preg_match('#^/api/duas/categories/(\d+)/items$#', $path, $m)) && $method === 'GET') {
            $catParam = isset($m[1]) ? (int)$m[1] : ($_GET['category'] ?? ($_GET['category_id'] ?? 1));
            $catId = 1;
            if (is_numeric($catParam)) {
                $catId = (int)$catParam;
            } else {
                $db = Database::getConnection();
                $kw = str_replace('_', ' ', $catParam);
                $stmt = $db->prepare("SELECT id FROM dua_categories WHERE name LIKE :s LIMIT 1");
                $stmt->execute(['s' => '%' . $kw . '%']);
                $catId = (int)($stmt->fetchColumn() ?: 1);
            }
            $items = DuaService::getItems($catId);
            Response::success($items, "Duas retrieved.");
        }

        if ($path === '/api/duas/search' && $method === 'GET') {
            $q = $_GET['query'] ?? ($_GET['q'] ?? '');
            $items = DuaService::search($q);
            Response::success($items, "Dua search results.");
        }

        // =============================================================
        // HADITH ENDPOINTS
        // =============================================================
        if ($path === '/api/hadith/collections' && $method === 'GET') {
            $colls = HadithService::getCollections();
            Response::success($colls, "Hadith collections retrieved.");
        }

        if (($path === '/api/hadith/items' || preg_match('#^/api/hadith/collections/(\d+)/items$#', $path, $m)) && $method === 'GET') {
            $collParam = isset($m[1]) ? (int)$m[1] : ($_GET['collection'] ?? ($_GET['collection_id'] ?? 1));
            $collId = 1;
            if (is_numeric($collParam)) {
                $collId = (int)$collParam;
            } else {
                $db = Database::getConnection();
                $kw = str_replace(['_', '40'], [' ', ''], $collParam);
                $stmt = $db->prepare("SELECT id FROM hadith_collections WHERE name LIKE :s LIMIT 1");
                $stmt->execute(['s' => '%' . trim($kw) . '%']);
                $collId = (int)($stmt->fetchColumn() ?: 1);
            }
            $limit = isset($_GET['limit']) ? min(100, (int)$_GET['limit']) : 50;
            $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
            $items = HadithService::getHadiths($collId, $limit, $offset);
            Response::success($items, "Hadiths retrieved.");
        }

        if (preg_match('#^/api/hadith/(\d+)$#', $path, $m) && $method === 'GET') {
            $id = (int)$m[1];
            $item = HadithService::getHadithById($id);
            if (!$item) Response::error("Hadith not found.", 404);
            Response::success($item, "Hadith retrieved.");
        }

        if ($path === '/api/hadith/search' && $method === 'GET') {
            $q = $_GET['query'] ?? ($_GET['q'] ?? '');
            $cid = isset($_GET['collection_id']) ? (int)$_GET['collection_id'] : null;
            $limit = isset($_GET['limit']) ? min(50, (int)$_GET['limit']) : 20;
            $results = HadithService::search($q, $cid, $limit);
            Response::success($results, "Hadith search results.");
        }

        // =============================================================
        // 99 NAMES OF ALLAH ENDPOINTS
        // =============================================================
        if (($path === '/api/names-of-allah' || $path === '/api/names-of-allah/all') && $method === 'GET') {
            $names = AllahNamesService::getAll();
            Response::success($names, "Names of Allah retrieved.");
        }

        if (($path === '/api/names-of-allah/item' || preg_match('#^/api/names-of-allah/(\d+)$#', $path, $m)) && $method === 'GET') {
            $num = isset($m[1]) ? (int)$m[1] : (int)($_GET['number'] ?? 1);
            $name = AllahNamesService::getByNumber($num);
            if (!$name) Response::error("Name not found.", 404);
            Response::success($name, "Name retrieved.");
        }

        // =============================================================
        // HIJRI CALENDAR & EVENTS ENDPOINTS
        // =============================================================
        if ($path === '/api/hijri/today' && $method === 'GET') {
            $adj = isset($_GET['adj']) ? (int)$_GET['adj'] : 0;
            $today = HijriService::getToday($adj);
            Response::success($today, "Today's Hijri date retrieved.");
        }

        if ($path === '/api/hijri/events' && $method === 'GET') {
            $today = HijriService::getToday();
            $events = HijriService::getIslamicEvents((int)$today['year']);
            Response::success($events, "Islamic events retrieved.");
        }

        // =============================================================
        // DIGITAL TASBIH ENDPOINTS
        // =============================================================
        if ($path === '/api/tasbih/session' && $method === 'POST') {
            $user = self::tryGetAuthUser();
            $userId = $user ? (int)$user['id'] : 1;
            $input = self::getJsonInput();
            $phrase = $input['phrase'] ?? ($input['dhikr_name'] ?? 'SubhanAllah');
            $target = (int)($input['target'] ?? 33);
            $completed = (int)($input['completed'] ?? ($input['total_count'] ?? $target));

            $db = Database::getConnection();
            $stmt = $db->prepare("INSERT INTO tasbih_sessions (user_id, dhikr_phrase, target_count, completed_count, created_at) VALUES (:uid, :p, :t, :c, CURRENT_TIMESTAMP)");
            $stmt->execute(['uid' => $userId, 'p' => $phrase, 't' => $target, 'c' => $completed]);
            Response::success(['id' => $db->lastInsertId()], "Tasbih session recorded.");
        }

        if ($path === '/api/tasbih/history' && $method === 'GET') {
            $user = self::tryGetAuthUser();
            $userId = $user ? (int)$user['id'] : 1;
            $db = Database::getConnection();
            $stmt = $db->prepare("SELECT * FROM tasbih_sessions WHERE user_id = :uid ORDER BY created_at DESC LIMIT 30");
            $stmt->execute(['uid' => $userId]);
            $sessions = $stmt->fetchAll();
            Response::success($sessions, "Tasbih history retrieved.");
        }

        // =============================================================
        // UNIFIED BOOKMARKS ENDPOINTS
        // =============================================================
        if (($path === '/api/bookmarks/all' || $path === '/api/bookmarks/unified') && $method === 'GET') {
            $user = self::tryGetAuthUser();
            $userId = $user ? (int)$user['id'] : 1;
            $type = $_GET['type'] ?? null;
            $bms = UnifiedBookmarkService::getUserBookmarks($userId, $type);
            Response::success($bms, "Unified bookmarks retrieved.");
        }

        if (($path === '/api/bookmarks/toggle' || $path === '/api/bookmarks/unified/toggle') && $method === 'POST') {
            $user = self::tryGetAuthUser();
            $userId = $user ? (int)$user['id'] : 1;
            $input = self::getJsonInput();
            if (empty($input['item_type']) || empty($input['item_id'])) {
                Response::error("item_type and item_id are required.", 422);
            }
            $res = UnifiedBookmarkService::toggle(
                $userId,
                $input['item_type'],
                (string)$input['item_id'],
                $input['title'] ?? 'Saved Item',
                $input['subtitle'] ?? null,
                $input['content_snippet'] ?? ($input['extra_data'] ?? null)
            );
            $res['success'] = true;
            Response::success($res, $res['message']);
        }

        // =============================================================
        // GLOBAL SEARCH ENDPOINT
        // =============================================================
        if ($path === '/api/search/global' && $method === 'GET') {
            $q = $_GET['query'] ?? ($_GET['q'] ?? '');
            $limit = isset($_GET['limit']) ? min(20, (int)$_GET['limit']) : 10;
            $category = $_GET['category'] ?? 'all';
            $res = GlobalSearchService::search($q, $limit, $category);
            Response::success($res, "Global search completed.");
        }

        // =============================================================
        // UNIFIED DASHBOARD OVERVIEW ENDPOINT
        // =============================================================
        if (($path === '/api/overview/dashboard' || $path === '/api/dashboard/overview') && $method === 'GET') {
            $user = self::tryGetAuthUser();
            $userId = $user ? (int)$user['id'] : 1;
            $overview = ProgressService::getPlatformOverview($userId);
            Response::success($overview, "Platform overview retrieved.");
        }

        // 404 for unhandled API endpoints
        Response::error("API endpoint not found: {$method} {$path}", 404);
    }
}
