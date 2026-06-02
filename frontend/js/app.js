/* Sifat Nazorati — App logic (navigation, forms, tables) */
'use strict';

// ── DATA CACHE ──────────────────────────────────────────────
let _data = [];
function getData() { return _data; }

async function loadData() {
  try {
    _data = await apiGetDefects() || [];
  } catch (err) {
    console.error('loadData error:', err);
    _data = _data || [];
  }
}

// ── SIDEBAR MOBILE ──────────────────────────────────────────
function openSidebar() {
  document.querySelector('.sidebar').classList.add('open');
  document.getElementById('mobOverlay').classList.add('open');
}
function closeSidebar() {
  document.querySelector('.sidebar').classList.remove('open');
  document.getElementById('mobOverlay').classList.remove('open');
}
function toggleSidebar() {
  document.querySelector('.sidebar').classList.contains('open') ? closeSidebar() : openSidebar();
}

// ── NAVIGATION ──────────────────────────────────────────────
async function goPage(name) {
  if (window.innerWidth <= 780) closeSidebar();
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-it').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelectorAll('.nav-it').forEach(n => {
    if ((n.getAttribute('onclick') || '').includes("'" + name + "'")) n.classList.add('active');
  });
  const m = PAGE_META[name] || { t: name, s: '' };
  document.getElementById('ptitle').textContent = m.t;
  document.getElementById('psub').textContent   = m.s;

  if (name === 'dash') {
    await loadData();
    renderDash();
  }
  if (name === 'entry') {
    setupForm();
  }
  if (name === 'records') {
    await loadData();
    renderRecords();
  }
  if (name === 'analytics') {
    await loadData();
    renderAnalytics();
  }
  if (['qayta','yamala','orta'].includes(name)) {
    await loadData();
    renderCatPage(name);
  }
  if (name === 'users') {
    renderUsers();
  }
}

// ── MODEL PICKER ─────────────────────────────────────────────
const MP_DATA = {
  Padosh: {
    models: ['Brunelli cucunelli','9092','1603-siliq','1603-yozuvli','2283','3316','Heval','23338','2099','Tomford','1207','2104'],
    colors: [{name:"qora",hex:"#1a1a1a"},{name:"ko'k",hex:"#1a5fb4"},{name:"oq",hex:"#f0f0f0"},{name:"jigarrang",hex:"#7b4f2e"},{name:"bardovый",hex:"#800020"}]
  },
  Stilka: {
    models: ['6668','9092','2104','23338','2099','Tomford','1603-siliq','1603-yozuvli'],
    colors: [{name:"qora",hex:"#1a1a1a"},{name:"ko'k",hex:"#1a5fb4"},{name:"oq",hex:"#f0f0f0"},{name:"jigarrang",hex:"#7b4f2e"},{name:"bardovый",hex:"#800020"}]
  }
};

let _mpCat = null, _mpModel = null;

function _mpGetCustom() {
  try { return JSON.parse(localStorage.getItem('mp_custom') || '{"models":[],"colors":{}}'); } catch { return {models:[],colors:{}}; }
}
function _mpSaveCustom(d) { localStorage.setItem('mp_custom', JSON.stringify(d)); }

function _mpGetModels(cat) {
  const base = [...(MP_DATA[cat]?.models || [])];
  const custom = _mpGetCustom();
  custom.models.filter(m => m.cat === cat).forEach(m => { if (!base.includes(m.name)) base.push(m.name); });
  return base;
}
function _mpGetColors(cat, model) {
  const base = [...(MP_DATA[cat]?.colors || [])];
  const custom = _mpGetCustom();
  const key = cat + '/' + model;
  (custom.colors[key] || []).forEach(c => { if (!base.find(b => b.name === c.name)) base.push(c); });
  return base;
}

function selectMpCat(cat) {
  _mpCat = cat; _mpModel = null;
  document.querySelectorAll('.mp-cat-btn').forEach(b => b.classList.toggle('active', b.id === 'mpBtn-' + cat));
  document.getElementById('mpStep2').style.display = 'block';
  document.getElementById('mpStep3').style.display = 'none';
  document.getElementById('mpSearch').value = '';
  renderMpModels('');
}

