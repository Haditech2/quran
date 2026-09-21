<?php

require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/config/JWT.php';
require_once __DIR__ . '/config/Response.php';
require_once __DIR__ . '/models/Schema.php';
require_once __DIR__ . '/services/AuthService.php';
require_once __DIR__ . '/services/QuranService.php';
require_once __DIR__ . '/services/SRSService.php';
require_once __DIR__ . '/services/MemorizationService.php';
require_once __DIR__ . '/services/ProgressService.php';
require_once __DIR__ . '/services/AchievementService.php';

use App\Config\Database;
use App\Models\Schema;
use App\Services\AuthService;

echo "[*] Creating PHP database schema...\n";
Schema::createTables();
$db = Database::getConnection();

// 1. Seed 114 Surahs
echo "[*] Seeding 114 Surahs...\n";
$surahs = [
    [1, "الفاتحة", "Al-Fatihah", "The Opener", "Meccan", 7, 1, 1],
    [2, "البقرة", "Al-Baqarah", "The Cow", "Medinan", 286, 1, 2],
    [3, "آل عمران", "Ali 'Imran", "Family of Imran", "Medinan", 200, 3, 50],
    [4, "النساء", "An-Nisa", "The Women", "Medinan", 176, 4, 77],
    [5, "المائدة", "Al-Ma'idah", "The Table Spread", "Medinan", 120, 6, 106],
    [6, "الأنعام", "Al-An'am", "The Cattle", "Meccan", 165, 7, 128],
    [7, "الأعراف", "Al-A'raf", "The Heights", "Meccan", 206, 8, 151],
    [8, "الأنفال", "Al-Anfal", "The Spoils of War", "Medinan", 75, 9, 177],
    [9, "التوبة", "At-Tawbah", "The Repentance", "Medinan", 129, 10, 187],
    [10, "يونس", "Yunus", "Jonah", "Meccan", 109, 11, 208],
    [11, "هود", "Hud", "Hud", "Meccan", 123, 11, 221],
    [12, "يوسف", "Yusuf", "Joseph", "Meccan", 111, 12, 235],
    [13, "الرعد", "Ar-Ra'd", "The Thunder", "Medinan", 43, 13, 249],
    [14, "إبراهيم", "Ibrahim", "Abraham", "Meccan", 52, 13, 255],
    [15, "الحجر", "Al-Hijr", "The Rocky Tract", "Meccan", 99, 14, 262],
    [16, "النحل", "An-Nahl", "The Bee", "Meccan", 128, 14, 267],
    [17, "الإسراء", "Al-Isra", "The Night Journey", "Meccan", 111, 15, 282],
    [18, "الكهف", "Al-Kahf", "The Cave", "Meccan", 110, 15, 293],
    [19, "مريم", "Maryam", "Mary", "Meccan", 98, 16, 305],
    [20, "طه", "Taha", "Ta-Ha", "Meccan", 135, 16, 312],
    [21, "الأنبياء", "Al-Anbiya", "The Prophets", "Meccan", 112, 17, 322],
    [22, "الحج", "Al-Hajj", "The Pilgrimage", "Medinan", 78, 17, 332],
    [23, "المؤمنون", "Al-Mu'minun", "The Believers", "Meccan", 118, 18, 342],
    [24, "النور", "An-Nur", "The Light", "Medinan", 64, 18, 350],
    [25, "الفرقان", "Al-Furqan", "The Criterion", "Meccan", 77, 18, 359],
    [26, "الشعراء", "Ash-Shu'ara", "The Poets", "Meccan", 227, 19, 367],
    [27, "النمل", "An-Naml", "The Ant", "Meccan", 93, 19, 377],
    [28, "القصص", "Al-Qasas", "The Stories", "Meccan", 88, 20, 385],
    [29, "العنكبوت", "Al-'Ankabut", "The Spider", "Meccan", 69, 20, 396],
    [30, "الروم", "Ar-Rum", "The Romans", "Meccan", 60, 21, 404],
    [31, "لقمان", "Luqman", "Luqman", "Meccan", 34, 21, 411],
    [32, "السجدة", "As-Sajdah", "The Prostration", "Meccan", 30, 21, 415],
    [33, "الأحزاب", "Al-Ahzab", "The Combined Forces", "Medinan", 73, 21, 418],
    [34, "سبأ", "Saba", "Sheba", "Meccan", 54, 22, 428],
    [35, "فاطر", "Fatir", "Originator", "Meccan", 45, 22, 434],
    [36, "يس", "Ya-Sin", "Ya-Sin", "Meccan", 83, 22, 440],
    [37, "الصافات", "As-Saffat", "Those who set the Ranks", "Meccan", 182, 23, 446],
    [38, "ص", "Sad", "The Letter Sad", "Meccan", 88, 23, 453],
    [39, "الزمر", "Az-Zumar", "The Troops", "Meccan", 75, 23, 458],
    [40, "غافر", "Ghafir", "The Forgiver", "Meccan", 85, 24, 467],
    [41, "فصلت", "Fussilat", "Explained in Detail", "Meccan", 54, 24, 477],
    [42, "الشورى", "Ash-Shuraa", "The Consultation", "Meccan", 53, 25, 483],
    [43, "الزخرف", "Az-Zukhruf", "The Ornaments of Gold", "Meccan", 89, 25, 489],
    [44, "الدخان", "Ad-Dukhan", "The Smoke", "Meccan", 59, 25, 496],
    [45, "الجاثية", "Al-Jathiyah", "The Crouching", "Meccan", 37, 25, 499],
    [46, "الأحقاف", "Al-Ahqaf", "The Wind-Curved Sandhills", "Meccan", 35, 26, 502],
    [47, "محمد", "Muhammad", "Muhammad", "Medinan", 38, 26, 507],
    [48, "الفتح", "Al-Fath", "The Victory", "Medinan", 29, 26, 511],
    [49, "الحجرات", "Al-Hujurat", "The Rooms", "Medinan", 18, 26, 515],
    [50, "ق", "Qaf", "The Letter Qaf", "Meccan", 45, 26, 518],
    [51, "الذاريات", "Adh-Dhariyat", "The Winnowing Winds", "Meccan", 60, 26, 520],
    [52, "الطور", "At-Tur", "The Mount", "Meccan", 49, 27, 523],
    [53, "النجم", "An-Najm", "The Star", "Meccan", 62, 27, 526],
    [54, "القمر", "Al-Qamar", "The Moon", "Meccan", 55, 27, 528],
    [55, "الرحمن", "Ar-Rahman", "The Beneficent", "Medinan", 78, 27, 531],
    [56, "الواقعة", "Al-Waqi'ah", "The Inevitable", "Meccan", 96, 27, 534],
    [57, "الحديد", "Al-Hadid", "The Iron", "Medinan", 29, 27, 537],
    [58, "المجادلة", "Al-Mujadila", "The Pleading Woman", "Medinan", 22, 28, 542],
    [59, "الحشر", "Al-Hashr", "The Exile", "Medinan", 24, 28, 545],
    [60, "الممتحنة", "Al-Mumtahanah", "She that is to be examined", "Medinan", 13, 28, 549],
    [61, "الصف", "As-Saf", "The Ranks", "Medinan", 14, 28, 551],
    [62, "الجمعة", "Al-Jumu'ah", "Friday", "Medinan", 11, 28, 553],
    [63, "المنافقون", "Al-Munafiqun", "The Hypocrites", "Medinan", 11, 28, 554],
    [64, "التغابن", "At-Taghabun", "The Mutual Disillusion", "Medinan", 18, 28, 556],
    [65, "الطلاق", "At-Talaq", "The Divorce", "Medinan", 12, 28, 558],
    [66, "التحريم", "At-Tahrim", "The Prohibition", "Medinan", 12, 28, 560],
    [67, "الملك", "Al-Mulk", "The Sovereignty", "Meccan", 30, 29, 562],
    [68, "القلم", "Al-Qalam", "The Pen", "Meccan", 52, 29, 564],
    [69, "الحاقة", "Al-Haqqah", "The Reality", "Meccan", 52, 29, 566],
    [70, "المعارج", "Al-Ma'arij", "The Ascending Stairways", "Meccan", 44, 29, 568],
    [71, "نوح", "Nuh", "Noah", "Meccan", 28, 29, 570],
    [72, "الجن", "Al-Jinn", "The Jinn", "Meccan", 28, 29, 572],
    [73, "المزمل", "Al-Muzzammil", "The Enshrouded One", "Meccan", 20, 29, 574],
    [74, "المدثر", "Al-Muddaththir", "The Cloaked One", "Meccan", 56, 29, 575],
    [75, "القيامة", "Al-Qiyamah", "The Resurrection", "Meccan", 40, 29, 577],
    [76, "الإنسان", "Al-Insan", "The Human", "Medinan", 31, 29, 578],
    [77, "المرسلات", "Al-Mursalat", "The Emissaries", "Meccan", 50, 29, 580],
    [78, "النبأ", "An-Naba", "The Tidings", "Meccan", 40, 30, 582],
    [79, "النازعات", "An-Nazi'at", "Those who drag forth", "Meccan", 46, 30, 583],
    [80, "عبس", "'Abasa", "He Frowned", "Meccan", 42, 30, 585],
    [81, "التكوير", "At-Takwir", "The Overthrowing", "Meccan", 29, 30, 586],
    [82, "الانفطار", "Al-Infitar", "The Cleaving", "Meccan", 19, 30, 587],
    [83, "المطففين", "Al-Mutaffifin", "The Defrauding", "Meccan", 36, 30, 587],
    [84, "الانشقاق", "Al-Inshiqaq", "The Splitting Open", "Meccan", 25, 30, 589],
    [85, "البروج", "Al-Buruj", "The Mansions of the Stars", "Meccan", 22, 30, 590],
    [86, "الطارق", "At-Tariq", "The Morning Star", "Meccan", 17, 30, 591],
    [87, "الأعلى", "Al-A'la", "The Most High", "Meccan", 19, 30, 591],
    [88, "الغاشية", "Al-Ghashiyah", "The Overwhelming", "Meccan", 26, 30, 592],
    [89, "الفجر", "Al-Fajr", "The Dawn", "Meccan", 30, 30, 593],
    [90, "البلد", "Al-Balad", "The City", "Meccan", 20, 30, 594],
    [91, "الشمس", "Ash-Shams", "The Sun", "Meccan", 15, 30, 595],
    [92, "الليل", "Al-Layl", "The Night", "Meccan", 21, 30, 595],
    [93, "الضحى", "Ad-Duha", "The Morning Hours", "Meccan", 11, 30, 596],
    [94, "الشرح", "Ash-Sharh", "The Relief", "Meccan", 8, 30, 596],
    [95, "التين", "At-Tin", "The Fig", "Meccan", 8, 30, 597],
    [96, "العلق", "Al-'Alaq", "The Clot", "Meccan", 19, 30, 597],
    [97, "القدر", "Al-Qadr", "The Power", "Meccan", 5, 30, 598],
    [98, "البينة", "Al-Bayyinah", "The Clear Proof", "Medinan", 8, 30, 598],
    [99, "الزلزلة", "Az-Zalzalah", "The Earthquake", "Medinan", 8, 30, 599],
    [100, "العاديات", "Al-'Adiyat", "The Courser", "Meccan", 11, 30, 599],
    [101, "القارعة", "Al-Qari'ah", "The Calamity", "Meccan", 11, 30, 600],
    [102, "التكاثر", "At-Takathur", "The Rivalry in world increase", "Meccan", 8, 30, 600],
    [103, "العصر", "Al-'Asr", "The Declining Day", "Meccan", 3, 30, 601],
    [104, "الهمزة", "Al-Humazah", "The Traducer", "Meccan", 9, 30, 601],
    [105, "الفيل", "Al-Fil", "The Elephant", "Meccan", 5, 30, 601],
    [106, "قريش", "Quraysh", "Quraysh", "Meccan", 4, 30, 602],
    [107, "الماعون", "Al-Ma'un", "The Small Kindness", "Meccan", 7, 30, 602],
    [108, "الكوثر", "Al-Kawthar", "The Abundance", "Meccan", 3, 30, 602],
    [109, "الكافرون", "Al-Kafirun", "The Disbelievers", "Meccan", 6, 30, 603],
    [110, "النصر", "An-Nasr", "The Divine Support", "Medinan", 3, 30, 603],
    [111, "المسد", "Al-Masad", "The Palm Fiber", "Meccan", 5, 30, 603],
    [112, "الإخلاص", "Al-Ikhlas", "The Sincerity", "Meccan", 4, 30, 604],
    [113, "الفلق", "Al-Falaq", "The Daybreak", "Meccan", 5, 30, 604],
    [114, "الناس", "An-Nas", "Mankind", "Meccan", 6, 30, 604]
];

