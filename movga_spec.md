# 🛒 Egyedi Webáruház MLM Struktúrával

## Tartalomjegyzék
- [Projekt célja](#projekt-célja)
- [Felhasználói szintek](#felhasználói-szintek)
- [Kedvezménylogika](#kedvezménylogika)
- [MLM struktúra](#mlm-struktúra)
- [Jutalékrendszer](#jutalékrendszer)
- [Elszámolás folyamata](#elszámolás-folyamata)
- [Adatmodell javaslat](#adatmodell-javaslat)
- [Hasznos technológiák és könyvtárak](#hasznos-technológiák-%C3%A9s-k%C3%B6nyvt%C3%A1rak)
- [Frontend/Backend szerkezet](#frontendbackend-szerkezet)

---

## Projekt célja
Egy saját fejlesztésű webáruház készítése, amelyben a felhasználók különböző kedvezményszinteket érhetnek el, illetve egy MLM-szerű struktúrán belül ajánlói rendszer működik, amely jutalékelszámolással zárul minden hónap végén.

---

## Felhasználói szintek

### 1. Sima vásárló
- Regisztrál, vásárolhat
- Nem része az MLM rendszernek

### 2. Meghívott vásárló (MLM-tag)
- Meghívókóddal regisztrált
- Vásárlásai alapján automatikus kedvezményt kap

#### Havi forgalomalapú kedvezmény (példa):
- 50.000 Ft felett: 15% kedvezmény
- 100.000 Ft felett: 30% kedvezmény
- A havi forgalom minden hónap elején nullázódik
- A kedvezményküszöbök admin által állíthatók

### 3. Üzletépítő
- Legalább 150.000 Ft forgalom (saját + hálózati)
- Beléphet az üzletépítő szintre

---

## MLM struktúra
- Minden regisztrált felhasználónál mentjük a `referrer_id`-t
- Az így létrejövő fastruktúrát a rendszer automatikusan kezeli
- Meghívott vásárlók és üzletépítők forgalma is számít a "felsőbb" szinthez

---

## Jutalékrendszer

### Szintek és százalékok:
- **150.000 - 450.000 Ft** összforgalom esetén: 6% jutalék
- **450.000 Ft felett**: a 6% mellé a nem kedvezményes vásárlásokból képződő extra árrés is hozzáadódik

### Számítás logikája:
- Minden vásárlás után kiszámoljuk a fel nem használt kedvezményt (árrést)
- Az árrés hozzáadódik a fölötte lévő üzletépítő kreditjéhez
- Az összesítés hónap végén történik

---

## Elszámolás folyamata
1. Hónap végén a rendszer lezárja az időszakot
2. Összesíti a kedvezményeket és jutalékokat
3. Üzletépítő indíthatja: `Kiszámlázom` funkció
4. Az összeg zárolásra kerül
5. A rendszer kiad egy elszámolási dokumentumot
6. A számla beérkezése után manuális jóváhagyás történik
7. A kifizetett jutalék törlésre kerül, vagy vásárlásra felhasználható

---

## Adatmodell javaslat

### `users` tábla
```sql
id UUID,
email TEXT,
password_hash TEXT,
referrer_id UUID,
role ENUM('basic', 'builder'),
monthly_sales INT,
discount_percent INT,
accumulated_commission INT,
locked_commission INT,
created_at TIMESTAMP
```

### `orders` tábla
```sql
id UUID,
user_id UUID,
total_amount INT,
discount_applied INT,
commission_generated INT,
created_at TIMESTAMP
```

### `payouts` tábla
```sql
id UUID,
user_id UUID,
amount INT,
status ENUM('pending', 'paid'),
invoice_number TEXT,
locked_at TIMESTAMP
```

---

## Hasznos technológiák és könyvtárak

### Backend
- **Node.js + Express** (vagy Fastify)
- **Prisma** ORM (PostgreSQL-hez ideális)
- **Zod** vagy **Yup** (validáláshoz)
- **node-cron** (időzített feladatokhoz)
- **nodemailer**, **resend** (e-mail küldés)
- **Számlázz.hu API** (számlázáshoz)

### Frontend
- **React**, **TailwindCSS**
- **Axios** (API kommunikáció)
- **shadcn/ui** vagy **Tremor** (admin felülethez)

---

## Frontend/Backend szerkezet

### 📁 Projektstruktúra
```
webshop-root/
├── frontend/           # React alapú UI
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── styles/
│   └── package.json
│
├── backend/            # Node.js + Express API szerver
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── utils/
│   │   ├── jobs/
│   │   └── config/
│   ├── prisma/
│   ├── package.json
│   └── .env
```

### 🔁 Backend modulok
- auth (regisztráció, login, jelszavak, JWT)
- user (profil, referrer)
- order (vásárlások, kedvezmények)
- network (MLM fa)
- commission (jutalék számítás)
- settlement (elszámolás, zárolás, számlázás)

### 🌐 API példák
```
POST   /auth/register
POST   /auth/login
GET    /user/me
POST   /orders/new
GET    /commission/summary
POST   /commission/settle
```

### 🧩 Frontend oldalak
- `/` – kezdőlap
- `/shop` – termékek
- `/cart` – kosár
- `/checkout` – fizetés
- `/profile` – profil, kedvezmény, hálózat
- `/admin` – admin felület, rendszerstatisztikák, rendszerbeállítások admin + superadmin jogosultsáigi szintekkel

### 💡 Fontos UI elemek
- ProductCard, CartItem, OrderSummary
- ReferralLinkBox (meghívó kód)
- CommissionProgress (forgalmi célkövetés)
- AdminDashboard (jutalék és zárolás kezelése)

---

## Következő lépések
- Backend API alapok elkészítése (User, Auth, Order)
- Frontend alap skeleton (React + Routing + Tailwind)
- Admin felület és elszámolási logika tervezése
