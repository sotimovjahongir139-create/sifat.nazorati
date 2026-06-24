/* Sifat Nazorati — Constants + Chart rendering */
'use strict';

const MODELS = [
  'Brunelli cucunelli','Hermes Lazerli','21128','589','2712','0063',
  'Loro piano 1733','2104','23137 givenchi','Hermes 1603','229110',
  'Xeval','Louis vuitton 2099','Katdrey','9092','Louis vuitton 0310',
  'VD 400','Loro piana 031','2019 Tep','Tomford','TEP 301 Loro piana',
  '090','2283','235116','PU0750','2903','PU 23338 Velikan',
  '3763 Dolche Gabbana','3316','348','AD666','3602','695 tep',
  'Baldini','1080','803','PU 50738 Behzod','0323','928','4008',
  'Rand','7271','82023','Klic 069','7314','6343 Tods','1207',
  'Arqon 3001','Making jenskiy','Alisher ortaped','Fusfet 002',
  '807','290','1880','Loro F','1339','52072','769','Hermes Randli',
  'Jevenj','Ecotop','GB','180','PU Gucci','2257','Arizona',
  'Asfando','003','Versace 6256','Fergamo 7685','7071 Zara tpyu',
  '17195','5925','10104','FNC velikan','MX3003','Hermes 3',
  '1610 katta','132','9910','1706','Loro piana 2733','7206 Tep',
  '1610 kichik','5633','075','Prato','1990','DTE jenskiy',
  'BOSS randli','2102 jenskiy','067','1309','303','1003','002',
  '2103','Boss Tep','Napoli','70601','8935','Louis Vuitton pvx',
  'WZ 001','6619 jenskiy','Brunelli Behzod','069','Klic','101',
  '8C21086','5636','PU20410','4040','A77','1323 detskiy','996',
  'E68','565','1807','0310 Farfalla','Brunelli Davron 5','6022',
  'Egeva','139','Vibram randli','1245','580','5060','Zara 083',
  '201','574','10726','07','247','Arkon keta','3337 randli',
  '729 jenski','5428','Loro piano lavash','27061','9892','1270',
  '3036','3214','5957','2003 randli','20021 randli','3602 Velikan',
  '6525','7515','2173','2258','Loro piana poshnali','3005 jenskiy',
  '1001','Tolik zima','1202','Tolik Fashion','0273','0318',
  '090 Randli padosh','666','Santoni','1229 TEP'
];

const REASONS = [
  'Randida havo qolib ketgan',
  "Dog' bo'lib qolgan",
  'Qolip ushlab ketgan',
  'Suv qolib ketgan',
  'Parda tushgan',
  'Randi kesilib ketgan',
  'Qolipdagi kamchiliklar',
  'Charxlaganda havo chiqib qolgan',
  "Charxlab qo'ygan"
];

const CATS = [
  {id:'qayta',   label:"Qayta ishlab bo'lmaydigan brak", navLabel:"Qayta ishlab bo'lmaydigan", accentCls:'r', accent:'#ff4757', icon:'fas fa-times-circle'},
  {id:'yamala',  label:'Yamaladigan brak',               navLabel:'Yamaladigan brak',           accentCls:'b', accent:'#4f8ef7', icon:'fas fa-tools'},
  {id:'orta',    label:"O'rta brak",                     navLabel:"O'rta brak",                 accentCls:'y', accent:'#ffd43b', icon:'fas fa-minus-circle'},
  {id:'yamchiq', label:'Yamalab chiqilgan brak',         navLabel:'Yamalab chiqilgan brak',     accentCls:'o', accent:'#ff9f43', icon:'fas fa-check-circle'},
];

const CAT_LABEL = {qayta:"Qayta ishlab bo'lmaydigan", yamala:'Yamaladigan', orta:"O'rta brak", yamchiq:'Yamalab chiqilgan'};

