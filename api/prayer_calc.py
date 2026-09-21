import math
from datetime import datetime, date

NIGERIAN_CITIES = [
    {"name": "Abuja", "state": "FCT", "latitude": 9.0765, "longitude": 7.3986, "timezone": 1.0, "is_capital": True},
    {"name": "Lagos", "state": "Lagos", "latitude": 6.5244, "longitude": 3.3792, "timezone": 1.0, "is_capital": False},
    {"name": "Kano", "state": "Kano", "latitude": 12.0022, "longitude": 8.5920, "timezone": 1.0, "is_capital": False},
    {"name": "Kaduna", "state": "Kaduna", "latitude": 10.5105, "longitude": 7.4165, "timezone": 1.0, "is_capital": False},
    {"name": "Port Harcourt", "state": "Rivers", "latitude": 4.8156, "longitude": 7.0498, "timezone": 1.0, "is_capital": False},
    {"name": "Ibadan", "state": "Oyo", "latitude": 7.3775, "longitude": 3.9470, "timezone": 1.0, "is_capital": False},
    {"name": "Benin City", "state": "Edo", "latitude": 6.3350, "longitude": 5.6037, "timezone": 1.0, "is_capital": False},
    {"name": "Maiduguri", "state": "Borno", "latitude": 11.8311, "longitude": 13.1510, "timezone": 1.0, "is_capital": False},
    {"name": "Zaria", "state": "Kaduna", "latitude": 11.0855, "longitude": 7.7199, "timezone": 1.0, "is_capital": False},
    {"name": "Jos", "state": "Plateau", "latitude": 9.8965, "longitude": 8.8583, "timezone": 1.0, "is_capital": False},
    {"name": "Ilorin", "state": "Kwara", "latitude": 8.4799, "longitude": 4.5418, "timezone": 1.0, "is_capital": False},
    {"name": "Enugu", "state": "Enugu", "latitude": 6.4584, "longitude": 7.5464, "timezone": 1.0, "is_capital": False},
    {"name": "Abeokuta", "state": "Ogun", "latitude": 7.1475, "longitude": 3.3619, "timezone": 1.0, "is_capital": False},
    {"name": "Sokoto", "state": "Sokoto", "latitude": 13.0059, "longitude": 5.2476, "timezone": 1.0, "is_capital": False},
    {"name": "Keffi", "state": "Nasarawa", "latitude": 8.8471, "longitude": 7.8736, "timezone": 1.0, "is_capital": False}
]

CALCULATION_METHODS = [
    {"id": "MWL", "name": "Muslim World League", "fajr_angle": 18.0, "isha_angle": 17.0, "description": "Standard for Europe, Far East, and Nigeria."},
    {"id": "ISNA", "name": "Islamic Society of North America", "fajr_angle": 15.0, "isha_angle": 15.0, "description": "Standard in North America."},
    {"id": "Egypt", "name": "Egyptian General Authority of Survey", "fajr_angle": 19.5, "isha_angle": 17.5, "description": "Standard across Egypt, Africa, and parts of the Middle East."},
    {"id": "Makkah", "name": "Umm al-Qura University, Makkah", "fajr_angle": 18.5, "isha_interval": 90, "description": "Official calendar of Saudi Arabia."},
    {"id": "Karachi", "name": "University of Islamic Sciences, Karachi", "fajr_angle": 18.0, "isha_angle": 18.0, "description": "Standard in Pakistan, India, Bangladesh, and Afghanistan."}
]

HIJRI_MONTHS = [
    {"number": 1, "name_english": "Muharram", "name_arabic": "محرّم"},
    {"number": 2, "name_english": "Safar", "name_arabic": "صفر"},
    {"number": 3, "name_english": "Rabi' al-Awwal", "name_arabic": "ربيع الأوّل"},
    {"number": 4, "name_english": "Rabi' al-Thani", "name_arabic": "ربيع الثاني"},
    {"number": 5, "name_english": "Jumada al-Ula", "name_arabic": "جمادى الأولى"},
    {"number": 6, "name_english": "Jumada al-Thaniyah", "name_arabic": "جمادى الثانية"},
    {"number": 7, "name_english": "Rajab", "name_arabic": "رجب"},
    {"number": 8, "name_english": "Sha'ban", "name_arabic": "شعبان"},
    {"number": 9, "name_english": "Ramadan", "name_arabic": "رمضان"},
    {"number": 10, "name_english": "Shawwal", "name_arabic": "شوّال"},
    {"number": 11, "name_english": "Dhu al-Qi'dah", "name_arabic": "ذو القعدة"},
    {"number": 12, "name_english": "Dhu al-Hijjah", "name_arabic": "ذو الحجّة"}
]

