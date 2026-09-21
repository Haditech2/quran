import json
import urllib.request
import urllib.parse
import sys

BASE_URL = "http://127.0.0.1:5000"

def get(path):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers={'Accept': 'application/json'})
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return {"error": True, "code": e.code, "json": json.loads(body)}
        except Exception:
            return {"error": True, "code": e.code, "body": body}

def post(path, data, token=None):
    url = f"{BASE_URL}{path}"
    encoded = json.dumps(data).encode('utf-8')
    headers = {'Content-Type': 'application/json', 'Accept': 'application/json'}
    if token:
        headers['Authorization'] = f"Bearer {token}"
    req = urllib.request.Request(url, data=encoded, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return {"error": True, "code": e.code, "json": json.loads(body)}
        except Exception:
            return {"error": True, "code": e.code, "body": body}

passed = 0
failed = 0

def assert_test(name, condition, extra=""):
    global passed, failed
    if condition:
        print(f"  [PASS] {name} {extra}")
        passed += 1
    else:
        print(f"  [FAIL] {name} {extra}")
        failed += 1

print("=" * 60)
print("FLASK BACKEND (VERCEL-READY) PLATFORM INTEGRATION TESTS")
print("=" * 60)

# 1. Platform Overview
print("\n--- 1. Platform Overview & Unified Dashboard ---")
d = get("/api/dashboard/overview")
assert_test("Overview Dashboard HTTP 200", not d.get("error"))
assert_test("Overview contains Tajweed stats", "tajweed" in d.get("data", {}))
assert_test("Overview contains Next Prayer", "next_prayer" in d.get("data", {}))
assert_test("Overview contains Hijri date", "hijri" in d.get("data", {}))

# 2. Tajweed Module
print("\n--- 2. Tajweed Rules & Lessons ---")
cats = get("/api/tajweed/categories")
assert_test("Tajweed Categories returned", len(cats.get("data", [])) >= 4, f"Count: {len(cats.get('data', []))}")
cat_id = cats.get("data", [{}])[0].get("id", 1)

lessons = get(f"/api/tajweed/lessons?category_id={cat_id}")
assert_test("Tajweed Lessons for Category", len(lessons.get("data", [])) > 0)

ayah_tajweed = get("/api/tajweed/ayah?surah=1&ayah=1")
assert_test("Ayah Tajweed lookup (1:1)", "detected_rules" in ayah_tajweed.get("data", {}))

quiz = get("/api/tajweed/quiz?lesson_id=1")
assert_test("Tajweed Quiz Questions", len(quiz.get("data", [])) > 0)

# 3. Tafsir Module
print("\n--- 3. Tafsir Exegesis ---")
sources = get("/api/tafsir/sources")
assert_test("Tafsir Sources list", len(sources.get("data", [])) >= 3)

tafsir_entry = get("/api/tafsir/ayah?surah=1&ayah=1&source=ibn_kathir")
assert_test("Tafsir 1:1 Ibn Kathir lookup", "tafsir_text" in tafsir_entry.get("data", {}))
assert_test("Tafsir contains Arabic text", bool(tafsir_entry.get("data", {}).get("text_arabic")))

search_tafsir = get("/api/tafsir/search?query=Praise")
assert_test("Tafsir search for 'Praise'", len(search_tafsir.get("data", [])) > 0)

# 4. Tawhid & 'Aqeedah Module
print("\n--- 4. Tawhid & 'Aqeedah Curriculum ---")
tawhid_cats = get("/api/tawhid/categories")
assert_test("Tawhid Categories", len(tawhid_cats.get("data", [])) >= 4)

t_lessons = get("/api/tawhid/lessons?category_id=1")
assert_test("Tawhid Lessons for Rububiyyah", len(t_lessons.get("data", [])) > 0)
assert_test("Tawhid Lesson has Quran evidence", bool(t_lessons.get("data", [{}])[0].get("evidence_quran")))

t_quiz = get("/api/tawhid/quiz?lesson_id=1")
assert_test("Tawhid Quiz questions", len(t_quiz.get("data", [])) > 0)

# 5. Prayer Times & Nigerian Presets
print("\n--- 5. Prayer Times & Astronomical Calculations ---")
cities = get("/api/prayer/cities")
assert_test("Nigerian Cities Presets", len(cities.get("data", [])) >= 12)

for city in ["Abuja", "Lagos", "Kano", "Kaduna", "Port Harcourt", "Enugu", "Jos", "Keffi"]:
    city_encoded = urllib.parse.quote(city)
    pt = get(f"/api/prayer/times?city={city_encoded}")
    times = pt.get("data", {}).get("times", pt.get("data", {}))
    has_times = all(k in times for k in ["fajr", "dhuhr", "asr", "maghrib", "isha"])
    assert_test(f"Prayer times for {city}", has_times, f"Fajr: {times.get('fajr')}, Asr: {times.get('asr')}")

# 6. Qibla Finder
print("\n--- 6. Qibla Direction Finder ---")
q_abuja = get("/api/qibla/calculate?latitude=9.0765&longitude=7.3986&city=Abuja")
data = q_abuja.get("data", {})
bearing = data.get("bearing_degrees")
dist = data.get("distance_km")
assert_test("Qibla bearing for Abuja (~64.6°)", bearing and 60 <= bearing <= 70, f"Bearing: {bearing}°")
assert_test("Distance from Abuja to Makkah (~3729 km)", dist and 3600 <= dist <= 4000, f"Distance: {dist} km")

# 7. Daily Adhkar
print("\n--- 7. Daily Adhkar & Remembrance ---")
for cat in ["morning", "evening", "after_salah", "sleep"]:
    adhkar = get(f"/api/adhkar/items?category={cat}")
    assert_test(f"Adhkar items for {cat}", len(adhkar.get("data", [])) > 0, f"Count: {len(adhkar.get('data', []))}")

# 8. Duas & Supplications
print("\n--- 8. Duas & Supplications (Hisn al-Muslim) ---")
dua_cats = get("/api/duas/categories")
assert_test("Dua categories", len(dua_cats.get("data", [])) >= 4)

daily_duas = get("/api/duas/items?category=daily")
assert_test("Daily Duas", len(daily_duas.get("data", [])) > 0)

dua_search = get("/api/duas/search?query=protection")
assert_test("Dua search for 'protection'", len(dua_search.get("data", [])) > 0)

# 9. Hadith Library
print("\n--- 9. Hadith Library ---")
nawawi = get("/api/hadith/items?collection=nawawi40")
assert_test("40 Hadith Nawawi items", len(nawawi.get("data", [])) > 0)

bukhari = get("/api/hadith/items?collection=bukhari")
assert_test("Sahih Bukhari selections", len(bukhari.get("data", [])) > 0)

hadith_search = get("/api/hadith/search?query=intentions")
assert_test("Hadith search for 'intentions'", len(hadith_search.get("data", [])) > 0)

# 10. 99 Names of Allah
print("\n--- 10. 99 Names of Allah ---")
names = get("/api/names-of-allah/all")
assert_test("99 Names of Allah count", len(names.get("data", [])) == 99, f"Count: {len(names.get('data', []))}")

first_name = get("/api/names-of-allah/item?number=1")
assert_test("Name #1 is Ar-Rahman", first_name.get("data", {}).get("name_english") == "Ar-Rahman")

# 11. Hijri Calendar
print("\n--- 11. Hijri Calendar & Milestones ---")
h_today = get("/api/hijri/today")
assert_test("Today's Hijri Date returned", bool(h_today.get("data", {}).get("day")))

h_events = get("/api/hijri/events")
assert_test("Islamic events list", len(h_events.get("data", [])) >= 6)

# 12. Global Search
print("\n--- 12. Multi-Module Global Search ---")
for term in ["Allah", "prayer", "patience"]:
    gs = get(f"/api/search/global?query={term}")
    results = gs.get("data", {}).get("results", [])
    assert_test(f"Global search for '{term}'", len(results) > 0, f"Found: {len(results)} matches across modules")

# 13. Unified Bookmarks Toggle
print("\n--- 13. Unified Bookmarks System ---")
bm_toggle = post("/api/bookmarks/toggle", {
    "item_type": "hadith",
    "item_id": "1",
    "title": "Hadith 1: Actions by Intentions",
    "content_snippet": "Actions are judged by motives and intentions..."
})
assert_test("Bookmark Toggle success", bm_toggle.get("data", {}).get("success") is True)
if not bm_toggle.get("data", {}).get("is_bookmarked"):
    post("/api/bookmarks/toggle", {
        "item_type": "hadith",
        "item_id": "1",
        "title": "Hadith 1: Actions by Intentions",
        "content_snippet": "Actions are judged by motives and intentions..."
    })

bm_list = get("/api/bookmarks/all")
assert_test("Unified Bookmarks list retrieved", len(bm_list.get("data", [])) >= 1)

# 14. Quran Memorization & SRS
print("\n--- 14. Quran Memorization & SRS Endpoints ---")
mem_res = post("/api/memorization/ayah/1/memorized", {})
assert_test("Mark Ayah Memorized (1)", mem_res.get("data", {}).get("strength_score") == 85)

diff_res = post("/api/memorization/ayah/2/difficult", {})
assert_test("Mark Ayah Difficult (2)", diff_res.get("data", {}).get("strength_score") == 40)

queue_res = get("/api/revision/queue")
assert_test("Revision Queue retrieved", isinstance(queue_res.get("data"), list))

grade_res = post("/api/revision/result", {"ayah_id": 1, "grade": "correct"})
assert_test("Submit Revision Grade", grade_res.get("data", {}).get("new_strength") is not None)

weak_res = get("/api/revision/weak-verses")
assert_test("Weak Verses retrieved", isinstance(weak_res.get("data"), list))

dash_res = get("/api/progress/dashboard")
assert_test("Progress Dashboard retrieved", dash_res.get("data", {}).get("total_quran_ayahs") == 6236)

print("\n" + "=" * 60)
print(f"TOTAL TESTS: {passed + failed} | PASSED: {passed} | FAILED: {failed}")
print("=" * 60)

if failed > 0:
    sys.exit(1)
else:
    sys.exit(0)
