<?php

namespace App\Services;

use App\Config\Database;
use PDO;

class AllahNamesService {
    public static function getAll(): array {
        $db = Database::getConnection();
        $stmt = $db->query("SELECT *, transliteration AS name_english FROM names_of_allah ORDER BY number ASC");
        return $stmt->fetchAll();
    }

    public static function getByNumber(int $num): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT *, transliteration AS name_english FROM names_of_allah WHERE number = :num");
        $stmt->execute(['num' => $num]);
        $row = $stmt->fetch();
        return $row ?: null;
    }
}
