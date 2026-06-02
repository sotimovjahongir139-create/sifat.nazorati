// Local-calendar date helpers. Browser's local time is the user's wall clock
// (factory operators run in Asia/Tashkent). `toISOString()` converts to UTC,
// which shifts the date string by one day during the 00:00-04:59 window —
// these helpers avoid that round-trip and stay in local time.

function ymdLocal(d) {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function todayLocal() {
  return ymdLocal(new Date());
}
