<?php

namespace App\Services;

use App\Config\Database;
use PDO;

class HadithService {
    public static function getCollections(): array {
        $db = Database::getConnection();
        $stmt = $db->query("
            SELECT hc.*, COUNT(hi.id) as hadith_count
            FROM hadith_collections hc
            LEFT JOIN hadith_items hi ON hc.id = hi.collection_id
            GROUP BY hc.id
            ORDER BY hc.id ASC
        ");
        return $stmt->fetchAll();
    }

    public static function getHadiths(int $collectionId, int $limit = 20, int $offset = 0): array {
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT hi.*, hc.name as collection_name, hc.author as collection_author
            FROM hadith_items hi
            JOIN hadith_collections hc ON hi.collection_id = hc.id
            WHERE hi.collection_id = :cid
            ORDER BY hi.hadith_number ASC
            LIMIT :lim OFFSET :off
        ");
        $stmt->bindValue(':cid', $collectionId, PDO::PARAM_INT);
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':off', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public static function getHadithById(int $id): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT hi.*, hc.name as collection_name, hc.author as collection_author
            FROM hadith_items hi
            JOIN hadith_collections hc ON hi.collection_id = hc.id
            WHERE hi.id = :id
        ");
        $stmt->execute(['id' => $id]);
        return $stmt->fetch() ?: null;
    }

    public static function search(string $query, ?int $collectionId = null, int $limit = 20): array {
        $db = Database::getConnection();
        $q = '%' . trim($query) . '%';
        $sql = "
            SELECT hi.*, hc.name as collection_name
            FROM hadith_items hi
            JOIN hadith_collections hc ON hi.collection_id = hc.id
            WHERE (hi.translation LIKE :q1 OR hi.text_arabic LIKE :q2 OR hi.chapter_name LIKE :q3)
            " . ($collectionId ? "AND hi.collection_id = :cid" : "") . "
            ORDER BY hi.collection_id ASC, hi.hadith_number ASC
            LIMIT :lim
        ";
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':q1', $q, PDO::PARAM_STR);
        $stmt->bindValue(':q2', $q, PDO::PARAM_STR);
        $stmt->bindValue(':q3', $q, PDO::PARAM_STR);
        if ($collectionId) $stmt->bindValue(':cid', $collectionId, PDO::PARAM_INT);
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
