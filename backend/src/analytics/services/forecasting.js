'use strict';

function linReg(vals) {
  const n    = vals.length;
  if (n < 2)  return { slope: 0, intercept: vals[0] || 0, r2: 0 };
  const xMean = (n - 1) / 2;
  const yMean = vals.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0, ssTot = 0;
  vals.forEach((y, i) => {
    num  += (i - xMean) * (y - yMean);
    den  += (i - xMean) ** 2;
    ssTot += (y - yMean) ** 2;
  });
  const slope     = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  const ssRes     = vals.reduce((s, y, i) => s + (y - (intercept + slope * i)) ** 2, 0);
  const r2        = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}

function forecast(entries, horizonDays = 7) {
  // Build daily totals
  const dailyMap = {};
  entries.forEach(e => {
    const d = e.date;
    dailyMap[d] = (dailyMap[d] || 0) + parseInt(e.qty || 1);
  });

  const sortedDays = Object.keys(dailyMap).sort();
  const vals       = sortedDays.map(d => dailyMap[d]);

  if (vals.length < 3) {
    return { trend: 'insufficient_data', predictions: [], trendLabel: "Ma'lumot yetarli emas" };
  }

  const window30 = vals.slice(-30);
  const { slope, intercept, r2 } = linReg(window30);
  const n = window30.length;

  // RMSE for confidence interval
  const errors = window30.map((v, i) => v - (intercept + slope * i));
  const rmse   = Math.sqrt(errors.reduce((s, e) => s + e * e, 0) / n);

  // Exponential smoothing (alpha=0.3) for alternative
  let ema = window30[0];
  window30.forEach(v => { ema = 0.3 * v + 0.7 * ema; });

  const lastDate = new Date(sortedDays[sortedDays.length - 1]);
  const predictions = [];

  for (let i = 1; i <= horizonDays; i++) {
    const lrPred  = Math.max(0, Math.round(intercept + slope * (n + i - 1)));
    const emaPred = Math.max(0, Math.round(ema + slope * i * 0.5));
    const blended = Math.round((lrPred * 0.6 + emaPred * 0.4));
    const d       = new Date(lastDate);
    d.setDate(d.getDate() + i);
    predictions.push({
      date:      d.toISOString().slice(0, 10),
      predicted: blended,
      lower:     Math.max(0, blended - Math.round(rmse)),
      upper:     blended + Math.round(rmse),
    });
  }

  const trend = slope > 1 ? 'up' : slope < -1 ? 'down' : 'stable';
  return {
    trend,
    slope:      Math.round(slope * 10) / 10,
    r2:         Math.round(r2 * 100) / 100,
    rmse:       Math.round(rmse),
    predictions,
    trendLabel: slope > 1 ? 'Ortib bormoqda ↑' : slope < -1 ? 'Kamayib bormoqda ↓' : 'Barqaror →',
    nextWeekTotal: predictions.reduce((s, p) => s + p.predicted, 0),
  };
}

module.exports = { forecast };
