# 🧪 Jelszó Visszaállítási Funkció Tesztelése

## Teszt Környezet Állapota ✅

**Lokális Docker Adatbázis:**
- ✅ PostgreSQL fut: `localhost:5434`
- ✅ Migráció lefutott: `20250531165306_add_password_reset_fields`
- ✅ Új mezők létrehozva: `resetToken`, `resetTokenExpiry`
- ✅ Teszt felhasználó létrehozva: `test@movaga.hu`

## Manuális Teszt Lépések

### 1. **Fejlesztői Szerver Indítása**
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5434/movaga" npm run dev
```

### 2. **Elfelejtett Jelszó Tesztelése**

1. **Nyisd meg:** http://localhost:3000/auth/login
2. **Kattints:** "Elfelejtett jelszó?" linkre
3. **Add meg:** `test@movaga.hu` email címet
4. **Küldd el** a kérést
5. **Ellenőrizd:** console logokat és adatbázist

### 3. **Adatbázis Ellenőrzés**
```bash
# Token létrejött-e?
psql "postgresql://postgres:password@localhost:5434/movaga" -c "SELECT email, resetToken, resetTokenExpiry FROM users WHERE email = 'test@movaga.hu';"
```

### 4. **Token Manuális Lekérése**
```bash
# Szerezd meg a tokent
TOKEN=$(psql "postgresql://postgres:password@localhost:5434/movaga" -t -c "SELECT resetToken FROM users WHERE email = 'test@movaga.hu';")
echo "Token: $TOKEN"
```

### 5. **Jelszó Visszaállítási Oldal Tesztelése**
1. **URL:** `http://localhost:3000/auth/reset-password?token=[TOKEN]`
2. **Új jelszó:** `newpassword123`
3. **Megerősítés:** `newpassword123`
4. **Küldd el** a formot

### 6. **Eredmény Ellenőrzése**
```bash
# Token törölve lett-e?
psql "postgresql://postgres:password@localhost:5434/movaga" -c "SELECT email, resetToken, resetTokenExpiry FROM users WHERE email = 'test@movaga.hu';"
```

### 7. **Bejelentkezés Új Jelszóval**
1. **Nyisd meg:** http://localhost:3000/auth/login  
2. **Email:** `test@movaga.hu`
3. **Jelszó:** `newpassword123`
4. **Jelentkezz be**

## Várható Eredmények

### ✅ **Sikeres Teszt Jelek:**

1. **Elfelejtett jelszó kérés:**
   - Sikeres üzenet jelenik meg
   - Token létrejön az adatbázisban
   - Token lejárati idő 1 óra múlva van beállítva

2. **Jelszó visszaállítás:**
   - Érvényes token elfogadva
   - Új jelszó beállítva
   - Token törölve az adatbázisból
   - Átirányítás a login oldalra

3. **Bejelentkezés:**
   - Új jelszóval sikeres bejelentkezés
   - Régi jelszó már nem működik

## Adatbázis Parancsok Gyűjteménye

```bash
# 1. Felhasználó állapot ellenőrzése
psql "postgresql://postgres:password@localhost:5434/movaga" -c "SELECT * FROM users WHERE email = 'test@movaga.hu';"

# 2. Token létrehozás manuális tesztelése
psql "postgresql://postgres:password@localhost:5434/movaga" -c "UPDATE users SET resetToken = 'manual-test-token', resetTokenExpiry = NOW() + INTERVAL '1 hour' WHERE email = 'test@movaga.hu';"

# 3. Token törlése (cleanup)
psql "postgresql://postgres:password@localhost:5434/movaga" -c "UPDATE users SET resetToken = NULL, resetTokenExpiry = NULL WHERE email = 'test@movaga.hu';"

# 4. Összes teszt felhasználó törlése
psql "postgresql://postgres:password@localhost:5434/movaga" -c "DELETE FROM users WHERE email LIKE '%test%';"
```

## Biztonság Ellenőrzés

### ✅ **Biztonsági Tesztek:**

1. **Érvénytelen token:** Hibás token URL-lel próbálkozás
2. **Lejárt token:** 1 óránál régebbi token tesztelése  
3. **Nem létező email:** Hamis email cím megadása
4. **SQL Injection:** Speciális karakterek az email mezőben

## Éles Adatbázis Migráció Szimulálása

### Lokális Tesztelés az Éles Struktúrával:

```bash
# 1. Jelenlegi éles struktúra lemásolása (csak struktúra)
pg_dump --schema-only "postgresql://movaga_db_x4eb_user:5nYkazQHzBwJBhwoYKW7lZ3lIePi0JhE@dpg-d0cvd9buibrs73dgvci0-a.oregon-postgres.render.com/movaga_db_x4eb" > production_schema.sql

# 2. Tiszta adatbázis létrehozása
psql "postgresql://postgres:password@localhost:5434/movaga" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 3. Éles struktúra importálása
psql "postgresql://postgres:password@localhost:5434/movaga" < production_schema.sql

# 4. Migráció futtatása
DATABASE_URL="postgresql://postgres:password@localhost:5434/movaga" npx prisma migrate deploy
```

## Következő Lépések

Ha minden teszt sikeresen lefut:

1. ✅ **Commit & Push** a kód változtatásokat
2. ✅ **Deploy** a Render-re  
3. ✅ **Migráció** futtatása az éles adatbázison
4. ✅ **Éles teszt** valós email címmel

## Rollback Terv

Ha bármi probléma lenne:

```sql
-- Emergency rollback (csak végelső esetben!)
DROP INDEX "users_resetToken_idx";
ALTER TABLE "users" DROP COLUMN "resetToken";
ALTER TABLE "users" DROP COLUMN "resetTokenExpiry";
``` 