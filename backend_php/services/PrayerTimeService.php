<?php

namespace App\Services;

use App\Config\Database;
use PDO;

class PrayerTimeService {
    public static function getNigerianCities(): array {
        return [
            ['name' => 'Abuja', 'state' => 'FCT', 'latitude' => 9.0765, 'longitude' => 7.3986, 'timezone' => 1],
            ['name' => 'Lagos', 'state' => 'Lagos', 'latitude' => 6.5244, 'longitude' => 3.3792, 'timezone' => 1],
            ['name' => 'Kano', 'state' => 'Kano', 'latitude' => 12.0022, 'longitude' => 8.5920, 'timezone' => 1],
            ['name' => 'Kaduna', 'state' => 'Kaduna', 'latitude' => 10.5105, 'longitude' => 7.4165, 'timezone' => 1],
            ['name' => 'Jos', 'state' => 'Plateau', 'latitude' => 9.8965, 'longitude' => 8.8583, 'timezone' => 1],
            ['name' => 'Keffi', 'state' => 'Nasarawa', 'latitude' => 8.8471, 'longitude' => 7.8736, 'timezone' => 1],
            ['name' => 'Port Harcourt', 'state' => 'Rivers', 'latitude' => 4.8156, 'longitude' => 7.0498, 'timezone' => 1],
            ['name' => 'Enugu', 'state' => 'Enugu', 'latitude' => 6.4584, 'longitude' => 7.5464, 'timezone' => 1],
            ['name' => 'Ibadan', 'state' => 'Oyo', 'latitude' => 7.3775, 'longitude' => 3.9470, 'timezone' => 1],
            ['name' => 'Ilorin', 'state' => 'Kwara', 'latitude' => 8.4799, 'longitude' => 4.5418, 'timezone' => 1],
            ['name' => 'Maiduguri', 'state' => 'Borno', 'latitude' => 11.8333, 'longitude' => 13.1500, 'timezone' => 1],
            ['name' => 'Sokoto', 'state' => 'Sokoto', 'latitude' => 13.0609, 'longitude' => 5.2341, 'timezone' => 1]
        ];
    }

    public static function getCalculationMethods(): array {
        return [
            'MWL' => ['name' => 'Muslim World League', 'fajr_angle' => 18.0, 'isha_angle' => 17.0],
            'Egyptian' => ['name' => 'Egyptian General Authority of Survey', 'fajr_angle' => 19.5, 'isha_angle' => 17.5],
            'ISNA' => ['name' => 'Islamic Society of North America', 'fajr_angle' => 15.0, 'isha_angle' => 15.0],
            'UmmAlQura' => ['name' => 'Umm al-Qura University, Makkah', 'fajr_angle' => 18.5, 'isha_interval' => 90],
            'Karachi' => ['name' => 'University of Islamic Sciences, Karachi', 'fajr_angle' => 18.0, 'isha_angle' => 18.0]
        ];
    }

    /**
     * Compute astronomical solar prayer times for a specific date and coordinates.
     */
    public static function calculate(
        float $lat,
        float $lng,
        string $dateStr, // YYYY-MM-DD
        float $timezone = 1.0,
        string $method = 'MWL',
        string $asrJuristic = 'Standard'
    ): array {
        $methods = self::getCalculationMethods();
        $params = $methods[$method] ?? $methods['MWL'];

        $time = strtotime($dateStr);
        $year = (int)date('Y', $time);
        $month = (int)date('m', $time);
        $day = (int)date('d', $time);

        // Julian Date
        if ($month <= 2) {
            $year -= 1;
            $month += 12;
        }
        $a = floor($year / 100);
        $b = 2 - $a + floor($a / 4);
        $jd = floor(365.25 * ($year + 4716)) + floor(30.6001 * ($month + 1)) + $day + $b - 1524.5;

        // D: Days since J2000.0
        $d = $jd - 2451545.0;

        // Solar coordinates
        $g = fmod(357.529 + 0.98560028 * $d, 360.0);
        $q = fmod(280.459 + 0.98564736 * $d, 360.0);
        $l = fmod($q + 1.915 * sin(deg2rad($g)) + 0.020 * sin(deg2rad(2 * $g)), 360.0);
        $e = 23.439 - 0.00000036 * $d;

        $ra = rad2deg(atan2(cos(deg2rad($e)) * sin(deg2rad($l)), cos(deg2rad($l)))) / 15.0;
        if ($ra < 0) $ra += 24.0;

        $dec = rad2deg(asin(sin(deg2rad($e)) * sin(deg2rad($l))));
        $eqt = ($q / 15.0) - $ra;

        // Solar Noon (Dhuhr)
        $noon = 12.0 + $timezone - ($lng / 15.0) - $eqt;
        while ($noon < 0) $noon += 24.0;
        while ($noon >= 24) $noon -= 24.0;

        // Helper to compute hour angle for an altitude angle
        $hourAngle = function(float $angle) use ($lat, $dec) {
            $cosH = (sin(deg2rad($angle)) - sin(deg2rad($lat)) * sin(deg2rad($dec))) /
                    (cos(deg2rad($lat)) * cos(deg2rad($dec)));
            if ($cosH > 1.0 || $cosH < -1.0) return null;
            return rad2deg(acos($cosH)) / 15.0;
        };

        // Sunrise & Sunset (Angle = -0.8333 degrees for atmospheric refraction)
        $sunH = $hourAngle(-0.8333);
        $sunrise = $sunH !== null ? $noon - $sunH : 6.0;
        $sunset = $sunH !== null ? $noon + $sunH : 18.25;

        // Fajr
        $fajrAngle = -$params['fajr_angle'];
        $fajrH = $hourAngle($fajrAngle);
        $fajr = $fajrH !== null ? $noon - $fajrH : $sunrise - 1.5;

        // Asr (Shadow ratio: 1 for Shafi/Standard, 2 for Hanafi)
        $shadowRatio = strtolower($asrJuristic) === 'hanafi' ? 2 : 1;
        $diff = abs($lat - $dec);
        $asrAlt = rad2deg(atan(1.0 / ($shadowRatio + tan(deg2rad($diff)))));
        $asrH = $hourAngle($asrAlt);
        $asr = $asrH !== null ? $noon + $asrH : $noon + 3.25;

        // Maghrib
        $maghrib = $sunset + (3.0 / 60.0); // 3 mins after sunset

        // Isha
        if (isset($params['isha_interval'])) {
            $isha = $maghrib + ($params['isha_interval'] / 60.0);
        } else {
            $ishaAngle = -$params['isha_angle'];
            $ishaH = $hourAngle($ishaAngle);
            $isha = $ishaH !== null ? $noon + $ishaH : $maghrib + 1.5;
        }

        $formatTime = function(float $t) {
            while ($t < 0) $t += 24;
            while ($t >= 24) $t -= 24;
            $h = floor($t);
            $m = round(($t - $h) * 60);
            if ($m >= 60) {
                $h += 1;
                $m -= 60;
            }
            return sprintf('%02d:%02d', (int)$h % 24, (int)$m);
        };

        return [
            'date' => $dateStr,
            'fajr' => $formatTime($fajr),
            'sunrise' => $formatTime($sunrise),
            'dhuhr' => $formatTime($noon + (2.0 / 60.0)), // Add 2 minutes past solar noon
            'asr' => $formatTime($asr),
            'maghrib' => $formatTime($maghrib),
            'isha' => $formatTime($isha),
            'coordinates' => ['latitude' => $lat, 'longitude' => $lng],
            'method' => $params['name'],
            'juristic' => $asrJuristic
        ];
    }

