# Render Beépített Backup Funkciók Használata

## Mit biztosít a Render automatikusan?

A Render **automatikusan** mentést készít az adatbázisról, és **nincs szükség AWS-re vagy extra beállításra!**

---

## 1. Point-in-Time Recovery (PITR) - Automatikus

### Mit csinál?
- **Folyamatos automatikus mentés** a háttérben
- **3-7 napig** vissza tudsz állni bármikor
- **Hobby plan**: 3 nap visszaállítás
- **Professional plan**: 7 nap visszaállítás

### Hogyan használd?

#### 1.1 Adatbázis Visszaállítása
1. **Render Dashboard** → **PostgreSQL** adatbázisod
2. **Recovery** tab megnyitása
3. **"Restore Database"** gomb
4. **Dátum és idő** kiválasztása (utolsó 3-7 napból)
5. **Új adatbázis név** megadása (pl. `movaga-restored-2025-01-28`)
6. **"Start Recovery"** → várakozás

#### 1.2 Új Adatbázis Használata
```bash
# 1. Régi DATABASE_URL mentése
OLD_URL="postgresql://..."

# 2. Új DATABASE_URL a helyreállított adatbázisból
NEW_URL="postgresql://new-restored-db..."

# 3. Environment variables frissítése a Render Dashboard-ban
```

---

## 2. Manuális Backup Export/Import

### 2.1 Backup Készítése (Export)
1. **Render Dashboard** → **PostgreSQL** adatbázisod  
2. **Recovery** tab → **"Create export"** gomb
3. **Várakozás** (pár perc)
4. **Download link** megjelenik → **letöltés**
5. Fájl: `backup_2025-01-28.dir.tar.gz`

### 2.2 Backup Visszaállítása (Import)
```bash
# 1. Backup fájl kicsomagolása
tar -zxvf backup_2025-01-28.dir.tar.gz

# 2. Visszaállítás új adatbázisba
pg_restore --dbname=$NEW_DATABASE_URL \
    --verbose --clean --if-exists \
    --no-owner --no-privileges \
    --format=directory backup_2025-01-28/

# 3. Ellenőrzés
psql $NEW_DATABASE_URL -c "\dt"
```

---

## 3. Rendszeres Manuális Mentés (Opcionális)

Ha szeretnél rendszeres helyi mentést készíteni:

### 3.1 Heti Backup Script
```bash
# scripts/weekly-backup.sh
#!/bin/bash

DATE=$(date +%Y-%m-%d)
BACKUP_FILE="movaga-backup-$DATE.sql"

echo "Creating weekly backup: $BACKUP_FILE"

# Local backup készítése
pg_dump $DATABASE_URL \
    --verbose \
    --clean \
    --format=custom \
    --file="./backups/$BACKUP_FILE"

echo "Backup saved: ./backups/$BACKUP_FILE"
```

### 3.2 Backup Script Futtatása
```bash
# Backup mappa létrehozása
mkdir -p backups

# Script futtatható tétele
chmod +x scripts/weekly-backup.sh

# Heti futtatás (kézzel)
./scripts/weekly-backup.sh
```

---

## 4. Vészhelyzeti Visszaállítás Lépései

### Probléma: Véletlenül törölted az adatokat

#### 4.1 Gyors Megoldás (PITR)
1. **Render Dashboard** → **Recovery**
2. **"Restore Database"** 
3. **Válassz időpontot** az adatok törlése előttről
4. **Új adatbázis** létrehozása
5. **Environment variables** átállítása az új DB-re
6. **App újraindítása**

#### 4.2 Részletes Lépések
```bash
# 1. Jelenlegi környezeti változók ellenőrzése
echo $DATABASE_URL

# 2. Render Dashboard-ban új DATABASE_URL másolása
# 3. Környezeti változók frissítése
# 4. Deploy trigger

# 5. Ellenőrzés
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

---

## 5. Backup Státusz Ellenőrzése

### 5.1 Recovery Opciók Megtekintése
1. **Render Dashboard** → **PostgreSQL DB**
2. **Recovery** tab
3. **Available recovery window** ellenőrzése
4. **Available exports** listája

### 5.2 Adatbázis Egészség Ellenőrzése
```bash
# Táblák ellenőrzése
psql $DATABASE_URL -c "\dt"

# Adatok számlálása
psql $DATABASE_URL -c "SELECT 
    'users' as table_name, COUNT(*) FROM users 
    UNION ALL SELECT 
    'orders' as table_name, COUNT(*) FROM orders;"

# Utolsó backup időpont
psql $DATABASE_URL -c "SELECT NOW() as current_time;"
```

---

## 6. Backup Automatizálás (Render-en belül)

Ha mégis szeretnél automatikus exportokat, de AWS nélkül:

### 6.1 Render Cron Job (Egyszerű Verzió)
```yaml
# render-simple-backup.yaml
services:
  - type: cron
    name: movaga-simple-backup
    env: node
    repo: https://github.com/szilamer/movaga
    branch: main
    schedule: "0 6 * * 0"  # Minden vasárnap hajnal 6-kor
    buildCommand: apt-get update && apt-get install -y postgresql-client-15
    startCommand: bash scripts/simple-backup.sh
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: movaga-postgres
          property: connectionString
```

### 6.2 Egyszerű Backup Script
```bash
# scripts/simple-backup.sh
#!/bin/bash

DATE=$(date +%Y-%m-%d)
echo "Creating backup on $DATE"

# Backup készítése
pg_dump $DATABASE_URL \
    --format=custom \
    --file="/tmp/movaga-backup-$DATE.sql"

echo "Backup completed: movaga-backup-$DATE.sql"
echo "Note: File will be deleted after cron job ends"
echo "For permanent storage, use Render's Export feature"
```

---

## Összefoglalás

### ✅ **Automatikus (Nincs teendő)**
- **Point-in-Time Recovery**: 3-7 nap automatikus mentés
- **Folyamatos védelem** adatvesztés ellen

### 🔧 **Manuális Opciók**
- **Export/Import**: Render Dashboard-ból letölthető mentések
- **Helyi backup**: Saját script futtatása

### 💡 **Ajánlás**
- **Normál használathoz**: Render beépített PITR elég
- **Extra biztonsághoz**: Heti manuális export letöltése
- **Vészhelyzetben**: PITR használata az adatok visszaállítására

**Költség**: **0 Ft** - minden a Render csomagodban van! 🎉

### Következő lépés?
Próbáld ki az **Export** funkciót a Dashboard-ban, hogy lásd hogyan működik! 