'use strict';

function generateRecommendations(topModels, topReasons, signals, forecastData, categories) {
  const recs = [];

  // Critical signals → urgent action
  const critical = signals.filter(s => s.severity === 'critical' || s.severity === 'high');
  if (critical.length > 0) {
    recs.push({
      priority: 'critical',
      category: 'urgent',
      icon:     '🚨',
      title:    "Zudlik bilan choralar ko'rish",
      detail:   `${critical.length} ta yuqori darajali signal aniqlandi. Ishlab chiqarishni to'xtatib, tekshiruv o'tkazing. ${critical.map(s => s.message).join('; ')}`,
    });
  }

  // Top model focus
  if (topModels.length > 0) {
    const top3 = topModels.slice(0, 3).map(m => `${m.model || m.name || m.sku} (${m.total})`).join(', ');
    recs.push({
      priority: 'high',
      category: 'quality_control',
      icon:     '🎯',
      title:    "Yuqori brak beruvchi modellarga maxsus nazorat",
      detail:   `${top3} — bu modellarga qo'shimcha sifat nazorat punktlari o'rnating va har soat tekshiruv chastotasini oshiring.`,
    });
  }

  // Top reason elimination
  if (topReasons.length > 0) {
    const top = topReasons[0];
    recs.push({
      priority: 'high',
      category: 'process',
      icon:     '🔧',
      title:    `Asosiy nuqson sababini bartaraf etish`,
      detail:   `"${top.reason || top.reason}" sababi ${top.total} marta qayd etilgan (${topReasons.slice(1, 3).map(r => `"${r.reason}" — ${r.total}`).join(', ')} va boshqalar). Texnologik jarayonni qayta ko'rib chiqing.`,
    });
  }

  // Forecast-based
  if (forecastData.trend === 'up') {
    recs.push({
      priority: 'medium',
      category: 'preventive',
      icon:     '📈',
      title:    'Profilaktik audit o\'tkazish',
      detail:   `Statistik model kuniga +${forecastData.slope} ta brak o'sishini bashorat qilmoqda. Keyingi 7 kun uchun prognoz: ${forecastData.nextWeekTotal} ta. Darhol jarayon auditi o'tkazing.`,
    });
  } else if (forecastData.trend === 'down') {
    recs.push({
      priority: 'low',
      category: 'maintain',
      icon:     '✅',
      title:    "Joriy yaxshilanishni davom ettiring",
      detail:   `Brak soni kamayish tendensiyasida. Joriy sifat nazorat usullarini hujjatlashtiring va kengaytiring.`,
    });
  }

  // Category-based
  if (categories && categories.length > 0) {
    const qayta = categories.find(c => c.category === 'qayta');
    if (qayta && parseInt(qayta.total) > 50) {
      recs.push({
        priority: 'medium',
        category: 'waste_reduction',
        icon:     '♻️',
        title:    "Qayta ishlanmaydigan brak nisbatini kamaytirish",
        detail:   `${qayta.total} ta qayta ishlanmaydigan brak aniqlandi. Bu to'liq yo'qotish hisoblanadi. Ishlab chiqarish boshida sifat nazoratini kuchaytiring.`,
      });
    }
  }

  // Training recommendation
  if (topReasons.length >= 3) {
    recs.push({
      priority: 'low',
      category: 'training',
      icon:     '🎓',
      title:    "Operatorlar uchun maxsus o'quv",
      detail:   `Eng ko'p uchraydigan nuqsonlar: ${topReasons.slice(0, 3).map(r => `"${r.reason}"`).join(', ')}. Bu sabablar bo'yicha operatorlarga maqsadli treying o'tkazing.`,
    });
  }

  return recs;
}

module.exports = { generateRecommendations };
