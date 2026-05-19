function dateToWeekInfo(dateStr) {
  const d          = new Date(dateStr + 'T00:00:00');
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const weekNum    = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return { week: weekNum, month: d.getMonth() + 1, year: d.getFullYear() };
}

module.exports = { dateToWeekInfo };
