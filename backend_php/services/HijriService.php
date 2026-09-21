<?php

namespace App\Services;

class HijriService {
    public static function getHijriMonths(): array {
        return [
            1 => ['name' => 'Muharram', 'name_arabic' => 'مُحَرَّم'],
            2 => ['name' => 'Safar', 'name_arabic' => 'صَفَر'],
            3 => ['name' => 'Rabi al-Awwal', 'name_arabic' => 'رَبِيع الأَوَّل'],
            4 => ['name' => 'Rabi al-Thani', 'name_arabic' => 'رَبِيع الآخِر'],
            5 => ['name' => 'Jumada al-Awwal', 'name_arabic' => 'جُمَادَى الأُولَى'],
            6 => ['name' => 'Jumada al-Thani', 'name_arabic' => 'جُمَادَى الآخِرَة'],
            7 => ['name' => 'Rajab', 'name_arabic' => 'رَجَب'],
            8 => ['name' => 'Sha\'ban', 'name_arabic' => 'شَعْبَان'],
            9 => ['name' => 'Ramadan', 'name_arabic' => 'رَمَضَان'],
            10 => ['name' => 'Shawwal', 'name_arabic' => 'شَوَّال'],
            11 => ['name' => 'Dhu al-Qi\'dah', 'name_arabic' => 'ذُو القَعْدَة'],
            12 => ['name' => 'Dhu al-Hijjah', 'name_arabic' => 'ذُو الحِجَّة']
        ];
    }

    /**
     * Accurate algorithmic Gregorian to Hijri conversion with manual adjustment support.
     */
    public static function gregorianToHijri(int $year, int $month, int $day, int $adjustment = 0): array {
        // Julian Day calculation
        if ($month <= 2) {
            $year -= 1;
            $month += 12;
        }
        $a = floor($year / 100);
        $b = 2 - $a + floor($a / 4);
        $jd = floor(365.25 * ($year + 4716)) + floor(30.6001 * ($month + 1)) + $day + $b - 1524.5;

        // Apply custom moon-sighting adjustment (+1 or -1 or 0)
        $jd += $adjustment;

        // Julian Days since Hijri epoch (July 16, 622 CE = JD 1948439.5)
        $l = $jd - 1948440 + 10632;
        $n = floor(($l - 1) / 10631);
        $l = $l - 10631 * $n + 354;
        $j = (floor((10985 - $l) / 5316)) * (floor((50 * $l) / 17719)) + (floor($l / 5670)) * (floor((43 * $l) / 15238));
        $l = $l - (floor((30 - $j) / 15)) * (floor((17719 * $j) / 50)) - (floor($j / 16)) * (floor((15238 * $j) / 43)) + 29;
        $m = floor((24 * $l) / 709);
        $d = $l - floor((709 * $m) / 24);
        $y = 30 * $n + $j - 30;

        $hDay = (int)$d;
        $hMonth = (int)$m;
        $hYear = (int)$y;

        $months = self::getHijriMonths();
        $monthInfo = $months[$hMonth] ?? ['name' => 'Month ' . $hMonth, 'name_arabic' => ''];

        return [
            'day' => $hDay,
            'month' => $hMonth,
            'year' => $hYear,
            'month_name' => $monthInfo['name'],
            'month_name_arabic' => $monthInfo['name_arabic'],
            'formatted' => "{$hDay} {$monthInfo['name']} {$hYear} AH",
            'formatted_arabic' => "{$hDay} {$monthInfo['name_arabic']} {$hYear} هـ"
        ];
    }

    public static function getToday(int $adjustment = 0): array {
        $now = time();
        $y = (int)date('Y', $now);
        $m = (int)date('m', $now);
        $d = (int)date('d', $now);
        $hijri = self::gregorianToHijri($y, $m, $d, $adjustment);
        $hijri['gregorian'] = date('l, j F Y', $now);
        return $hijri;
    }

    public static function getIslamicEvents(int $hijriYear): array {
        return [
            ['title' => 'Islamic New Year', 'date' => "1 Muharram {$hijriYear}", 'hijri_month' => 1, 'hijri_day' => 1, 'description' => 'The beginning of the new Hijri calendar year.'],
            ['title' => 'Day of Ashura', 'date' => "10 Muharram {$hijriYear}", 'hijri_month' => 1, 'hijri_day' => 10, 'description' => 'Day of fasting and commemoration of Prophet Musa (AS) and salvation from Pharaoh.'],
            ['title' => 'Start of Ramadan', 'date' => "1 Ramadan {$hijriYear}", 'hijri_month' => 9, 'hijri_day' => 1, 'description' => 'First day of the holy month of fasting and revelation of the Qur\'an.'],
            ['title' => 'Laylat al-Qadr (The Night of Decree)', 'date' => "27 Ramadan {$hijriYear}", 'hijri_month' => 9, 'hijri_day' => 27, 'description' => 'Better than a thousand months; night of immense mercy and forgiveness.'],
            ['title' => 'Eid al-Fitr', 'date' => "1 Shawwal {$hijriYear}", 'hijri_month' => 10, 'hijri_day' => 1, 'description' => 'Islamic celebration marking the end of the Ramadan fast.'],
            ['title' => 'Day of Arafah', 'date' => "9 Dhu al-Hijjah {$hijriYear}", 'hijri_month' => 12, 'hijri_day' => 9, 'description' => 'Pinnacle of Hajj pilgrimage on Mount Arafah; day of fasting for non-pilgrims.'],
            ['title' => 'Eid al-Adha', 'date' => "10 Dhu al-Hijjah {$hijriYear}", 'hijri_month' => 12, 'hijri_day' => 10, 'description' => 'Feast of the Sacrifice commemorating Prophet Ibrahim\'s devotion.']
        ];
    }
}
