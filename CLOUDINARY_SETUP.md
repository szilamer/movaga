# Cloudinary képfeltöltés beállítása a Movaga alkalmazáshoz

Ez az útmutató segít a Cloudinary beállításában a Movaga webáruházhoz, hogy a feltöltött termékképek megfelelően eltárolódjanak a felhőben.

## Mi az a Cloudinary?

A Cloudinary egy felhőalapú képkezelő szolgáltatás, amely lehetővé teszi a képek tárolását, optimalizálását és kiszolgálását. Ez fontos, mert a Render.com-on a konténerek nem perzisztensek, így a helyi fájlrendszerbe feltöltött fájlok elvesznek az újraindításkor.

## Regisztráció a Cloudinary-ra

1. Látogass el a [Cloudinary](https://cloudinary.com/users/register/free) oldalára
2. Regisztrálj egy ingyenes fiókra (a FREE csomag 25 GB tárolót és havi 25 GB sávszélességet biztosít)
3. A regisztráció után a Cloudinary Dashboard-on megtalálod a szükséges adatokat

## Szükséges adatok

A Dashboard-on az alábbi adatokat keresd:

- **Cloud Name**: Ez a te "Cloudinary felhőd" neve
- **API Key**: Az API hozzáféréshez szükséges kulcs
- **API Secret**: Az API hozzáféréshez szükséges titkos kulcs

## Környezeti változók beállítása a Render.com-on

1. Lépj be a Render.com fiókodba
2. Navigálj a Movaga webszolgáltatáshoz
3. Kattints a "Environment" fülre
4. Add hozzá a következő környezeti változókat:

```
CLOUDINARY_CLOUD_NAME=a_te_cloud_neved
CLOUDINARY_API_KEY=a_te_api_kulcsod
CLOUDINARY_API_SECRET=a_te_api_titkos_kulcsod
```

5. Kattints a "Save Changes" gombra
6. Indítsd újra a szolgáltatást

## Tesztelés

A beállítások befejezése után:

1. Jelentkezz be az adminfelületre
2. Próbálj feltölteni egy képet egy termékhez
3. Ellenőrizd, hogy megjelenik-e a kép
4. A Cloudinary Dashboard-on a Media Library-ben láthatod a feltöltött képeket

## Hibaelhárítás

Ha a beállítás után is problémák lennének:

1. Ellenőrizd, hogy helyesen adtad-e meg a környezeti változókat
2. Nézd meg a Render.com logs-ot a hibaüzenetekért
3. Ellenőrizd, hogy a Cloudinary account aktív-e és van-e elegendő tárhely/sávszélesség

## Megjegyzések

- A Cloudinary ingyenes csomagja elegendő a legtöbb kisebb webáruház számára
- A képek URL-jeiben a "res.cloudinary.com" domaint fogod látni
- Az alkalmazás automatikusan kezeli a képfeltöltést és a képmegjelenítést 