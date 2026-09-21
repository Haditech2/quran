<?php

namespace App\Services;

use App\Config\Database;
use App\Config\JWT;
use PDO;

class AuthService {
    public static function register(string $username, string $email, string $password, ?string $name = null, string $role = 'user'): array {
        $db = Database::getConnection();
        $username = trim(strtolower($username));
        $email = trim(strtolower($email));

        // Check duplicates
        $stmt = $db->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $email]);
        if ($stmt->fetch()) {
            throw new \Exception("Username or Email is already registered.");
        }

        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $name = $name ?: $username;

        $insert = $db->prepare("
            INSERT INTO users (username, email, password_hash, name, role)
            VALUES (?, ?, ?, ?, ?)
        ");
        $insert->execute([$username, $email, $passwordHash, $name, $role]);
        $userId = (int)$db->lastInsertId();

        // Create default notification preferences
        $pref = $db->prepare("INSERT INTO notification_preferences (user_id) VALUES (?)");
        $pref->execute([$userId]);

        $user = self::getUserById($userId);
        $accessToken = JWT::encode(['sub' => $userId, 'role' => $role], null, 86400);
        $refreshToken = JWT::encode(['sub' => $userId, 'type' => 'refresh'], null, 86400 * 30);

        return [
            'user' => $user,
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken
        ];
    }

    public static function login(string $identifier, string $password): array {
        $db = Database::getConnection();
        $identifier = trim(strtolower($identifier));

        $stmt = $db->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$identifier, $identifier]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            throw new \Exception("Invalid username/email or password.");
        }

        if (!$user['is_active']) {
            throw new \Exception("Account is disabled.");
        }

        unset($user['password_hash']);
        $accessToken = JWT::encode(['sub' => (int)$user['id'], 'role' => $user['role']], null, 86400);
        $refreshToken = JWT::encode(['sub' => (int)$user['id'], 'type' => 'refresh'], null, 86400 * 30);

        return [
            'user' => $user,
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken
        ];
    }

    public static function getUserById(int $id): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT id, username, email, name, role, profile_image, memorization_goal, daily_goal_ayahs, daily_revision_goal_ayahs, created_at FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    public static function updateProfile(int $userId, array $data): array {
        $db = Database::getConnection();
        $fields = [];
        $params = [];

        if (isset($data['name'])) {
            $fields[] = "name = ?";
            $params[] = trim($data['name']);
        }
        if (isset($data['memorization_goal'])) {
            $fields[] = "memorization_goal = ?";
            $params[] = trim($data['memorization_goal']);
        }
        if (isset($data['daily_goal_ayahs'])) {
            $fields[] = "daily_goal_ayahs = ?";
            $params[] = max(1, (int)$data['daily_goal_ayahs']);
        }
        if (isset($data['daily_revision_goal_ayahs'])) {
            $fields[] = "daily_revision_goal_ayahs = ?";
            $params[] = max(1, (int)$data['daily_revision_goal_ayahs']);
        }
        if (isset($data['profile_image'])) {
            $fields[] = "profile_image = ?";
            $params[] = $data['profile_image'];
        }

        if (!empty($fields)) {
            $params[] = $userId;
            $sql = "UPDATE users SET " . implode(', ', $fields) . ", updated_at = CURRENT_TIMESTAMP WHERE id = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
        }

        return self::getUserById($userId);
    }
}
