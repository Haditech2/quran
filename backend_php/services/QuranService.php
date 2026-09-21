<?php

namespace App\Services;

use App\Config\Database;
use PDO;

class QuranService {

    private static function httpGet(string $url): ?string {
        if (function_exists('curl_init')) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 12);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_USERAGENT, 'QuranHifzApp/1.0');
            $res = curl_exec($ch);
            curl_close($ch);
            if ($res) return $res;
        }

        $ctx = stream_context_create([
            'http' => ['timeout' => 12, 'header' => "User-Agent: QuranHifzApp/1.0\r\n"],
            'ssl'  => ['verify_peer' => false, 'verify_peer_name' => false]
        ]);
        return @file_get_contents($url, false, $ctx) ?: null;
    }

    public static function getSurahs(): array {
        $db = Database::getConnection();
        $stmt = $db->query("SELECT * FROM surahs ORDER BY number ASC");
        return $stmt->fetchAll();
    }

    public static function getSurahById(int $id, bool $includeAyahs = false): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM surahs WHERE id = ? OR number = ?");
        $stmt->execute([$id, $id]);
        $surah = $stmt->fetch();
        if (!$surah) return null;

        if ($includeAyahs) {
            $surah['ayahs'] = self::getAyahs((int)$surah['number']);
        }
        return $surah;
    }

    public static function fetchAndStoreSurahLive(int $surahNumber): array {
        $db = Database::getConnection();

        // Query live authoritative Al-Quran Cloud API for Arabic Uthmani, English Sahih, and Alafasy Audio
        $url = "https://api.alquran.cloud/v1/surah/{$surahNumber}/editions/quran-uthmani,en.sahih,ar.alafasy";
        $raw = self::httpGet($url);
        if (!$raw) {
            return [];
        }

        $json = json_decode($raw, true);
        if (empty($json['data']) || !is_array($json['data']) || count($json['data']) < 2) {
            return [];
        }

        $arAyahs = $json['data'][0]['ayahs'] ?? [];
        $enAyahs = $json['data'][1]['ayahs'] ?? [];
        $auAyahs = $json['data'][2]['ayahs'] ?? [];

        if (empty($arAyahs)) {
            return [];
        }

        // Get surah id from local DB
        $sStmt = $db->prepare("SELECT id FROM surahs WHERE number = ?");
        $sStmt->execute([$surahNumber]);
        $surahId = $sStmt->fetchColumn() ?: $surahNumber;

        // Upsert into ayahs table using database transaction
        $ins = $db->prepare("
            REPLACE INTO ayahs (id, surah_id, surah_number, ayah_number, verse_key, text_arabic, text_translation, juz_number, page_number, hizb_number, audio_url)
            VALUES (
                (SELECT id FROM ayahs WHERE verse_key = ?),
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
        ");

        try {
            $db->beginTransaction();
            for ($i = 0; $i < count($arAyahs); $i++) {
                $numInSurah = (int)$arAyahs[$i]['numberInSurah'];
                $verseKey = "{$surahNumber}:{$numInSurah}";
                $arabic = $arAyahs[$i]['text'];
                $trans = $enAyahs[$i]['text'] ?? '';
                $juz = (int)($arAyahs[$i]['juz'] ?? 1);
                $page = (int)($arAyahs[$i]['page'] ?? 1);
                $hizb = (int)($arAyahs[$i]['hizbQuarter'] ?? 1);
                
                // CDN audio stream
                $audio = $auAyahs[$i]['audio'] ?? "https://cdn.islamic.network/quran/audio/128/ar.alafasy/{$arAyahs[$i]['number']}.mp3";

                $ins->execute([
                    $verseKey,
                    $surahId,
                    $surahNumber,
                    $numInSurah,
                    $verseKey,
                    $arabic,
                    $trans,
                    $juz,
                    $page,
                    $hizb,
                    $audio
                ]);
            }
            $db->commit();
        } catch (\Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
        }

        return self::queryAyahsFromDb($surahNumber);
    }

    private static function queryAyahsFromDb(int $surahNumber, ?int $start = null, ?int $end = null): array {
        $db = Database::getConnection();
        $sql = "
            SELECT a.*, s.name_english as surah_name_english, s.name_arabic as surah_name_arabic 
            FROM ayahs a 
            JOIN surahs s ON s.id = a.surah_id 
            WHERE a.surah_number = ?
        ";
        $params = [$surahNumber];

        if ($start !== null) {
            $sql .= " AND a.ayah_number >= ?";
            $params[] = $start;
        }
        if ($end !== null) {
            $sql .= " AND a.ayah_number <= ?";
            $params[] = $end;
        }
        $sql .= " ORDER BY a.ayah_number ASC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public static function getAyahs(int $surahNumber, ?int $start = null, ?int $end = null): array {
        $db = Database::getConnection();
        
        // Check if surah exists and get its expected total_ayahs
        $sStmt = $db->prepare("SELECT total_ayahs FROM surahs WHERE number = ?");
        $sStmt->execute([$surahNumber]);
        $totalExpected = (int)$sStmt->fetchColumn();

        // Check how many ayahs are in local DB
        $cStmt = $db->prepare("SELECT COUNT(*) FROM ayahs WHERE surah_number = ?");
        $cStmt->execute([$surahNumber]);
        $existingCount = (int)$cStmt->fetchColumn();

        // If local DB is missing ayahs for this surah, fetch live from authoritative Quran API
        if ($existingCount === 0 || ($totalExpected > 0 && $existingCount < $totalExpected)) {
            $liveAyahs = self::fetchAndStoreSurahLive($surahNumber);
            if (!empty($liveAyahs)) {
                if ($start !== null || $end !== null) {
                    return self::queryAyahsFromDb($surahNumber, $start, $end);
                }
                return $liveAyahs;
            }
        }

        return self::queryAyahsFromDb($surahNumber, $start, $end);
    }

    public static function getAyahById(int $id): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT a.*, s.name_english as surah_name_english, s.name_arabic as surah_name_arabic 
            FROM ayahs a 
            JOIN surahs s ON s.id = a.surah_id 
            WHERE a.id = ?
        ");
        $stmt->execute([$id]);
        $ayah = $stmt->fetch();
        return $ayah ?: null;
    }

    public static function getJuzList(): array {
        $db = Database::getConnection();
        $stmt = $db->query("SELECT * FROM juz ORDER BY number ASC");
        return $stmt->fetchAll();
    }

    public static function getJuzAyahs(int $juzNumber): array {
        $db = Database::getConnection();
        
        // Find which surahs are in this Juz
        $jStmt = $db->prepare("SELECT * FROM juz WHERE number = ?");
        $jStmt->execute([$juzNumber]);
        $juz = $jStmt->fetch();

        if ($juz) {
            for ($sn = (int)$juz['start_surah_number']; $sn <= (int)$juz['end_surah_number']; $sn++) {
                // Ensure surah is loaded
                $c = (int)$db->query("SELECT COUNT(*) FROM ayahs WHERE surah_number = {$sn}")->fetchColumn();
                if ($c === 0) {
                    self::fetchAndStoreSurahLive($sn);
                }
            }
        }

        $stmt = $db->prepare("
            SELECT a.*, s.name_english as surah_name_english, s.name_arabic as surah_name_arabic 
            FROM ayahs a 
            JOIN surahs s ON s.id = a.surah_id 
            WHERE a.juz_number = ? 
            ORDER BY a.surah_number ASC, a.ayah_number ASC
        ");
        $stmt->execute([$juzNumber]);
        return $stmt->fetchAll();
    }

    public static function search(string $query, int $limit = 50): array {
        $db = Database::getConnection();
        $term = '%' . trim($query) . '%';
        $stmt = $db->prepare("
            SELECT a.*, s.name_english as surah_name_english, s.name_arabic as surah_name_arabic 
            FROM ayahs a 
            JOIN surahs s ON s.id = a.surah_id 
            WHERE a.text_arabic LIKE ? OR a.text_translation LIKE ? 
            ORDER BY a.surah_number ASC, a.ayah_number ASC 
            LIMIT ?
        ");
        $stmt->execute([$term, $term, $limit]);
        return $stmt->fetchAll();
    }

    public static function getReciters(): array {
        $db = Database::getConnection();
        $stmt = $db->query("SELECT * FROM reciters ORDER BY id ASC");
        return $stmt->fetchAll();
    }
}