const REASON_COLORS = [
  'rgba(79,142,247,.8)','rgba(255,71,87,.8)','rgba(46,213,115,.8)',
  'rgba(255,212,59,.8)','rgba(255,107,53,.8)','rgba(156,106,248,.8)',
  'rgba(46,196,213,.8)','rgba(255,159,67,.8)','rgba(105,213,131,.8)'
];

const UZ_MONTHS = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
const GRID = 'rgba(255,255,255,.04)';
const TC   = '#6b7280';

const HIST_MODELS = { PU: [], TEP: [] };

const HIST_GRAMS = ['200','250','300','350','400','450','500','550','600','650','700'];

const PAGE_META = {
  dash:     {t:'Bosh sahifa',                          s:"Sifat nazorati ko'rsatkichlari"},
  entry:    {t:'Brak kiritish',                        s:'Yangi brak yozuvini kiriting'},
  records:  {t:'Barcha yozuvlar',                      s:"To'liq nuqson tarixi"},
  analytics:{t:'Tahlil',                               s:'Batafsil sifat tahlili'},
  users:        {t:'Foydalanuvchilar',                     s:'Tizim foydalanuvchilarini boshqarish'},
  histogramma:  {t:'Histogramma',                          s:'PU va TEP sifat tahlili'},
  ai:           {t:'AI Analitika',                         s:'Claude AI yordamida chuqur tahlil'},
  'ai14':       {t:'Analitika',                            s:'Aqlli AI tahlil tizimi — signallar, prognoz, tavsiyalar'},
  qayta:    {t:"Qayta ishlab bo'lmaydigan brak",       s:"Tuzatib bo'lmaydigan nuqsonlar"},
  yamala:   {t:'Yamaladigan brak',                     s:"Tuzatilishi mumkin bo'lgan nuqsonlar"},
  orta:     {t:"O'rta brak",                           s:"O'rta darajadagi nuqsonlar"},
  yamchiq:  {t:'Yamalab chiqilgan brak',               s:'Yamalab chiqilgan nuqsonlar'},
  bolim:    {t:"Bo'lim ish vaqti",                     s:"Kunlik ish ko'rsatkichlari"},
};

// ── CHART REGISTRY ──────────────────────────────────────────
const charts = {};
function destroyC(k) { if (charts[k]) { charts[k].destroy(); delete charts[k]; } }

// ── DATE HELPERS ────────────────────────────────────────────
function currentWeekDays() {
  const now = new Date(), dow = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() + (dow === 0 ? -6 : 1 - dow));
  mon.setHours(0, 0, 0, 0);
  return ['Du','Se','Ch','Pa','Ju','Sh','Ya'].map((lbl, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i);
    return { label: lbl, date: ymdLocal(d) };
  });
}
function currentMonthWeeks() {
  const now = new Date(), y = now.getFullYear(), m = now.getMonth();
  const last = new Date(y, m + 1, 0).getDate();
  return [{label:'Haf 1',from:1,to:7},{label:'Haf 2',from:8,to:14},
          {label:'Haf 3',from:15,to:21},{label:'Haf 4',from:22,to:last}]
    .map(w => {
      const s = new Date(y, m, w.from), e = new Date(y, m, Math.min(w.to, last));
      return { label: w.label, start: ymdLocal(s), end: ymdLocal(e) };
    });
}
function weeklyTotal(data, start, end) {
  return data.filter(r => r.date >= start && r.date <= end).reduce((s, r) => s + r.qty, 0);
}
function last8weeks() {
  const out = [], now = new Date();
  for (let i = 7; i >= 0; i--) {
    const e = new Date(now); e.setDate(now.getDate() - i * 7);
    const s = new Date(e);   s.setDate(e.getDate() - 6);
    out.push({ label: 'Haf ' + (8 - i), start: ymdLocal(s), end: ymdLocal(e) });
  }
  return out;
}
function _top5(data, field) {
  const m = {};
  data.forEach(r => { m[r[field]] = (m[r[field]] || 0) + r.qty; });
  return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);
}
function _allItems(data, field) {
  const m = {};
  data.forEach(r => { m[r[field]] = (m[r[field]] || 0) + r.qty; });
  return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k]) => k);
}
function last6() {
  const out = []; const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ label: UZ_MONTHS[d.getMonth()] + ' ' + d.getFullYear(), y: d.getFullYear(), m: d.getMonth() });
  }
  return out;
}
function monthlyTotal(data, y, m) {
  return data.filter(r => { const d = new Date(r.date + 'T00:00:00'); return d.getFullYear() === y && d.getMonth() === m; }).reduce((s, r) => s + r.qty, 0);
}
function currentMonthData(data) {
  const now = new Date();
  return data.filter(r => { const d = new Date(r.date + 'T00:00:00'); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); });
}
function reasonTotal(data, r) { return data.filter(d => d.reason === r).reduce((s, d) => s + d.qty, 0); }

