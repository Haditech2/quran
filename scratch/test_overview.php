<?php
$baseDir = dirname(__DIR__) . '/backend_php';
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

try {
    echo "1. Calling ProgressService::getPlatformOverview(1)...\n";
    $res = App\Services\ProgressService::getPlatformOverview(1);
    echo "Overview result keys: " . implode(', ', array_keys($res)) . "\n";

    echo "2. Calling Router::handle('/api/dashboard/overview', 'GET')...\n";
    App\Api\Router::handle('/api/dashboard/overview', 'GET');
} catch (\Throwable $t) {
    echo "EXCEPTION: " . $t->getMessage() . " at " . $t->getFile() . ":" . $t->getLine() . "\n";
}
