<?php

namespace App\Services;

use App\Config\Database;
use PDO;

class AdhkarService {
    public static function getCategories(): array {
        $db = Database::getConnection();
        $stmt = $db->query("
            SELECT ac.*, COUNT(ai.id) as item_count 
            FROM adhkar_categories ac
            LEFT JOIN adhkar_items ai ON ac.id = ai.category_id
            GROUP BY ac.id
            ORDER BY ac.order_index ASC, ac.id ASC
        ");
        return $stmt->fetchAll();
    }

    public static function getItems(int $categoryId, ?int $userId = null): array {
        $db = Database::getConnection();
        $sql = "
            SELECT ai.*, 
                   ac.name as category_name,
                   " . ($userId ? "COALESCE(uap.completed_count, 0) as user_count" : "0 as user_count") . "
            FROM adhkar_items ai
            JOIN adhkar_categories ac ON ai.category_id = ac.id
            " . ($userId ? "LEFT JOIN user_adhkar_progress uap ON ai.id = uap.dhikr_id AND uap.user_id = :uid AND DATE(uap.last_read_at) = DATE('now')" : "") . "
            WHERE ai.category_id = :cid
            ORDER BY ai.id ASC
        ";
        $stmt = $db->prepare($sql);
        $params = ['cid' => $categoryId];
        if ($userId) $params['uid'] = $userId;
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public static function recordProgress(int $userId, int $dhikrId, int $count = 1): array {
        $db = Database::getConnection();
        
        // Fetch target
        $tStmt = $db->prepare("SELECT target_count FROM adhkar_items WHERE id = :id");
        $tStmt->execute(['id' => $dhikrId]);
        $target = (int)$tStmt->fetchColumn() ?: 1;

        // Check if user has record for today
        $stmt = $db->prepare("SELECT id, completed_count FROM user_adhkar_progress WHERE user_id = :uid AND dhikr_id = :did AND DATE(last_read_at) = DATE('now')");
        $stmt->execute(['uid' => $userId, 'did' => $dhikrId]);
        $existing = $stmt->fetch();

        if ($existing) {
            $newCount = min($target, $existing['completed_count'] + $count);
            $upd = $db->prepare("UPDATE user_adhkar_progress SET completed_count = :cnt, last_read_at = CURRENT_TIMESTAMP WHERE id = :id");
            $upd->execute(['cnt' => $newCount, 'id' => $existing['id']]);
        } else {
            $newCount = min($target, $count);
            $ins = $db->prepare("INSERT INTO user_adhkar_progress (user_id, dhikr_id, completed_count, last_read_at) VALUES (:uid, :did, :cnt, CURRENT_TIMESTAMP)");
            $ins->execute(['uid' => $userId, 'did' => $dhikrId, 'cnt' => $newCount]);
        }

        return [
            'dhikr_id' => $dhikrId,
            'completed_count' => $newCount,
            'target_count' => $target,
            'is_completed' => $newCount >= $target
        ];
    }
}