    /**
     * Compute current prayer and upcoming prayer with countdown seconds.
     */
    public static function getCurrentAndNext(array $times, ?string $currentTime = null): array {
        $now = $currentTime ? strtotime($currentTime) : time();
        $date = $times['date'];

        $prayers = [
            ['name' => 'Fajr', 'time' => $times['fajr']],
            ['name' => 'Sunrise', 'time' => $times['sunrise']],
            ['name' => 'Dhuhr', 'time' => $times['dhuhr']],
            ['name' => 'Asr', 'time' => $times['asr']],
            ['name' => 'Maghrib', 'time' => $times['maghrib']],
            ['name' => 'Isha', 'time' => $times['isha']],
        ];

        $current = 'Isha';
        $next = 'Fajr';
        $nextTimeTimestamp = strtotime("{$date} {$times['fajr']}") + 86400; // Tomorrow's Fajr default

        for ($i = 0; $i < count($prayers); $i++) {
            $pTime = strtotime("{$date} {$prayers[$i]['time']}");
            if ($now < $pTime) {
                $next = $prayers[$i]['name'];
                $nextTimeTimestamp = $pTime;
                $current = $i > 0 ? $prayers[$i - 1]['name'] : 'Isha (Previous)';
                break;
            }
            $current = $prayers[$i]['name'];
        }

        $countdown = max(0, $nextTimeTimestamp - $now);

        return [
            'current_prayer' => $current,
            'next_prayer' => $next,
            'countdown_seconds' => $countdown,
            'countdown_formatted' => sprintf('%02dh %02dm', floor($countdown / 3600), floor(($countdown % 3600) / 60))
        ];
    }

    public static function getMonthly(
        float $lat,
        float $lng,
        int $year,
        int $month,
        float $timezone = 1.0,
        string $method = 'MWL',
        string $asrJuristic = 'Standard'
    ): array {
        $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $year);
        $schedule = [];
        for ($d = 1; $d <= $daysInMonth; $d++) {
            $dateStr = sprintf('%04d-%02d-%02d', $year, $month, $d);
            $schedule[] = self::calculate($lat, $lng, $dateStr, $timezone, $method, $asrJuristic);
        }
        return $schedule;
    }

    public static function getUserSettings(int $userId): array {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM prayer_settings WHERE user_id = :uid");
        $stmt->execute(['uid' => $userId]);
        $res = $stmt->fetch();

        if (!$res) {
            $init = $db->prepare("
                INSERT INTO prayer_settings (user_id, city, country, latitude, longitude, calculation_method, asr_juristic, time_format)
                VALUES (:uid, 'Abuja', 'Nigeria', 9.0765, 7.3986, 'MWL', 'Standard', '12h')
            ");
            $init->execute(['uid' => $userId]);
            return self::getUserSettings($userId);
        }
        return $res;
    }

    public static function updateUserSettings(int $userId, array $data): array {
        $db = Database::getConnection();
        $fields = [
            'city', 'country', 'latitude', 'longitude', 'calculation_method', 'asr_juristic',
            'time_format', 'adhan_audio', 'fajr_notification', 'fajr_adhan',
            'dhuhr_notification', 'dhuhr_adhan', 'asr_notification', 'asr_adhan',
            'maghrib_notification', 'maghrib_adhan', 'isha_notification', 'isha_adhan'
        ];
        $updates = [];
        $params = ['uid' => $userId];

        foreach ($fields as $f) {
            if (isset($data[$f])) {
                $updates[] = "{$f} = :{$f}";
                $params[$f] = $data[$f];
            }
        }

        if (!empty($updates)) {
            $sql = "UPDATE prayer_settings SET " . implode(', ', $updates) . ", updated_at = CURRENT_TIMESTAMP WHERE user_id = :uid";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
        }

        return self::getUserSettings($userId);
    }
}