function top5models(data) {
  const t = {};
  data.forEach(r => { t[r.sku] = (t[r.sku] || 0) + r.qty; });
  const sorted = Object.entries(t).sort((a, b) => b[1] - a[1]);
  if (sorted.length <= 5) return { labels: sorted.map(e => e[0]), values: sorted.map(e => e[1]) };
  const top  = sorted.slice(0, 5);
  const rest = sorted.slice(5).reduce((s, e) => s + e[1], 0);
  return { labels: [...top.map(e => e[0]), 'Boshqalar'], values: [...top.map(e => e[1]), rest] };
}

function topNmodels(data, n) {
  const t = {};
  data.forEach(r => { t[r.sku] = (t[r.sku] || 0) + r.qty; });
  return Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, total]) => ({ name, total }));
}

function calcPctChips(data) {
  const months = last6();
  const totals = months.map(m => monthlyTotal(data, m.y, m.m));
  return months.slice(1).map((m, i) => {
    const prev = totals[i], curr = totals[i + 1];
    const prevLbl = months[i].label.split(' ')[0];
    const currLbl = m.label.split(' ')[0];
    let cls = 'pc-n', pctTxt = '0%', arrow = '→';
    if (prev === 0 && curr === 0) {
      pctTxt = '0%';
    } else if (prev === 0) {
      cls = 'pc-r'; pctTxt = '+100%'; arrow = '↑';
    } else {
      const pct = (Math.min(curr, prev) / Math.max(curr, prev) * 100).toFixed(1);
      if (curr > prev)      { cls = 'pc-r'; pctTxt = '+' + pct + '%'; arrow = '↑'; }
      else if (curr < prev) { cls = 'pc-g'; pctTxt = '+' + pct + '%'; arrow = '↓'; }
      else                  { pctTxt = pct + '%'; }
    }
    return `<div class="pct-chip ${cls}"><span class="pct-lbl">${prevLbl} → ${currLbl}</span><span class="pct-val">${pctTxt} ${arrow}</span></div>`;
  }).join('');
}

const baseScales = () => ({
  x: { grid: { color: GRID }, ticks: { color: TC, font: { size: 10 } } },
  y: { grid: { color: GRID }, ticks: { color: TC, font: { size: 10 } }, beginAtZero: true }
});

// ── TREND CHART ────────────────────────────────────────────
const LINE_COLORS = ['#4f8ef7','#2ed573','#ff6b35','#ffd43b','#9c6af8'];
let _trendMode    = 'tendensiya';
let _msSubMode    = 'haftalik';
let _weekNavOffset = 0;
let _skuFilter      = null;
let _trendActiveIdx = null;

const _datalabelPlugin = {
  id: 'trendDatalabels',
  afterDatasetsDraw(chart) {
    if (_trendActiveIdx === null) return;
    const meta = chart.getDatasetMeta(_trendActiveIdx);
    if (!meta || !meta.visible) return;
    const ctx = chart.ctx;
    ctx.save();
    ctx.font = 'bold 11px system-ui,sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    meta.data.forEach((pt, i) => {
      const v = chart.data.datasets[_trendActiveIdx]?.data[i];
      if (v === null || v === undefined || v === 0) return;
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      ctx.fillText(v, pt.x, pt.y - 6);
    });
    ctx.restore();
  }
};

