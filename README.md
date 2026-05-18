# Sifat Nazorati — Full-Stack QC Dashboard

Poyabzal podeshvasi ishlab chiqarish korxonasi uchun brak nazorat tizimi.

## Texnologiyalar

- **Backend**: Node.js + Express + PostgreSQL
- **Auth**: JWT token (24 soat) + bcryptjs parol hashlash
- **Frontend**: Vanilla HTML/CSS/JS + Chart.js
- **Deploy**: Render.com (Web Service + PostgreSQL)

---

## Do'stim uchun: Render.com da deploy qilish

### 1. GitHub dan clone qilish

```bash
git clone https://github.com/sotimovjanongir139-create/sifat.nazorati.git
cd sifat.nazorati
```

### 2. Render.com da "New Blueprint" yaratish

1. [render.com](https://render.com) ga kiring
2. **New** → **Blueprint** bosing
3. GitHub reponi tanlang: `sifat.nazorati`
4. `render.yaml` avtomatik aniqlanadi
5. **Apply** bosing

Render avtomatik ravishda:
- PostgreSQL database yaratadi (`sifat-nazorati-db`)
- Node.js web service ishga tushiradi (`sifat-nazorati-api`)
- `JWT_SECRET` ni generate qiladi
- `DATABASE_URL` ni ulaydi

### 3. Deploy tugashini kuting (2-5 daqiqa)

Server birinchi marta ishga tushganda avtomatik:
- Jadvallarni yaratadi (users, entries)
- Boshlang'ich foydalanuvchilarni qo'shadi

### 4. Tayyor URL ni menga bering

Format: `https://sifat-nazorati-api.onrender.com`

---

## Boshlang'ich foydalanuvchilar

| Username   | Parol          | Rol        |
|------------|----------------|------------|
| admin      | arkon08_sifat  | Admin      |
| boss       | boss123        | Boss       |
| operator1  | oper123        | Operator   |
| operator2  | oper123        | Operator   |
| operator3  | oper123        | Operator   |

> **Muhim:** Birinchi kirishdan keyin admin parolini o'zgartiring!

---

## Rollar va huquqlar

| Imkoniyat                | Operator | Boss | Admin |
|--------------------------|:--------:|:----:|:-----:|
| Brak kiritish            | ✓        | ✓    | ✓     |
| O'z yozuvlarini ko'rish  | ✓        | ✓    | ✓     |
| Barcha yozuvlarni ko'rish|          | ✓    | ✓     |
| Yozuv o'chirish          |          |      | ✓     |
| Foydalanuvchi boshqarish |          |      | ✓     |

---

## API Endpointlar

```
POST   /api/auth/login          Login → JWT token
GET    /api/auth/me             Token → foydalanuvchi ma'lumoti

POST   /api/entries             Yangi brak yozuv
GET    /api/entries             Yozuvlar ro'yxati (filter: date, category, sku)
DELETE /api/entries/:id         O'chirish (admin only)

GET    /api/analytics/dashboard KPI statistikasi
GET    /api/analytics/top-models Top 10 model

GET    /api/users               Foydalanuvchilar (admin)
POST   /api/users               Yangi user (admin)
DELETE /api/users/:id           User o'chirish (admin)
```

---

## Fayl tuzilmasi

```
sifat-nazorati/
├── backend/
│   ├── server.js           ← Express server + auto-migration
│   ├── package.json
│   ├── .env.example
│   ├── db/
│   │   ├── index.js        ← PostgreSQL pool
│   │   └── schema.sql      ← Jadval sxemasi (ma'lumotnoma)
│   ├── middleware/
│   │   └── auth.js         ← JWT tekshirish
│   └── routes/
│       ├── auth.js
│       ├── entries.js
│       ├── analytics.js
│       └── users.js
├── frontend/
│   ├── index.html          ← Asosiy UI
│   └── api.js              ← Fetch wrapper
├── render.yaml             ← Render Blueprint config
└── README.md
```

---

## Mahalliy ishga tushirish (development)

```bash
# PostgreSQL o'rnatilgan bo'lishi kerak
cd backend
cp .env.example .env
# .env faylida DATABASE_URL, JWT_SECRET ni to'ldiring
npm install
npm run dev
```

Frontend: `http://localhost:3000`

---

## Xavfsizlik

- Parollar `bcryptjs` (saltRounds: 10) bilan hashlangan
- JWT token 24 soat amal qiladi
- Login: 5 noto'g'ri urinish → 15 daqiqa blok (express-rate-limit)
- Barcha DB so'rovlar parameterized query ($1, $2...)
- CORS yoqilgan (Render HTTPS deploy uchun)

---

Arkon © 2025