function renderMpModels(q) {
  const models = _mpGetModels(_mpCat);
  const filtered = q ? models.filter(m => m.toLowerCase().includes(q.toLowerCase())) : models;
  document.getElementById('mpModelList').innerHTML = filtered.map(m =>
    `<div class="mp-model-item" onclick="selectMpModel(this,'${m.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')"><i class="fas fa-shoe-prints" style="font-size:10px;opacity:.4;margin-right:6px"></i>${m}</div>`
  ).join('');
  const addEl = document.getElementById('mpAddNew');
  const exact = models.find(m => m.toLowerCase() === q.toLowerCase());
  if (q && !exact) {
    document.getElementById('mpAddName').textContent = q;
    addEl.style.display = 'block';
  } else {
    addEl.style.display = 'none';
  }
}

function filterMpModels() {
  renderMpModels(document.getElementById('mpSearch').value.trim());
}

function selectMpModel(el, model) {
  _mpModel = model;
  document.getElementById('mpStep2').style.display = 'none';
  document.getElementById('mpStep3').style.display = 'block';
  document.getElementById('mpModelName').textContent = _mpCat + ' — ' + model;
  renderMpColors();
}

function renderMpColors() {
  const colors = _mpGetColors(_mpCat, _mpModel);
  document.getElementById('mpColorList').innerHTML = colors.map(c =>
    `<div class="mp-color-item" onclick="selectMpColor('${c.name.replace(/'/g,"\\'")}','${c.hex}')">
      <span class="mp-color-dot" style="background:${c.hex}${c.name==='oq'?';border-color:rgba(255,255,255,.35)':''}"></span>${c.name}
    </div>`
  ).join('');
}

function selectMpColor(name, hex) {
  const val = _mpCat + ' - ' + _mpModel + ' - ' + name;
  document.getElementById('eSku').value = val;
  document.getElementById('mpStep1').style.display = 'none';
  document.getElementById('mpStep2').style.display = 'none';
  document.getElementById('mpStep3').style.display = 'none';
  const selEl = document.getElementById('mpSelected');
  document.getElementById('mpSelectedText').textContent = val;
  selEl.style.display = 'flex';
}

function mpGoBack(toStep) {
  if (toStep === 1) {
    _mpModel = null; _mpCat = null;
    document.getElementById('mpStep2').style.display = 'none';
    document.getElementById('mpStep3').style.display = 'none';
    document.querySelectorAll('.mp-cat-btn').forEach(b => b.classList.remove('active'));
  } else if (toStep === 2) {
    _mpModel = null;
    document.getElementById('mpStep3').style.display = 'none';
    document.getElementById('mpStep2').style.display = 'block';
  }
}

function resetModelPicker() {
  _mpCat = null; _mpModel = null;
  document.getElementById('eSku').value = '';
  document.getElementById('mpSelected').style.display = 'none';
  document.getElementById('mpStep1').style.display = 'block';
  document.getElementById('mpStep2').style.display = 'none';
  document.getElementById('mpStep3').style.display = 'none';
  document.querySelectorAll('.mp-cat-btn').forEach(b => b.classList.remove('active'));
}

function addCustomModel() {
  const name = document.getElementById('mpSearch').value.trim();
  if (!name || !_mpCat) return;
  const custom = _mpGetCustom();
  if (!custom.models.find(m => m.name === name && m.cat === _mpCat)) {
    custom.models.push({ name, cat: _mpCat });
    _mpSaveCustom(custom);
  }
  document.getElementById('mpModelList').querySelectorAll('.mp-model-item').forEach(el => {
    if (el.textContent.trim() === name) selectMpModel(el, name);
  });
  selectMpModel(null, name);
}

function addCustomColor() {
  const name = document.getElementById('mpColorName').value.trim();
  const hex  = document.getElementById('mpColorPicker').value;
  if (!name || !_mpCat || !_mpModel) return;
  const custom = _mpGetCustom();
  const key = _mpCat + '/' + _mpModel;
  if (!custom.colors[key]) custom.colors[key] = [];
  if (!custom.colors[key].find(c => c.name === name)) {
    custom.colors[key].push({ name, hex });
    _mpSaveCustom(custom);
    document.getElementById('mpColorName').value = '';
    renderMpColors();
    toast("Rang qo'shildi!", 's');
  }
}

