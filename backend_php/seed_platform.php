<?php

require_once __DIR__ . '/config/Database.php';
use App\Config\Database;

$db = Database::getConnection();

echo "[*] Seeding Islamic Learning & Worship Platform data...\n";

// =========================================================================
// 1. SEED 99 NAMES OF ALLAH (AS-SMA' AL-HUSNA)
// =========================================================================
echo " -> Seeding 99 Names of Allah...\n";
$namesData = [
    [1, "الرَّحْمَنُ", "Ar-Rahman", "The Most Gracious", "The One who has plenty of mercy for the believers and the blasphemers in this world and exclusively for the believers in the hereafter.", "Surah Al-Fatihah 1:1"],
    [2, "الرَّحِيمُ", "Ar-Rahim", "The Most Merciful", "The One who has plenty of mercy for the believers.", "Surah Al-Fatihah 1:3"],
    [3, "الْمَلِكُ", "Al-Malik", "The King, The Sovereign", "The One with the complete Dominion, the One Whose Dominion is clear from imperfection.", "Surah Al-Hashr 59:23"],
    [4, "الْقُدُّوسُ", "Al-Quddus", "The Most Holy", "The One who is pure from any imperfection and clear from children and adversaries.", "Surah Al-Hashr 59:23"],
    [5, "السَّلَامُ", "As-Salam", "The Source of Peace", "The One who is free from every imperfection.", "Surah Al-Hashr 59:23"],
    [6, "الْمُؤْمِنُ", "Al-Mu'min", "The Guardian of Faith", "The One who witnessed for Himself that no one is God but Him. And He witnessed for His believers that they are truthful.", "Surah Al-Hashr 59:23"],
    [7, "الْمُهَيْمِنُ", "Al-Muhaymin", "The Protector", "The One who witnesses the saying and deeds of His creatures.", "Surah Al-Hashr 59:23"],
    [8, "الْعَزِيزُ", "Al-Aziz", "The All-Mighty", "The Strong, The Defeater who is not defeated.", "Surah Al-Hashr 59:23"],
    [9, "الْجَبَّارُ", "Al-Jabbar", "The Compeller", "The One that nothing happens in His Dominion except that which He willed.", "Surah Al-Hashr 59:23"],
    [10, "الْمُتَكَبِّرُ", "Al-Mutakabbir", "The Supreme, The Majestic", "The One who is clear from the attributes of the creatures and from resembling them.", "Surah Al-Hashr 59:23"],
    [11, "الْخَالِقُ", "Al-Khaliq", "The Creator", "The One who brings everything from non-existence to existence.", "Surah Al-Hashr 59:24"],
    [12, "الْبَارِئُ", "Al-Bari'", "The Originator", "The Maker who created the creation from nothing.", "Surah Al-Hashr 59:24"],
    [13, "الْمُصَوِّرُ", "Al-Musawwir", "The Fashioner", "The One who forms His creatures in different pictures and shapes.", "Surah Al-Hashr 59:24"],
    [14, "الْغَفَّارُ", "Al-Ghaffar", "The All-Forgiving", "The One who forgives the sins of His slaves time and time again.", "Surah Nuh 71:10"],
    [15, "الْقَهَّارُ", "Al-Qahhar", "The Subduer", "The Dominant, The One who has the perfect Power and not unable over anything.", "Surah Ar-Ra'd 13:16"],
    [16, "الْوَهَّابُ", "Al-Wahhab", "The Bestower", "The One who gives generously without asking for compensation.", "Surah Ali 'Imran 3:8"],
    [17, "الرَّزَّاقُ", "Ar-Razzaq", "The Provider", "The Provider of sustenance to all His creation.", "Surah Adh-Dhariyat 51:58"],
    [18, "الْفَتَّاحُ", "Al-Fattah", "The Opener, The Judge", "The One who opens for His slaves the closed worldly and religious matters.", "Surah Saba 34:26"],
    [19, "الْعَلِيمُ", "Al-Alim", "The All-Knowing", "The Knowledgeable; The One whose knowledge nothing hidden from.", "Surah Al-Baqarah 2:29"],
    [20, "الْقَابِضُ", "Al-Qabid", "The Withholder", "The One who constricts the sustenance by His wisdom.", "Surah Al-Baqarah 2:245"],
    [21, "الْبَاسِطُ", "Al-Basit", "The Extender", "The One who expands and widens sustenance to whomever He wills.", "Surah Al-Baqarah 2:245"],
    [22, "الْخَافِضُ", "Al-Khafid", "The Abaser", "The One who lowers whoever He willed by His Destruction.", "Hadith at-Tirmidhi"],
    [23, "الرَّافِعُ", "Ar-Rafi'", "The Exalter", "The One who raises whoever He willed by His endowment.", "Surah Al-An'am 6:83"],
    [24, "الْمُعِزُّ", "Al-Mu'izz", "The Bestower of Honor", "He gives esteem to whoever He willed.", "Surah Ali 'Imran 3:26"],
    [25, "الْمُذِلُّ", "Al-Mudhill", "The Humiliator", "The One who dishonors and abases the arrogant.", "Surah Ali 'Imran 3:26"],
    [26, "السَّمِيعُ", "As-Sami'", "The All-Hearing", "The One who Hears all things that are heard without an ear or instrument.", "Surah Ash-Shura 42:11"],
    [27, "الْبَصِيرُ", "Al-Basir", "The All-Seeing", "The One who Sees all things that are seen without pupils or eyes.", "Surah Ash-Shura 42:11"],
    [28, "الْحَكَمُ", "Al-Hakam", "The Judge", "He is the Ruler and His judgment is His Word.", "Surah Al-An'am 6:114"],
    [29, "الْعَدْلُ", "Al-'Adl", "The Utterly Just", "The One who is entitled to do what He does.", "Surah Al-An'am 6:115"],
    [30, "اللَّطِيفُ", "Al-Latif", "The Subtle, The Gentle", "The One who is kind to His slaves and bends subtleties to their aid.", "Surah Al-Mulk 67:14"],
    [31, "الْخَبِيرُ", "Al-Khabir", "The All-Aware", "The One who knows the truth of things and inward realities.", "Surah Al-Mulk 67:14"],
    [32, "الْحَلِيمُ", "Al-Halim", "The Most Forbearing", "The One who delays the penalty for those who deserve it.", "Surah Al-Baqarah 2:225"],
    [33, "الْعَظِيمُ", "Al-Azim", "The Magnificent", "The One deserving the attributes of Exaltment, Glory and Purity.", "Surah Al-Baqarah 2:255"],
    [34, "الْغَفُورُ", "Al-Ghafur", "The Great Forgiver", "The One who forgives a lot.", "Surah Fatir 35:28"],
    [35, "الشَّكُورُ", "Ash-Shakur", "The Most Appreciative", "The One who gives a lot of reward for a little obedience.", "Surah Fatir 35:30"],
    [36, "الْعَلِيُّ", "Al-Aliyy", "The Most High", "The One who is clear from the attributes of the creatures.", "Surah Al-Baqarah 2:255"],
    [37, "الْكَبِيرُ", "Al-Kabir", "The Most Great", "The One who is greater than everything in respect to His status.", "Surah Ar-Ra'd 13:9"],
    [38, "الْحَفِيظُ", "Al-Hafiz", "The Preserver", "The One who protects whatever and whoever He willed to protect.", "Surah Hud 11:57"],
    [39, "الْمُقِيتُ", "Al-Muqit", "The Sustainer", "The One who provides sustenance to every living creature.", "Surah An-Nisa 4:85"],
    [40, "الْحَسِيبُ", "Al-Hasib", "The Reckoner", "The One who gives the satisfaction and takes account of deeds.", "Surah An-Nisa 4:6"],
    [41, "الْجَلِيلُ", "Al-Jalil", "The Majestic", "The One who is attributed with greatness of Power and Glory.", "Surah Ar-Rahman 55:27"],
    [42, "الْكَرِيمُ", "Al-Karim", "The Most Generous", "The One who is attributed with bountiful Generosity.", "Surah Al-Infitar 82:6"],
    [43, "الرَّقِيبُ", "Ar-Raqib", "The Watchful", "The One that nothing is absent from Him.", "Surah Al-Ahzab 33:52"],
    [44, "الْمُجِيبُ", "Al-Mujib", "The Responsive", "The One who answers the prayers and supplications.", "Surah Hud 11:61"],
    [45, "الْوَاسِعُ", "Al-Wasi'", "The All-Encompassing", "The Knowledgeable who encompasses all things in knowledge and mercy.", "Surah Al-Baqarah 2:268"],
    [46, "الْحَكِيمُ", "Al-Hakim", "The All-Wise", "The One who is correct in His doing and legislation.", "Surah Al-An'am 6:18"],
    [47, "الْوَدُودُ", "Al-Wadud", "The Loving", "The One who loves His believing slaves and His believing slaves love Him.", "Surah Al-Buruj 85:14"],
    [48, "الْمَجِيدُ", "Al-Majid", "The Glorious", "The One who is with majesty, magnificence, and generosity.", "Surah Al-Buruj 85:15"],
    [49, "الْبَاعِثُ", "Al-Ba'ith", "The Resurrector", "The One who resurrects His slaves after death for reward and/or punishment.", "Surah Al-Hajj 22:7"],
    [50, "الشَّهِيدُ", "Ash-Shahid", "The Witness", "The One who nothing is absent from Him.", "Surah Al-Baqarah 2:133"],
    [51, "الْحَقُّ", "Al-Haqq", "The Truth", "The One who truly exists; the Absolute Truth.", "Surah Ta-Ha 20:114"],
    [52, "الْوَكِيلُ", "Al-Wakil", "The Trustee", "The One who gives the satisfaction and is relied upon.", "Surah Al-Imran 3:173"],
    [53, "الْقَوِيُّ", "Al-Qawiyy", "The All-Strong", "The One with complete Power.", "Surah Al-Hajj 22:40"],
    [54, "الْمَتِينُ", "Al-Matin", "The Firm, The Steadfast", "The One with extreme Power which is uninterrupted.", "Surah Adh-Dhariyat 51:58"],
    [55, "الْوَلِيُّ", "Al-Waliyy", "The Protecting Friend", "The Supporter and Helper of the believers.", "Surah Ash-Shura 42:28"],
    [56, "الْحَمِيدُ", "Al-Hamid", "The Praiseworthy", "The praised One who deserves to be praised.", "Surah Ibrahim 14:1"],
    [57, "الْمُحْصِي", "Al-Muhsi", "The Accounter", "The One who the count of things are known to Him.", "Surah Maryam 19:94"],
    [58, "الْمُبْدِئُ", "Al-Mubdi'", "The Originator", "The One who started the human being from clay and dust.", "Surah Al-Buruj 85:13"],
    [59, "الْمُعِيدُ", "Al-Mu'id", "The Restorer", "The One who brings back the creatures after death.", "Surah Al-Buruj 85:13"],
    [60, "الْمُحْيِي", "Al-Muhyi", "The Giver of Life", "The One who took out a living one from a dead one.", "Surah Ar-Rum 30:50"],
    [61, "الْمُمِيتُ", "Al-Mumit", "The Bringer of Death", "The One who renders the living dead.", "Surah Al-Mu'minun 23:80"],
    [62, "الْحَيُّ", "Al-Hayy", "The Ever-Living", "The One attributed with a life that is unlike our life and is everlasting.", "Surah Al-Baqarah 2:255"],
    [63, "الْقَيُّومُ", "Al-Qayyum", "The Self-Subsisting", "The One who remains and does not end; sustains all that exists.", "Surah Al-Baqarah 2:255"],
    [64, "الْوَاجِدُ", "Al-Wajid", "The Perceiver, The Finder", "The Rich who is never in need of anything.", "Surah Ad-Duha 93:7"],
    [65, "الْمَاجِدُ", "Al-Majid", "The Illustrious", "The Magnificent and Generous.", "Surah Hud 11:73"],
    [66, "الْوَاحِدُ", "Al-Wahid", "The Unique, The One", "The One without a partner in His Essence and Attributes.", "Surah Al-Ikhlas 112:1"],
    [67, "الأَحَدُ", "Al-Ahad", "The Indivisible", "The Sole One who has no equal or peer.", "Surah Al-Ikhlas 112:1"],
    [68, "الصَّمَدُ", "As-Samad", "The Eternal Refuge", "The Master who is relied upon in matters and needed by all.", "Surah Al-Ikhlas 112:2"],
    [69, "الْقَادِرُ", "Al-Qadir", "The Capable", "The One who is attributed with Power over all things.", "Surah Al-Baqarah 2:20"],
    [70, "الْمُقْتَدِرُ", "Al-Muqtadir", "The Omnipotent", "The One with the Power that nothing is difficult for Him.", "Surah Al-Qamar 54:42"],
    [71, "الْمُقَدِّمُ", "Al-Muqaddim", "The Expediter", "The One who puts things in their right places; promotes whom He wills.", "Surah Qaf 50:28"],
    [72, "الْمُؤَخِّرُ", "Al-Mu'akhkhir", "The Delayer", "The One who delays whoever and whatever He willed.", "Surah Ibrahim 14:42"],
    [73, "الأَوَّلُ", "Al-Awwal", "The First", "The One whose Existence is without a beginning.", "Surah Al-Hadid 57:3"],
    [74, "الآخِرُ", "Al-Akhir", "The Last", "The One whose Existence is without an end.", "Surah Al-Hadid 57:3"],
    [75, "الظَّاهِرُ", "Az-Zahir", "The Manifest", "The One that nothing is above Him and nothing is like Him.", "Surah Al-Hadid 57:3"],
    [76, "الْبَاطِنُ", "Al-Batin", "The Hidden", "The One that nothing is underneath Him.", "Surah Al-Hadid 57:3"],
    [77, "الْوَالِي", "Al-Wali", "The Patron", "The One who owns things and manages them.", "Surah Ar-Ra'd 13:11"],
    [78, "الْمُتَعَالِي", "Al-Muta'ali", "The Supremely Exalted", "The One who is clear from the attributes of the creation.", "Surah Ar-Ra'd 13:9"],
    [79, "الْبَرُّ", "Al-Barr", "The Source of Goodness", "The Righteous, The One who is kind to His creatures.", "Surah At-Tur 52:28"],
    [80, "التَّوَّابُ", "At-Tawwab", "The Ever-Pardoning", "The One who accepts the repentance from His slaves.", "Surah An-Nur 24:10"],
    [81, "الْمُنْتَقِمُ", "Al-Muntaqim", "The Avenger", "The One who victoriously prevails over His enemies and punishes them.", "Surah As-Sajdah 32:22"],
    [82, "العَفُوُّ", "Al-'Afuww", "The Pardoner", "The One with wide pardon and forgiveness.", "Surah An-Nisa 4:99"],
    [83, "الرَّؤُوفُ", "Ar-Ra'uf", "The Compassionate", "The One with extreme Mercy.", "Surah Al-Baqarah 2:207"],
    [84, "مَالِكُ الْمُلْكِ", "Malik-ul-Mulk", "Owner of All Sovereignty", "The One who controls the Dominion and gives it to whoever He willed.", "Surah Ali 'Imran 3:26"],
    [85, "ذُو الْجَلَالِ وَالإِكْرَامِ", "Dhul-Jalali wal-Ikram", "Lord of Glory and Honor", "The One who deserves to be Exalted and not denied.", "Surah Ar-Rahman 55:27"],
    [86, "الْمُقْسِطُ", "Al-Muqsit", "The Equitable", "The One who is Just in His judgment.", "Surah Ali 'Imran 3:18"],
    [87, "الْجَامِعُ", "Al-Jami'", "The Gatherer", "The One who gathers the creatures on a day that there is no doubt about.", "Surah Ali 'Imran 3:9"],
    [88, "الْغَنِيُّ", "Al-Ghaniyy", "The Self-Sufficient", "The One who does not need the creation.", "Surah Fatir 35:15"],
    [89, "الْمُغْنِي", "Al-Mughni", "The Enricher", "The One who satisfies the necessities of the creatures.", "Surah An-Najm 53:48"],
    [90, "الْمَانِعُ", "Al-Mani'", "The Withholder", "The Defender, The Shielder.", "Hadith at-Tirmidhi"],
    [91, "الضَّارُّ", "Ad-Darr", "The Distresser", "The One who makes harm to reach by His will.", "Surah Al-An'am 6:17"],
    [92, "النَّافِعُ", "An-Nafi'", "The Benefactor", "The One who makes benefit to reach by His will.", "Surah Al-An'am 6:17"],
    [93, "النُّورُ", "An-Nur", "The Light", "The One who guides by His Light.", "Surah An-Nur 24:35"],
    [94, "الْهَادِي", "Al-Hadi", "The Guide", "The One with whose Guidance his believers were guided.", "Surah Al-Hajj 22:54"],
    [95, "الْبَدِيعُ", "Al-Badi'", "The Incomparable", "The One who created the creation and formed it without any preceding example.", "Surah Al-Baqarah 2:117"],
    [96, "الْبَاقِي", "Al-Baqi", "The Everlasting", "The One that the state of non-existence is impossible for Him.", "Surah Ar-Rahman 55:27"],
    [97, "الْوَارِثُ", "Al-Warith", "The Inheritor", "The One whose Existence remains after the creation perishes.", "Surah Al-Hijr 15:23"],
    [98, "الرَّشِيدُ", "Ar-Rashid", "The Infallible Teacher", "The One who guides to the righteous path.", "Surah Al-Kahf 18:17"],
    [99, "الصَّبُورُ", "As-Sabur", "The Patient", "The One who does not quickly punish the sinners.", "Hadith at-Tirmidhi"]
];

