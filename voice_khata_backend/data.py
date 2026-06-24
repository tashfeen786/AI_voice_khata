"""
clean_and_split.py (Fixed)
------------------
For Roman Urdu ASR dataset.
Run: python data.py
"""

import os
import re
import random
import shutil
import librosa
import numpy as np
from collections import defaultdict

# ==============================================
#  🔧 CONFIG – CHANGE THIS PATH
# ==============================================
SOURCE_DIR = r"F:\Netsol Course\Project\voice_khata_backend\audio_data"   # <-- All mp3+txt yahan hain

TRAIN_DIR = os.path.join(SOURCE_DIR, "train")
VAL_DIR   = os.path.join(SOURCE_DIR, "val")
REVIEW_DIR = os.path.join(SOURCE_DIR, "review")
BACKUP_DIR = os.path.join(SOURCE_DIR, "..", "backup_original")

TRAIN_RATIO = 0.8
RANDOM_SEED = 42
MIN_DURATION = 0.8
SAMPLE_RATE = 16000

# ==============================================
# 1. Normalization (Fixed - no backslash in f-string)
# ==============================================
def normalize_roman_urdu(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    
    def num_to_words(match):
        num = match.group()
        num_map = {
            '0':'sifar','1':'ek','2':'do','3':'teen','4':'chaar',
            '5':'paanch','6':'chhay','7':'saat','8':'aath','9':'nau',
            '10':'das','11':'gyarah','12':'barah','13':'terah','14':'chaudah',
            '15':'pandrah','16':'solah','17':'satrah','18':'atharah','19':'unnis',
            '20':'bees','30':'tees','40':'chaalis','50':'pacchas','60':'saath',
            '70':'sattar','80':'assi','90':'nabbay','100':'sau','200':'do sau',
            '500':'paanch sau','1000':'hazaar'
        }
        if num in num_map:
            return num_map[num]
        if len(num) == 3:
            hundreds = int(num[0]) * 100
            rest = int(num[1:])
            if rest == 0:
                return num_map.get(str(hundreds), num)
            else:
                # Fix: move re.search outside f-string
                rest_str = str(rest)
                rest_match = re.search(r'\d+', rest_str)
                rest_words = num_to_words(rest_match) if rest_match else rest_str
                return f"{num_map.get(str(hundreds), num)} {rest_words}"
        return num
    
    text = re.sub(r'\d+', lambda m: num_to_words(m), text)
    text = re.sub(r'[^\w\s\']', '', text)
    
    replacements = {
        r'\bhai\b':'hay', r'\bhy\b':'hay', r'\bhe\b':'hay',
        r'\brupaye?\b':'rupay', r'\brupee\b':'rupay', r'\bso[uo]?\b':'sau',
        r'\bkiya\b':'kia', r'\bth[aei]\b':'tha', r'\bthay\b':'thay',
        r'\bk[aeu]l\b':'kal', r'\bne\b':'ne', r'\bko\b':'ko', r'\bse\b':'se',
        r'\bmei[n]?\b':'mein', r'\bah?\b':'a', r'\bek\b':'ek', r'\bdoo?\b':'do',
        r'\bteen\b':'teen', r'\bch[ao]r\b':'chaar', r'\bp[a]?nch\b':'paanch',
        r'\bch[eh]e?\b':'che', r'\bs[ae]t\b':'saat', r'\baa?th\b':'aath',
        r'\bn[ou]u?\b':'nau', r'\bda[eh]s\b':'das', r'\bbara[ah]\b':'barah',
        r'\bter[ae]h\b':'terah', r'\bchau?da[h]\b':'chaudah', r'\bpandra[h]\b':'pandrah',
        r'\bsola[h]\b':'solah', r'\bsatra[h]\b':'satrah', r'\batha[ar]a[h]\b':'atharah',
        r'\bunn[iy]s\b':'unnis', r'\bbe[ei]s\b':'bees', r'\bte[ei]s\b':'tees',
        r'\bchaa?li[cs]\b':'chaalis', r'\bpac[c]?ha[s]\b':'pacchas', r'\bsaa?th\b':'saath',
        r'\bsatt[ae]r\b':'sattar', r'\bass[iy]\b':'assi', r'\bnabb[ae]y?\b':'nabbay',
    }
    for pat, repl in replacements.items():
        text = re.sub(pat, repl, text, flags=re.IGNORECASE)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# ==============================================
# 2. Audio validity
# ==============================================
def is_audio_valid(audio_path, min_dur=MIN_DURATION):
    try:
        duration = librosa.get_duration(path=audio_path)
        if duration < min_dur:
            return False, f"Too short ({duration:.2f}s)"
        y, sr = librosa.load(audio_path, sr=SAMPLE_RATE, duration=1.0)
        if len(y) == 0:
            return False, "Empty audio"
        rms = np.sqrt(np.mean(y**2))
        if rms < 0.002:
            return False, f"Too silent (rms={rms:.5f})"
        return True, "OK"
    except Exception as e:
        return False, str(e)

# ==============================================
# 3. Clean all files
# ==============================================
def clean_all_files():
    all_files = [f for f in os.listdir(SOURCE_DIR) if f.endswith('.mp3')]
    print(f"Found {len(all_files)} mp3 files in {SOURCE_DIR}")
    
    valid_pairs = []
    issues_summary = defaultdict(int)
    fixed_log = []
    
    os.makedirs(REVIEW_DIR, exist_ok=True)
    
    for mp3 in all_files:
        base = mp3[:-4]
        txt_path = os.path.join(SOURCE_DIR, base + '.txt')
        audio_path = os.path.join(SOURCE_DIR, mp3)
        
        valid, msg = is_audio_valid(audio_path)
        if not valid:
            print(f"❌ {mp3}: {msg}")
            issues_summary['bad_audio'] += 1
            shutil.move(audio_path, os.path.join(REVIEW_DIR, mp3))
            if os.path.exists(txt_path):
                shutil.move(txt_path, os.path.join(REVIEW_DIR, base+'.txt'))
            continue
        
        if not os.path.exists(txt_path):
            print(f"⚠️ {mp3}: missing transcript")
            issues_summary['missing_txt'] += 1
            shutil.move(audio_path, os.path.join(REVIEW_DIR, mp3))
            continue
        
        with open(txt_path, 'r', encoding='utf-8') as f:
            original = f.read().strip()
        if len(original) < 3:
            print(f"⚠️ {mp3}: empty/short transcript")
            issues_summary['short_txt'] += 1
            shutil.move(audio_path, os.path.join(REVIEW_DIR, mp3))
            shutil.move(txt_path, os.path.join(REVIEW_DIR, base+'.txt'))
            continue
        
        normalized = normalize_roman_urdu(original)
        if original != normalized:
            fixed_log.append((mp3, original, normalized))
            print(f"🔄 Fixed: {mp3}")
            print(f"   Before: {original[:80]}\n   After:  {normalized[:80]}")
        
        with open(txt_path, 'w', encoding='utf-8') as f:
            f.write(normalized)
        
        valid_pairs.append((mp3, normalized))
    
    # Save log
    log_path = os.path.join(SOURCE_DIR, "clean_fix_log.txt")
    with open(log_path, 'w', encoding='utf-8') as f:
        for mp3, orig, norm in fixed_log:
            f.write(f"{mp3}\nBEFORE: {orig}\nAFTER:  {norm}\n{'-'*60}\n")
    
    print(f"\n✅ Cleaning complete.")
    print(f"   Valid pairs: {len(valid_pairs)}")
    print(f"   Moved to review: {issues_summary.get('bad_audio',0) + issues_summary.get('missing_txt',0) + issues_summary.get('short_txt',0)}")
    print(f"   Fixed transcripts: {len(fixed_log)}")
    return valid_pairs

# ==============================================
# 4. Split into train/val
# ==============================================
def split_and_move(valid_pairs):
    for d in [TRAIN_DIR, VAL_DIR]:
        if os.path.exists(d):
            shutil.rmtree(d)
        os.makedirs(d)
    
    random.seed(RANDOM_SEED)
    random.shuffle(valid_pairs)
    split_idx = int(len(valid_pairs) * TRAIN_RATIO)
    train_pairs = valid_pairs[:split_idx]
    val_pairs = valid_pairs[split_idx:]
    
    def copy_pair(pair, dest_dir):
        mp3, _ = pair
        base = mp3[:-4]
        src_mp3 = os.path.join(SOURCE_DIR, mp3)
        src_txt = os.path.join(SOURCE_DIR, base+'.txt')
        dest_mp3 = os.path.join(dest_dir, mp3)
        dest_txt = os.path.join(dest_dir, base+'.txt')
        shutil.copy2(src_mp3, dest_mp3)
        shutil.copy2(src_txt, dest_txt)
    
    for p in train_pairs:
        copy_pair(p, TRAIN_DIR)
    for p in val_pairs:
        copy_pair(p, VAL_DIR)
    
    print(f"\n📁 Split complete:")
    print(f"   Train: {len(train_pairs)} pairs -> {TRAIN_DIR}")
    print(f"   Val:   {len(val_pairs)} pairs -> {VAL_DIR}")
    
    summary_path = os.path.join(SOURCE_DIR, "split_summary.txt")
    with open(summary_path, 'w') as f:
        f.write(f"Total valid pairs: {len(valid_pairs)}\n")
        f.write(f"Train: {len(train_pairs)}\n")
        f.write(f"Val:   {len(val_pairs)}\n")
        f.write(f"Review folder: {REVIEW_DIR}\n")
    print(f"📄 Split summary saved to {summary_path}")

# ==============================================
# 5. Main
# ==============================================
def main():
    print("🚀 Starting dataset cleaning and splitting...")
    print(f"📁 Source: {SOURCE_DIR}\n")
    
    if not os.path.exists(BACKUP_DIR):
        print(f"📦 Creating backup in {BACKUP_DIR}")
        shutil.copytree(SOURCE_DIR, BACKUP_DIR)
        print("✅ Backup done.\n")
    else:
        print(f"ℹ️ Backup already exists at {BACKUP_DIR}\n")
    
    valid_pairs = clean_all_files()
    
    if len(valid_pairs) == 0:
        print("\n❌ No valid pairs found! Check your data.")
        return
    
    split_and_move(valid_pairs)
    
    print("\n🎉 All done! Now use 'train' and 'val' folders for training.")
    print(f"Bad files: {REVIEW_DIR}")
    print(f"Backup: {BACKUP_DIR}")

if __name__ == "__main__":
    main()