# Projekt előrehaladás

## Elvégzett feladatok
- [x] PowerShell scriptek létrehozása (dev.ps1, build.ps1)
- [x] Middleware típus javítások
- [x] Package.json scriptek frissítése
- [x] TypeScript függőségek telepítése
- [x] PowerShell parancsok optimalizálása
- [x] Alap autentikáció implementálása
- [x] Prisma adatbázis integráció
- [x] Felhasználói regisztráció és bejelentkezés
- [x] NextAuth.js integráció

## Folyamatban lévő feladatok
- [ ] Termékkezelési rendszer
  - [ ] Termék modell bővítése
    - [ ] Részletes termékleírás mező
    - [ ] Termék variációk (szín, méret, stb.)
    - [ ] Termék képek kezelése (több kép támogatása)
    - [ ] SEO mezők (meta title, description)
    - [ ] Raktárkészlet kezelés
    - [ ] Termék státuszok (aktív, inaktív, kifutó)
  - [ ] Termék adminisztráció
    - [ ] Szuperadmin jogosultság kezelés
    - [ ] Termék létrehozás/szerkesztés felület
    - [ ] Tömeges termék import/export
    - [ ] Termék előnézeti mód
  - [ ] Termékkategória rendszer
    - [ ] Többszintű kategória hierarchia
    - [ ] Kategória SEO beállítások
    - [ ] Kategória oldal testreszabás
  - [ ] Termék megjelenítés
    - [ ] Reszponzív termékkártya komponens
    - [ ] Termék részletoldal sablon
    - [ ] Termék lista/rács nézet
    - [ ] Termék keresés és szűrés
    - [ ] Termék rendezési opciók
  - [ ] Termék árazás
    - [ ] Alapár és akciós ár kezelés
    - [ ] Mennyiségi kedvezmények
    - [ ] MLM kedvezmények integrációja

- [ ] MLM struktúra implementálása
  - [x] Alap hálózati lekérdezések
  - [ ] Jutalék számítás javítása
  - [ ] Havi forgalom követés
- [ ] Admin aloldalak fejlesztése
  - [x] Dashboard alap implementáció
  - [ ] Rendelések kezelése
  - [x] Termékek kezelése
  - [x] Kategóriák kezelése
  - [ ] Felhasználók kezelése
- [ ] Kedvezményrendszer
  - [ ] Automatikus kedvezmény számítás
  - [ ] Kedvezményszintek kezelése
- [ ] Elszámolási rendszer
  - [ ] Havi zárás folyamat
  - [ ] Jutalék kifizetés kezelése
  - [ ] Számlázási integráció

## Ismert hibák
- [ ] Hálózati tagok lekérésénél Prisma aggregáció hiba
- [ ] Duplikált email regisztráció kezelése

## Következő lépések
1. Termékkezelési rendszer alapjainak implementálása
   - Termék modell bővítése
   - Szuperadmin jogosultságkezelés
   - Alap termékfeltöltési felület
2. Termékkártya és listázó komponensek fejlesztése
3. Hálózati lekérdezések és jutalék számítás javítása
4. Kedvezményrendszer implementálása
5. Admin felület hiányzó funkcióinak fejlesztése
6. Elszámolási rendszer alapjainak lefektetése 