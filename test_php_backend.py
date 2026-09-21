import requests

BASE_URL = "http://127.0.0.1:8000/api"

def test_php():
    print("=== 1. Testing PHP Registration ===")
    import time
    uname = f"khalid_{int(time.time())}"
    reg_data = {
        "username": uname,
        "email": f"{uname}@example.com",
        "password": "Password123!",
        "name": "Khalid Ibn Walid"
    }
    res = requests.post(f"{BASE_URL}/auth/register", json=reg_data)
    print(f"Register: {res.status_code}")
    assert res.status_code == 201, f"Registration failed: {res.text}"

    print("=== 2. Testing PHP Login ===")
    res = requests.post(f"{BASE_URL}/auth/login", json={"identifier": f"{uname}@example.com", "password": "Password123!"})
    print(f"Login: {res.status_code}")
    assert res.status_code == 200, f"Login failed: {res.text}"
    token = res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    print("=== 3. Testing PHP Quran Retrieval ===")
    res = requests.get(f"{BASE_URL}/quran/surahs")
    assert res.status_code == 200
    surahs = res.json()["data"]
    print(f"Surahs loaded: {len(surahs)}. First: {surahs[0]['name_english']}")

    res = requests.get(f"{BASE_URL}/quran/surahs/1?include_ayahs=true")
    assert res.status_code == 200
    s1 = res.json()["data"]
    print(f"Surah 1: {s1['name_english']} has {len(s1['ayahs'])} ayahs.")

    print("=== 4. Testing PHP Hifz Plan ===")
    plan_data = {
        "title": "PHP Memorize Juz Amma",
        "start_surah": 1,
        "start_ayah": 1,
        "end_surah": 1,
        "end_ayah": 7,
        "ayahs_per_day": 4,
        "days_per_week": 6
    }
    res = requests.post(f"{BASE_URL}/plans", json=plan_data, headers=headers)
    assert res.status_code == 201
    print(f"Created Plan: {res.json()['data']['title']}")

    res = requests.get(f"{BASE_URL}/plans/active", headers=headers)
    assert res.status_code == 200
    act_plan = res.json()["data"]
    print(f"Active Plan: {act_plan['title']}, Remaining: {act_plan['remaining_ayahs']}")

    print("=== 5. Testing PHP Memorization Session & Grading ===")
    res = requests.post(f"{BASE_URL}/memorization/start", json={"surah_number": 1, "start_ayah": 1, "end_ayah": 4}, headers=headers)
    assert res.status_code == 200
    print(f"Practice started on {len(res.json()['data']['ayahs'])} ayahs.")

    ayah1_id = s1['ayahs'][0]['id']
    res = requests.post(f"{BASE_URL}/memorization/ayah/{ayah1_id}/memorized", json={"strength": 85.0}, headers=headers)
    assert res.status_code == 200
    print(f"Ayah 1:1 marked memorized, strength: {res.json()['data']['progress']['strength_score']}%")

    print("=== 6. Testing PHP Muraja'ah Revision Workflow ===")
    res = requests.post(f"{BASE_URL}/revision/start", json={"session_type": "scheduled"}, headers=headers)
    assert res.status_code == 200
    sess_id = res.json()["data"]["id"]

    res = requests.post(f"{BASE_URL}/revision/result", json={"ayah_id": ayah1_id, "grade": "correct", "session_id": sess_id}, headers=headers)
    assert res.status_code == 200
    print(f"Graded correct: strength before {res.json()['data']['strength_before']}% -> after {res.json()['data']['strength_after']}%")

    res = requests.post(f"{BASE_URL}/revision/complete", json={"session_id": sess_id, "duration_seconds": 150}, headers=headers)
    assert res.status_code == 200
    print("Revision session successfully completed.")

    print("=== 7. Testing PHP Dashboard & Progress ===")
    res = requests.get(f"{BASE_URL}/progress/dashboard", headers=headers)
    assert res.status_code == 200
    dash = res.json()["data"]
    print(f"Dashboard: Memorized = {dash['memorized_ayahs']}, Streak = {dash['current_streak']} Days")

    res = requests.get(f"{BASE_URL}/progress/statistics", headers=headers)
    assert res.status_code == 200
    stats = res.json()["data"]
    print(f"Statistics: Accuracy = {stats['revision_accuracy']}%")

    print("=== 8. Testing PHP Bookmarks & Notes ===")
    res = requests.post(f"{BASE_URL}/bookmarks", json={"ayah_id": ayah1_id, "category": "important"}, headers=headers)
    assert res.status_code in [200, 201]
    print("Bookmark added.")

    res = requests.post(f"{BASE_URL}/notes", json={"ayah_id": ayah1_id, "content": "PHP backend note test."}, headers=headers)
    assert res.status_code == 201
    print("Note added.")

    print("=== 9. Testing PHP SPA Frontend Shell Serving ===")
    res = requests.get("http://127.0.0.1:8000/")
    assert res.status_code == 200
    assert "Quran Hifz & Muraja'ah" in res.text
    print("PHP Server serves HTML SPA shell with 200 OK.")

    print("\n[SUCCESS] PHP Backend verified completely with 100% test passing!")

if __name__ == "__main__":
    test_php()
