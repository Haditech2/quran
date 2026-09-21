import os
import sqlite3
import shutil

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def get_db_path():
    # 1. If in Vercel / serverless environment, use /tmp for write safety
    if os.environ.get('VERCEL'):
        tmp_path = '/tmp/quran_hifz.sqlite'
        if not os.path.exists(tmp_path):
            # Locate bundled db to copy from
            bundled_candidates = [
                os.path.join(os.path.dirname(__file__), 'quran_hifz.sqlite'),
                os.path.join(os.path.dirname(__file__), '..', 'backend_php', 'quran_hifz.sqlite'),
                os.path.join(os.path.dirname(__file__), '..', 'quran_hifz.sqlite'),
            ]
            for c in bundled_candidates:
                if os.path.exists(c):
                    shutil.copy2(c, tmp_path)
                    break
        if os.path.exists(tmp_path):
            return tmp_path

    # 2. Local candidates
    candidates = [
        os.path.join(os.path.dirname(__file__), 'quran_hifz.sqlite'),
        os.path.join(os.path.dirname(__file__), '..', 'backend_php', 'quran_hifz.sqlite'),
        os.path.join(os.path.dirname(__file__), '..', 'quran_hifz.sqlite'),
    ]
    for c in candidates:
        if os.path.exists(c):
            return os.path.abspath(c)

    return os.path.abspath(candidates[0])

def get_connection():
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    conn.row_factory = dict_factory
    conn.execute("PRAGMA foreign_keys = ON")
    return conn
