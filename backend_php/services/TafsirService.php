<?php

namespace App\Services;

use App\Config\Database;
use PDO;

class TafsirService {
    public static function getSources(): array {
        $db = Database::getConnection();
        $stmt = $db->query("SELECT * FROM tafsir_sources ORDER BY is_default DESC, id ASC");
        return $stmt->fetchAll();
    }

    public static function getAyahTafsir(int $surahNumber, int $ayahNumber, ?int $sourceId = null): ?array {
        $db = Database::getConnection();
        
        // If no source requested, get default
        if (!$sourceId) {
            $defStmt = $db->query("SELECT id FROM tafsir_sources WHERE is_default = 1 LIMIT 1");
            $sourceId = (int)$defStmt->fetchColumn() ?: 1;
        }

        $stmt = $db->prepare("
            SELECT te.*, ts.name as source_name, ts.author as source_author, ts.methodology as source_methodology
            FROM tafsir_entries te
            JOIN tafsir_sources ts ON te.source_id = ts.id
            WHERE te.surah_number = :sn AND te.ayah_number = :an AND te.source_id = :sid
            LIMIT 1
        ");
        $stmt->execute(['sn' => $surahNumber, 'an' => $ayahNumber, 'sid' => $sourceId]);
        $entry = $stmt->fetch();

        if ($entry) {
            $entry['tafsir_text'] = $entry['content'];
            return $entry;
        }

        // Fallback: Check if there is ANY source available for this ayah
        $anyStmt = $db->prepare("
            SELECT te.*, ts.name as source_name, ts.author as source_author, ts.methodology as source_methodology
            FROM tafsir_entries te
            JOIN tafsir_sources ts ON te.source_id = ts.id
            WHERE te.surah_number = :sn AND te.ayah_number = :an
            LIMIT 1
        ");
        $anyStmt->execute(['sn' => $surahNumber, 'an' => $ayahNumber]);
        $fallback = $anyStmt->fetch();
        if ($fallback) {
            $fallback['tafsir_text'] = $fallback['content'];
            return $fallback;
        }
        return null;
    }

    public static function getSurahTafsir(int $surahNumber, ?int $sourceId = null, int $limit = 20, int $offset = 0): array {
        $db = Database::getConnection();
        if (!$sourceId) {
            $defStmt = $db->query("SELECT id FROM tafsir_sources WHERE is_default = 1 LIMIT 1");
            $sourceId = (int)$defStmt->fetchColumn() ?: 1;
        }

        $stmt = $db->prepare("
            SELECT te.*, ts.name as source_name, ts.author as source_author
            FROM tafsir_entries te
            JOIN tafsir_sources ts ON te.source_id = ts.id
            WHERE te.surah_number = :sn AND te.source_id = :sid
            ORDER BY te.ayah_number ASC
            LIMIT :lim OFFSET :off
        ");
        $stmt->bindValue(':sn', $surahNumber, PDO::PARAM_INT);
        $stmt->bindValue(':sid', $sourceId, PDO::PARAM_INT);
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':off', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public static function searchTafsir(string $query, ?int $sourceId = null, int $limit = 20): array {
        $db = Database::getConnection();
        $q = '%' . trim($query) . '%';
        $sql = "
            SELECT te.id, te.surah_number, te.ayah_number, te.verse_key, te.content, te.source_attribution,
                   ts.name as source_name, s.name_english as surah_name_english, s.name_arabic as surah_name_arabic
            FROM tafsir_entries te
            JOIN tafsir_sources ts ON te.source_id = ts.id
            LEFT JOIN surahs s ON te.surah_number = s.number
            WHERE te.content LIKE :q
            " . ($sourceId ? "AND te.source_id = :sid" : "") . "
            ORDER BY te.surah_number ASC, te.ayah_number ASC
            LIMIT :lim
        ";
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':q', $q, PDO::PARAM_STR);
        if ($sourceId) $stmt->bindValue(':sid', $sourceId, PDO::PARAM_INT);
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