// ── DASHBOARD ───────────────────────────────────────────────
function renderDash() {
  const data = getData(); const now = new Date();
  const today = now.toISOString().split('T')[0];

  document.getElementById('k-today').textContent =
    data.filter(r => r.date === today).reduce((s, r) => s + r.qty, 0);
  document.getElementById('k-month').textContent =
    data.filter(r => { const d = new Date(r.date + 'T00:00:00'); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); }).reduce((s, r) => s + r.qty, 0);

  const topMod = topNmodels(data, 1);
  document.getElementById('k-sku').textContent = topMod[0]?.total > 0 ? topMod[0].name : '—';

  const topReason = REASONS.map(r => ({ r, t: reasonTotal(data, r) })).sort((a, b) => b.t - a.t);
  document.getElementById('k-reason').textContent = topReason[0]?.t > 0 ? topReason[0].r : '—';

  renderTrend(data);

  // Top 5 doughnut
  destroyC('sku');
  const { labels, values } = top5models(data);
  charts.sku = new Chart(document.getElementById('cSku').getContext('2d'), {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values,
      backgroundColor: ['rgba(79,142,247,.8)','rgba(46,213,115,.8)','rgba(255,107,53,.8)','rgba(255,212,59,.8)','rgba(156,106,248,.8)','rgba(100,100,120,.5)'],
      borderWidth: 2, borderColor: 'rgba(20,20,46,.8)'
    }]},
    options: { responsive: true, maintainAspectRatio: false, cutout: '63%',
      plugins: { legend: { position: 'bottom', labels: { color: TC, padding: 10, font: { size: 10 } } } }}
  });

  // Reasons bar
  destroyC('reason');
  charts.reason = new Chart(document.getElementById('cReason').getContext('2d'), {
    type: 'bar',
    data: { labels: REASONS, datasets: [{ data: REASONS.map(r => reasonTotal(data, r)), backgroundColor: REASON_COLORS, borderRadius: 5, borderSkipped: false }] },
    options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } },
      scales: { x: { grid: { color: GRID }, ticks: { color: TC, font: { size: 9 } } }, y: { grid: { display: false }, ticks: { color: TC, font: { size: 9 } } } } }
  });

  // Top 10 ranking — current month only
  const mData = data.filter(r => { const d = new Date(r.date + 'T00:00:00'); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); });
  renderRankList('skuRank', topNmodels(mData, 10),
    ['#ffd43b','#aaa','#ff6b35',...Array(7).fill('#6666aa')],
    ['rgba(255,212,59,.5)','rgba(170,170,170,.35)','rgba(255,107,53,.45)',...Array(7).fill('rgba(100,100,170,.3)')]);

  // Recent table
  const recent = [...data].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  const tb = document.getElementById('recentTb');
  if (!recent.length) {
    tb.innerHTML = '<tr><td colspan="6" class="empty">Yozuvlar yo\'q — birinchi nuqsonni kiriting.</td></tr>';
    return;
  }
  tb.innerHTML = recent.map(r => `
    <tr>
      <td>${fmtDate(r.date)}</td>
      <td><span class="mbadge" title="${r.sku}">${r.sku}</span></td>
      <td><span class="rtag">${r.reason}</span></td>
      <td><span style="font-size:12px;color:${catColor(r.cat)}">${CAT_LABEL[r.cat] || r.cat || '—'}</span></td>
      <td class="${qtyCls(r.qty)}">${r.qty}</td>
      <td style="color:var(--text2);font-size:12px">${r.notes || '—'}</td>
    </tr>`).join('');
}

// ── CUSTOM REASONS ───────────────────────────────────────────
async function loadCustomReasons() {
  try {
    const reasons = await apiGetReasons();
    const sel = document.getElementById('eReason');
    sel.querySelectorAll('.custom-reason').forEach(o => o.remove());
    reasons.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.name;
      opt.textContent = r.name;
      opt.className = 'custom-reason';
      sel.appendChild(opt);
    });
  } catch { /* silent — base reasons still work */ }
}

