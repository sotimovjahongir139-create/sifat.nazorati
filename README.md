# Sifat Nazorati — Ishlab chiqarish sifatini nazorati

Poyabzal podeshvasi ishlab chiqarish korxonasi uchun brak nazorat tizimi.

## Imkoniyatlar

- Brak kiritish va kuzatish (3 tur: qayta, yamaladigan, o'rta)
- 155 ta model bo'yicha filtrlash
- 9 ta brak sababi
- Oylik trend grafiklar va foizli taqqoslash
- Top 5 model va sabab reytinglari
- Brute-force himoyasi (5 urinish → 15 daqiqa bloklanadi)
- Mobil qurilmalarga moslashgan dizayn

## Texnologiyalar

- Sof HTML + CSS + JavaScript (framework yo'q)
- [Chart.js 4.4](https://www.chartjs.org/) — grafiklar
- [Font Awesome 6.5](https://fontawesome.com/) — ikonkalar
- `localStorage` — ma'lumotlarni saqlash
- Web Crypto API — parol xeshlash (SHA-256)

## Ishga tushirish

Fayllarni to'g'ridan-to'g'ri brauzerda oching yoki GitHub Pages orqali kiriting:

```
https://USERNAME.github.io/sifat-nazorati/
```

## Parol o'zgartirish

Yangi parolni `config.js` faylidagi `_k` massiviga hex ko'rinishda kiriting:

```js
const _k = new Uint8Array([ /* yangi parol baytlari */ ]);
```

So'ng `localStorage` dagi `qcPassHash` kalitini o'chirib, sahifani yangilang.

## Litsenziya

Faqat ichki foydalanish uchun. Arkon © 2025
