# Sifat Nazorati — QC Dashboard v2

Poyabzal podeshvasi ishlab chiqarish korxonasi uchun brak nazorat tizimi.

## Texnologiyalar

- **Backend**: Node.js + Express + PostgreSQL (MVC arxitektura)
- **Auth**: JWT (xotirada saqlash, localStorage emas) + bcryptjs + express-rate-limit
- **Security**: helmet, morgan
- **Frontend**: Vanilla HTML/CSS/JS + Chart.js 4.4
- **Deploy**: Render.com (Web Service + PostgreSQL)

---

## Foydalanuvchilar

| Username         | Parol          | Rol      |
|------------------|----------------|----------|
| admin2           | arkon08_sifat  | admin    |
| admin            | arkon07_sifat  | boss     |
| sifat_nazorati   | arkon09_sifat  | operator |
| operator2        | oper123        | operator |
| operator3        | oper123        | operator |

> **Muhim:** Birinchi kirishdan keyin admin parollarini o'zgartiring!

---

## Rollar va huquqlar

| Imkoniyat                    | Operator | Boss | Admin |
|------------------------------|:--------:|:----:|:-----:|
| Brak kiritish                | ✓        | ✓    | ✓     |
| O'z yozuvlarini ko'rish      | ✓        | ✓    | ✓     |
| Barcha yozuvlarni ko'rish    |          | ✓    | ✓     |
| Yozuv o'chirish              |          |      | ✓     |
| Foydalanuvchi boshqarish     |          |      | ✓     |

---

## API Endpointlar

```
POST   /api/auth/login            Login → JWT token
GET    /api/auth/me               Token → foydalanuvchi ma'lumoti

GET    /api/defects               Brak yozuvlar ro'yxati
POST   /api/defects               Yangi brak yozuv
DELETE /api/defects/:id           O'chirish (admin only)

GET    /api/models                Barcha modellar (unique SKU)

GET    /api/stats/dashboard       KPI statistikasi
GET    /api/stats/top-models      Top 10 model

GET    /api/users                 Foydalanuvchilar (admin)
POST   /api/users                 Yangi user (admin)
DELETE /api/users/:id             User o'chirish (admin)

GET    /api/health                Server holati
```

---

## Fayl tuzilmasi

```
sifat-nazorati/
├── backend/
│   ├── src/
│   │   ├── server.js             ← Express server
│   │   ├── config/
│   │   │   ├── config.js         ← Env sozlamalari
│   │   │   └── database.js       ← PostgreSQL pool
│   │   ├── migrations/
│   │   │   ├── run.js            ← Deploy da avtomatik ishlaydi
│   │   │   └── 001_init.sql      ← Schema (ma'lumotnoma)
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── errorHandler.js
│   │   │   └── logger.js
│   │   ├── utils/helpers.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── defects.controller.js
│   │   │   ├── models.controller.js
│   │   │   ├── stats.controller.js
│   │   │   └── users.controller.js
│   │   └── routes/
│   │       ├── index.js
│   │       ├── auth.routes.js
│   │       ├── defects.routes.js
│   │       ├── models.routes.js
│   │       ├── stats.routes.js
│   │       └── users.routes.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── index.html                ← Asosiy UI
│   ├── css/style.css             ← Barcha stillar
│   └── js/
│       ├── api.js                ← API client (JWT xotirada)
│       ├── auth.js               ← Login/logout
│       ├── charts.js             ← Chart.js grafiklari
│       └── app.js                ← Navigatsiya, formalar, jadvallar
├── render.yaml                   ← Render Blueprint
└── README.md
```

---

## Render.com ga deploy qilish

### 1. GitHub dan

```bash
git clone https://github.com/sotimovjanongir139-create/sifat.nazorati3.git
```

### 2. Render.com — New Blueprint

1. [render.com](https://render.com) → **New** → **Blueprint**
2. GitHub reponi tanlang: `sifat.nazorati3`
3. `render.yaml` avtomatik aniqlanadi → **Apply**

Render avtomatik:
- PostgreSQL database yaratadi
- Node.js server ishga tushiradi (`node src/server.js`)
- `JWT_SECRET` generate qiladi
- `DATABASE_URL` ulaydi
- Migration va seed foydalanuvchilar qo'shadi

### 3. Mahalliy ishga tushirish

```bash
cd backend
cp .env.example .env
# .env da DATABASE_URL va JWT_SECRET ni to'ldiring
npm install
npm run dev
```

---

## Xavfsizlik

- Parollar `bcryptjs` (saltRounds: 10) bilan hashlangan
- JWT token faqat xotirada (localStorage ga yozilmaydi)
- Login: 5 noto'g'ri urinish → 15 daqiqa blok (server tomonida)
- Helmet — HTTP xavfsizlik headerlari
- Barcha DB so'rovlar parameterized query ($1, $2...)

---

Arkon © 2025