function _wireLegendClicks(lstEl, ch) {
  lstEl.querySelectorAll('span[data-li]').forEach((span, idx) => {
    span.onclick = () => {
      const i = parseInt(span.dataset.li);
      if (_trendActiveIdx === i) {
        _trendActiveIdx = null;
        ch.data.datasets.forEach((_, di) => ch.setDatasetVisibility(di, true));
        lstEl.querySelectorAll('span[data-li]').forEach(s => { s.style.opacity = '1'; });
      } else {
        _trendActiveIdx = i;
        ch.data.datasets.forEach((_, di) => ch.setDatasetVisibility(di, di === i));
        lstEl.querySelectorAll('span[data-li]').forEach((s, si) => { s.style.opacity = si === i ? '1' : '0.3'; });
      }
      ch.update();
    };
  });
}

function getOffsetWeekDays(offset) {
  const now = new Date(), dow = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() + (dow === 0 ? -6 : 1 - dow) + offset * 7);
  mon.setHours(0, 0, 0, 0);
  return ['Du','Se','Ch','Pa','Ju','Sh','Ya'].map((lbl, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i);
    return { label: lbl, date: ymdLocal(d) };
  });
}

function navWeek(delta) {
  _weekNavOffset = (delta === 0) ? 0 : _weekNavOffset + delta;
  renderTrend(getData());
}

function setTrendMode(m) {
  _trendMode = m;
  _weekNavOffset = 0;
  ['tendensiya','haftalik','oylik','model','sabab'].forEach(k => {
    const b = document.getElementById('ttab-' + k);
    if (b) b.classList.toggle('active', k === m);
  });
  renderTrend(getData());
}

function setSkuFilter(f) {
  _skuFilter = _skuFilter === f ? null : f;
  renderTrend(getData());
}

function setMsSubMode(m) {
  _msSubMode = m;
  _weekNavOffset = 0;
  document.querySelectorAll('.ms-stab').forEach(b => b.classList.toggle('active', b.dataset.m === m));
  renderTrend(getData());
}

function _makePtLbl(total) {
  return { id: 'ptLbl', afterDatasetsDraw(c) {
    const ctx = c.ctx;
    c.data.datasets.forEach((ds, i) => {
      c.getDatasetMeta(i).data.forEach((pt, j) => {
        const v = ds.data[j]; if (v == null || v === 0) return;
        const pct = total > 0 ? ((v / total) * 100).toFixed(0) : '0';
        ctx.save(); ctx.fillStyle = '#c8c8e8';
        ctx.font = 'bold 10px Segoe UI,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(v + ' (' + pct + '%)', pt.x, pt.y - 7); ctx.restore();
      });
    });
  }};
}

function _makeCountQtyLbl(counts) {
  return { id: 'cqLbl', afterDatasetsDraw(c) {
    const ctx = c.ctx;
    c.data.datasets.forEach((ds, i) => {
      c.getDatasetMeta(i).data.forEach((pt, j) => {
        const qty = ds.data[j]; if (qty == null || qty === 0) return;
        const cnt = counts[j];
        const lbl = (cnt != null && cnt > 0) ? cnt + ' (' + qty + ')' : String(qty);
        ctx.save(); ctx.fillStyle = '#c8c8e8';
        ctx.font = 'bold 10px Segoe UI,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(lbl, pt.x, pt.y - 4); ctx.restore();
      });
    });
  }};
}

function _makeQtyParenLbl() {
  return { id: 'qpLbl', afterDatasetsDraw(c) {
    const ctx = c.ctx;
    c.data.datasets.forEach((ds, i) => {
      c.getDatasetMeta(i).data.forEach((pt, j) => {
        const qty = ds.data[j]; if (qty == null || qty === 0) return;
        ctx.save(); ctx.fillStyle = '#c8c8e8';
        ctx.font = 'bold 10px Segoe UI,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('(' + qty + ')', pt.x, pt.y - 4); ctx.restore();
      });
    });
  }};
}

