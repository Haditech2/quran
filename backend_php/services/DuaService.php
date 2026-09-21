<?php

namespace App\Services;

use App\Config\Database;
use PDO;

class DuaService {
    public static function getCategories(): array {
        $db = Database::getConnection();
        $stmt = $db->query("
            SELECT dc.*, COUNT(di.id) as item_count 
            FROM dua_categories dc
            LEFT JOIN dua_items di ON dc.id = di.category_id
            GROUP BY dc.id
            ORDER BY dc.order_index ASC, dc.id ASC
        ");
        return $stmt->fetchAll();
    }

    public static function getItems(int $categoryId): array {
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT di.*, dc.name as category_name
            FROM dua_items di
            JOIN dua_categories dc ON di.category_id = dc.id
            WHERE di.category_id = :cid
            ORDER BY di.id ASC
        ");
        $stmt->execute(['cid' => $categoryId]);
        return $stmt->fetchAll();
    }

    public static function search(string $query, int $limit = 25): array {
        $db = Database::getConnection();
        $q = '%' . trim($query) . '%';
        $stmt = $db->prepare("
            SELECT di.*, dc.name as category_name
            FROM dua_items di
            JOIN dua_categories dc ON di.category_id = dc.id
            WHERE di.title LIKE :q1 OR di.translation LIKE :q2 OR di.text_arabic LIKE :q3 OR di.transliteration LIKE :q4
            ORDER BY di.id ASC
            LIMIT :lim
        ");
        $stmt->bindValue(':q1', $q, PDO::PARAM_STR);
        $stmt->bindValue(':q2', $q, PDO::PARAM_STR);
        $stmt->bindValue(':q3', $q, PDO::PARAM_STR);
        $stmt->bindValue(':q4', $q, PDO::PARAM_STR);
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