function toggleReasonAdd() {
  const row = document.getElementById('reasonAddRow');
  const btn = document.getElementById('reasonAddBtn');
  const show = row.style.display === 'none';
  row.style.display = show ? 'block' : 'none';
  btn.style.display  = show ? 'none'  : '';
  if (show) document.getElementById('reasonNewText').focus();
}

function cancelNewReason() {
  document.getElementById('reasonAddRow').style.display = 'none';
  document.getElementById('reasonAddBtn').style.display = '';
  document.getElementById('reasonNewText').value = '';
}

async function saveNewReason() {
  const name = document.getElementById('reasonNewText').value.trim();
  if (!name) { toast('Sabab nomini kiriting.', 'e'); return; }
  try {
    await apiPostReason(name);
    await loadCustomReasons();
    document.getElementById('eReason').value = name;
    cancelNewReason();
    toast("Yangi sabab qo'shildi!", 's');
  } catch (err) {
    toast(err.message || 'Xatolik yuz berdi', 'e');
  }
}

// ── ENTRY FORM ──────────────────────────────────────────────
function setupForm() {
  document.getElementById('eDate').value   = new Date().toISOString().split('T')[0];
  document.getElementById('eReason').value = '';
  document.getElementById('eCat').value    = '';
  document.getElementById('eQty').value    = '';
  document.getElementById('eNotes').value  = '';
  document.getElementById('succMsg').style.display = 'none';
  cancelNewReason();
  resetModelPicker();
  loadCustomReasons();
}

async function saveEntry() {
  const date   = document.getElementById('eDate').value;
  const sku    = document.getElementById('eSku').value;
  const reason = document.getElementById('eReason').value;
  const cat    = document.getElementById('eCat').value;
  const qty    = parseInt(document.getElementById('eQty').value);
  const notes  = document.getElementById('eNotes').value.trim();

  if (!date || !sku || !reason || !cat || !qty || qty < 1) {
    toast("Barcha majburiy maydonlarni to'ldiring.", 'e');
    return;
  }

  try {
    await apiPostDefect({ date, sku, reason, category: cat, qty, notes });
    document.getElementById('succMsg').style.display = 'flex';
    toast('Nuqson yozuvi saqlandi!', 's');
    setTimeout(() => {
      document.getElementById('succMsg').style.display = 'none';
      goPage('dash');
    }, 1600);
  } catch (err) {
    toast(err.message || 'Saqlashda xatolik yuz berdi', 'e');
  }
}