function _makeMultiPtLbl(weekTotals) {
  return { id: 'multiPtLbl', afterDatasetsDraw(c) {
    const ctx  = c.ctx;
    const nds  = c.data.datasets.length;
    const npts = (c.data.datasets[0]?.data.length) || 0;
    const fontSize = nds >= 5 ? 8 : 9;
    const lineH    = fontSize + 5;
    const ca       = c.chartArea;
    for (let j = 0; j < npts; j++) {
      const col = [];
      c.data.datasets.forEach((ds, di) => {
        const v = ds.data[j]; if (v == null || v === 0) return;
        const pt  = c.getDatasetMeta(di).data[j];
        const tot = weekTotals[j] || 0;
        const pct = tot > 0 ? ((v / tot) * 100).toFixed(0) : '0';
        col.push({ pt, v, pct, color: ds.borderColor || '#c8c8e8' });
      });
      if (!col.length) continue;
      col.sort((a, b) => a.pt.y - b.pt.y);
      const n       = col.length;
      const centerY = col.reduce((s, x) => s + x.pt.y, 0) / n - lineH;
      const totalH  = (n - 1) * lineH;
      const rawStart = centerY - totalH / 2;
      const startY  = Math.max(ca.top + lineH / 2, Math.min(ca.bottom - lineH / 2 - totalH, rawStart));
      col.forEach(({ pt, v, pct, color }, k) => {
        const ly = Math.max(ca.top + 4, Math.min(ca.bottom - 4, startY + k * lineH));
        ctx.save(); ctx.fillStyle = color;
        ctx.font = 'bold ' + fontSize + 'px Segoe UI,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(v + ' (' + pct + '%)', pt.x, ly); ctx.restore();
      });
    }
  }};
}

