<?php

namespace App\Services;

use App\Config\Database;
use PDO;

class TajweedService {
    public static function getCategories(): array {
        $db = Database::getConnection();
        $stmt = $db->query("
            SELECT tc.*, 
                   COUNT(tl.id) as lesson_count 
            FROM tajweed_categories tc
            LEFT JOIN tajweed_lessons tl ON tc.id = tl.category_id
            GROUP BY tc.id
            ORDER BY tc.order_index ASC, tc.id ASC
        ");
        return $stmt->fetchAll();
    }

    public static function getCategoryLessons(int $categoryId, ?int $userId = null): array {
        $db = Database::getConnection();
        $sql = "
            SELECT tl.*,
                   tc.name as category_name,
                   COUNT(DISTINCT tr.id) as rules_count,
                   COUNT(DISTINCT tq.id) as quiz_count,
                   " . ($userId ? "COALESCE(utp.is_completed, 0) as is_completed, COALESCE(utp.quiz_score, 0) as quiz_score" : "0 as is_completed, 0 as quiz_score") . "
            FROM tajweed_lessons tl
            JOIN tajweed_categories tc ON tl.category_id = tc.id
            LEFT JOIN tajweed_rules tr ON tl.id = tr.lesson_id
            LEFT JOIN tajweed_quizzes tq ON tl.id = tq.lesson_id
            " . ($userId ? "LEFT JOIN user_tajweed_progress utp ON tl.id = utp.lesson_id AND utp.user_id = :userId" : "") . "
            WHERE tl.category_id = :catId
            GROUP BY tl.id
            ORDER BY tl.order_index ASC, tl.id ASC
        ";
        $stmt = $db->prepare($sql);
        $params = ['catId' => $categoryId];
        if ($userId) $params['userId'] = $userId;
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public static function getLesson(int $lessonId, ?int $userId = null): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT tl.*, tc.name as category_name
            FROM tajweed_lessons tl
            JOIN tajweed_categories tc ON tl.category_id = tc.id
            WHERE tl.id = :id
        ");
        $stmt->execute(['id' => $lessonId]);
        $lesson = $stmt->fetch();
        if (!$lesson) return null;

        // Rules
        $rStmt = $db->prepare("SELECT * FROM tajweed_rules WHERE lesson_id = :lid ORDER BY id ASC");
        $rStmt->execute(['lid' => $lessonId]);
        $rules = $rStmt->fetchAll();

        foreach ($rules as &$rule) {
            $eStmt = $db->prepare("SELECT * FROM tajweed_examples WHERE rule_id = :rid ORDER BY id ASC");
            $eStmt->execute(['rid' => $rule['id']]);
            $rule['examples'] = $eStmt->fetchAll();
        }
        $lesson['rules'] = $rules;

        // Quizzes
        $qStmt = $db->prepare("SELECT id, question, option_a, option_b, option_c, option_d, explanation FROM tajweed_quizzes WHERE lesson_id = :lid ORDER BY id ASC");
        $qStmt->execute(['lid' => $lessonId]);
        $lesson['quizzes'] = $qStmt->fetchAll();

        // User progress
        if ($userId) {
            $pStmt = $db->prepare("SELECT is_completed, quiz_score, completed_at FROM user_tajweed_progress WHERE user_id = :uid AND lesson_id = :lid");
            $pStmt->execute(['uid' => $userId, 'lid' => $lessonId]);
            $prog = $pStmt->fetch();
            $lesson['progress'] = $prog ?: ['is_completed' => 0, 'quiz_score' => 0];
        }

        return $lesson;
    }

    public static function submitQuiz(int $userId, int $lessonId, array $answers): array {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT id, correct_option FROM tajweed_quizzes WHERE lesson_id = :lid");
        $stmt->execute(['lid' => $lessonId]);
        $quizzes = $stmt->fetchAll();

        if (empty($quizzes)) {
            // Mark completed directly if no quizzes
            $up = $db->prepare("
                INSERT INTO user_tajweed_progress (user_id, lesson_id, is_completed, quiz_score, completed_at)
                VALUES (:uid, :lid, 1, 100, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id, lesson_id) DO UPDATE SET is_completed = 1, completed_at = CURRENT_TIMESTAMP
            ");
            $up->execute(['uid' => $userId, 'lid' => $lessonId]);
            return ['score' => 100, 'passed' => true, 'total' => 0, 'correct' => 0];
        }

        $total = count($quizzes);
        $correct = 0;
        foreach ($quizzes as $q) {
            $qid = (int)$q['id'];
            if (isset($answers[$qid]) && strtoupper(trim($answers[$qid])) === strtoupper(trim($q['correct_option']))) {
                $correct++;
            }
        }

        $score = (int)round(($correct / $total) * 100);
        $passed = $score >= 70;

        $saveStmt = $db->prepare("
            INSERT INTO user_tajweed_progress (user_id, lesson_id, is_completed, quiz_score, completed_at)
            VALUES (:uid, :lid, :comp, :sc, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, lesson_id) DO UPDATE SET
                is_completed = CASE WHEN :comp2 = 1 THEN 1 ELSE is_completed END,
                quiz_score = MAX(quiz_score, :sc2),
                completed_at = CURRENT_TIMESTAMP
        ");
        $saveStmt->execute([
            'uid' => $userId,
            'lid' => $lessonId,
            'comp' => $passed ? 1 : 0,
            'sc' => $score,
            'comp2' => $passed ? 1 : 0,
            'sc2' => $score
        ]);

        return [
            'score' => $score,
            'passed' => $passed,
            'total' => $total,
            'correct' => $correct,
            'message' => $passed ? 'Congratulations! You passed this Tajweed quiz.' : 'Review the lesson and try again to achieve 70% or higher.'
        ];
    }

    public static function getQuizzes(int $lessonId): array {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT id, lesson_id, question, option_a, option_b, option_c, option_d, explanation FROM tajweed_quizzes WHERE lesson_id = :lid ORDER BY id ASC");
        $stmt->execute(['lid' => $lessonId]);
        $rows = $stmt->fetchAll();
        if (empty($rows)) {
            $stmt = $db->query("SELECT id, lesson_id, question, option_a, option_b, option_c, option_d, explanation FROM tajweed_quizzes ORDER BY id ASC LIMIT 5");
            $rows = $stmt->fetchAll();
        }
        foreach ($rows as &$r) {
            $r['question_text'] = $r['question'] ?? '';
            $r['options'] = [
                ['key' => 'A', 'text' => $r['option_a'] ?? ''],
                ['key' => 'B', 'text' => $r['option_b'] ?? ''],
                ['key' => 'C', 'text' => $r['option_c'] ?? ''],
                ['key' => 'D', 'text' => $r['option_d'] ?? '']
            ];
        }
        return $rows;
    }

    public static function getAyahTajweedRules(int $surahNumber, int $ayahNumber): array {
        $db = Database::getConnection();
        // Look for any exact examples linked to this ayah
        $stmt = $db->prepare("
            SELECT te.*, tr.name as rule_name, tr.name_arabic as rule_arabic, tr.color_code, tr.explanation as rule_explanation
            FROM tajweed_examples te
            JOIN tajweed_rules tr ON te.rule_id = tr.id
            WHERE te.surah_number = :sn AND te.ayah_number = :an
        ");
        $stmt->execute(['sn' => $surahNumber, 'an' => $ayahNumber]);
        $specific = $stmt->fetchAll();

        // Also return foundational Tajweed color coding rules guide
        $guide = [
            ['rule' => 'Ghunnah / Ikhfa', 'color' => '#d97706', 'description' => 'Nasal sound held for 2 harakat on Noon/Meem Mushaddad or Ikhfa.'],
            ['rule' => 'Qalqalah', 'color' => '#0284c7', 'description' => 'Echoing / bouncing sound on letters Qaf, Taa, Baa, Jeem, Dal (ق ط ب ج د) with Sukoon.'],
            ['rule' => 'Idgham', 'color' => '#10b981', 'description' => 'Merging of Noon Sakinah/Tanween into Ya, Ra, Meem, Laam, Waw, Noon (يرملون).'],
            ['rule' => 'Iqlab', 'color' => '#8b5cf6', 'description' => 'Conversion of Noon Sakinah/Tanween into Meem before letter Baa (ب).'],
            ['rule' => 'Madd (Prolongation)', 'color' => '#ef4444', 'description' => 'Elongating vowel sounds for 4 to 6 counts.']
        ];

        return [
            'surah_number' => $surahNumber,
            'ayah_number' => $ayahNumber,
            'detected_rules' => $specific,
            'color_guide' => $guide
        ];
    }

    public static function getUserProgress(int $userId): array {
        $db = Database::getConnection();
        $totalStmt = $db->query("SELECT COUNT(*) FROM tajweed_lessons");
        $total = (int)$totalStmt->fetchColumn();

        $compStmt = $db->prepare("SELECT COUNT(*), AVG(quiz_score) FROM user_tajweed_progress WHERE user_id = :uid AND is_completed = 1");
        $compStmt->execute(['uid' => $userId]);
        $row = $compStmt->fetch();
        $completed = (int)($row[0] ?? 0);
        $avgScore = round((float)($row[1] ?? 0), 1);
        $pct = $total > 0 ? round(($completed / $total) * 100) : 0;

        return [
            'total_lessons' => $total,
            'completed_lessons' => $completed,
            'completion_percentage' => $pct,
            'average_score' => $avgScore
        ];
    }
}
