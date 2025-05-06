# Movaga.hu Render.com Telepítési Útmutató

Ez az útmutató segít a Movaga webáruház telepítésében a Render.com szolgáltatásra, a movaga-prod.orender.hu domainre.

## Szükséges Környezeti Változók

A következő környezeti változókat kell beállítani a Render.com felületén:

### Alap Rendszerbeállítások

| Környezeti Változó | Érték | Leírás |
|-------------------|-------|--------|
| `NODE_ENV` | `production` | Az alkalmazás működési módja |
| `NEXTAUTH_URL` | `https://movaga-prod.orender.hu` | A NextAuth autentikáció URL-je |
| `NEXTAUTH_SECRET` | *egyedi, erős kulcs* | A NextAuth tokenek titkosítási kulcsa (32+ karakter) |
| `NEXT_PUBLIC_URL` | `https://movaga-prod.orender.hu` | Az alkalmazás nyilvános URL-je |

### Adatbázis Beállítások

| Környezeti Változó | Érték | Leírás |
|-------------------|-------|--------|
| `DATABASE_URL` | *a Render-en létrehozott Postgres adatbázis URL-je* | Az adatbázis kapcsolódási URL-je (belső URL) |

### Email Beállítások (Fontos rendelési értesítőkhöz)

| Környezeti Változó | Érték | Leírás |
|-------------------|-------|--------|
| `SMTP_HOST` | `mx03.rackhost.hu` | Az SMTP szerver |
| `SMTP_PORT` | `465` | Az SMTP port |
| `SMTP_USER` | `info@movaga.hu` | SMTP felhasználónév |
| `SMTP_PASS` | *jelszó* | SMTP jelszó |
| `SMTP_FROM` | `info@movaga.hu` | Az email küldő címe |

### Képfeltöltés - Cloudinary (Erősen ajánlott)

| Környezeti Változó | Érték | Leírás |
|-------------------|-------|--------|
| `CLOUDINARY_CLOUD_NAME` | *a te felhőd neve* | Cloudinary felhő név |
| `CLOUDINARY_API_KEY` | *api kulcs* | Cloudinary API kulcs |
| `CLOUDINARY_API_SECRET` | *titkos kulcs* | Cloudinary API titkos kulcs |

### Barion Fizetési Kapu

| Környezeti Változó | Érték | Leírás |
|-------------------|-------|--------|
| `BARION_POS_KEY` | `fab5fa17-77a6-4cf6-a5ae-a5cb81e264d8` | Barion POS kulcs |
| `NEXT_PUBLIC_BARION_POS_KEY` | `fab5fa17-77a6-4cf6-a5ae-a5cb81e264d8` | Nyilvánosan elérhető Barion POS kulcs |

### Opcionális - UploadThing Képfeltöltés

| Környezeti Változó | Érték | Leírás |
|-------------------|-------|--------|
| `UPLOADTHING_SECRET` | *a te kulcsod* | UploadThing titkos kulcs |
| `UPLOADTHING_APP_ID` | *a te app ID-d* | UploadThing alkalmazás azonosító |

### Opcionális - Admin Beállítások

| Környezeti Változó | Érték | Leírás |
|-------------------|-------|--------|
| `ADMIN_EMAIL` | `admin@movaga.hu` | Admin email cím (alapértelmezett: admin@movaga.hu) |
| `ADMIN_PASSWORD` | *jelszó* | Admin jelszó (alapértelmezett: Admin123!) |
| `ADMIN_NAME` | `Admin` | Admin megjelenő neve (alapértelmezett: Admin) |

## Telepítési lépések

1. Hozz létre egy új Web Service-t a Render.com felületén
2. Válaszd a GitHub integrációt és válaszd a `szilamer/movaga` repository-t
3. Branch: `backup-crypto-auth`
4. Add meg a fenti környezeti változókat
5. Állítsd be a Build parancsot: `yarn install`
6. Állítsd be a Start parancsot: `./entrypoint.sh`
7. Válaszd ki a megfelelő szerver típust (legalább 1GB RAM ajánlott)
8. Kattints a "Create Web Service" gombra

## Hibaelhárítás

Ha a telepítés után problémák lépnének fel:

1. Ellenőrizd a Render.com naplófájlokat
2. Ellenőrizd a környezeti változókat
3. Az admin felületen a `/admin/debug/email` útvonalon ellenőrizheted az email beállításokat
4. A `/admin/debug/environment` útvonalon az általános környezeti beállításokat nézheted meg

## Domain beállítások

A movaga.hu domaint a Render.com egyedi URL-re (movaga-prod.orender.hu) kell irányítani:

1. A domain szolgáltatódnál hozz létre egy CNAME rekordot:
   - Név: `www` (vagy `@` a gyökér domainhez)
   - Érték: `movaga-prod.orender.hu`

2. A Render.com felületén add hozzá az egyéni domaint:
   - A Web Service beállításai > Domains > Add Domain
   - Add meg a domaint: `movaga.hu` (és/vagy `www.movaga.hu`)
   - Kövesd a Render utasításait a DNS hitelesítéshez 