function renderTrend(data) {
  const subEl = document.getElementById('trendSub');
  const totEl = document.getElementById('trendTotal');
  const boxEl = document.getElementById('trendChartBox');
  const lstEl = document.getElementById('trendList');
  const pctEl = document.getElementById('pctRowDash');
  const stEl  = document.getElementById('trendSubTabs');

  // ── Tendensiya ──
  if (_trendMode === 'tendensiya') {
    subEl.textContent = "So'nggi 6 oy";
    totEl.style.display = 'none'; boxEl.style.display = 'block';
    lstEl.style.display = 'none'; pctEl.style.display = ''; stEl.style.display = 'none';
    destroyC('trend'); destroyC('trendM'); destroyC('trendS');
    const months = last6();
    charts.trend = new Chart(document.getElementById('cTrend').getContext('2d'), {
      type: 'line',
      data: { labels: months.map(m => m.label), datasets: [{ label: 'Braklar', data: months.map(m => monthlyTotal(data, m.y, m.m)),
        borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,.08)',
        borderWidth: 2.5, pointBackgroundColor: '#4f8ef7', pointRadius: 4, fill: true, tension: .4
      }]},
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: baseScales() }
    });
    pctEl.innerHTML = calcPctChips(data);

  // ── Haftalik ──
  } else if (_trendMode === 'haftalik') {
    const wdays = currentWeekDays();
    const today = todayLocal();
    const fd = new Date(wdays[0].date + 'T00:00:00'), ld = new Date(wdays[6].date + 'T00:00:00');
    subEl.textContent = 'Bu hafta: ' + fd.getDate() + '-' + ld.getDate() + ' ' + UZ_MONTHS[ld.getMonth()];
    totEl.style.display = 'none'; boxEl.style.display = 'block';
    lstEl.style.display = 'none'; pctEl.innerHTML = ''; stEl.style.display = 'none';
    destroyC('trend'); destroyC('trendM'); destroyC('trendS');
    const vals    = wdays.map(d => d.date > today ? null : data.filter(r => r.date === d.date).reduce((s, r) => s + r.qty, 0));
    const wkTotal = vals.reduce((s, v) => s + (v || 0), 0);
    charts.trend = new Chart(document.getElementById('cTrend').getContext('2d'), {
      type: 'line',
      data: { labels: wdays.map(d => d.label), datasets: [{ data: vals,
        borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,.08)',
        borderWidth: 2.5, fill: true, tension: .4, spanGaps: false,
        pointBackgroundColor: wdays.map(d => d.date === today ? '#ff4757' : '#4f8ef7'),
        pointRadius: wdays.map(d => d.date === today ? 6 : 4)
      }]},
      options: { responsive: true, maintainAspectRatio: false, layout: { padding: { top: 18 } }, plugins: { legend: { display: false } }, scales: baseScales() },
      plugins: [_makeQtyParenLbl()]
    });
    const chips = [];
    for (let i = 0; i < vals.length - 1; i++) {
      const v1 = vals[i], v2 = vals[i + 1];
      if (v1 === null || v2 === null) continue;
      if (v1 === 0 && v2 === 0) continue;
      let base = v1;
      if (base === 0) {
        for (let k = i - 1; k >= 0; k--) {
          if (vals[k] !== null && vals[k] > 0) { base = vals[k]; break; }
        }
      }
      let cls = 'pc-n', pctTxt = '0%';
      if (v2 === 0)  { cls = 'pc-g'; pctTxt = '-100% ↓'; }
      else if (!base){ cls = 'pc-r'; pctTxt = '+100% ↑'; }
      else {
        const pct = (Math.min(v2, base) / Math.max(v2, base) * 100).toFixed(1);
        if (v2 > base)      { cls = 'pc-r'; pctTxt = '+' + pct + '% ↑'; }
        else if (v2 < base) { cls = 'pc-g'; pctTxt = '-' + pct + '% ↓'; }
        else                { pctTxt = pct + '%'; }
      }
      chips.push(`<div class="pct-chip ${cls}"><span class="pct-lbl">${wdays[i].label} → ${wdays[i + 1].label}</span><span class="pct-val">${pctTxt}</span></div>`);
    }
    pctEl.innerHTML = chips.join('');
    pctEl.style.display = chips.length ? '' : 'none';

  // ── Oylik ──
  } else if (_trendMode === 'oylik') {
    const now = new Date();
    subEl.textContent = 'Bu oy: ' + UZ_MONTHS[now.getMonth()] + ' ' + now.getFullYear();
    totEl.style.display = 'none'; boxEl.style.display = 'block';
    pctEl.style.display = 'none'; pctEl.innerHTML = ''; stEl.style.display = 'none';
    lstEl.style.display = 'none';
    destroyC('trend'); destroyC('trendM'); destroyC('trendS');
    const mweeks   = currentMonthWeeks();
    const wkTotals = mweeks.map(w => weeklyTotal(data, w.start, w.end));
    const wkCounts = mweeks.map(w => data.filter(r => r.date >= w.start && r.date <= w.end).length);
    charts.trend = new Chart(document.getElementById('cTrend').getContext('2d'), {
      type: 'bar',
      data: { labels: mweeks.map(w => w.label), datasets: [{ data: wkTotals,
        backgroundColor: 'rgba(59,130,246,.75)',
        borderColor: '#3b82f6',
        borderWidth: 1,
        borderRadius: 5,
        borderSkipped: false
      }]},
      options: { responsive: true, maintainAspectRatio: false, layout: { padding: { top: 22 } }, plugins: { legend: { display: false } }, scales: baseScales() },
      plugins: [_makeCountQtyLbl([])]
    });

  // ── Model / Sabab multi-line ──
  } else {
    destroyC('trend'); destroyC('trendM'); destroyC('trendS');
    _trendActiveIdx = null;
    boxEl.style.display = 'block'; pctEl.style.display = 'none'; pctEl.innerHTML = '';
    const field      = _trendMode === 'model' ? 'sku' : 'reason';
    const displayData = (_trendMode === 'model' && _skuFilter)
      ? data.filter(r => r.sku && r.sku.includes(_skuFilter))
      : data;
    const allKeys = _allItems(displayData, field);
    const clr = i => LINE_COLORS[i % LINE_COLORS.length];

    if (_msSubMode === 'haftalik') {
      const wdays = getOffsetWeekDays(_weekNavOffset);
      const fd = new Date(wdays[0].date + 'T00:00:00');
      const ld = new Date(wdays[6].date + 'T00:00:00');
      const fdStr = fd.getDate() + ' ' + UZ_MONTHS[fd.getMonth()];
      const ldStr = ld.getDate() + ' ' + UZ_MONTHS[ld.getMonth()] + ' ' + ld.getFullYear();
      subEl.textContent = fdStr + ' — ' + ldStr;

      stEl.style.display = 'block';
      stEl.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:4px">
        <div class="trend-tabs" style="display:inline-flex">
          <button class="ttab ms-stab active" data-m="haftalik" onclick="setMsSubMode('haftalik')">Haftalik</button>
          <button class="ttab ms-stab" data-m="oylik" onclick="setMsSubMode('oylik')">Oylik</button>
          ${_trendMode === 'model' ? `<button class="ttab${_skuFilter === 'Padosh' ? ' active' : ''}" onclick="setSkuFilter('Padosh')">Padosh</button><button class="ttab${_skuFilter === 'Stilka' ? ' active' : ''}" onclick="setSkuFilter('Stilka')">Stilka</button>` : ''}
        </div>
        <div style="display:flex;gap:6px">
          <button class="ttab" onclick="navWeek(-1)">← Oldingi hafta</button>
          ${_weekNavOffset < 0 ? '<button class="ttab" style="background:rgba(79,142,247,.2);color:var(--blue)" onclick="navWeek(0)">Joriy hafta</button>' : ''}
        </div>
      </div>`;

      const wkTotals = wdays.map(d => data.filter(r => r.date === d.date).reduce((s, r) => s + r.qty, 0));
      const weekGrandTotal = wkTotals.reduce((s, v) => s + v, 0);
      const monthTotal = currentMonthData(data).reduce((s, r) => s + r.qty, 0);
      totEl.textContent = 'Bu oy: ' + monthTotal; totEl.style.display = 'block';

      const datasets = allKeys.map((k, i) => ({
        label: k,
        data: wdays.map(d => data.filter(r => r.date === d.date && r[field] === k).reduce((s, r) => s + r.qty, 0)),
        borderColor: clr(i), backgroundColor: clr(i) + '22',
        borderWidth: 2, pointBackgroundColor: clr(i), pointRadius: 4, fill: false, tension: .4
      }));
      const legendVals = datasets.map(ds => ds.data.reduce((s, v) => s + v, 0));
      lstEl.style.display = 'block';
      lstEl.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:5px 10px;padding:6px 2px 2px">' +
        allKeys.map((k, i) => { const v = legendVals[i], pct = weekGrandTotal > 0 ? ((v / weekGrandTotal) * 100).toFixed(1) : '0.0';
          return `<span data-li="${i}" style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--text);white-space:nowrap;cursor:pointer"><span style="width:8px;height:8px;border-radius:2px;background:${clr(i)};flex-shrink:0"></span>${k} — ${v} ta (${pct}%)</span>`;
        }).join('') + '</div>';
      destroyC('trend');
      charts.trend = new Chart(document.getElementById('cTrend').getContext('2d'), {
        type: 'line',
        data: { labels: wdays.map(w => w.label), datasets },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => {
              const v   = ctx.parsed.y;
              const tot = wkTotals[ctx.dataIndex] || 0;
              const pct = tot > 0 ? ((v / tot) * 100).toFixed(0) : '0';
              return ctx.dataset.label + ': ' + v + ' (' + pct + '%)';
            }}}
          },
          scales: baseScales()
        },
        plugins: [_datalabelPlugin]
      });
      _wireLegendClicks(lstEl, charts.trend);

    } else {
      const now = new Date();
      subEl.textContent = 'Bu oy: ' + UZ_MONTHS[now.getMonth()] + ' ' + now.getFullYear();
      stEl.style.display = 'block';
      stEl.innerHTML = `<div class="trend-tabs" style="display:inline-flex">
        <button class="ttab ms-stab" data-m="haftalik" onclick="setMsSubMode('haftalik')">Haftalik</button>
        <button class="ttab ms-stab active" data-m="oylik" onclick="setMsSubMode('oylik')">Oylik</button>
        ${_trendMode === 'model' ? `<button class="ttab${_skuFilter === 'Padosh' ? ' active' : ''}" onclick="setSkuFilter('Padosh')">Padosh</button><button class="ttab${_skuFilter === 'Stilka' ? ' active' : ''}" onclick="setSkuFilter('Stilka')">Stilka</button>` : ''}
      </div>`;
      const weeks      = currentMonthWeeks();
      const wkTotals   = weeks.map(w => weeklyTotal(data, w.start, w.end));
      const monthTotal = currentMonthData(data).reduce((s, r) => s + r.qty, 0);
      totEl.textContent = 'Bu oy: ' + monthTotal; totEl.style.display = 'block';
      const datasets = allKeys.map((k, i) => ({
        label: k,
        data: weeks.map(w => data.filter(r => r.date >= w.start && r.date <= w.end && r[field] === k).reduce((s, r) => s + r.qty, 0)),
        borderColor: clr(i), backgroundColor: clr(i) + '22',
        borderWidth: 2, pointBackgroundColor: clr(i), pointRadius: 4, fill: false, tension: .4
      }));
      const legendVals = datasets.map(ds => ds.data.reduce((s, v) => s + v, 0));
      lstEl.style.display = 'block';
      lstEl.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:5px 10px;padding:6px 2px 2px">' +
        allKeys.map((k, i) => { const v = legendVals[i], pct = monthTotal > 0 ? ((v / monthTotal) * 100).toFixed(1) : '0.0';
          return `<span data-li="${i}" style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--text);white-space:nowrap;cursor:pointer"><span style="width:8px;height:8px;border-radius:2px;background:${clr(i)};flex-shrink:0"></span>${k} — ${v} ta (${pct}%)</span>`;
        }).join('') + '</div>';
      destroyC('trend');
      charts.trend = new Chart(document.getElementById('cTrend').getContext('2d'), {
        type: 'line',
        data: { labels: weeks.map(w => w.label), datasets },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => {
              const v   = ctx.parsed.y;
              const tot = (wkTotals || [])[ctx.dataIndex] || 0;
              const pct = tot > 0 ? ((v / tot) * 100).toFixed(0) : '0';
              return ctx.dataset.label + ': ' + v + ' (' + pct + '%)';
            }}}
          },
          scales: baseScales()
        },
        plugins: [_datalabelPlugin]
      });
      _wireLegendClicks(lstEl, charts.trend);
    }
  }
}

// ── SHARED: RANKING LIST ─────────────────────────────────────
function renderRankList(elId, items, colors, barColors, numStyles = null, monthTotal = 0) {
  const el = document.getElementById(elId);
  if (!el) return;
  const max    = items[0]?.total || 1;
  const numCls = ['rn1','rn2','rn3'];
  el.innerHTML = items.map((it, i) => {
    const ns  = numStyles ? numStyles[i] || '' : '';
    const nc  = numStyles ? 'rn-' : (numCls[i] || 'rn-');
    const pct = monthTotal > 0 ? `<span class="rpct">${(it.total / monthTotal * 100).toFixed(1)}%</span>` : '';
    return `<li class="rit">
      <div class="rnum ${nc}" style="${ns}">${i + 1}</div>
      <div class="rinfo">
        <div class="rname" style="color:${colors[i] || '#ccc'}">${it.name}</div>
        <div class="rbar-wrap"><div class="rbar" style="width:${(it.total / max * 100).toFixed(0)}%;background:${barColors[i] || 'rgba(100,100,100,.4)'}"></div></div>
      </div>
      <div class="rval">${it.total}${pct}</div>
    </li>`;
  }).join('');
}