// ── ALL RECORDS ─────────────────────────────────────────────
function renderRecords() {
  const data = [...getData()].sort((a, b) => new Date(b.date) - new Date(a.date));
  document.getElementById('recCount').textContent = data.length + ' ta yozuv';
  const tb        = document.getElementById('allTb');
  const canDelete = getCurrentUser()?.role === 'admin';
  if (!data.length) { tb.innerHTML = '<tr><td colspan="8" class="empty">Yozuvlar topilmadi.</td></tr>'; return; }
  tb.innerHTML = data.map((r, i) => `
    <tr>
      <td style="color:var(--muted)">${i + 1}</td>
      <td>${fmtDate(r.date)}</td>
      <td><span class="mbadge" title="${r.sku}">${r.sku}</span></td>
      <td><span class="rtag">${r.reason}</span></td>
      <td><span style="font-size:12px;font-weight:600;color:${catColor(r.cat)}">${CAT_LABEL[r.cat] || r.cat || '—'}</span></td>
      <td class="${qtyCls(r.qty)}">${r.qty}</td>
      <td style="color:var(--text2);font-size:12px">${r.notes || '—'}</td>
      <td>${canDelete ? `<button onclick="delRecord(${r.id})" style="background:none;border:none;color:var(--red);cursor:pointer;opacity:.55;transition:opacity .15s" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.55"><i class="fas fa-trash"></i></button>` : ''}</td>
    </tr>`).join('');
}

async function delRecord(id) {
  if (!confirm("Ushbu yozuvni o'chirishni tasdiqlaysizmi?")) return;
  try {
    await apiDeleteDefect(id);
    _data = _data.filter(r => r.id !== id);
    renderRecords();
    toast("Yozuv o'chirildi.", 's');
  } catch (err) {
    toast(err.message || "O'chirishda xatolik yuz berdi", 'e');
  }
}

// ── ANALYTICS ───────────────────────────────────────────────
function renderAnalytics() {
  const data = getData(); const months = last6();

  destroyC('aTrend');
  charts.aTrend = new Chart(document.getElementById('cATrend').getContext('2d'), {
    type: 'line',
    data: { labels: months.map(m => m.label), datasets: [{ label: 'Nuqsonlar',
      data: months.map(m => monthlyTotal(data, m.y, m.m)),
      borderColor: '#4f8ef7', backgroundColor: 'rgba(79,142,247,.1)',
      borderWidth: 2.5, pointBackgroundColor: '#4f8ef7', pointRadius: 5, fill: true, tension: .4
    }]},
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: baseScales() }
  });

  document.getElementById('pctRowAn').innerHTML = calcPctChips(data);

  destroyC('aPie');
  charts.aPie = new Chart(document.getElementById('cAPie').getContext('2d'), {
    type: 'pie',
    data: { labels: REASONS, datasets: [{ data: REASONS.map(r => reasonTotal(data, r)), backgroundColor: REASON_COLORS, borderWidth: 2, borderColor: 'rgba(19,19,46,.9)' }] },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'right', labels: { color: TC, font: { size: 9 }, padding: 8 } } }}
  });

  const rColors = ['#ff4757','#ffd43b','#ff6b35','#4f8ef7','#2ed573','#9c6af8','#2ec4b6','#ff9f43','#55efc4'];
  const now2 = new Date();
  const aMData = data.filter(r => { const d = new Date(r.date + 'T00:00:00'); return d.getFullYear() === now2.getFullYear() && d.getMonth() === now2.getMonth(); });
  renderRankList('aSkuRank', topNmodels(aMData, 10),
    ['#ffd43b','#aaa','#ff6b35',...Array(7).fill('#6666aa')],
    ['rgba(255,212,59,.5)','rgba(170,170,170,.35)','rgba(255,107,53,.45)',...Array(7).fill('rgba(100,100,170,.3)')]);
  renderRankList('aReasonRank',
    REASONS.map(r => ({ name: r, total: reasonTotal(aMData, r) })).sort((a, b) => b.total - a.total),
    rColors, rColors.map(c => c + '66'));
}

// ── CATEGORY PAGES ───────────────────────────────────────────
function renderCatPage(catId) {
  const cat  = CATS.find(c => c.id === catId);
  const data = getData().filter(r => r.cat === catId);
  const now  = new Date(); const today = now.toISOString().split('T')[0];

  const total      = data.reduce((s, r) => s + r.qty, 0);
  const monthTotal = data.filter(r => { const d = new Date(r.date + 'T00:00:00'); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); }).reduce((s, r) => s + r.qty, 0);
  const todayTotal = data.filter(r => r.date === today).reduce((s, r) => s + r.qty, 0);
  const ac = cat.accentCls;

  const el = document.getElementById('page-' + catId);
  el.innerHTML = `
    <div class="cat-hdr" style="border-left-color:${cat.accent}">
      <div class="cat-hdr-ico" style="background:${cat.accent}1a;color:${cat.accent}">
        <i class="${cat.icon}" style="font-size:22px"></i>
      </div>
      <div>
        <h2 style="color:${cat.accent}">${cat.label}</h2>
        <p>Jami <strong style="color:${cat.accent}">${total}</strong> ta nuqson qayd etilgan</p>
      </div>
    </div>
    <div class="kpi-row-3">
      <div class="kpi ${ac}"><div class="kpi-ico"><i class="fas fa-layer-group"></i></div>
        <div class="kpi-lbl">Jami nuqsonlar</div><div class="kpi-val">${total}</div><div class="kpi-sub">Barcha vaqt davomida</div></div>
      <div class="kpi ${ac}"><div class="kpi-ico"><i class="fas fa-calendar-alt"></i></div>
        <div class="kpi-lbl">Shu oyda</div><div class="kpi-val">${monthTotal}</div><div class="kpi-sub">Joriy oy natijalari</div></div>
      <div class="kpi ${ac}"><div class="kpi-ico"><i class="fas fa-clock"></i></div>
        <div class="kpi-lbl">Bugun</div><div class="kpi-val">${todayTotal}</div><div class="kpi-sub">Bugungi nuqsonlar</div></div>
    </div>
    <div class="g2" style="margin-bottom:16px">
      <div class="tcard" style="margin-bottom:0">
        <div class="thead"><div>
          <div class="thead-t">So'nggi yozuvlar</div>
          <div class="thead-s">${cat.label}</div>
        </div></div>
        <table>
          <thead><tr><th>Sana</th><th>Model</th><th>Nuqson sababi</th><th>Miqdor</th></tr></thead>
          <tbody id="catTb-${catId}"></tbody>
        </table>
      </div>
      <div class="ccard">
        <div class="ch"><div><div class="ch-t">Nuqson sabablari</div><div class="ch-s">Ushbu turkum bo'yicha</div></div></div>
        <div class="cbox"><canvas id="cCatR-${catId}"></canvas></div>
      </div>
    </div>
    <div class="ccard">
      <div class="ch"><div><div class="ch-t">Top 10 model reytingi</div><div class="ch-s">${cat.label} — jami nuqsonlar bo'yicha</div></div></div>
      <ul class="rlist" id="catRnk-${catId}"></ul>
    </div>`;

  const recent = [...data].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  const tb = document.getElementById('catTb-' + catId);
  if (!recent.length) {
    tb.innerHTML = `<tr><td colspan="4" class="empty">Bu turkumda yozuvlar yo'q.</td></tr>`;
  } else {
    tb.innerHTML = recent.map(r => `
      <tr>
        <td>${fmtDate(r.date)}</td>
        <td><span class="mbadge" title="${r.sku}">${r.sku}</span></td>
        <td><span class="rtag">${r.reason}</span></td>
        <td class="${qtyCls(r.qty)}">${r.qty}</td>
      </tr>`).join('');
  }

  destroyC('catR' + catId);
  charts['catR' + catId] = new Chart(document.getElementById('cCatR-' + catId).getContext('2d'), {
    type: 'bar',
    data: { labels: REASONS, datasets: [{ data: REASONS.map(r => data.filter(d => d.reason === r).reduce((s, d) => s + d.qty, 0)), backgroundColor: REASON_COLORS, borderRadius: 5, borderSkipped: false }] },
    options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } },
      scales: { x: { grid: { color: GRID }, ticks: { color: TC, font: { size: 9 } } }, y: { grid: { display: false }, ticks: { color: TC, font: { size: 9 } } } } }
  });

  const items = topNmodels(data, 10);
  if (items.length) {
    const a = cat.accent;
    const numStyles = [
      `background:${a}30;color:${a}`, `background:${a}20;color:${a}bb`, `background:${a}18;color:${a}99`,
      ...Array(7).fill(`background:rgba(255,255,255,.05);color:var(--muted)`)
    ];
    renderRankList('catRnk-' + catId, items,
      [a, a + 'dd', a + 'bb', ...Array(7).fill('#6666aa')],
      [a + '55', a + '44', a + '33', ...Array(7).fill('rgba(100,100,170,.25)')],
      numStyles);
  } else {
    document.getElementById('catRnk-' + catId).innerHTML =
      `<li style="padding:20px;text-align:center;color:var(--muted);font-size:13px">Yozuvlar yo'q</li>`;
  }
}

