<?php

namespace App\Config;

use PDO;
use PDOException;

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $databaseUrl = getenv('DATABASE_URL');
            
            // Check for optional database.local.php file
            $configFile = dirname(__DIR__) . '/config/database.local.php';
            if (!$databaseUrl && file_exists($configFile)) {
                $cfg = require $configFile;
                $databaseUrl = $cfg['DATABASE_URL'] ?? null;
            }

            if (!$databaseUrl) {
                $databaseUrl = 'sqlite:' . dirname(__DIR__) . '/quran_hifz.sqlite';
            }

            try {
                if (str_starts_with($databaseUrl, 'sqlite:')) {
                    self::$instance = new PDO($databaseUrl);
                    self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                    self::$instance->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
                    self::$instance->exec('PRAGMA foreign_keys = ON;');
                } elseif (str_starts_with($databaseUrl, 'mysql:')) {
                    // MySQL support (e.g. mysql:host=localhost;dbname=cpaneluser_quran;charset=utf8mb4, user, pass)
                    $user = getenv('DB_USER') ?: null;
                    $pass = getenv('DB_PASS') ?: null;
                    if (file_exists($configFile)) {
                        $cfg = require $configFile;
                        $user = $user ?: ($cfg['DB_USER'] ?? null);
                        $pass = $pass ?: ($cfg['DB_PASS'] ?? null);
                    }
                    self::$instance = new PDO($databaseUrl, $user, $pass, [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                    ]);
                } else {
                    // PostgreSQL support
                    $dbopts = parse_url($databaseUrl);
                    $host = $dbopts['host'] ?? 'localhost';
                    $port = $dbopts['port'] ?? 5432;
                    $user = $dbopts['user'] ?? 'postgres';
                    $pass = $dbopts['pass'] ?? '';
                    $dbname = ltrim($dbopts['path'] ?? 'quran_hifz', '/');

                    $dsn = "pgsql:host={$host};port={$port};dbname={$dbname};";
                    self::$instance = new PDO($dsn, $user, $pass, [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                    ]);
                }
            } catch (PDOException $e) {
                die(json_encode([
                    'success' => false,
                    'message' => 'Database connection failed: ' . $e->getMessage()
                ]));
            }
        }
        return self::$instance;
    }
}
