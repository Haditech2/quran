<?php

namespace App\Services;

use App\Config\Database;
use PDO;

class UnifiedBookmarkService {
    public static function getUserBookmarks(int $userId, ?string $itemType = null): array {
        $db = Database::getConnection();
        $sql = "SELECT * FROM unified_bookmarks WHERE user_id = :uid";
        $params = ['uid' => $userId];
        if ($itemType) {
            $sql .= " AND item_type = :type";
            $params['type'] = $itemType;
        }
        $sql .= " ORDER BY created_at DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public static function toggle(
        int $userId,
        string $itemType,
        string $itemId,
        string $title,
        ?string $subtitle = null,
        ?string $extraData = null
    ): array {
        $db = Database::getConnection();
        $check = $db->prepare("SELECT id FROM unified_bookmarks WHERE user_id = :uid AND item_type = :type AND item_id = :id");
        $check->execute(['uid' => $userId, 'type' => $itemType, 'id' => $itemId]);
        $existingId = $check->fetchColumn();

        if ($existingId) {
            $del = $db->prepare("DELETE FROM unified_bookmarks WHERE id = :id");
            $del->execute(['id' => $existingId]);
            return ['is_bookmarked' => false, 'message' => 'Bookmark removed.'];
        } else {
            $ins = $db->prepare("
                INSERT INTO unified_bookmarks (user_id, item_type, item_id, title, subtitle, extra_data, created_at)
                VALUES (:uid, :type, :id, :t, :sub, :extra, CURRENT_TIMESTAMP)
            ");
            $ins->execute([
                'uid' => $userId,
                'type' => $itemType,
                'id' => $itemId,
                't' => $title,
                'sub' => $subtitle,
                'extra' => $extraData
            ]);
            return ['is_bookmarked' => true, 'message' => 'Bookmark saved.'];
        }
    }

    public static function isBookmarked(int $userId, string $itemType, string $itemId): bool {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT COUNT(*) FROM unified_bookmarks WHERE user_id = :uid AND item_type = :type AND item_id = :id");
        $stmt->execute(['uid' => $userId, 'type' => $itemType, 'id' => $itemId]);
        return ((int)$stmt->fetchColumn()) > 0;
    }
}