// ── USERS PAGE (admin only) ──────────────────────────────────
async function renderUsers() {
  const el = document.getElementById('page-users');
  el.innerHTML = '<p style="color:var(--text2);padding:20px">Yuklanmoqda...</p>';
  try {
    const users = await apiGetUsers();
    el.innerHTML = `
      <div class="fcard" style="max-width:560px;margin-bottom:22px">
        <div style="font-size:14px;font-weight:700;margin-bottom:18px">Yangi foydalanuvchi qo'shish</div>
        <div class="fgrid">
          <div><label class="flbl">Username *</label><input class="fi" id="nu-user" placeholder="username"></div>
          <div><label class="flbl">Parol *</label><input class="fi" id="nu-pass" type="password" placeholder="Parol"></div>
          <div><label class="flbl">Rol *</label>
            <select class="fi" id="nu-role">
              <option value="">Rolni tanlang...</option>
              <option value="operator">Operator</option>
              <option value="boss">Boss</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div class="fact"><button class="btn-save" onclick="addUser()"><i class="fas fa-user-plus"></i> Qo'shish</button></div>
      </div>
      <div class="tcard">
        <div class="thead"><div class="thead-t">Foydalanuvchilar</div></div>
        <table>
          <thead><tr><th>#</th><th>Username</th><th>Rol</th><th>Qo'shilgan</th><th></th></tr></thead>
          <tbody id="usersTb"></tbody>
        </table>
      </div>`;
    renderUserRows(users);
  } catch (err) {
    el.innerHTML = `<p style="color:var(--red);padding:20px">${err.message}</p>`;
  }
}