def calculate_prayer_times(lat, lng, date_str=None, tz=1.0, method_name='MWL', asr_method='Standard'):
    if not date_str:
        dt = date.today()
    else:
        dt = datetime.strptime(date_str, '%Y-%m-%d').date()

    method = next((m for m in CALCULATION_METHODS if m['id'].upper() == method_name.upper()), CALCULATION_METHODS[0])
    fajr_angle = method.get('fajr_angle', 18.0)
    isha_angle = method.get('isha_angle', 17.0)

    # Day of year
    day_of_year = dt.timetuple().tm_yday

    # Approximate Solar Declination (degrees)
    gamma = 2 * math.pi / 365 * (day_of_year - 1)
    decl = 0.006918 - 0.399912 * math.cos(gamma) + 0.070257 * math.sin(gamma) - 0.006758 * math.cos(2*gamma) + 0.000907 * math.sin(2*gamma)
    decl_deg = math.degrees(decl)

    # Equation of Time in minutes
    eq_time = 229.18 * (0.000075 + 0.001868 * math.cos(gamma) - 0.032077 * math.sin(gamma) - 0.014615 * math.cos(2*gamma) - 0.040849 * math.sin(2*gamma))

    # Solar Noon (Dhuhr) in hours
    time_offset = eq_time + 4 * lng - 60 * tz
    solar_noon = (720 - time_offset) / 60.0

    phi = math.radians(lat)
    delta = decl

    def hour_angle(alpha_deg):
        alpha = math.radians(alpha_deg)
        cos_ha = (math.sin(alpha) - math.sin(phi) * math.sin(delta)) / (math.cos(phi) * math.cos(delta))
        if cos_ha > 1.0:
            return 0.0
        if cos_ha < -1.0:
            return 180.0
        return math.degrees(math.acos(cos_ha))

    # Fajr (-fajr_angle)
    ha_fajr = hour_angle(-fajr_angle)
    t_fajr = solar_noon - ha_fajr / 15.0

    # Sunrise (-0.833 degrees for refraction & semi-diameter)
    ha_sunrise = hour_angle(-0.833)
    t_sunrise = solar_noon - ha_sunrise / 15.0

    # Dhuhr
    t_dhuhr = solar_noon

    # Asr: shadow factor = 1 (Standard / Shafi'i, Maliki, Hanbali) or 2 (Hanafi)
    shadow_factor = 2.0 if asr_method.lower() == 'hanafi' else 1.0
    asr_altitude = math.degrees(math.atan(1.0 / (shadow_factor + math.tan(abs(phi - delta)))))
    ha_asr = hour_angle(asr_altitude)
    t_asr = solar_noon + ha_asr / 15.0

    # Maghrib (Sunset: -0.833 degrees)
    ha_sunset = hour_angle(-0.833)
    t_maghrib = solar_noon + ha_sunset / 15.0

    # Isha (-isha_angle)
    if 'isha_interval' in method:
        t_isha = t_maghrib + method['isha_interval'] / 60.0
    else:
        ha_isha = hour_angle(-isha_angle)
        t_isha = solar_noon + ha_isha / 15.0

    def fmt_time(t_hours):
        t_hours = t_hours % 24.0
        total_mins = int(round(t_hours * 60.0))
        h = (total_mins // 60) % 24
        m = total_mins % 60
        return f"{h:02d}:{m:02d}"

    return {
        "fajr": fmt_time(t_fajr),
        "sunrise": fmt_time(t_sunrise),
        "dhuhr": fmt_time(t_dhuhr),
        "asr": fmt_time(t_asr),
        "maghrib": fmt_time(t_maghrib),
        "isha": fmt_time(t_isha),
        "date": dt.strftime('%Y-%m-%d'),
        "method": method['name'],
        "asr_calculation": asr_method
    }

def get_current_and_next_prayer(times, current_time_str=None):
    if not current_time_str:
        now = datetime.now()
        current_time_str = now.strftime('%H:%M')

    cur_mins = time_to_minutes(current_time_str)
    order = [
        ("Fajr", times['fajr']),
        ("Sunrise", times['sunrise']),
        ("Dhuhr", times['dhuhr']),
        ("Asr", times['asr']),
        ("Maghrib", times['maghrib']),
        ("Isha", times['isha'])
    ]

    current_prayer = "Isha"
    next_prayer = "Fajr"
    next_time = times['fajr']
    min_diff = None

    for idx, (name, t_str) in enumerate(order):
        t_min = time_to_minutes(t_str)
        if cur_mins < t_min:
            next_prayer = name
            next_time = t_str
            min_diff = t_min - cur_mins
            current_prayer = order[idx - 1][0] if idx > 0 else "Isha"
            break

    if min_diff is None:
        # After Isha, next is tomorrow's Fajr
        next_prayer = "Fajr"
        next_time = times['fajr']
        fajr_min = time_to_minutes(times['fajr'])
        min_diff = (1440 - cur_mins) + fajr_min
        current_prayer = "Isha"

    h = min_diff // 60
    m = min_diff % 60
    countdown = f"in {h}h {m}m" if h > 0 else f"in {m}m"

    return {
        "current_prayer": current_prayer,
        "next_prayer": {
            "name": next_prayer,
            "time": next_time,
            "minutes_remaining": min_diff,
            "countdown_formatted": countdown
        }
    }

def time_to_minutes(t_str):
    parts = t_str.split(':')
    return int(parts[0]) * 60 + int(parts[1])

def calculate_qibla(lat, lng, city_name=None):
    kaaba_lat = 21.4225
    kaaba_lng = 39.8262

    phi1 = math.radians(lat)
    phi2 = math.radians(kaaba_lat)
    delta_lambda = math.radians(kaaba_lng - lng)

    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
    bearing_rad = math.atan2(y, x)
    bearing_deg = (math.degrees(bearing_rad) + 360.0) % 360.0

    # Spherical Great Circle distance in km
    earth_radius = 6371.0
    delta_phi = math.radians(kaaba_lat - lat)
    a = math.sin(delta_phi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    dist_km = earth_radius * c

    def get_compass_direction(deg):
        dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
        idx = int((deg + 11.25) / 22.5) % 16
        return dirs[idx]

    return {
        "city": city_name or "Custom Location",
        "latitude": lat,
        "longitude": lng,
        "qibla_bearing": round(bearing_deg, 2),
        "bearing_degrees": round(bearing_deg, 2),
        "direction": get_compass_direction(bearing_deg),
        "distance_km": round(dist_km, 1),
        "kaaba_coordinates": {"latitude": kaaba_lat, "longitude": kaaba_lng}
    }

def get_hijri_date(adj=0):
    today = date.today()
    y = today.year
    m = today.month
    d = today.day

    # Julian Day Number
    if m <= 2:
        y -= 1
        m += 12
    a = math.floor(y / 100)
    b = 2 - a + math.floor(a / 4)
    jd = math.floor(365.25 * (y + 4716)) + math.floor(30.6001 * (m + 1)) + d + b - 1524.5

    # Islamic Epoch Julian Day is 1948439.5
    days = jd - 1948439.5 + adj
    cycle = math.floor(days / 10631)
    rem = days % 10631
    h_year = cycle * 30 + math.floor((rem - 0.5) / 354.366) + 1
    day_in_year = rem - math.floor((h_year - 1 - cycle * 30) * 354.366)
    h_month = min(12, max(1, math.floor((day_in_year - 1) / 29.53058) + 1))
    h_day = max(1, min(30, math.floor(day_in_year - math.floor((h_month - 1) * 29.53058))))

    month_info = HIJRI_MONTHS[h_month - 1]
    return {
        "day": h_day,
        "month_number": h_month,
        "month_name_english": month_info['name_english'],
        "month_name_arabic": month_info['name_arabic'],
        "year": h_year,
        "formatted": f"{h_day} {month_info['name_english']} {h_year} AH",
        "gregorian_date": today.strftime('%Y-%m-%d')
    }

def get_islamic_events(hijri_year):
    return [
        {"name": "Islamic New Year (1st Muharram)", "hijri_date": f"1 Muharram {hijri_year}", "month": 1, "day": 1, "significance": "Start of the new Islamic calendar year."},
        {"name": "Day of Ashura", "hijri_date": f"10 Muharram {hijri_year}", "month": 1, "day": 10, "significance": "Day Allah saved Prophet Musa (AS) from Pharaoh."},
        {"name": "Mawlid an-Nabi (12th Rabi' al-Awwal)", "hijri_date": f"12 Rabi' al-Awwal {hijri_year}", "month": 3, "day": 12, "significance": "Birth of the final Messenger Muhammad ﷺ."},
        {"name": "Isra and Mi'raj (27th Rajab)", "hijri_date": f"27 Rajab {hijri_year}", "month": 7, "day": 27, "significance": "The miraculous Night Journey and Ascension."},
        {"name": "Nisfu Sha'ban (15th Sha'ban)", "hijri_date": f"15 Sha'ban {hijri_year}", "month": 8, "day": 15, "significance": "Mid-Sha'ban night of forgiveness and worship."},
        {"name": "First Day of Ramadan", "hijri_date": f"1 Ramadan {hijri_year}", "month": 9, "day": 1, "significance": "Beginning of the blessed month of obligatory fasting."},
        {"name": "Laylat al-Qadr (The Night of Decree)", "hijri_date": f"27 Ramadan {hijri_year}", "month": 9, "day": 27, "significance": "Better than a thousand months."},
        {"name": "Eid al-Fitr", "hijri_date": f"1 Shawwal {hijri_year}", "month": 10, "day": 1, "significance": "Celebration concluding the holy month of Ramadan."},
        {"name": "Day of Arafah", "hijri_date": f"9 Dhu al-Hijjah {hijri_year}", "month": 12, "day": 9, "significance": "Pivotal day of Hajj and supreme day of forgiveness."},
        {"name": "Eid al-Adha", "hijri_date": f"10 Dhu al-Hijjah {hijri_year}", "month": 12, "day": 10, "significance": "Feast of Sacrifice commemorating Prophet Ibrahim (AS)."}
    ]
