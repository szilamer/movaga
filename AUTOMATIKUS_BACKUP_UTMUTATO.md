# Automatikus Adatbázis Backup Beállítási Útmutató

## Mit fogunk csinálni?

Automatikus napi backup-okat állítunk be a Render-es PostgreSQL adatbázishoz, ami minden nap hajnali 3-kor mentést készít és feltölti Amazon S3-ra.

## Előfeltételek

1. **Render-es PostgreSQL adatbázis** (már megvan)
2. **Amazon AWS fiók** (ezt létre kell hozni)
3. **GitHub repository hozzáférés** (már megvan)

---

## 1. LÉPÉS: Amazon AWS Fiók és S3 Beállítása

### 1.1 AWS Fiók Létrehozása
1. Menj az [aws.amazon.com](https://aws.amazon.com) oldalra
2. Kattints "Create an AWS Account" gombra
3. Kövesd a regisztráció lépéseit
4. **Figyelem**: Kártya adatok kellenek, de az S3 backup tárolás havi pár euró költség

### 1.2 IAM Felhasználó Létrehozása (Backup-hoz)
1. **AWS Console**-ba bejelentkezés után menj **IAM** szolgáltatáshoz
2. Bal oldali menüben: **Users** → **Add users**
3. **Username**: `movaga-backup-user`
4. **Select AWS credential type**: ✅ **Access key - Programmatic access**
5. **Next: Permissions** → **Attach existing policies directly**
6. Keress rá: `AmazonS3FullAccess` → válaszd ki
7. **Next** → **Next** → **Create user**
8. **FONTOS**: Másold ki és mentsd el:
   - **Access Key ID**: `AKIAXXXXXXXXXX`
   - **Secret Access Key**: `xxxxxxxxxxxxxxxx`

---

## 2. LÉPÉS: Render Cron Job Beállítása

### 2.1 Backup Script Futtatható Létrehozása
```bash
chmod +x scripts/create-backup-cron.sh
chmod +x scripts/local-backup.sh
```

### 2.2 Render Dashboard-ba Menés
1. Menj a [render.com](https://render.com) dashboardra
2. Kattints a **"New"** gombra
3. Válaszd a **"Cron Job"** opciót

### 2.3 Cron Job Beállítása
```
Name: movaga-database-backup
Repository: https://github.com/szilamer/movaga
Branch: main
Schedule: 0 3 * * *  (minden nap hajnali 3-kor)
```

### 2.4 Build & Start Commands
```bash
# Build Command:
apt-get update && apt-get install -y postgresql-client-15 curl unzip gzip

# Start Command:
bash scripts/create-backup-cron.sh
```

### 2.5 Environment Variables Beállítása
**Add hozzá ezeket a környezeti változókat:**

| Kulcs | Érték | Megjegyzés |
|-------|-------|------------|
| `DATABASE_URL` | *Render adatbázis URL* | Dashboard-ról másold |
| `AWS_ACCESS_KEY_ID` | `AKIAXXXXXXXXXX` | AWS-ből mentett érték |
| `AWS_SECRET_ACCESS_KEY` | `xxxxxxxxxxxxxxxx` | AWS-ből mentett érték |
| `AWS_REGION` | `eu-west-1` | Európai szerver |
| `S3_BUCKET_NAME` | `movaga-database-backups` | Egyedi bucket név |
| `POSTGRES_VERSION` | `15` | Adatbázis verzió |
| `NOTIFICATION_EMAIL` | `admin@movaga.hu` | Email értesítések |

---

## 3. LÉPÉS: Adatbázis URL Megkeresése

### 3.1 Render Dashboard-ban
1. Menj a **PostgreSQL** adatbázisodhoz
2. **Info** tab → **Connections**
3. Másold ki az **External Database URL**-t
4. Ez valami ilyesmi: `postgresql://user:password@dpg-xxxxx-a.oregon-postgres.render.com/database_name`

---

## 4. LÉPÉS: Tesztelés

### 4.1 Manuális Futtatás
1. Render Dashboard → **Cron Jobs** → **movaga-database-backup**
2. **Trigger Run** gomb → megnyomás
3. **Logs** tab-ban nézd, hogy fut-e

### 4.2 AWS S3 Ellenőrzése
1. AWS Console → **S3** szolgáltatás
2. `movaga-database-backups` bucket megkeresése
3. `daily-backups/` mappa → mentések listája

---

## 5. OPCIÓ: Egyszerűbb Megoldás (Blueprint-tel)

### 5.1 Blueprint Használata
Ha a fenti túl bonyolult, használhatod a kész `render-backup.yaml` fájlt:

1. **Render Dashboard** → **Blueprints** → **New Blueprint Instance**
2. **Repository**: `https://github.com/szilamer/movaga`
3. **Blueprint Path**: `render-backup.yaml`
4. Töltsd ki a kért környezeti változókat

---

## 6. LÉPÉS: Ellenőrzés és Monitoring

### 6.1 Backup Státusz Ellenőrzése
- **Render Dashboard**: Cron job logs
- **AWS S3**: Fájlok megjelenése
- **Email**: Sikeres backup értesítések

### 6.2 Backup Visszaállítás (ha szükséges)
```bash
# S3-ról letöltés
aws s3 cp s3://movaga-database-backups/daily-backups/movaga_backup_2025-01-28_03-00-00.sql.gz ./

# Kicsomagolás
gunzip movaga_backup_2025-01-28_03-00-00.sql.gz

# Visszaállítás
pg_restore --dbname=$DATABASE_URL --verbose --clean movaga_backup_2025-01-28_03-00-00.sql
```

---

## Költségek

### AWS S3 Tárolás
- **Tárolás**: ~0.02€/GB/hó
- **Napi backup**: ~50-500MB
- **Havi költség**: 1-5€ körül

### Render Cron Job
- **Starter Plan**: $7/hó
- **Havi futási idő**: ~30 perc összesen

**Összesen**: ~10-15€/hó a biztonságért

---

## Hibaelhárítás

### Gyakori Problémák

1. **"pg_dump command not found"**
   - Build command-ban adj hozzá: `postgresql-client-15`

2. **"AWS credentials not found"**
   - Ellenőrizd az Environment Variables-t

3. **"Permission denied"**
   - `chmod +x scripts/create-backup-cron.sh`

4. **"Database connection failed"**
   - Ellenőrizd a `DATABASE_URL` változót

### Logok Ellenőrzése
- **Render Dashboard** → **Cron Job** → **Logs** tab

---

## Következő Lépések

1. ✅ AWS fiók létrehozása
2. ✅ IAM user és S3 beállítása  
3. ✅ Render Cron Job létrehozása
4. ✅ Environment variables beállítása
5. ✅ Első teszt futtatás
6. ✅ S3 backup ellenőrzése

**Kész vagy!** 🎉 

Az adatbázisod mostantól automatikusan mentve lesz minden nap. 