function renderUserRows(users) {
  const tb   = document.getElementById('usersTb');
  const me   = getCurrentUser();
  const roleLabel = { admin: 'Administrator', boss: 'Rahbar', operator: 'Operator' };
  tb.innerHTML = users.map((u, i) => `
    <tr>
      <td style="color:var(--muted)">${i + 1}</td>
      <td style="font-weight:600">${u.username}</td>
      <td><span style="font-size:11px;padding:3px 8px;border-radius:5px;background:rgba(79,142,247,.1);color:var(--blue)">${roleLabel[u.role] || u.role}</span></td>
      <td style="color:var(--text2);font-size:12px">${fmtDate(u.created_at?.split('T')[0])}</td>
      <td>${u.id !== me?.id ? `<button onclick="removeUser(${u.id},'${u.username}')" style="background:none;border:none;color:var(--red);cursor:pointer;opacity:.55;transition:opacity .15s" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.55"><i class="fas fa-trash"></i></button>` : '<span style="color:var(--muted);font-size:11px">(siz)</span>'}</td>
    </tr>`).join('');
}

async function addUser() {
  const username = document.getElementById('nu-user').value.trim();
  const password = document.getElementById('nu-pass').value;
  const role     = document.getElementById('nu-role').value;
  if (!username || !password || !role) { toast("Barcha maydonlarni to'ldiring.", 'e'); return; }
  try {
    await apiPostUser({ username, password, role });
    toast("Foydalanuvchi qo'shildi!", 's');
    document.getElementById('nu-user').value = '';
    document.getElementById('nu-pass').value = '';
    document.getElementById('nu-role').value = '';
    renderUsers();
  } catch (err) { toast(err.message || "Xatolik yuz berdi", 'e'); }
}

async function removeUser(id, username) {
  if (!confirm(`"${username}" foydalanuvchisini o'chirishni tasdiqlaysizmi?`)) return;
  try {
    await apiDeleteUser(id);
    toast("Foydalanuvchi o'chirildi.", 's');
    renderUsers();
  } catch (err) { toast(err.message || "O'chirishda xatolik", 'e'); }
}

// ── HELPERS ──────────────────────────────────────────────────
function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s + 'T00:00:00');
  return d.getDate().toString().padStart(2, '0') + ' ' + UZ_MONTHS[d.getMonth()] + ' ' + d.getFullYear();
}
function qtyCls(q) { return q >= 20 ? 'qh' : q >= 10 ? 'qm' : 'ql'; }
function catColor(c) { return c === 'qayta' ? 'var(--red)' : c === 'yamala' ? 'var(--blue)' : 'var(--yellow)'; }

function toast(msg, type) {
  const t = document.getElementById('toast');
  t.className = 'toast ' + (type === 's' ? 'ts' : 'te');
  document.getElementById('toastIco').textContent = type === 's' ? '✓' : '✕';
  document.getElementById('toastTxt').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}
