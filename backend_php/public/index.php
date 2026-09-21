<?php

$baseDir = dirname(__DIR__);

require_once $baseDir . '/config/Database.php';
require_once $baseDir . '/config/JWT.php';
require_once $baseDir . '/config/Response.php';
require_once $baseDir . '/models/Schema.php';
require_once $baseDir . '/services/AuthService.php';
require_once $baseDir . '/services/QuranService.php';
require_once $baseDir . '/services/SRSService.php';
require_once $baseDir . '/services/MemorizationService.php';
require_once $baseDir . '/services/ProgressService.php';
require_once $baseDir . '/services/AchievementService.php';
require_once $baseDir . '/services/TajweedService.php';
require_once $baseDir . '/services/TafsirService.php';
require_once $baseDir . '/services/TawhidService.php';
require_once $baseDir . '/services/PrayerTimeService.php';
require_once $baseDir . '/services/QiblaService.php';
require_once $baseDir . '/services/AdhkarService.php';
require_once $baseDir . '/services/DuaService.php';
require_once $baseDir . '/services/HadithService.php';
require_once $baseDir . '/services/AllahNamesService.php';
require_once $baseDir . '/services/HijriService.php';
require_once $baseDir . '/services/UnifiedBookmarkService.php';
require_once $baseDir . '/services/GlobalSearchService.php';
require_once $baseDir . '/api/router.php';

$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// If it's a request to an existing static file, let PHP's built-in server serve it
if (php_sapi_name() === 'cli-server') {
    $file = __DIR__ . $path;
    if (is_file($file) && !str_ends_with($file, '.php')) {
        return false;
    }
}

// Static Assets Handler for Apache / LiteSpeed / FastCGI (CSS, JS, Fonts, Images)
if (str_contains($path, '/static/')) {
    $staticSub = substr($path, strpos($path, '/static/'));
    $targetFile = __DIR__ . $staticSub;
    if (!file_exists($targetFile)) {
        $targetFile = $baseDir . $staticSub;
    }
    if (file_exists($targetFile) && is_file($targetFile)) {
        $ext = strtolower(pathinfo($targetFile, PATHINFO_EXTENSION));
        $mimes = [
            'css' => 'text/css',
            'js' => 'application/javascript',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'svg' => 'image/svg+xml',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf' => 'font/ttf',
            'ico' => 'image/x-icon'
        ];
        $contentType = $mimes[$ext] ?? 'text/plain';
        header("Content-Type: {$contentType}; charset=utf-8");
        header("Cache-Control: public, max-age=86400");
        readfile($targetFile);
        exit;
    }
}

// API Routes (supports root or subfolder deployment on cPanel)
if (str_contains($path, '/api/')) {
    App\Api\Router::handle($uri, $_SERVER['REQUEST_METHOD']);
    exit;
}

// Otherwise serve SPA HTML shell
$htmlPath = __DIR__ . '/index.html';
if (file_exists($htmlPath)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($htmlPath);
    exit;
}

echo "Quran Memorization & Muraja'ah Application (PHP Backend)";