$nameStmt = $db->prepare("
    INSERT OR REPLACE INTO names_of_allah 
    (id, number, name_arabic, transliteration, meaning_english, explanation, quran_reference)
    VALUES (?, ?, ?, ?, ?, ?, ?)
");
foreach ($namesData as $n) {
    $nameStmt->execute([$n[0], $n[0], $n[1], $n[2], $n[3], $n[4], $n[5]]);
}

// =========================================================================
// 2. SEED TAJWEED MODULE (CATEGORIES, LESSONS, RULES, EXAMPLES, QUIZZES)
// =========================================================================
echo " -> Seeding Tajweed Module...\n";
$tajCats = [
    [1, "Makharij al-Huruf", "مخارج الحروف", "The 17 specific articulation points from where Arabic letters originate.", 1],
    [2, "Sifaat al-Huruf", "صفات الحروف", "The intrinsic characteristics and acoustic properties of Arabic letters.", 2],
    [3, "Ahkam an-Noon & Tanween", "أحكام النون الساكنة والتنوين", "The four fundamental rules governing Noon Sakinah and Tanween.", 3],
    [4, "Ahkam al-Meem as-Sakinah", "أحكام الميم الساكنة", "The three rules applicable when Meem Sakinah is followed by other letters.", 4],
    [5, "Qalqalah (Echoing)", "أحكام القلقلة", "The bouncing or vibration sound produced on five specific letters.", 5],
    [6, "Ahkam al-Madd (Elongation)", "أحكام المد", "Natural and derived rules for lengthening vowel sounds.", 6],
    [7, "Rules of Raa and Laam", "أحكام الراء واللام", "Tafkheem (heaviness) and Tarqeeq (lightness) for letters Raa and Laam.", 7],
    [8, "Waqf and Ibtida' (Stopping & Starting)", "الوقف والابتداء", "Rules and signs governing where to pause, stop, and resume recitation.", 8]
];

$tcStmt = $db->prepare("INSERT OR REPLACE INTO tajweed_categories (id, name, name_arabic, description, order_index) VALUES (?, ?, ?, ?, ?)");
foreach ($tajCats as $c) {
    $tcStmt->execute($c);
}

// Lessons & Rules
$tajLessons = [
    [
        1, 1, "The 5 Major Articulation Regions", "المخارج العامة الخمسة",
        "Introduction to the five primary areas of speech sounds in the vocal tract.",
        "The articulation points of Arabic letters are divided into 5 major general regions (Al-Makharij al-Ammah):\n1. Al-Jawf (الْجَوْف) - The empty space in the mouth and throat (Letters of Madd: ا, و, ي).\n2. Al-Halq (الْحَلْق) - The Throat (6 letters: ء, هـ, ع, ح, غ, خ).\n3. Al-Lisan (اللِّسَان) - The Tongue (18 letters distributed across 10 specific points).\n4. Ash-Shafatan (الشَّفَتَان) - The Lips (4 letters: ف, ب, م, و).\n5. Al-Khayshum (الْخَيْشُوم) - The Nasal Cavity (produces Ghunnah).",
        1
    ],
    [
        2, 3, "Izhar Halqi (Clear Pronunciation)", "الإظهار الحلقي",
        "Pronouncing the Noon Sakinah or Tanween clearly without added Ghunnah when followed by throat letters.",
        "Izhar literally means 'clarity' or 'manifestation'. In Tajweed, it means pronouncing the Noon Sakinah (نْ) or Tanween without extra Ghunnah (nasal elongation) when followed by one of the six throat letters:\nء (Hamzah), هـ (Haa), ع ('Ayn), ح (Haa), غ (Ghayn), خ (Khaa).\n\nMnemonic: أَخِي هَاكَ عِلْمًا حَازَهُ غَيْرُ خَاسِرٍ (Akhi Haaka 'Ilman Hazahu Ghayru Khasir).",
        1
    ],
    [
        3, 3, "Idgham with and without Ghunnah", "الإدغام بغنة وبغير غنة",
        "Merging Noon Sakinah or Tanween into the subsequent letter.",
        "Idgham literally means 'to insert' or 'merge'. In Tajweed, when Noon Sakinah or Tanween is followed by any of the 6 letters of (يَرْمَلُونَ - Yarmaloon), the Noon merges into that letter.\n\nDivided into two types:\n1. Idgham with Ghunnah (بِغُنَّة) - Letters: ي, ن, م, و (Yanmoo - يَنْمُو) held for 2 counts.\n2. Idgham without Ghunnah (بِغَيْرِ غُنَّة) - Letters: ل, ر (Laam and Raa) completely merged cleanly with no nasal hum.",
        2
    ],
    [
        4, 3, "Iqlab (Conversion to Meem)", "الإقلاب",
        "Turning Noon Sakinah or Tanween into a hidden Meem with Ghunnah before the letter Baa.",
        "Iqlab literally means 'to turn or convert'. When Noon Sakinah (نْ) or Tanween is immediately followed by the letter Baa (ب), the Noon sound is converted into a light Meem (م) accompanied by a 2-count Ghunnah and slight relaxation of the lips.\n\nIn the Mushaf, this is denoted by a small standing Meem (مـ) over the Noon or Tanween.",
        3
    ],
    [
        5, 3, "Ikhfa Haqiqi (Hiding / Concealment)", "الإخفاء الحقيقي",
        "Concealing the Noon Sakinah or Tanween between Izhar and Idgham with an ongoing Ghunnah.",
        "Ikhfa literally means 'to hide'. In Tajweed, it is pronouncing the Noon Sakinah or Tanween in a state between Izhar and Idgham without Tashdeed, keeping the Ghunnah on the remaining 15 letters of the alphabet.\n\nThe 15 Ikhfa letters are the initial letters of each word in the classical poem:\nصِفْ ذَا ثَنَا كَمْ جَادَ شَخْصٌ قَدْ سَمَا * دُمْ طَيِّبًا زِدْ فِي تُقًى ضَعْ ظَالِمَا\n(ص, ذ, ث, ك, ج, ش, ق, س, د, ط, ز, ف, ت, ض, ظ).",
        4
    ],
    [
        6, 5, "The Mechanics of Qalqalah", "حروف القلقلة ومراتبها",
        "The echoing rebound sound on five specific consonants when bearing a Sukoon.",
        "Qalqalah literally means 'vibration' or 'shaking'. When one of the five letters of (قُطْبُ جَدٍّ - Qutbu Jaddin: ق, ط, ب, ج, د) carries a Sukoon (either inherently or due to stopping), an echoing rebound sound must be produced without adding a vowel.\n\nLevels of Qalqalah:\n1. Sughra (Minor) - Middle of a word or sentence (e.g. يَقْطَعُونَ).\n2. Kubra (Major) - End of an ayah/word when stopped upon (e.g. الفَلَقْ).\n3. Akbar (Maximum) - End of a word on a letter with Shaddah stopped upon (e.g. الحَقّ).",
        1
    ]
];

$tlStmt = $db->prepare("INSERT OR REPLACE INTO tajweed_lessons (id, category_id, title, title_arabic, summary, content, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)");
foreach ($tajLessons as $l) {
    $tlStmt->execute($l);
}

// Rules
$tajRules = [
    [1, 2, "Izhar Halqi", "إظهار حلقي", "#10b981", "Pronounce Noon clearly without holding the nasal hum before Hamzah, Haa, 'Ayn, Haa, Ghayn, Khaa."],
    [2, 3, "Idgham with Ghunnah", "إدغام بغنة", "#d97706", "Merge Noon into Ya, Noon, Meem, or Waw while holding a nasal hum for 2 harakat."],
    [3, 3, "Idgham without Ghunnah", "إدغام بغير غنة", "#059669", "Completely merge Noon into Laam or Raa cleanly without nasal hum."],
    [4, 4, "Iqlab", "إقلاب", "#8b5cf6", "Turn Noon sound into Meem before letter Baa with 2-count Ghunnah."],
    [5, 5, "Ikhfa Haqiqi", "إخفاء حقيقي", "#f59e0b", "Hide the Noon sound at the point of the next letter with 2-count Ghunnah."],
    [6, 6, "Qalqalah", "قلقلة", "#0284c7", "Echoing sound on Qaf, Taa, Baa, Jeem, Dal with Sukoon."]
];

$trStmt = $db->prepare("INSERT OR REPLACE INTO tajweed_rules (id, lesson_id, name, name_arabic, color_code, explanation) VALUES (?, ?, ?, ?, ?, ?)");
foreach ($tajRules as $r) {
    $trStmt->execute($r);
}

// Examples
$tajExamples = [
    [1, 1, "مَنْ ءَامَنَ", "Man aamana", 2, 62, "Noon Sakinah followed by Hamzah (ء) - Clear pronunciation without elongation."],
    [2, 1, "عَلِيمٌ حَكِيمٌ", "'Aleemun Hakeem", 4, 26, "Tanween followed by Haa (ح) - Izhar Halqi."],
    [3, 2, "مَن يَقُولُ", "May-yaqool", 2, 8, "Noon Sakinah followed by Ya (ي) - Merged with 2 counts of Ghunnah."],
    [4, 3, "مِّن رَّبِّهِمْ", "Mir-rabbihim", 2, 5, "Noon Sakinah followed by Raa (ر) - Completely merged into Raa with no Ghunnah."],
    [5, 4, "مِنۢ بَعْدِ", "Mim-ba'di", 2, 27, "Noon Sakinah before Baa (ب) - Converted to Meem with Ghunnah."],
    [6, 5, "مِن قَبْلُ", "Ming-qablu", 2, 25, "Noon Sakinah before Qaf (ق) - Concealed with heavy Ghunnah."],
    [7, 6, "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ", "Qul a'oodhu bi-rabbil-falaq", 113, 1, "Letter Qaf (ق) stopped upon with Sukoon 'Arid - Major Qalqalah."]
];

$teStmt = $db->prepare("INSERT OR REPLACE INTO tajweed_examples (id, rule_id, text_arabic, text_transliteration, surah_number, ayah_number, explanation) VALUES (?, ?, ?, ?, ?, ?, ?)");
foreach ($tajExamples as $e) {
    $teStmt->execute($e);
}

// Quizzes
$tajQuizzes = [
    [1, 2, "How many letters cause Izhar Halqi (clear pronunciation)?", "4 letters", "6 letters", "8 letters", "15 letters", "B", "The 6 throat letters are Hamzah, Haa, 'Ayn, Haa, Ghayn, Khaa."],
    [2, 2, "In the phrase 'مَنْ ءَامَنَ', which Tajweed rule applies to the Noon Sakinah?", "Idgham", "Ikhfa", "Izhar Halqi", "Iqlab", "C", "Because Noon Sakinah is followed by Hamzah (ء), which is a throat letter."],
    [3, 3, "Which letters belong to Idgham without Ghunnah (بغير غنة)?", "ي and و", "ل and ر", "م and ن", "ب and م", "B", "Laam and Raa (ل and ر) merge completely without any nasal sound."],
    [4, 4, "Which letter causes the rule of Iqlab to take place?", "Letter Meem (م)", "Letter Baa (ب)", "Letter Waw (و)", "Letter Noon (ن)", "B", "Iqlab occurs ONLY when Noon Sakinah or Tanween is followed by the single letter Baa (ب)."],
    [5, 5, "How many letters trigger the rule of Ikhfa Haqiqi?", "6 letters", "14 letters", "15 letters", "28 letters", "C", "There are 15 letters of Ikhfa Haqiqi."],
    [6, 6, "What are the 5 letters of Qalqalah?", "ق ط ب ج د", "ي ر م ل و ن", "أ هـ ع ح غ خ", "ف ج ش ث خ ص", "A", "The 5 letters are collected in the phrase Qutbu Jadd (قُطْبُ جَدٍّ)."]
];

$tqStmt = $db->prepare("INSERT OR REPLACE INTO tajweed_quizzes (id, lesson_id, question, option_a, option_b, option_c, option_d, correct_option, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
foreach ($tajQuizzes as $q) {
    $tqStmt->execute($q);
}

// =========================================================================
// 3. SEED TAFSIR MODULE (SOURCES & AUTHENTIC ENTRIES)
// =========================================================================
echo " -> Seeding Tafsir Module...\n";
$tafsirSources = [
    [1, "Tafsir Ibn Kathir (Abridged)", "Imam Ismail ibn Kathir (d. 774 AH)", "en", "Classical exegesis strictly based on Tafsir of Quran by Quran, authentic Hadith, sayings of the Sahaba and Tabi'un.", 1],
    [2, "Tafsir al-Jalalayn", "Jalal al-Din al-Mahalli & Jalal al-Din al-Suyuti", "en", "Concise classical exegesis highly revered for word-by-word clarity and linguistic precision.", 0],
    [3, "Tafsir as-Sa'di (Taysir al-Karim)", "Shaykh Abd ar-Rahman as-Sa'di (d. 1376 AH)", "en", "Clear, contemporary, spiritually uplifting exegesis focusing on the guidance and moral lessons of the verses.", 0]
];

$tsStmt = $db->prepare("INSERT OR REPLACE INTO tafsir_sources (id, name, author, language, methodology, is_default) VALUES (?, ?, ?, ?, ?, ?)");
foreach ($tafsirSources as $s) {
    $tsStmt->execute($s);
}

$tafsirEntries = [
    // Surah Al-Fatihah (1:1 to 1:7)
    [
        1, 1, 1, 1, "1:1", "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
        "The Basmalah: The Companions started the Book of Allah with it. Scholars agree that Bismillah is a verse in Surah An-Naml (27:30). The name 'Allah' is the Greatest Name of the Lord, derived from Al-Ilah (the One who alone deserves to be worshipped). Ar-Rahman is more intensive than Ar-Rahim, denoting vast, all-encompassing mercy for all creation in this world, while Ar-Rahim denotes special mercy for the believers in the Hereafter.",
        "Tafsir Ibn Kathir, Vol 1, pp. 67-85", "Surah An-Naml 27:30, Surah Al-A'raf 7:156"
    ],
    [
        2, 1, 1, 2, "1:2", "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
        "[All] praise is [due] to Allah, Lord of the worlds -",
        "Al-Hamd means all manner of perfect praise and gratitude belongs solely to Allah for His intrinsic Perfection and for the countless bounties He bestows upon His servants. 'Rabb' signifies the Master, Owner, Creator, Sustainer, and Regulator of all affairs. 'Al-Alamin' is plural of 'Alam', encompassing everything in existence other than Allah (mankind, jinn, angels, heavens, earth).",
        "Tafsir Ibn Kathir, Vol 1, pp. 86-98", "Surah Al-An'am 6:1, Surah Fatir 35:1"
    ],
    [
        3, 1, 1, 5, "1:5", "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
        "It is You we worship and You we ask for help.",
        "This is the heart and core of the entire Quran: the realization of Pure Tawhid (Monotheism). Putting 'Iyyaka' (You alone) first signifies exclusivity: 'We worship none but You, and we rely upon none but You.' Worship (Ibadah) comprises the utmost love, submission, and reverence. Seeking help (Isti'anah) is placed right after worship because man cannot perform any act of obedience without Allah's divine aid.",
        "Tafsir Ibn Kathir, Vol 1, pp. 102-115", "Surah Hud 11:123, Surah Al-Mulk 67:29"
    ],
    // Ayat al-Kursi (2:255)
    [
        4, 1, 2, 255, "2:255", "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ",
        "Allah - there is no deity except Him, the Ever-Living, the Sustainer of [all] existence. Neither drowsiness overtakes Him nor sleep.",
        "Ayat al-Kursi is the greatest single verse in the Holy Quran, as authentically established in Sahih Muslim from Ubayy ibn Ka'b. It mentions ten independent, magnificent attributes of Allah. 'Al-Hayy' (The Ever-Living) affirms that Allah possesses eternal life without beginning or end. 'Al-Qayyum' affirms that He sustains Himself and all creation depends entirely on Him. 'Sinah' means drowsiness, while 'Nawm' means deep sleep; Allah is elevated above any deficiency or fatigue.",
        "Tafsir Ibn Kathir, Vol 2, pp. 12-25", "Surah Taha 20:111, Surah Al-Imran 3:2"
    ],
    // Surah Al-Ikhlas (112:1 to 112:4)
    [
        5, 1, 112, 1, "112:1", "قُلْ هُوَ اللَّهُ أَحَدٌ",
        "Say, 'He is Allah, [who is] One,'",
        "The Prophet ﷺ declared that Surah Al-Ikhlas is equivalent to one-third of the entire Quran because the Quran consists of three main themes: Islamic Creed (Aqeedah/Tawhid), Stories of the Past, and Legal Rulings. This Surah is dedicated purely to the description of Allah the Almighty. 'Ahad' means He is the Absolute, Single One with no partners, equals, or rivals in His Essence, Lordship, or Worship.",
        "Tafsir Ibn Kathir, Vol 8, pp. 530-542", "Surah Ash-Shura 42:11, Surah Al-An'am 6:102"
    ],
    [
        6, 1, 112, 2, "112:2", "اللَّهُ الصَّمَدُ",
        "Allah, the Eternal Refuge.",
        "Ibn Abbas (RA) stated that 'As-Samad' means: The Master who is perfect in His sovereignty, the Noble who is perfect in His nobility, the Magnificent who is perfect in His magnificence, the All-Knowing who is perfect in His knowledge, and the Self-Sufficient One whom all creation turns to in need while He is in need of none.",
        "Tafsir Ibn Kathir, Vol 8, pp. 535-538", "Surah Fatir 35:15"
    ]
];

$teStmt = $db->prepare("
    INSERT OR REPLACE INTO tafsir_entries 
    (id, source_id, surah_number, ayah_number, verse_key, text_arabic, text_translation, content, source_attribution, related_verses)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");
foreach ($tafsirEntries as $te) {
    $teStmt->execute($te);
}

// =========================================================================
// 4. SEED TAWHID & AQEEDAH MODULE
// =========================================================================
echo " -> Seeding Tawhid & Aqeedah Module...\n";
$tawhidCats = [
    [1, "Tawhid (Islamic Monotheism)", "التوحيد", "Understanding the Oneness of Allah in Lordship, Worship, and Divine Names and Attributes.", 1],
    [2, "Arkan al-Iman (Articles of Faith)", "أركان الإيمان", "The six fundamental pillars of Islamic belief required of every Muslim.", 2],
    [3, "Protection from Shirk", "التحذير من الشرك", "Understanding the reality of Major and Minor Shirk to safeguard one's faith.", 3],
    [4, "Nawaqid al-Islam (Nullifiers of Faith)", "نواقض الإسلام", "Core theological principles and actions that nullify a person's Islam.", 4]
];

$twcStmt = $db->prepare("INSERT OR REPLACE INTO tawhid_categories (id, name, name_arabic, description, order_index) VALUES (?, ?, ?, ?, ?)");
foreach ($tawhidCats as $tc) {
    $twcStmt->execute($tc);
}

$tawhidLessons = [
    [
        1, 1, "Tawhid al-Rububiyyah (Oneness of Lordship)",
        "Tawhid al-Rububiyyah means affirming that Allah alone is the Creator, Sustainer, Owner, and Provider of all that exists.",
        "Definition:\nTawhid al-Rububiyyah is the firm belief that Allah alone creates, provides, gives life, causes death, and governs every atom in the heavens and the earth without any partner or assistant.\n\nEven the pagan Arabs at the time of the Prophet ﷺ acknowledged this category of Tawhid (as stated in Surah Luqman 31:25: 'And if you asked them who created the heavens and earth, they would surely say, Allah'). However, this alone does not make a person a Muslim until they single out Allah in worship.",
        "Quran: 'Unquestionably, His is the creation and the command; blessed is Allah, Lord of the worlds.' (7:54)\nQuran: 'Say, Who provides for you from the heaven and the earth? Or who controls hearing and sight? They will say: Allah.' (10:31)",
        "1. Allah is the sole Creator and Administrator of the Universe.\n2. Acknowledging Rububiyyah logically necessitates worshipping Him alone (Uluhiyyah).\n3. No being has power to benefit or harm independent of Allah's permission.",
        1
    ],
    [
        2, 1, "Tawhid al-Uluhiyyah (Oneness in Worship)",
        "Tawhid al-Uluhiyyah (also known as Tawhid al-Ibadah) is the core purpose of human existence and the message of all Prophets.",
        "Definition:\nTawhid al-Uluhiyyah is directing all acts of worship exclusively to Allah alone. Worship (Ibadah) is an umbrella term encompassing everything Allah loves and is pleased with from internal beliefs (love, fear, hope, reliance) and external actions (prayer, zakah, fasting, sacrifice, du'a, vows).\n\nThis was the exact point of dispute between all Prophets and their disbelieving nations. The polytheists refused to worship Allah alone, instead taking intermediaries, idols, or pious souls as conduits to Allah.",
        "Quran: 'And We certainly sent into every nation a messenger, saying: Worship Allah and avoid Taghut.' (16:36)\nQuran: 'And your Lord says: Call upon Me; I will respond to you.' (40:60)\nHadith: 'Du'a is worship itself.' (Sunan Abi Dawud)",
        "1. Worship must only be directed to Allah without any intermediary.\n2. Making Du'a to deceased saints, idols, or angels violates Tawhid al-Uluhiyyah.\n3. Acts of worship require two conditions: Sincerity (Ikhlas) and compliance with the Sunnah.",
        2
    ],
    [
        3, 1, "Tawhid al-Asma wa al-Sifat (Names & Attributes)",
        "Believing in all of Allah's Divine Names and Attributes as mentioned in the Quran and Sunnah without distortion or comparison.",
        "Definition:\nTawhid al-Asma wa al-Sifat means describing Allah as He has described Himself in His Book, or as His Messenger ﷺ described Him in authentic Hadiths, based on two core foundations:\n1. Affirmation without resemblance (اثبات بلا تمثيل)\n2. Exaltation without denial (تنزيه بلا تعطيل)\n\nWe do not distort their meanings (Tahreef), deny them (Ta'teel), question how they are (Takyreef), or liken them to the creation (Tamtheel).",
        "Quran: 'There is nothing like unto Him, and He is the Hearing, the Seeing.' (42:11)\nQuran: 'And to Allah belong the best names, so invoke Him by them.' (7:180)",
        "1. Allah's Names are all beautiful and His Attributes are all supreme.\n2. Affirm what Allah affirmed for Himself without comparing Him to humans.\n3. His hearing and seeing are real and divine, unlike creation's limited faculties.",
        3
    ],
    [
        4, 2, "The Six Articles of Faith (Arkan al-Iman)",
        "The six pillars of Iman explained by the Prophet ﷺ in the famous Hadith of Jibreel.",
        "When the Angel Jibreel came to the Prophet ﷺ and asked: 'Tell me about Iman,' the Prophet ﷺ replied:\n'Iman is to believe in:\n1. Allah\n2. His Angels\n3. His Books\n4. His Messengers\n5. The Last Day\n6. Divine Decree (al-Qadar), both its good and its bad.' (Sahih Muslim)\n\nIman increases with acts of obedience and righteous deeds, and decreases with sins and negligence.",
        "Quran: 'The Messenger has believed in what was revealed to him from his Lord, and [so have] the believers. All of them have believed in Allah and His angels and His books and His messengers.' (2:285)\nHadith: Hadith Jibreel (Sahih Muslim 8)",
        "1. Faith consists of speech of the tongue, belief of the heart, and action of the limbs.\n2. Rejecting even one of the six pillars invalidates a person's faith.\n3. Iman increases through good deeds and decreases through disobedience.",
        1
    ],
    [
        5, 3, "Understanding Shirk: Major and Minor",
        "The gravest sin in Islam and how to protect one's heart and deeds from it.",
        "Shirk is associating partners with Allah. It is classified into two main categories:\n\n1. Major Shirk (الشرك الأكبر): Directing any form of worship to other than Allah (such as supplicating to the dead, seeking omens, sacrificing animals to jinns). This expels a person from the fold of Islam and nullifies all good deeds.\n\n2. Minor Shirk (الشرك الأصغر): Acts that lead toward polytheism, such as Riya' (showing off in worship to be praised by people) or swearing by other than Allah without deifying them. It does not expel one from Islam, but it is a major sin and invalidates the specific deed.",
        "Quran: 'Indeed, Allah does not forgive association with Him, but He forgives what is less than that for whom He wills.' (4:48)\nHadith: 'The thing I fear most for you is the lesser shirk: Riya' (showing off).' (Musnad Ahmad)",
        "1. Shirk is the only unforgivable sin if one dies without repenting from it.\n2. Sincerity of intention must be purified continuously.\n3. Seeking protection from Shirk with the Prophetic supplication.",
        1
    ],
    [
        6, 4, "Ten Nullifiers of Islam",
        "A study of the actions that invalidate one's Islam according to authentic scholarship.",
        "Scholars of Islam agree that certain grave deviations invalidate one's faith: 1. Polytheism in worship. 2. Setting up intermediaries between oneself and Allah. 3. Not declaring polytheists to be disbelievers or doubting their disbelief. 4. Believing guidance other than the Prophet's ﷺ is superior. 5. Hating something the Messenger brought. 6. Mocking Islam or its rewards. 7. Sorcery and black magic. 8. Supporting polytheists against Muslims. 9. Believing some people can escape following Muhammad ﷺ. 10. Turning away from Islam completely.",
        "Quran: 'Say: Is it Allah and His verses and His Messenger that you were mocking? Make no excuse; you have disbelieved after your belief.' (9:65-66)",
        "1. Faith must be guarded with continuous vigilance.\n2. Sincerity and adherence to the Sunnah protect a believer.\n3. Knowledge of nullifiers prevents falling into destruction.",
        1
    ]
];

$twlStmt = $db->prepare("INSERT OR REPLACE INTO tawhid_lessons (id, category_id, title, introduction, main_lesson, evidence_quran_hadith, key_points, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
foreach ($tawhidLessons as $tl) {
    $twlStmt->execute($tl);
}

$tawhidQuizzes = [
    [1, 1, "What does Tawhid al-Rububiyyah mean?", "Singling out Allah in all acts of worship", "Belief that Allah alone is the Creator, Sustainer, and Ruler of the universe", "Singling out Allah in His Divine Names", "Belief in the angels and books", "B", "Rububiyyah is derived from Rabb (Lord, Creator, Sustainer)."],
    [2, 2, "Which category of Tawhid was the primary message and call of all Prophets?", "Tawhid al-Rububiyyah", "Tawhid al-Uluhiyyah (Worship)", "Tawhid of the heavens", "Tawhid of creation", "B", "All prophets called their people: 'Worship Allah, you have no other deity besides Him.'"],
    [3, 3, "Which Quranic verse establishes the foundational rule for understanding Allah's Divine Names and Attributes?", "Surah Al-Baqarah 2:255", "Surah Ash-Shura 42:11 ('There is nothing like unto Him...')", "Surah Yasin 36:1", "Surah Al-Mulk 67:1", "B", "Surah Ash-Shura 42:11 establishes negation of likeness followed by affirmation of attributes."],
    [4, 4, "How many pillars of Iman (Faith) did the Prophet ﷺ outline in Hadith Jibreel?", "5 pillars", "6 pillars", "7 pillars", "10 pillars", "B", "There are 6 pillars: Belief in Allah, Angels, Books, Messengers, Last Day, and Divine Decree."],
    [5, 5, "What is Riya' (showing off for human praise) categorized as in Islamic jurisprudence?", "Major Shirk", "Minor Shirk", "Permissible action", "Recommended act", "B", "Riya' is the lesser shirk (Ash-Shirk al-Asghar) as warned by the Prophet ﷺ."],
    [6, 6, "What is the primary condition for any act of worship to be accepted by Allah?", "Sincerity (Ikhlas) for Allah alone and adherence to the Sunnah of the Prophet ﷺ", "Performing it in public places", "Worldly wealth and status", "Speed in completion", "A", "Every accepted deed requires Ikhlas solely for Allah and Ittiba' (compliance) with the Sunnah."]
];

$twqStmt = $db->prepare("INSERT OR REPLACE INTO tawhid_quizzes (id, lesson_id, question, option_a, option_b, option_c, option_d, correct_option, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
foreach ($tawhidQuizzes as $tq) {
    $twqStmt->execute($tq);
}

// =========================================================================
// 5. SEED AUTHENTIC HADITH (40 NAWAWI & SAHIH COLLECTIONS)
// =========================================================================
echo " -> Seeding Hadith Collections & Items...\n";
$hadithColls = [
    [1, "40 Hadith an-Nawawi", "Imam Yahya ibn Sharaf an-Nawawi (d. 676 AH)", 42, "The most famous compilation of foundational, comprehensive Hadiths encapsulating the principles of Islam."],
    [2, "Sahih al-Bukhari (Selections)", "Imam Muhammad ibn Ismail al-Bukhari (d. 256 AH)", 100, "The most authentic book after the Holy Quran, containing strictly verified Hadiths with connected chains."],
    [3, "Sahih Muslim (Selections)", "Imam Muslim ibn al-Hajjaj an-Naysaburi (d. 261 AH)", 100, "The second preeminent collection of authentic prophetic traditions."]
];

$hcStmt = $db->prepare("INSERT OR REPLACE INTO hadith_collections (id, name, author, total_hadith, description) VALUES (?, ?, ?, ?, ?)");
foreach ($hadithColls as $hc) {
    $hcStmt->execute($hc);
}

$hadithItems = [
    [
        1, 1, 1, "The Intentions",
        "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ فَهِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ...",
        "Actions are judged only by intentions, and every person will get only what they intended. Thus, whoever emigrated for Allah and His Messenger, his emigration is for Allah and His Messenger; and whoever emigrated for worldly gain or to marry a woman, his emigration is for that which he emigrated for.",
        "Umar ibn al-Khattab (RA)", "Sahih", "Sahih al-Bukhari 1, Sahih Muslim 1907"
    ],
    [
        2, 1, 2, "Islam, Iman, and Ihsan (Hadith Jibreel)",
        "بَيْنَمَا نَحْنُ جُلُوسٌ عِنْدَ رَسُولِ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ ذَاتَ يَوْمٍ إِذْ طَلَعَ عَلَيْنَا رَجُلٌ شَدِيدُ بَيَاضِ الثِّيَابِ شَدِيدُ سَوَادِ الشَّعْرِ...",
        "One day while we were sitting with the Messenger of Allah ﷺ, there came before us a man with exceedingly white clothes and exceedingly black hair... He asked: 'O Muhammad, tell me about Islam...' Then he asked: 'Tell me about Iman...' Then he asked: 'Tell me about Ihsan...' The Prophet said: 'It was Jibreel who came to teach you your religion.'",
        "Umar ibn al-Khattab (RA)", "Sahih", "Sahih Muslim 8"
    ],
    [
        3, 1, 3, "The Five Pillars of Islam",
        "بُنِيَ الإِسْلامُ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لا إِلَهَ إِلا اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ، وَإِقَامِ الصَّلاةِ، وَإِيتَاءِ الزَّكَاةِ، وَحَجِّ الْبَيْتِ، وَصَوْمِ رَمَضَانَ",
        "Islam is built upon five pillars: Testifying that there is no god worthy of worship except Allah and that Muhammad is the Messenger of Allah, establishing prayer, paying Zakah, making the pilgrimage to the House (Hajj), and fasting during Ramadan.",
        "Abdullah ibn Umar (RA)", "Sahih", "Sahih al-Bukhari 8, Sahih Muslim 16"
    ],
    [
        4, 1, 13, "Loving for One's Brother",
        "لا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
        "None of you truly believes until he loves for his brother what he loves for himself.",
        "Anas ibn Malik (RA)", "Sahih", "Sahih al-Bukhari 13, Sahih Muslim 45"
    ],
    [
        5, 1, 18, "Taqwa and Good Character",
        "اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ، وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا، وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ",
        "Fear Allah wherever you may be, follow up a bad deed with a good deed and it will wipe it out, and behave toward people with good character.",
        "Abu Dharr Jundub ibn Junadah & Abu Abdur-Rahman Mu'adh ibn Jabal (RA)", "Hasan", "Jami' at-Tirmidhi 1987"
    ],
    [
        6, 2, 1, "Beginning of Revelation",
        "سَمِعْتُ عَلْقَمَةَ بْنَ وَقَّاصٍ اللَّيْثِيَّ، يَقُولُ: سَمِعْتُ عُمَرَ بْنَ الْخَطَّابِ رَضِيَ اللَّهُ عَنْهُ عَلَى الْمِنْبَرِ قَالَ: سَمِعْتُ رَسُولَ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ يَقُولُ: إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
        "I heard the Messenger of Allah ﷺ saying: The reward of deeds depends upon the intentions and every person will get the reward according to what he has intended.",
        "Umar ibn al-Khattab (RA)", "Sahih", "Sahih al-Bukhari 1"
    ],
    [
        7, 2, 10, "Definition of a Muslim",
        "المُسْلِمُ مَنْ سَلِمَ المُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ، وَالمُهَاجِرُ مَنْ هَجَرَ مَا نَهَى اللَّهُ عَنْهُ",
        "A Muslim is the one who avoids harming Muslims with his tongue and his hands, and a Muhajir (emigrant) is the one who abandons all what Allah has forbidden.",
        "Abdullah ibn Amr (RA)", "Sahih", "Sahih al-Bukhari 10"
    ],
    [
        8, 2, 67, "Seeking Sacred Knowledge",
        "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ",
        "Whoever travels a path in search of sacred knowledge, Allah makes easy for him a path to Paradise.",
        "Abu Hurairah (RA)", "Sahih", "Sahih al-Bukhari & Sahih Muslim"
    ],
    [
        9, 3, 55, "Religion is Sincere Advice",
        "الدِّينُ النَّصِيحَةُ، قُلْنَا: لِمَنْ؟ قَالَ: لِلَّهِ وَلِكِتَابِهِ وَلِرَسُولِهِ وَلأَئِمَّةِ الْمُسْلِمِينَ وَعَامَّتِهِمْ",
        "The religion is sincere advice (Nasihah). We said: To whom? The Prophet ﷺ replied: To Allah, His Book, His Messenger, the leaders of the Muslims, and their common folk.",
        "Tamim ad-Dari (RA)", "Sahih", "Sahih Muslim 55"
    ]
];

$hiStmt = $db->prepare("
    INSERT OR REPLACE INTO hadith_items 
    (id, collection_id, hadith_number, chapter_name, text_arabic, translation, narrator, grading, reference)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
");
foreach ($hadithItems as $hi) {
    $hiStmt->execute($hi);
}

// =========================================================================
// 6. SEED ADHKAR & DAILY SUPPLICATIONS (HISN AL-MUSLIM)
// =========================================================================
echo " -> Seeding Adhkar & Duas...\n";
$adhkarCats = [
    [1, "Morning Adhkar", "أذكار الصباح", "sun", 1],
    [2, "Evening Adhkar", "أذكار المساء", "moon-stars", 2],
    [3, "After Salah", "أذكار بعد الصلاة", "bell", 3],
    [4, "Before Sleep", "أذكار النوم", "cloud-moon", 4],
    [5, "General Dhikr", "أذكار عامة", "heart-pulse", 5]
];

$acStmt = $db->prepare("INSERT OR REPLACE INTO adhkar_categories (id, name, name_arabic, icon, order_index) VALUES (?, ?, ?, ?, ?)");
foreach ($adhkarCats as $ac) {
    $acStmt->execute($ac);
}

$adhkarItems = [
    [
        1, 1, "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَـهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        "Asbahna wa-asbahal-mulku lillah, wal-hamdu lillah, la ilaha illallahu wahdahu la shareeka lah, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadeer.",
        "We have entered the morning and the kingdom belongs to Allah, and all praise is for Allah. There is no deity except Allah alone, having no partner. To Him belongs the dominion and to Him belongs all praise, and He is over all things competent.",
        "Protection throughout the morning until evening.", "Sahih Muslim 2723", 1
    ],
    [
        2, 1, "اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ",
        "Allahumma Anta Rabbi la ilaha illa Ant, khalaqtani wa ana 'abduk, wa ana 'ala 'ahdika wa wa'dika mastata't, a'oodhu bika min sharri ma sana't, aboo'u laka bini'matika 'alayy, wa aboo'u bidhanbi faghfir li, fa-innahu la yaghfirudh-dhunooba illa Ant.",
        "Sayyid al-Istighfar (The Master of Forgiveness): O Allah, You are my Lord, there is no god but You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favor upon me, and I acknowledge my sin, so forgive me, for none forgives sins except You.",
        "Whoever recites it in the morning with conviction and dies before evening will be among the people of Paradise.", "Sahih al-Bukhari 6306", 1
    ],
    [
        3, 1, "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
        "SubhanAllahi wa bihamdih",
        "Glory be to Allah and all praise is due to Him.",
        "Whoever recites this 100 times in the morning and evening, no one will come on the Day of Resurrection with anything better except one who said the same or more.", "Sahih Muslim 2692", 100
    ],
    [
        4, 3, "أَسْتَغْفِرُ اللهَ (٣ مرات)\nاللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالإِكْرَامِ",
        "Astaghfirullah (3x). Allahumma antas-Salam wa minkas-Salam, tabarakta ya dhal-Jalali wal-Ikram.",
        "I seek the forgiveness of Allah (3 times). O Allah, You are Peace and from You comes peace. Blessed are You, O Owner of majesty and honor.",
        "Recited immediately upon completing the obligatory prayer.", "Sahih Muslim 591", 1
    ],
    [
        5, 3, "سُبْحَانَ اللهِ (٣٣) | الحَمْدُ للهِ (٣٣) | اللهُ أَكْبَرُ (٣٣) | لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لا شَرِيكَ لَهُ...",
        "SubhanAllah (33x), Alhamdulillah (33x), Allahu Akbar (33x), followed by La ilaha illallah wahdahu la shareeka lah...",
        "Glory be to Allah (33x), Praise be to Allah (33x), Allah is the Greatest (33x), completed with the declaration of Tawhid.",
        "Whoever recites this after every obligatory prayer, his sins will be forgiven even if they are like the foam of the sea.", "Sahih Muslim 597", 33
    ],
    [
        6, 2, "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَـهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        "Amsayna wa-amsal-mulku lillah, wal-hamdu lillah, la ilaha illallahu wahdahu la shareeka lah, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadeer.",
        "We have reached the evening and the kingdom belongs to Allah, and all praise is for Allah. There is no deity except Allah alone, having no partner. To Him belongs the dominion and to Him belongs all praise, and He is over all things competent.",
        "Evening protection until dawn.", "Sahih Muslim 2723", 1
    ],
    [
        7, 2, "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
        "A'oodhu bi-kalimatil-lahit-tammati min sharri ma khalaq.",
        "I seek refuge in the perfect words of Allah from the evil of what He has created.",
        "Whoever recites this 3 times in the evening will not be harmed by poisonous stings or venomous creatures that night.", "Sahih Muslim 2709", 3
    ],
    [
        8, 4, "بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ",
        "Bismika Rabbi wada'tu janbi, wa bika arfa'uh, fa-in amsakta nafsi far-hamha, wa-in arsaltaha fah-fazha bima tahfazu bihi 'ibadakas-saliheen.",
        "In Your name, my Lord, I lay my side down, and in Your name I raise it up. If You take my soul, have mercy upon it, and if You release it, then protect it as You protect Your righteous slaves.",
        "Supplication upon reclining to sleep.", "Sahih al-Bukhari 6320, Sahih Muslim 2714", 1
    ],
    [
        9, 4, "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
        "Bismik-Allahumma amootu wa-ahya.",
        "In Your name, O Allah, I die and I live.",
        "Recited before closing eyes for sleep.", "Sahih al-Bukhari 6312", 1
    ]
];

$aiStmt = $db->prepare("
    INSERT OR REPLACE INTO adhkar_items 
    (id, category_id, text_arabic, transliteration, translation, virtue, reference, target_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
");
foreach ($adhkarItems as $ai) {
    $aiStmt->execute($ai);
}

// Duas Categories & Items
$duaCats = [
    [1, "Quranic Duas (Rabbana)", "أدعية قرآنية", "book", 1],
    [2, "Daily & Lifestyle", "أدعية يومية", "house", 2],
    [3, "Forgiveness & Repentance", "الاستغفار والتوبة", "arrow-counterclockwise", 3],
    [4, "Anxiety & Difficulties", "تفريج الكرب والهم", "shield-check", 4],
    [5, "Family & Righteousness", "الذرية والأسرة", "people", 5]
];

$dcStmt = $db->prepare("INSERT OR REPLACE INTO dua_categories (id, name, name_arabic, icon, order_index) VALUES (?, ?, ?, ?, ?)");
foreach ($duaCats as $dc) {
    $dcStmt->execute($dc);
}

$duaItems = [
    [
        1, 1, "Dua for Good in Both Worlds",
        "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
        "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar.",
        "Our Lord, give us in this world [that which is] good and in the Hereafter [that which is] good and protect us from the punishment of the Fire.",
        "Surah Al-Baqarah 2:201"
    ],
    [
        2, 1, "Dua for Increase in Knowledge",
        "رَّبِّ زِدْنِي عِلْمًا",
        "Rabbi zidni 'ilma.",
        "My Lord, increase me in knowledge.",
        "Surah Ta-Ha 20:114"
    ],
    [
        3, 1, "Dua for Parents",
        "رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
        "Rabbir-hamhuma kama rabbayani sagheera.",
        "My Lord, have mercy upon them as they brought me up [when I was] small.",
        "Surah Al-Isra 17:24"
    ],
    [
        4, 4, "Dua in Times of Distress and Grief",
        "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ",
        "Allahumma inni a'oodhu bika minal-hammi wal-hazan, wal-'ajzi wal-kasal, wal-bukhli wal-jubn, wa dala'id-dayni wa ghalabatir-rijal.",
        "O Allah, I seek refuge in You from grief and sadness, from weakness and laziness, from miserliness and cowardice, from the burden of debt, and from being overpowered by men.",
        "Sahih al-Bukhari 2893"
    ],
    [
        5, 2, "Dua for Leaving the Home",
        "بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلا حَوْلَ وَلا قُوَّةَ إِلاَّ بِاللَّهِ",
        "Bismillahi tawakkaltu 'alallahi wa la hawla wa la quwwata illa billah.",
        "In the name of Allah, I place my trust in Allah; there is no power and no strength except with Allah.",
        "Sunan Abi Dawud 5095"
    ],
    [
        6, 4, "Dua for Protection from All Harm and Evil",
        "بِسْمِ اللَّهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلاَ فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
        "Bismillahil-ladhi la yadurru ma'asmihi shay'un fil-ardi wa la fis-sama'i wa Huwas-Samee'ul-'Aleem.",
        "In the name of Allah, with whose name nothing on earth or in heaven can cause harm, and He is the All-Hearing, the All-Knowing. (Supreme Prophetic supplication for comprehensive protection from danger and evil)",
        "Sunan Abi Dawud 5088, Jami' at-Tirmidhi 3388"
    ]
];

$diStmt = $db->prepare("
    INSERT OR REPLACE INTO dua_items 
    (id, category_id, title, text_arabic, transliteration, translation, reference)
    VALUES (?, ?, ?, ?, ?, ?, ?)
");
foreach ($duaItems as $di) {
    $diStmt->execute($di);
}

echo "[+] Islamic Learning & Worship Platform data successfully seeded!\n";
