'use strict';

function analyzeRootCauses(entries) {
  // Model × Reason cross-matrix
  const matrix = {};
  entries.forEach(e => {
    const model  = e.sku || e.model || e.name || 'Noma\'lum';
    const reason = e.reason || 'Noma\'lum';
    const key    = `${model}|||${reason}`;
    matrix[key]  = (matrix[key] || 0) + parseInt(e.qty || 1);
  });

  const topPairs = Object.entries(matrix)
    .map(([k, count]) => {
      const [model, reason] = k.split('|||');
      return { model, reason, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // Day-of-week analysis
  const DOW = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  const dowCounts = Array(7).fill(0);
  const dowEntries = Array(7).fill(0);
  entries.forEach(e => {
    if (!e.date) return;
    const day = new Date(e.date).getDay();
    dowCounts[day]  += parseInt(e.qty || 1);
    dowEntries[day] += 1;
  });
  const dowSummary = DOW.map((name, i) => ({
    day:     name,
    total:   dowCounts[i],
    entries: dowEntries[i],
    avg:     dowEntries[i] > 0 ? Math.round(dowCounts[i] / dowEntries[i]) : 0,
  }));
  const worstDay = dowSummary.reduce((a, b) => b.total > a.total ? b : a, dowSummary[0]);

  // Category breakdown
  const catMap = {};
  entries.forEach(e => {
    const cat = e.category || e.cat || 'other';
    catMap[cat] = (catMap[cat] || 0) + parseInt(e.qty || 1);
  });
  const catTotal   = Object.values(catMap).reduce((a, b) => a + b, 0);
  const categories = Object.entries(catMap)
    .map(([k, v]) => ({ category: k, total: v, pct: catTotal > 0 ? Math.round(v / catTotal * 100) : 0 }))
    .sort((a, b) => b.total - a.total);

  // Monthly breakdown
  const monthMap = {};
  entries.forEach(e => {
    if (!e.date) return;
    const m = e.date.slice(0, 7);
    monthMap[m] = (monthMap[m] || 0) + parseInt(e.qty || 1);
  });
  const months = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, total]) => ({ month, total }));

  // Most defect-prone hour (if created_at available)
  const hourMap = {};
  entries.forEach(e => {
    if (!e.created_at) return;
    const hr = new Date(e.created_at).getHours();
    hourMap[hr] = (hourMap[hr] || 0) + parseInt(e.qty || 1);
  });
  const peakHour = Object.entries(hourMap).sort(([,a],[,b]) => b - a)[0];

  return {
    topModelReasonPairs: topPairs,
    dayOfWeek:           dowSummary,
    worstDayOfWeek:      worstDay,
    categories,
    monthlyTrend:        months,
    peakHour:            peakHour ? { hour: parseInt(peakHour[0]), total: peakHour[1] } : null,
  };
}

module.exports = { analyzeRootCauses };
