<?php

namespace App\Services;

use App\Config\Database;
use PDO;

class GlobalSearchService {
    public static function search(string $query, int $limitPerCategory = 5): array {
        $trimmed = trim($query);
        if (strlen($trimmed) < 2) {
            return [
                'query' => $query,
                'total_results' => 0,
                'categories' => []
            ];
        }

        $db = Database::getConnection();
        $term = '%' . $trimmed . '%';
        $results = [];
        $total = 0;

        // 1. Quran Surahs & Ayahs
        $qSurah = $db->prepare("
            SELECT number, name_english, name_arabic, total_ayahs, 'surah' as type
            FROM surahs
            WHERE name_english LIKE :q1 OR name_translation LIKE :q2 OR name_arabic LIKE :q3
            LIMIT :lim
        ");
        $qSurah->bindValue(':q1', $term, PDO::PARAM_STR);
        $qSurah->bindValue(':q2', $term, PDO::PARAM_STR);
        $qSurah->bindValue(':q3', $term, PDO::PARAM_STR);
        $qSurah->bindValue(':lim', $limitPerCategory, PDO::PARAM_INT);
        $qSurah->execute();
        $surahs = $qSurah->fetchAll();

        $qAyah = $db->prepare("
            SELECT a.surah_number, a.ayah_number, a.verse_key, a.text_arabic, a.text_translation, s.name_english as surah_name
            FROM ayahs a
            JOIN surahs s ON a.surah_id = s.id
            WHERE a.text_translation LIKE :q1 OR a.text_arabic LIKE :q2
            LIMIT :lim
        ");
        $qAyah->bindValue(':q1', $term, PDO::PARAM_STR);
        $qAyah->bindValue(':q2', $term, PDO::PARAM_STR);
        $qAyah->bindValue(':lim', $limitPerCategory, PDO::PARAM_INT);
        $qAyah->execute();
        $ayahs = $qAyah->fetchAll();

        $results['quran'] = array_merge($surahs, $ayahs);
        $total += count($results['quran']);

        // 2. Tafsir
        $qTafsir = $db->prepare("
            SELECT te.id, te.surah_number, te.ayah_number, te.verse_key, te.content, te.source_attribution, ts.name as source_name
            FROM tafsir_entries te
            JOIN tafsir_sources ts ON te.source_id = ts.id
            WHERE te.content LIKE :q
            LIMIT :lim
        ");
        $qTafsir->bindValue(':q', $term, PDO::PARAM_STR);
        $qTafsir->bindValue(':lim', $limitPerCategory, PDO::PARAM_INT);
        $qTafsir->execute();
        $results['tafsir'] = $qTafsir->fetchAll();
        $total += count($results['tafsir']);

        // 3. Hadith
        $qHadith = $db->prepare("
            SELECT hi.id, hi.hadith_number, hi.chapter_name, hi.text_arabic, hi.translation, hi.reference, hc.name as collection_name
            FROM hadith_items hi
            JOIN hadith_collections hc ON hi.collection_id = hc.id
            WHERE hi.translation LIKE :q1 OR hi.text_arabic LIKE :q2 OR hi.chapter_name LIKE :q3
            LIMIT :lim
        ");
        $qHadith->bindValue(':q1', $term, PDO::PARAM_STR);
        $qHadith->bindValue(':q2', $term, PDO::PARAM_STR);
        $qHadith->bindValue(':q3', $term, PDO::PARAM_STR);
        $qHadith->bindValue(':lim', $limitPerCategory, PDO::PARAM_INT);
        $qHadith->execute();
        $results['hadith'] = $qHadith->fetchAll();
        $total += count($results['hadith']);

        // 4. Duas
        $qDua = $db->prepare("
            SELECT di.id, di.title, di.text_arabic, di.translation, di.reference, dc.name as category_name
            FROM dua_items di
            JOIN dua_categories dc ON di.category_id = dc.id
            WHERE di.title LIKE :q1 OR di.translation LIKE :q2 OR di.text_arabic LIKE :q3
            LIMIT :lim
        ");
        $qDua->bindValue(':q1', $term, PDO::PARAM_STR);
        $qDua->bindValue(':q2', $term, PDO::PARAM_STR);
        $qDua->bindValue(':q3', $term, PDO::PARAM_STR);
        $qDua->bindValue(':lim', $limitPerCategory, PDO::PARAM_INT);
        $qDua->execute();
        $results['duas'] = $qDua->fetchAll();
        $total += count($results['duas']);

        // 5. Adhkar
        $qAdhkar = $db->prepare("
            SELECT ai.id, ai.text_arabic, ai.translation, ai.virtue, ai.reference, ac.name as category_name
            FROM adhkar_items ai
            JOIN adhkar_categories ac ON ai.category_id = ac.id
            WHERE ai.translation LIKE :q1 OR ai.text_arabic LIKE :q2 OR ai.virtue LIKE :q3
            LIMIT :lim
        ");
        $qAdhkar->bindValue(':q1', $term, PDO::PARAM_STR);
        $qAdhkar->bindValue(':q2', $term, PDO::PARAM_STR);
        $qAdhkar->bindValue(':q3', $term, PDO::PARAM_STR);
        $qAdhkar->bindValue(':lim', $limitPerCategory, PDO::PARAM_INT);
        $qAdhkar->execute();
        $results['adhkar'] = $qAdhkar->fetchAll();
        $total += count($results['adhkar']);

        // 6. Tajweed Lessons
        $qTaj = $db->prepare("
            SELECT tl.id, tl.title, tl.title_arabic, tl.summary, tc.name as category_name
            FROM tajweed_lessons tl
            JOIN tajweed_categories tc ON tl.category_id = tc.id
            WHERE tl.title LIKE :q1 OR tl.summary LIKE :q2 OR tl.content LIKE :q3
            LIMIT :lim
        ");
        $qTaj->bindValue(':q1', $term, PDO::PARAM_STR);
        $qTaj->bindValue(':q2', $term, PDO::PARAM_STR);
        $qTaj->bindValue(':q3', $term, PDO::PARAM_STR);
        $qTaj->bindValue(':lim', $limitPerCategory, PDO::PARAM_INT);
        $qTaj->execute();
        $results['tajweed'] = $qTaj->fetchAll();
        $total += count($results['tajweed']);

        // 7. Tawhid Lessons
        $qTaw = $db->prepare("
            SELECT tl.id, tl.title, tl.introduction, tl.key_points, tc.name as category_name
            FROM tawhid_lessons tl
            JOIN tawhid_categories tc ON tl.category_id = tc.id
            WHERE tl.title LIKE :q1 OR tl.introduction LIKE :q2 OR tl.main_lesson LIKE :q3
            LIMIT :lim
        ");
        $qTaw->bindValue(':q1', $term, PDO::PARAM_STR);
        $qTaw->bindValue(':q2', $term, PDO::PARAM_STR);
        $qTaw->bindValue(':q3', $term, PDO::PARAM_STR);
        $qTaw->bindValue(':lim', $limitPerCategory, PDO::PARAM_INT);
        $qTaw->execute();
        $results['tawhid'] = $qTaw->fetchAll();
        $total += count($results['tawhid']);

        $flatList = [];
        foreach ($results as $catKey => $items) {
            foreach ($items as $item) {
                $flatList[] = array_merge($item, ['search_category' => $catKey]);
            }
        }

        return [
            'query' => $query,
            'total_results' => $total,
            'categories' => $results,
            'results' => $flatList
        ];
    }
}
