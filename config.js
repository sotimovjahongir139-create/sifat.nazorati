/*!
 * Sifat Nazorati — Konfiguratsiya fayli
 * Ushbu faylni faqat vakolatli IT xodim o'zgartirishi mumkin.
 * Parolni o'zgartirish uchun: yangi parolni SHA-256 orqali xeshlang
 * va localStorage.setItem('qcPassHash', '<yangi-hash>') bilan yangilang.
 */
(function () {
  'use strict';
  // Admin parolini SHA-256 xeshi sifatida bir martalik sozlash
  // (Faqat birinchi yuklanishda yoki qcPassHash yo'q bo'lganda bajariladi)
  if (!localStorage.getItem('qcPassHash')) {
    // Parol baytlari (tekst ko'rinishida saqlanmaydi)
    const _k = new Uint8Array([
      0x61,0x72,0x6b,0x6f,0x6e,    // ark on
      0x30,0x38,0x5f,               // 08_
      0x73,0x69,0x66,0x61,0x74     // sifat
    ]);
    crypto.subtle.digest('SHA-256', _k)
      .then(function (buf) {
        const h = Array.from(new Uint8Array(buf))
          .map(function (b) { return b.toString(16).padStart(2, '0'); })
          .join('');
        localStorage.setItem('qcPassHash', h);
      })
      .catch(function () {
        // Eski brauzerlar uchun zaxira: base variant
        localStorage.setItem('qcPassHash', '__init_error__');
      });
  }
})();
