'use strict';

function detectSignals(entries, topModels) {
  const signals = [];

  // Build daily totals
  const dailyMap = {};
  entries.forEach(e => {
    const d = e.date;
    dailyMap[d] = (dailyMap[d] || 0) + parseInt(e.qty || 1);
  });
  const days = Object.keys(dailyMap).sort();
  const vals = days.map(d => dailyMap[d]);

  if (vals.length >= 7) {
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const std  = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length) || 1;

    // Anomaly detection: last 14 days
    const window = Math.min(14, vals.length);
    for (let i = vals.length - window; i < vals.length; i++) {
      const v      = vals[i];
      const sigma  = (v - mean) / std;
      if (sigma > 2) {
        signals.push({
          type:     'anomaly',
          severity: sigma > 3 ? 'critical' : 'high',
          date:     days[i],
          value:    v,
          mean:     Math.round(mean),
          sigma:    sigma.toFixed(1),
          message:  `${days[i]}: ${v} ta brak (o'rtacha ${Math.round(mean)}, ${sigma.toFixed(1)}σ yuqori)`,
        });
      }
    }

    // Consecutive increase streak
    let streak = 0;
    for (let i = vals.length - 1; i > 0; i--) {
      if (vals[i] > vals[i - 1]) streak++;
      else break;
    }
    if (streak >= 3) {
      signals.push({
        type:     'trend_up',
        severity: streak >= 5 ? 'critical' : 'medium',
        streak,
        message:  `Brak soni ${streak} kun ketma-ket ortib bormoqda`,
      });
    }

    // Last week vs previous week
    if (vals.length >= 14) {
      const lastWeek = vals.slice(-7).reduce((a, b) => a + b, 0);
      const prevWeek = vals.slice(-14, -7).reduce((a, b) => a + b, 0);
      if (prevWeek > 0 && lastWeek > prevWeek * 1.3) {
        const pct = ((lastWeek - prevWeek) / prevWeek * 100).toFixed(0);
        signals.push({
          type:     'week_over_week',
          severity: 'medium',
          lastWeek,
          prevWeek,
          pct,
          message:  `Bu hafta (${lastWeek}) o'tgan haftaga (${prevWeek}) nisbatan ${pct}% ko'p brak`,
        });
      }
    }
  }

  // Model spike: top model >> second
  if (topModels.length >= 2) {
    const top    = parseInt(topModels[0].total);
    const second = parseInt(topModels[1].total);
    const label  = topModels[0].model || topModels[0].sku || topModels[0].name || 'Noma\'lum';
    if (top > second * 2 && top > 10) {
      signals.push({
        type:     'model_spike',
        severity: 'high',
        model:    label,
        total:    top,
        ratio:    (top / second).toFixed(1),
        message:  `"${label}" modeli 2× dan ko'p brak bermoqda (${top} ta)`,
      });
    }
  }

  return signals;
}

module.exports = { detectSignals };
