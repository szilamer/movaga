# Jelszó Visszaállítási Funkció Beállítása

Ez a dokumentum leírja, hogyan állítsd be a jelszó visszaállítási funkciót a Movaga alkalmazásban.

## 1. Környezeti Változók Beállítása

Hozz létre egy `.env.local` fájlt a projekt gyökérkönyvtárában a következő tartalommal:

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/movaga"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Email Configuration
SMTP_HOST="mx03.rackhost.hu"
SMTP_PORT="465"
SMTP_USER="info@movaga.hu"
SMTP_PASS="your-email-password"
SMTP_FROM="info@movaga.hu"

# App Configuration
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

## 2. Adatbázis Migráció

Futtasd le az adatbázis migrációt a jelszó visszaállítási mezők hozzáadásához:

```bash
npx prisma migrate dev --name add-password-reset-fields
```

## 3. Prisma Client Újragenerálása

```bash
npx prisma generate
```

## 4. Funkciók

### Implementált Funkciók:

1. **Elfelejtett jelszó oldal** (`/auth/forgot-password`)
   - Email cím megadása
   - Visszaállítási link küldése

2. **Jelszó visszaállítási oldal** (`/auth/reset-password`)
   - Token alapú hitelesítés
   - Új jelszó beállítása
   - Jelszó megerősítés

3. **API végpontok**:
   - `POST /api/auth/forgot-password` - Visszaállítási token generálása és email küldése
   - `POST /api/auth/reset-password` - Jelszó visszaállítása token alapján

4. **Email sablonok**:
   - Professzionális HTML email sablon
   - Egyszerű szöveges verzió
   - Biztonságos token kezelés

### Biztonsági Funkciók:

- Token lejárati idő (1 óra)
- Biztonságos token generálás (32 byte random)
- Email cím normalizálás
- Jelszó erősség ellenőrzés (min. 8 karakter)
- Timing attack védelem
- Nem fedi fel, hogy létezik-e az email cím

## 5. Használat

1. **Elfelejtett jelszó kérése**:
   - Látogasd meg: `/auth/forgot-password`
   - Add meg az email címed
   - Ellenőrizd az emailjeidet

2. **Jelszó visszaállítása**:
   - Kattints az emailben kapott linkre
   - Add meg az új jelszavadat
   - Erősítsd meg a jelszót
   - Jelentkezz be az új jelszóval

## 6. Tesztelés

A funkció teszteléséhez:

1. Regisztrálj egy teszt felhasználót
2. Használd az elfelejtett jelszó funkciót
3. Ellenőrizd az email küldést (ha be van állítva)
4. Teszteld a jelszó visszaállítást

## 7. Hibaelhárítás

### Email nem érkezik meg:
- Ellenőrizd az SMTP beállításokat
- Nézd meg a szerver logokat
- Teszteld az email konfigurációt: `/api/debug/email-test`

### Token hibák:
- Ellenőrizd, hogy a token nem járt-e le (1 óra)
- Győződj meg róla, hogy a DATABASE_URL helyes
- Ellenőrizd a Prisma kapcsolatot

### Adatbázis hibák:
- Futtasd le a migrációt: `npx prisma migrate dev`
- Ellenőrizd a DATABASE_URL-t
- Győződj meg róla, hogy az adatbázis elérhető

## 8. Produkciós Telepítés

Produkciós környezetben:

1. Állítsd be a valós SMTP beállításokat
2. Használj erős NEXTAUTH_SECRET-et
3. Állítsd be a helyes NEXT_PUBLIC_BASE_URL-t
4. Futtasd le a migrációt a produkciós adatbázison
5. Teszteld az email küldést

## 9. Konfigurációs Fájlok

A következő fájlok lettek módosítva/létrehozva:

- `prisma/schema.prisma` - Adatbázis séma frissítés
- `src/lib/auth.ts` - Jelszó visszaállítási funkciók
- `src/lib/email.ts` - Email küldési funkció
- `src/app/api/auth/forgot-password/route.ts` - API végpont
- `src/app/api/auth/reset-password/route.ts` - API végpont
- `src/app/auth/forgot-password/page.tsx` - Frontend oldal
- `src/app/auth/reset-password/page.tsx` - Frontend oldal
- `src/app/auth/login/page.tsx` - Frissített bejelentkezési oldal

## 10. Következő Lépések

Opcionális fejlesztések:

1. Rate limiting a jelszó visszaállítási kérésekhez
2. Email sablon testreszabása
3. Többnyelvű támogatás
4. SMS alapú visszaállítás
5. Kétfaktoros hitelesítés integráció 