$insSurah = $db->prepare("
    INSERT OR REPLACE INTO surahs (id, number, name_arabic, name_english, name_translation, revelation_type, total_ayahs, juz_start, page_start)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
");
foreach ($surahs as $s) {
    $insSurah->execute([$s[0], $s[0], $s[1], $s[2], $s[3], $s[4], $s[5], $s[6], $s[7]]);
}


// 2. Seed 30 Juz
echo "[*] Seeding 30 Juz...\n";
$juzList = [
    [1, "الجزء ١", 1, 1, 2, 141],
    [2, "الجزء ٢", 2, 142, 2, 252],
    [3, "الجزء ٣", 2, 253, 3, 92],
    [4, "الجزء ٤", 3, 93, 4, 23],
    [5, "الجزء ٥", 4, 24, 4, 147],
    [6, "الجزء ٦", 4, 148, 5, 81],
    [7, "الجزء ٧", 5, 82, 6, 110],
    [8, "الجزء ٨", 6, 111, 7, 87],
    [9, "الجزء ٩", 7, 88, 8, 40],
    [10, "الجزء ١٠", 8, 41, 9, 92],
    [11, "الجزء ١١", 9, 93, 11, 5],
    [12, "الجزء ١٢", 11, 6, 12, 52],
    [13, "الجزء ١٣", 12, 53, 14, 52],
    [14, "الجزء ١٤", 15, 1, 16, 128],
    [15, "الجزء ١٥", 17, 1, 18, 74],
    [16, "الجزء ١٦", 18, 75, 20, 135],
    [17, "الجزء ١٧", 21, 1, 22, 78],
    [18, "الجزء ١٨", 23, 1, 25, 20],
    [19, "الجزء ١٩", 25, 21, 27, 55],
    [20, "الجزء ٢٠", 27, 56, 29, 45],
    [21, "الجزء ٢١", 29, 46, 33, 30],
    [22, "الجزء ٢٢", 33, 31, 36, 27],
    [23, "الجزء ٢٣", 36, 28, 39, 31],
    [24, "الجزء ٢٤", 39, 32, 41, 46],
    [25, "الجزء ٢٥", 41, 47, 45, 37],
    [26, "الجزء ٢٦", 46, 1, 51, 30],
    [27, "الجزء ٢٧", 51, 31, 57, 29],
    [28, "الجزء ٢٨", 58, 1, 66, 12],
    [29, "الجزء ٢٩", 67, 1, 77, 50],
    [30, "الجزء ٣٠", 78, 1, 114, 6]
];
$insJuz = $db->prepare("
    INSERT OR IGNORE INTO juz (id, number, name_arabic, start_surah_number, start_ayah_number, end_surah_number, end_ayah_number)
    VALUES (?, ?, ?, ?, ?, ?, ?)
");
foreach ($juzList as $j) {
    $insJuz->execute($j);
}

// 3. Seed Reciters
echo "[*] Seeding Reciters...\n";
$reciters = [
    ["Mishary Rashid Alafasy", "Alafasy_128kbps", "Murattal", "https://everyayah.com/data/Alafasy_128kbps", 1],
    ["Mahmoud Khalil Al-Husary", "Husary_128kbps", "Murattal", "https://everyayah.com/data/Husary_128kbps", 0],
    ["AbdulBaset AbdulSamad", "Abdul_Basit_Murattal_192kbps", "Murattal", "https://everyayah.com/data/Abdul_Basit_Murattal_192kbps", 0],
    ["Abu Bakr Ash-Shatri", "Abu_Bakr_Ash-Shaatree_128kbps", "Murattal", "https://everyayah.com/data/Abu_Bakr_Ash-Shaatree_128kbps", 0]
];
$insRec = $db->prepare("
    INSERT OR IGNORE INTO reciters (name, identifier, style, audio_base_url, is_default)
    VALUES (?, ?, ?, ?, ?)
");
foreach ($reciters as $r) {
    $insRec->execute($r);
}

// 4. Seed Achievements
echo "[*] Seeding Achievements...\n";
$achievements = [
    ["first_ayah", "First Ayah Memorized", "Began the journey of Quran memorization", "star", "ayahs_memorized", 1],
    ["first_surah", "First Surah Completed", "Successfully memorized your first complete Surah", "award", "surahs_completed", 1],
    ["streak_7", "7-Day Streak", "Practiced or revised Quran for 7 consecutive days", "zap", "streak_days", 7],
    ["streak_30", "30-Day Master", "Maintained steadfast dedication for 30 consecutive days", "flame", "streak_days", 30],
    ["first_juz", "First Juz Completed", "Completed an entire Juz in memory", "book-open", "juz_completed", 1],
    ["ayahs_100", "100 Ayahs Memorized", "Reached 100 preserved verses in your heart", "shield", "ayahs_memorized", 100],
    ["ayahs_500", "500 Ayahs Memorized", "Memorized over 500 noble verses", "gem", "ayahs_memorized", 500],
    ["ayahs_1000", "1,000 Ayahs Memorized", "A monumental milestone of 1,000 verses memorized", "crown", "ayahs_memorized", 1000],
    ["revisions_100", "100 Revision Sessions", "Master of Muraja'ah: completed 100 revision sessions", "check-circle", "revisions_completed", 100]
];
$insAch = $db->prepare("
    INSERT OR IGNORE INTO achievements (code, title, description, icon, requirement_type, requirement_value)
    VALUES (?, ?, ?, ?, ?, ?)
");
foreach ($achievements as $a) {
    $insAch->execute($a);
}

// 5. Seed Verified Ayahs
echo "[*] Seeding verified Ayahs...\n";
$verifiedAyahs = [
    // Surah 1: Al-Fatihah
    [1, 1, 1, "1:1", "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "In the name of Allah, the Entirely Merciful, the Especially Merciful.", 1, 1, 1, "https://everyayah.com/data/Alafasy_128kbps/001001.mp3"],
    [1, 1, 2, "1:2", "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", "[All] praise is [due] to Allah, Lord of the worlds -", 1, 1, 1, "https://everyayah.com/data/Alafasy_128kbps/001002.mp3"],
    [1, 1, 3, "1:3", "الرَّحْمَٰنِ الرَّحِيمِ", "The Entirely Merciful, the Especially Merciful,", 1, 1, 1, "https://everyayah.com/data/Alafasy_128kbps/001003.mp3"],
    [1, 1, 4, "1:4", "مَالِكِ يَوْمِ الدِّينِ", "Sovereign of the Day of Recompense.", 1, 1, 1, "https://everyayah.com/data/Alafasy_128kbps/001004.mp3"],
    [1, 1, 5, "1:5", "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", "It is You we worship and You we ask for help.", 1, 1, 1, "https://everyayah.com/data/Alafasy_128kbps/001005.mp3"],
    [1, 1, 6, "1:6", "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", "Guide us to the straight path -", 1, 1, 1, "https://everyayah.com/data/Alafasy_128kbps/001006.mp3"],
    [1, 1, 7, "1:7", "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", "The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.", 1, 1, 1, "https://everyayah.com/data/Alafasy_128kbps/001007.mp3"],

    // Surah 2: Al-Baqarah (1-5)
    [2, 2, 1, "2:1", "الم", "Alif, Lam, Meem.", 1, 2, 1, "https://everyayah.com/data/Alafasy_128kbps/002001.mp3"],
    [2, 2, 2, "2:2", "ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ", "This is the Book about which there is no doubt, a guidance for those conscious of Allah -", 1, 2, 1, "https://everyayah.com/data/Alafasy_128kbps/002002.mp3"],
    [2, 2, 3, "2:3", "الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ", "Who believe in the unseen, establish prayer, and spend out of what We have provided for them,", 1, 2, 1, "https://everyayah.com/data/Alafasy_128kbps/002003.mp3"],
    [2, 2, 4, "2:4", "وَالَّذِينَ يُؤْمِنُونَ بِمَا أُنزِلَ إِلَيْكَ وَمَا أُنزِلَ مِن قَبْلِكَ وَبِالْآخِرَةِ هُمْ يُوقِنُونَ", "And who believe in what has been revealed to you, [O Muhammad], and what was revealed before you, and of the Hereafter they are certain [in faith].", 1, 2, 1, "https://everyayah.com/data/Alafasy_128kbps/002004.mp3"],
    [2, 2, 5, "2:5", "أُولَٰئِكَ عَلَىٰ هُدًى مِّن رَّبِّهِمْ ۖ وَأُولَٰئِكَ هُمُ الْمُفْلِحُونَ", "Those are upon [right] guidance from their Lord, and it is those who are the successful.", 1, 2, 1, "https://everyayah.com/data/Alafasy_128kbps/002005.mp3"],

    // Surah 103: Al-Asr
    [103, 103, 1, "103:1", "وَالْعَصْرِ", "By time,", 30, 601, 60, "https://everyayah.com/data/Alafasy_128kbps/103001.mp3"],
    [103, 103, 2, "103:2", "إِنَّ الْإِنسَانَ لَفِي خُسْرٍ", "Indeed, mankind is in loss,", 30, 601, 60, "https://everyayah.com/data/Alafasy_128kbps/103002.mp3"],
    [103, 103, 3, "103:3", "إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ", "Except for those who have believed and done righteous deeds and advised each other to truth and advised each other to patience.", 30, 601, 60, "https://everyayah.com/data/Alafasy_128kbps/103003.mp3"],

    // Surah 108: Al-Kawthar
    [108, 108, 1, "108:1", "إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ", "Indeed, We have granted you, [O Muhammad], al-Kawthar.", 30, 602, 60, "https://everyayah.com/data/Alafasy_128kbps/108001.mp3"],
    [108, 108, 2, "108:2", "فَصَلِّ لِرَبِّكَ وَانْحَرْ", "So pray to your Lord and sacrifice [to Him alone].", 30, 602, 60, "https://everyayah.com/data/Alafasy_128kbps/108002.mp3"],
    [108, 108, 3, "108:3", "إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ", "Indeed, your enemy is the one cut off.", 30, 602, 60, "https://everyayah.com/data/Alafasy_128kbps/108003.mp3"],

    // Surah 112: Al-Ikhlas
    [112, 112, 1, "112:1", "قُلْ هُوَ اللَّهُ أَحَدٌ", "Say, \"He is Allah, [who is] One,", 30, 604, 60, "https://everyayah.com/data/Alafasy_128kbps/112001.mp3"],
    [112, 112, 2, "112:2", "اللَّهُ الصَّمَدُ", "Allah, the Eternal Refuge.", 30, 604, 60, "https://everyayah.com/data/Alafasy_128kbps/112002.mp3"],
    [112, 112, 3, "112:3", "لَمْ يَلِدْ وَلَمْ يُولَدْ", "He neither begets nor is born,", 30, 604, 60, "https://everyayah.com/data/Alafasy_128kbps/112003.mp3"],
    [112, 112, 4, "112:4", "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ", "Nor is there to Him any equivalent.\"", 30, 604, 60, "https://everyayah.com/data/Alafasy_128kbps/112004.mp3"],

    // Surah 113: Al-Falaq
    [113, 113, 1, "113:1", "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ", "Say, \"I seek refuge in the Lord of daybreak", 30, 604, 60, "https://everyayah.com/data/Alafasy_128kbps/113001.mp3"],
    [113, 113, 2, "113:2", "مِن شَرِّ مَا خَلَقَ", "From the evil of that which He created", 30, 604, 60, "https://everyayah.com/data/Alafasy_128kbps/113002.mp3"],
    [113, 113, 3, "113:3", "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ", "And from the evil of darkness when it settles", 30, 604, 60, "https://everyayah.com/data/Alafasy_128kbps/113003.mp3"],
    [113, 113, 4, "113:4", "وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ", "And from the evil of the blowers in knots", 30, 604, 60, "https://everyayah.com/data/Alafasy_128kbps/113004.mp3"],
    [113, 113, 5, "113:5", "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ", "And from the evil of an envier when he envies.\"", 30, 604, 60, "https://everyayah.com/data/Alafasy_128kbps/113005.mp3"],

    // Surah 114: An-Nas
    [114, 114, 1, "114:1", "قُلْ أَعُوذُ بِرَبِّ النَّاسِ", "Say, \"I seek refuge in the Lord of mankind,", 30, 604, 60, "https://everyayah.com/data/Alafasy_128kbps/114001.mp3"],
    [114, 114, 2, "114:2", "مَلِكِ النَّاسِ", "The Sovereign of mankind,", 30, 604, 60, "https://everyayah.com/data/Alafasy_128kbps/114002.mp3"],
    [114, 114, 3, "114:3", "إِلَٰهِ النَّاسِ", "The God of mankind,", 30, 604, 60, "https://everyayah.com/data/Alafasy_128kbps/114003.mp3"],
    [114, 114, 4, "114:4", "مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ", "From the evil of the retreating whisperer -", 30, 604, 60, "https://everyayah.com/data/Alafasy_128kbps/114004.mp3"],
    [114, 114, 5, "114:5", "الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ", "Who whispers into the breasts of mankind -", 30, 604, 60, "https://everyayah.com/data/Alafasy_128kbps/114005.mp3"],
    [114, 114, 6, "114:6", "مِنَ الْجِنَّةِ وَالنَّاسِ", "From among the jinn and mankind.\"", 30, 604, 60, "https://everyayah.com/data/Alafasy_128kbps/114006.mp3"]
];
$insAyah = $db->prepare("
    INSERT OR IGNORE INTO ayahs (surah_id, surah_number, ayah_number, verse_key, text_arabic, text_translation, juz_number, page_number, hizb_number, audio_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");
foreach ($verifiedAyahs as $va) {
    $insAyah->execute($va);
}

// 6. Seed Admin & Demo Student
echo "[*] Seeding Admin & Demo Student in PHP...\n";
try {
    AuthService::register("admin", "admin@quran.com", "Admin123!", "Hifz Administrator", "admin");
} catch (\Exception $e) {}

try {
    $studentData = AuthService::register("student", "student@quran.com", "Student123!", "Abdul Hadi", "user");
    $studentId = (int)$studentData['user']['id'];

    // Create plan for demo student
    $planStmt = $db->prepare("
        INSERT INTO memorization_plans 
        (user_id, title, start_date, target_date, start_surah, start_ayah, end_surah, end_ayah, ayahs_per_day, days_per_week, rest_days, status)
        VALUES (?, 'Complete Juz Amma', date('now', '-7 days'), date('now', '+23 days'), 1, 1, 1, 7, 5, 6, 'Friday', 'active')
    ");
    $planStmt->execute([$studentId]);

    // Seed progress for Surah 1
    $s1Ayahs = $db->query("SELECT id, verse_key FROM ayahs WHERE surah_number = 1 ORDER BY ayah_number ASC")->fetchAll();
    foreach ($s1Ayahs as $idx => $a) {
        $strength = $idx < 3 ? 95.0 : ($idx < 5 ? 82.0 : 45.0);
        $status = $strength >= 70 ? 'memorized' : 'struggling';
        $corr = $strength > 70 ? 3 : 1;
        $inc = $strength > 70 ? 0 : 2;

        $pStmt = $db->prepare("
            INSERT OR IGNORE INTO memorization_progress 
            (user_id, ayah_id, verse_key, strength_score, times_reviewed, times_correct, times_incorrect, difficulty_level, memorized_status, ease_factor, interval_days, last_reviewed_at, next_review_at)
            VALUES (?, ?, ?, ?, 3, ?, ?, ?, ?, 2.5, 7, date('now', '-1 day'), date('now', '+6 days'))
        ");
        $pStmt->execute([$studentId, $a['id'], $a['verse_key'], $strength, $corr, $inc, $strength > 70 ? 1 : 3, $status]);
    }

    // Seed 7-day practice streak
    for ($i = 0; $i < 7; $i++) {
        $dateStr = date('Y-m-d H:i:s', strtotime("-{$i} days"));
        $prStmt = $db->prepare("
            INSERT INTO practice_sessions (user_id, surah_number, start_ayah, end_ayah, mode, ayahs_practiced, duration_seconds, started_at, completed_at)
            VALUES (?, 1, 1, 5, 'read', 5, 300, ?, ?)
        ");
        $prStmt->execute([$studentId, $dateStr, $dateStr]);
    }

    // Seed initial revision session
    $revStmt = $db->prepare("
        INSERT INTO revision_sessions (user_id, session_type, total_reviewed, total_correct, total_incorrect, total_difficult, duration_seconds)
        VALUES (?, 'scheduled', 5, 4, 1, 0, 240)
    ");
    $revStmt->execute([$studentId]);
} catch (\Exception $e) {}

require_once __DIR__ . '/seed_platform.php';

echo "[+] PHP Database seeding complete! Admin: admin@quran.com / Admin123! | Student: student@quran.com / Student123!\n";
