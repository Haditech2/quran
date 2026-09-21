<?php

namespace App\Services;

class QiblaService {
    const KAABA_LAT = 21.422487;
    const KAABA_LNG = 39.826206;

    public static function calculate(float $userLat, float $userLng): array {
        $lat1 = deg2rad($userLat);
        $lng1 = deg2rad($userLng);
        $lat2 = deg2rad(self::KAABA_LAT);
        $lng2 = deg2rad(self::KAABA_LNG);

        $dLng = $lng2 - $lng1;

        // Bearing calculation
        $y = sin($dLng);
        $x = cos($lat1) * tan($lat2) - sin($lat1) * cos($dLng);
        $bearing = rad2deg(atan2($y, $x));
        $bearing = fmod($bearing + 360.0, 360.0);

        // Distance in kilometers (Haversine formula)
        $dLat = $lat2 - $lat1;
        $a = sin($dLat / 2) * sin($dLat / 2) + cos($lat1) * cos($lat2) * sin($dLng / 2) * sin($dLng / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        $distanceKm = round(6371 * $c, 1);

        // Compass direction label (e.g. NE, ENE)
        $directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        $idx = (int)round(fmod(($bearing + 11.25), 360.0) / 22.5);
        $directionLabel = $directions[$idx % 16];

        return [
            'latitude' => $userLat,
            'longitude' => $userLng,
            'qibla_bearing' => round($bearing, 2),
            'direction' => $directionLabel,
            'distance_km' => $distanceKm,
            'kaaba_coordinates' => ['latitude' => self::KAABA_LAT, 'longitude' => self::KAABA_LNG]
        ];
    }
}
