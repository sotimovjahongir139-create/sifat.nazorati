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

// ── SIDEBAR WEEKLY BADGES ───────────────────────────────────
async function fetchWeeklySidebar() {
  try {
    const d = await apiGetWeeklySummary();
    const map = { qayta: d.qayta_ishlab, yamala: d.yamaladigan, orta: d.orta, yamchiq: d.yamchiq };
    ['qayta', 'yamala', 'orta', 'yamchiq'].forEach(k => {
      const el = document.getElementById('badge-' + k);
      if (!el) return;
      const v = map[k];
      if (v != null) { el.textContent = v; el.style.display = ''; }
    });
  } catch { /* hide silently — badges stay hidden */ }
}

// ── NAVIGATION ──────────────────────────────────────────────
async function goPage(name) {
  fetchWeeklySidebar();
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
  if (name === 'yamchiq') {
    await renderYamchiqPage();
  }
  if (name === 'users') {
    renderUsers();
  }
  if (name === 'histogramma') {
    setupHistogramma();
    renderHistogramma();
  }
  if (name === 'bolim') {
    await renderBolimPage();
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
  const today = todayLocal();

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
  document.getElementById('eDate').value   = todayLocal();
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

// ── ANALYTICS DRILL-DOWN ────────────────────────────────────
const _drill = { step: 1, category: null, model: null };

function _drillMonth() {
  const n = new Date();
  return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0');
}

function renderDrill() {
  const el = document.getElementById('drillContent');
  if (!el) return;
  if (_drill.step === 1) {
    el.innerHTML = `
      <div class="ch"><div><div class="ch-t">Model → Sabab tahlili</div><div class="ch-s">Kategoriya tanlang</div></div></div>
      <div style="display:flex;gap:16px;padding:16px 0 8px">
        <div onclick="drillGoCategory('Padosh')" style="flex:1;padding:28px 16px;background:rgba(59,130,246,.08);border:2px solid rgba(59,130,246,.25);border-radius:12px;cursor:pointer;text-align:center" onmouseover="this.style.borderColor='#3b82f6'" onmouseout="this.style.borderColor='rgba(59,130,246,.25)'">
          <div style="font-size:18px;font-weight:700;color:#fff">Padosh</div>
        </div>
        <div onclick="drillGoCategory('Stilka')" style="flex:1;padding:28px 16px;background:rgba(249,115,22,.08);border:2px solid rgba(249,115,22,.25);border-radius:12px;cursor:pointer;text-align:center" onmouseover="this.style.borderColor='#f97316'" onmouseout="this.style.borderColor='rgba(249,115,22,.25)'">
          <div style="font-size:18px;font-weight:700;color:#fff">Stilka</div>
        </div>
      </div>`;
  } else if (_drill.step === 2) {
    el.innerHTML = `
      <div class="ch">
        <div>
          <button class="ttab" onclick="drillBack()" style="margin-bottom:6px">← Orqaga</button>
          <div class="ch-t">${_drill.category} modellari</div>
          <div class="ch-s">Joriy oy bo'yicha saralangan</div>
        </div>
      </div>
      <ul class="rlist" id="drillList"><li class="rit" style="justify-content:center;padding:20px"><i class="fas fa-spinner fa-spin" style="color:var(--blue)"></i></li></ul>`;
    apiGetCategoryModels(_drill.category, _drillMonth()).then(res => {
      const rColors = ['#ffd43b','#aaa','#ff6b35','#4f8ef7','#2ed573','#9c6af8','#2ec4b6','#ff9f43','#55efc4','#ff4757'];
      const items = (res.models || []);
      if (!items.length) { document.getElementById('drillList').innerHTML = `<li class="rit"><span style="opacity:.6">Ma'lumot topilmadi</span></li>`; return; }
      const max = items[0].count || 1;
      document.getElementById('drillList').innerHTML = items.map((it, i) => {
        const c = rColors[i % rColors.length];
        return `<li class="rit" style="cursor:pointer" onclick="drillGoModel('${it.model.replace(/'/g,"\\'")}')">
          <div class="rnum rn-" style="background:${c}22;color:${c}">${i+1}</div>
          <div class="rinfo">
            <div class="rname" style="color:${c}">${it.model}</div>
            <div class="rbar-wrap"><div class="rbar" style="width:${(it.count/max*100).toFixed(0)}%;background:${c}55"></div></div>
          </div>
          <div class="rval">${it.count}<span class="rpct">${it.percentage}%</span></div>
        </li>`;
      }).join('');
    }).catch(() => { document.getElementById('drillList').innerHTML = `<li class="rit"><span style="color:var(--red)">Xatolik yuz berdi</span></li>`; });
  } else {
    const uzMonth = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'][new Date().getMonth()];
    const shortName = _drill.model.replace(/^(Padosh|Stilka)\s*-\s*/i, '');
    el.innerHTML = `
      <div class="ch">
        <div>
          <button class="ttab" onclick="drillBack()" style="margin-bottom:6px">← Orqaga</button>
          <div class="ch-t">${shortName} — bu oygi sabablari</div>
          <div class="ch-s">Jami: <strong id="drillTotal">—</strong> ta &nbsp;|&nbsp; Oy: ${uzMonth}</div>
        </div>
      </div>
      <ul class="rlist" id="drillList"><li class="rit" style="justify-content:center;padding:20px"><i class="fas fa-spinner fa-spin" style="color:var(--blue)"></i></li></ul>`;
    apiGetModelCauses(_drill.model, _drillMonth()).then(res => {
      document.getElementById('drillTotal').textContent = res.total || 0;
      const rColors = ['#ff4757','#ffd43b','#ff6b35','#4f8ef7','#2ed573','#9c6af8','#2ec4b6','#ff9f43','#55efc4'];
      const causes = (res.causes || []);
      if (!causes.length) { document.getElementById('drillList').innerHTML = `<li class="rit"><span style="opacity:.6">Ma'lumot topilmadi</span></li>`; return; }
      const max = causes[0].count || 1;
      document.getElementById('drillList').innerHTML = causes.map((it, i) => {
        const c = rColors[i % rColors.length];
        return `<li class="rit">
          <div class="rnum rn-" style="background:${c}22;color:${c}">${i+1}</div>
          <div class="rinfo">
            <div class="rname" style="color:${c}">${it.cause}</div>
            <div class="rbar-wrap"><div class="rbar" style="width:${(it.count/max*100).toFixed(0)}%;background:${c}55"></div></div>
          </div>
          <div class="rval">${it.count}<span class="rpct">${it.percentage}%</span></div>
        </li>`;
      }).join('');
    }).catch(() => { document.getElementById('drillList').innerHTML = `<li class="rit"><span style="color:var(--red)">Xatolik yuz berdi</span></li>`; });
  }
}

function drillGoCategory(cat) { _drill.step = 2; _drill.category = cat; _drill.model = null; renderDrill(); }
function drillGoModel(model)   { _drill.step = 3; _drill.model = model; renderDrill(); }
function drillBack()           { _drill.step = Math.max(1, _drill.step - 1); if (_drill.step === 1) _drill.category = null; renderDrill(); }

// ── ANALYTICS ───────────────────────────────────────────────
function renderAnalytics() {
  _drill.step = 1; _drill.category = null; _drill.model = null;
  renderDrill();
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
  const aMTotal = aMData.reduce((s, r) => s + r.qty, 0);
  const aTopModels = topNmodels(aMData, 10);

  document.getElementById('aSkuRankTitle').textContent = 'Top 10 model reytingi';
  document.getElementById('aSkuRankSub').textContent   = "Jami nuqsonlar bo'yicha";
  document.getElementById('aSkuRankBack').style.display = 'none';
  renderRankList('aSkuRank', aTopModels,
    ['#ffd43b','#aaa','#ff6b35',...Array(7).fill('#6666aa')],
    ['rgba(255,212,59,.5)','rgba(170,170,170,.35)','rgba(255,107,53,.45)',...Array(7).fill('rgba(100,100,170,.3)')],
    null, aMTotal);
  [...document.getElementById('aSkuRank').querySelectorAll('.rit')].forEach((li, i) => {
    if (aTopModels[i]) { li.style.cursor = 'pointer'; li.onclick = () => analyticsModelDrilldown(aTopModels[i].name); }
  });

  const aReasonItems = REASONS.map(r => ({ name: r, total: reasonTotal(aMData, r) })).sort((a, b) => b.total - a.total);
  const aTotalCauses = aReasonItems.reduce((s, it) => s + it.total, 0);
  renderRankList('aReasonRank', aReasonItems, rColors, rColors.map(c => c + '66'), null, aTotalCauses);
}

async function analyticsModelDrilldown(modelName) {
  const now   = new Date();
  const month = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  document.getElementById('aSkuRankTitle').textContent  = modelName + ' — sabablari';
  document.getElementById('aSkuRankSub').textContent    = 'Nuqson sabablari boʼyicha';
  document.getElementById('aSkuRankBack').style.display = '';
  document.getElementById('aSkuRank').innerHTML = '<li class="rit" style="justify-content:center;padding:20px"><i class="fas fa-spinner fa-spin" style="color:var(--blue)"></i></li>';
  try {
    const result  = await apiGetModelCauses(modelName, month);
    const rColors = ['#ff4757','#ffd43b','#ff6b35','#4f8ef7','#2ed573','#9c6af8','#2ec4b6','#ff9f43','#55efc4'];
    if (!result.causes || !result.causes.length) {
      document.getElementById('aSkuRank').innerHTML = `<li class="rit"><span style="opacity:.6">Ma'lumot topilmadi</span></li>`;
      return;
    }
    renderRankList('aSkuRank',
      result.causes.map(c => ({ name: c.cause, total: c.count })),
      rColors, rColors.map(c => c + '66'), null, result.total);
  } catch (e) {
    document.getElementById('aSkuRank').innerHTML = `<li class="rit"><span style="color:var(--red)">Xatolik: ${e.message}</span></li>`;
  }
}

function analyticsModelBack() {
  document.getElementById('aSkuRankTitle').textContent  = 'Top 10 model reytingi';
  document.getElementById('aSkuRankSub').textContent    = "Jami nuqsonlar bo'yicha";
  document.getElementById('aSkuRankBack').style.display = 'none';
  const d       = getData();
  const now2    = new Date();
  const aMData2 = d.filter(r => { const dt = new Date(r.date + 'T00:00:00'); return dt.getFullYear() === now2.getFullYear() && dt.getMonth() === now2.getMonth(); });
  const aMTotal2   = aMData2.reduce((s, r) => s + r.qty, 0);
  const aTopModels = topNmodels(aMData2, 10);
  renderRankList('aSkuRank', aTopModels,
    ['#ffd43b','#aaa','#ff6b35',...Array(7).fill('#6666aa')],
    ['rgba(255,212,59,.5)','rgba(170,170,170,.35)','rgba(255,107,53,.45)',...Array(7).fill('rgba(100,100,170,.3)')],
    null, aMTotal2);
  [...document.getElementById('aSkuRank').querySelectorAll('.rit')].forEach((li, i) => {
    if (aTopModels[i]) { li.style.cursor = 'pointer'; li.onclick = () => analyticsModelDrilldown(aTopModels[i].name); }
  });
}

// ── CATEGORY PAGES ───────────────────────────────────────────
// ── BOLIM ISH VAQTI PAGE ─────────────────────────────────────
let _bolimData = [];
let _bolimMode = 'haftalik';
let _bolimWeekOffset = 0;

function _blTimeOpts(sel) {
  let s = '<option value="">— Tanlang —</option>';
  for (let h = 0; h < 24; h++) s += `<option value="${h}"${sel === h ? ' selected' : ''}>${h}:00</option>`;
  return s;
}

async function renderBolimPage() {
  const el = document.getElementById('page-bolim');
  el.innerHTML = '<p style="color:var(--text2);padding:20px">Yuklanmoqda...</p>';
  try { _bolimData = await apiGetBolim() || []; } catch { _bolimData = []; }
  _renderBolimContent();
}

function _renderBolimContent() {
  const el     = document.getElementById('page-bolim');
  const now    = new Date();
  const today  = todayLocal();
  const todayRec = _bolimData.find(r => r.date === today) || {};

  // KPI: current month
  const monthData = _bolimData.filter(r => {
    const d = new Date(r.date + 'T00:00:00');
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const oylikIshSoati = monthData.reduce((s, r) => s + (r.ish_soati != null ? Number(r.ish_soati) : 0), 0);
  const oylikPadosh   = monthData.reduce((s, r) => s + (r.padosh_soni != null ? Number(r.padosh_soni) : 0), 0);
  const personHours   = monthData.reduce((s, r) => {
    const ish = r.ish_soati != null ? Number(r.ish_soati) : 0;
    const hod = r.hodim_soni != null ? Number(r.hodim_soni) : 0;
    return s + ish * hod;
  }, 0);
  const kishiBoshigaOy = personHours > 0 ? Math.round(oylikPadosh / personHours) : 0;

  el.innerHTML = `
    <div class="cat-hdr" style="border-left-color:#4f8ef7">
      <div class="cat-hdr-ico" style="background:#4f8ef71a;color:#4f8ef7">
        <i class="fas fa-clock" style="font-size:22px"></i>
      </div>
      <div>
        <h2 style="color:#4f8ef7">Bo'lim ish vaqti</h2>
        <p>Kunlik ish ko'rsatkichlari va samaradorlik</p>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:22px">
      <div class="kpi b"><div class="kpi-ico"><i class="fas fa-hourglass-half"></i></div>
        <div class="kpi-lbl">Oylik ish soati</div>
        <div class="kpi-val">${oylikIshSoati}</div>
        <div class="kpi-sub">Joriy oy jami</div>
      </div>
      <div class="kpi b"><div class="kpi-ico"><i class="fas fa-layer-group"></i></div>
        <div class="kpi-lbl">Oylik sifat nazoratidan o'tgan padosh</div>
        <div class="kpi-val">${oylikPadosh}</div>
        <div class="kpi-sub">Joriy oy jami</div>
      </div>
      <div class="kpi b"><div class="kpi-ico"><i class="fas fa-user-clock"></i></div>
        <div class="kpi-lbl">Kishi boshiga (oylik)</div>
        <div class="kpi-val">${kishiBoshigaOy}</div>
        <div class="kpi-sub">Padosh / soat / kishi</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:22px">
      <div class="fcard" style="max-width:100%">
        <div class="succ-msg" id="blSucc1" style="display:none"><i class="fas fa-check-circle"></i>&nbsp; Saqlandi!</div>
        <div style="font-size:13px;font-weight:700;color:#4f8ef7;margin-bottom:14px"><i class="fas fa-clock" style="margin-right:6px"></i>Ish vaqti</div>
        <label class="flbl">Sana</label>
        <input type="date" class="fi" id="blDate" style="margin-bottom:12px">
        <label class="flbl">Dan (soat)</label>
        <select class="fi" id="blDan" style="margin-bottom:12px">${_blTimeOpts(todayRec.dan != null ? Number(todayRec.dan) : -1)}</select>
        <label class="flbl">Gacha (soat)</label>
        <select class="fi" id="blGacha" style="margin-bottom:16px">${_blTimeOpts(todayRec.gacha != null ? Number(todayRec.gacha) : -1)}</select>
        <div id="blIshSoatiHint" style="font-size:12px;color:var(--muted);margin-bottom:12px"></div>
        <button class="btn-save" onclick="saveBolimIshVaqti()"><i class="fas fa-save"></i> Saqlash</button>
      </div>
      <div class="fcard" style="max-width:100%">
        <div class="succ-msg" id="blSucc2" style="display:none"><i class="fas fa-check-circle"></i>&nbsp; Saqlandi!</div>
        <div style="font-size:13px;font-weight:700;color:#4f8ef7;margin-bottom:14px"><i class="fas fa-users" style="margin-right:6px"></i>Hodim soni</div>
        <label class="flbl">Hodimlar soni</label>
        <input type="number" class="fi" id="blHodim" min="1" placeholder="Masalan: 2" value="${todayRec.hodim_soni != null ? todayRec.hodim_soni : ''}" style="margin-bottom:16px">
        <button class="btn-save" onclick="saveBolimHodim()"><i class="fas fa-save"></i> Saqlash</button>
      </div>
      <div class="fcard" style="max-width:100%">
        <div class="succ-msg" id="blSucc3" style="display:none"><i class="fas fa-check-circle"></i>&nbsp; Saqlandi!</div>
        <div style="font-size:13px;font-weight:700;color:#4f8ef7;margin-bottom:14px"><i class="fas fa-layer-group" style="margin-right:6px"></i>Sifat nazoratidan o'tgan padosh</div>
        <label class="flbl">Padosh miqdori</label>
        <input type="number" class="fi" id="blPadosh" min="0" placeholder="Masalan: 800" value="${todayRec.padosh_soni != null ? todayRec.padosh_soni : ''}" style="margin-bottom:16px">
        <button class="btn-save" onclick="saveBolimPadosh()"><i class="fas fa-save"></i> Saqlash</button>
      </div>
    </div>

    <div class="ccard">
      <div class="ch">
        <div>
          <div class="ch-t">Ish ko'rsatkichlari dinamikasi</div>
          <div class="ch-s" id="blWeekRange" style="margin-top:2px"></div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <div id="blWeekToggleWrap" style="display:none">
            <button id="blWeekToggleBtn" class="ttab" onclick="toggleBolimWeek()" style="font-size:11px;padding:4px 10px"></button>
          </div>
          <div class="trend-tabs">
            <button class="ttab${_bolimMode === 'haftalik' ? ' active' : ''}" id="blTab-haftalik" onclick="setBolimMode('haftalik')">Haftalik</button>
            <button class="ttab${_bolimMode === 'oylik'    ? ' active' : ''}" id="blTab-oylik"    onclick="setBolimMode('oylik')">Oylik</button>
          </div>
        </div>
      </div>
      <div class="cbox"><canvas id="cBolim"></canvas></div>
    </div>`;

  document.getElementById('blDate').value = today;
  document.getElementById('blDan').addEventListener('change', _updateBlIshSoatiHint);
  document.getElementById('blGacha').addEventListener('change', _updateBlIshSoatiHint);
  _updateBlIshSoatiHint();
  _renderBolimChart();
}

function _updateBlIshSoatiHint() {
  const dan   = parseInt(document.getElementById('blDan')?.value);
  const gacha = parseInt(document.getElementById('blGacha')?.value);
  const hint  = document.getElementById('blIshSoatiHint');
  if (!hint) return;
  if (!isNaN(dan) && !isNaN(gacha) && gacha > dan) {
    hint.textContent = `Ish soati: ${gacha - dan} soat`;
  } else {
    hint.textContent = '';
  }
}

function _blShowSucc(id) {
  const el = document.getElementById(id);
  if (el) { el.style.display = 'flex'; setTimeout(() => { el.style.display = 'none'; }, 2000); }
}

async function saveBolimIshVaqti() {
  const date  = document.getElementById('blDate').value;
  const dan   = document.getElementById('blDan').value;
  const gacha = document.getElementById('blGacha').value;
  if (!date || dan === '' || gacha === '') { toast('Sana, Dan va Gacha ni tanlang.', 'e'); return; }
  if (parseInt(gacha) <= parseInt(dan)) { toast("'Gacha' 'Dan'dan katta bo'lishi kerak.", 'e'); return; }
  try {
    await apiPostBolim({ date, dan: parseInt(dan), gacha: parseInt(gacha) });
    _blShowSucc('blSucc1');
    toast('Saqlandi!', 's');
    _bolimData = await apiGetBolim() || [];
    _renderBolimContent();
  } catch (err) { toast(err.message || 'Xatolik', 'e'); }
}

async function saveBolimHodim() {
  const date  = document.getElementById('blDate').value;
  const hodim = parseInt(document.getElementById('blHodim').value);
  if (!date || !hodim || hodim < 1) { toast("Sana va hodimlar sonini kiriting.", 'e'); return; }
  try {
    await apiPostBolim({ date, hodim_soni: hodim });
    _blShowSucc('blSucc2');
    toast('Saqlandi!', 's');
    _bolimData = await apiGetBolim() || [];
    _renderBolimContent();
  } catch (err) { toast(err.message || 'Xatolik', 'e'); }
}

async function saveBolimPadosh() {
  const date   = document.getElementById('blDate').value;
  const padosh = parseInt(document.getElementById('blPadosh').value);
  if (!date || padosh == null || isNaN(padosh) || padosh < 0) { toast("Sana va padosh miqdorini kiriting.", 'e'); return; }
  try {
    await apiPostBolim({ date, padosh_soni: padosh });
    _blShowSucc('blSucc3');
    toast('Saqlandi!', 's');
    _bolimData = await apiGetBolim() || [];
    _renderBolimContent();
  } catch (err) { toast(err.message || 'Xatolik', 'e'); }
}

function setBolimMode(mode) {
  _bolimMode = mode;
  _bolimWeekOffset = 0;
  ['haftalik', 'oylik'].forEach(m => {
    const btn = document.getElementById('blTab-' + m);
    if (btn) btn.classList.toggle('active', m === mode);
  });
  _renderBolimChart();
}

function toggleBolimWeek() {
  _bolimWeekOffset = _bolimWeekOffset === 0 ? 1 : 0;
  _renderBolimChart();
}

function _renderBolimChart() {
  destroyC('bolim');
  const canvas = document.getElementById('cBolim');
  if (!canvas) return;
  const data = _bolimData;
  const weekRange = document.getElementById('blWeekRange');
  const toggleWrap = document.getElementById('blWeekToggleWrap');
  const toggleBtn  = document.getElementById('blWeekToggleBtn');
  let labels = [], ishSoatiVals = [], kishiBoshigaVals = [];

  if (_bolimMode === 'oylik') {
    if (weekRange) weekRange.textContent = "Oylik tahlil";
    if (toggleWrap) toggleWrap.style.display = 'none';
    const map = {};
    data.forEach(r => {
      const d   = new Date(r.date + 'T00:00:00');
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { ish: 0, kb: [], personH: 0, padosh: 0 };
      if (r.ish_soati != null) map[key].ish += Number(r.ish_soati);
      if (r.ish_soati != null && r.hodim_soni != null) {
        map[key].personH += Number(r.ish_soati) * Number(r.hodim_soni);
      }
      if (r.padosh_soni != null) map[key].padosh += Number(r.padosh_soni);
    });
    const months = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
    const keys = Object.keys(map).sort();
    labels          = keys.map(k => { const [y, m] = k.split('-'); return months[parseInt(m) - 1] + ' ' + y; });
    ishSoatiVals    = keys.map(k => map[k].ish);
    kishiBoshigaVals = keys.map(k => map[k].personH > 0 ? Math.round(map[k].padosh / map[k].personH) : 0);
  } else {
    const DAY_ABBR = ['Du','Se','Ch','Pa','Ju','Sh','Ya'];
    const week     = _bolimWeekOffset === 0 ? _yqCurrentWeek() : _yqPrevWeek();
    const isCur    = _bolimWeekOffset === 0;
    if (weekRange) weekRange.textContent = (isCur ? 'Joriy hafta: ' : 'Oldingi hafta: ') + _yqFmtDay(week.start) + ' – ' + _yqFmtDay(week.end);
    if (toggleWrap) toggleWrap.style.display = '';
    if (toggleBtn)  toggleBtn.textContent = isCur ? '← Oldingi hafta' : 'Joriy hafta →';

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(week.start);
      d.setDate(week.start.getDate() + i);
      days.push(d);
    }
    labels = days.map((d, i) => DAY_ABBR[i] + ' ' + d.getDate());

    ishSoatiVals    = days.map(d => {
      const ds  = _yqLocalDateStr(d);
      const rec = data.find(r => r.date === ds);
      return rec && rec.ish_soati != null ? Number(rec.ish_soati) : 0;
    });
    kishiBoshigaVals = days.map(d => {
      const ds  = _yqLocalDateStr(d);
      const rec = data.find(r => r.date === ds);
      return rec && rec.kishi_boshiga != null ? Number(rec.kishi_boshiga) : 0;
    });
  }

  charts['bolim'] = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Ish soati', data: ishSoatiVals,     borderColor: '#4f8ef7', backgroundColor: '#4f8ef722', tension: 0.35, fill: true,  pointRadius: 3, pointBackgroundColor: '#4f8ef7', borderWidth: 2, yAxisID: 'y' },
        { label: 'Kishi boshiga padosh', data: kishiBoshigaVals, borderColor: '#ff9f43', backgroundColor: '#ff9f4322', tension: 0.35, fill: true, pointRadius: 3, pointBackgroundColor: '#ff9f43', borderWidth: 2, yAxisID: 'y1' },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: true, labels: { color: '#9da3b4', font: { size: 11 }, boxWidth: 12 } } },
      scales: {
        x:  { grid: { color: GRID }, ticks: { color: TC, font: { size: 10 } } },
        y:  { grid: { color: GRID }, ticks: { color: TC, font: { size: 10 } }, beginAtZero: true, position: 'left',
              title: { display: true, text: 'Ish soati', color: '#4f8ef7', font: { size: 10 } } },
        y1: { grid: { display: false }, ticks: { color: TC, font: { size: 10 } }, beginAtZero: true, position: 'right',
              title: { display: true, text: 'Kishi boshiga', color: '#ff9f43', font: { size: 10 } } },
      }
    }
  });
}

// ── YAMCHIQ PAGE ─────────────────────────────────────────────
let _yamchiqData = [];
let _yamchiqMode = 'oylik';
let _yamchiqWeekOffset = 0; // 0=joriy hafta, 1=oldingi hafta
let _yamchiqTableFilter = 'oylik';

function setYamchiqTableFilter(mode) {
  _yamchiqTableFilter = mode;
  _renderYamchiqContent();
}

async function renderYamchiqPage() {
  const el = document.getElementById('page-yamchiq');
  el.innerHTML = '<p style="color:var(--text2);padding:20px">Yuklanmoqda...</p>';
  try {
    _yamchiqData = await apiGetYamchiqRecords() || [];
  } catch (e) {
    _yamchiqData = [];
  }
  _renderYamchiqContent();
}

function _renderYamchiqContent() {
  const el     = document.getElementById('page-yamchiq');
  const accent = '#ff9f43';
  const now    = new Date();
  const jami   = _yamchiqData.reduce((s, r) => s + (r.mahsulot_soni || 0), 0);
  const qayta  = _yamchiqData.reduce((s, r) => s + (r.qayta_yamalgan || 0), 0);
  const oyJami  = _yamchiqData.filter(r => {
    const d = new Date(r.date + 'T00:00:00');
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).reduce((s, r) => s + (r.mahsulot_soni || 0), 0);
  const oyQayta = _yamchiqData.filter(r => {
    const d = new Date(r.date + 'T00:00:00');
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).reduce((s, r) => s + (r.qayta_yamalgan || 0), 0);

  el.innerHTML = `
    <div class="cat-hdr" style="border-left-color:${accent}">
      <div class="cat-hdr-ico" style="background:${accent}1a;color:${accent}">
        <i class="fas fa-check-circle" style="font-size:22px"></i>
      </div>
      <div>
        <h2 style="color:${accent}">Yamalab chiqilgan brak</h2>
        <p>Jami <strong style="color:${accent}">${jami}</strong> ta yamalab chiqilgan</p>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">
      <div class="kpi o"><div class="kpi-ico"><i class="fas fa-check-double"></i></div>
        <div class="kpi-lbl">Jami yamalgan soni</div>
        <div class="kpi-val">${jami}</div>
        <div class="kpi-sub">Barcha vaqt davomida</div>
      </div>
      <div class="kpi o"><div class="kpi-ico"><i class="fas fa-redo"></i></div>
        <div class="kpi-lbl">Qayta yamalganlar soni</div>
        <div class="kpi-val">${qayta}</div>
        <div class="kpi-sub">Barcha vaqt davomida</div>
      </div>
      <div class="kpi o"><div class="kpi-ico"><i class="fas fa-calendar-alt"></i></div>
        <div class="kpi-lbl">Bu oy yamalgan soni</div>
        <div class="kpi-val">${oyJami}</div>
        <div class="kpi-sub">Joriy oy</div>
      </div>
      <div class="kpi o"><div class="kpi-ico"><i class="fas fa-calendar-check"></i></div>
        <div class="kpi-lbl">Bu oy qayta yamalgan padoshlar</div>
        <div class="kpi-val">${oyQayta}</div>
        <div class="kpi-sub">Joriy oy</div>
      </div>
    </div>
    <div class="fcard" style="margin-bottom:22px;max-width:100%">
      <div class="succ-msg" id="yamchiqSuccMsg" style="display:none"><i class="fas fa-check-circle"></i>&nbsp; Muvaffaqiyatli saqlandi!</div>
      <div class="fgrid">
        <div>
          <label class="flbl">Sana</label>
          <input type="date" class="fi" id="yqDate">
        </div>
        <div>
          <label class="flbl">Mahsulot soni</label>
          <input type="number" class="fi" id="yqMahsulot" min="1" placeholder="Miqdorni kiriting">
        </div>
        <div style="grid-column:1/-1">
          <label class="flbl">Qayta yamalgan padosh</label>
          <input type="number" class="fi" id="yqQayta" min="0" placeholder="Qayta yamalgan soni">
        </div>
      </div>
      <div style="margin-top:16px">
        <button class="btn-save" onclick="saveYamchiqRecord()"><i class="fas fa-save"></i> Saqlash</button>
      </div>
    </div>
    <div class="tcard" style="margin-bottom:22px">
      <div class="thead">
        <div>
          <div class="thead-t">So'nggi yozuvlar</div>
          <div class="thead-s">Yamalab chiqilgan brak</div>
        </div>
        <div class="trend-tabs">
          <button class="ttab${_yamchiqTableFilter==='oylik'?' active':''}" onclick="setYamchiqTableFilter('oylik')">Oylik</button>
          <button class="ttab${_yamchiqTableFilter==='haftalik'?' active':''}" onclick="setYamchiqTableFilter('haftalik')">Haftalik</button>
        </div>
      </div>
      <table>
        <thead><tr><th>Sana</th><th>Mahsulot soni</th><th>Qayta yamalgan padosh</th></tr></thead>
        <tbody id="yqRecTb"></tbody>
      </table>
    </div>
    <div class="ccard">
      <div class="ch">
        <div>
          <div class="ch-t">Yamalgan dinamikasi</div>
          <div class="ch-s" id="yqWeekRange" style="margin-top:2px"></div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <div id="yqWeekToggleWrap" style="display:none">
            <button id="yqWeekToggleBtn" class="ttab" onclick="toggleYamchiqWeek()" style="font-size:11px;padding:4px 10px"></button>
          </div>
          <div class="trend-tabs">
            <button class="ttab${_yamchiqMode === 'haftalik' ? ' active' : ''}" id="yqTab-haftalik" onclick="setYamchiqMode('haftalik')">Haftalik</button>
            <button class="ttab${_yamchiqMode === 'oylik'    ? ' active' : ''}" id="yqTab-oylik"    onclick="setYamchiqMode('oylik')">Oylik</button>
          </div>
        </div>
      </div>
      <div class="cbox"><canvas id="cYamchiq"></canvas></div>
    </div>`;

  document.getElementById('yqDate').value = todayLocal();

  // Fill So'nggi yozuvlar table
  const yqFiltered = _yamchiqTableFilter === 'haftalik'
    ? _yamchiqData.filter(r => _dateInThisWeek(r.date))
    : _yamchiqData.filter(r => _dateInThisMonth(r.date));
  const yqRecent = [...yqFiltered].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50);
  const yqTb = document.getElementById('yqRecTb');
  if (yqTb) {
    yqTb.innerHTML = yqRecent.length
      ? yqRecent.map(r => `<tr><td>${fmtDate(r.date)}</td><td>${r.mahsulot_soni ?? '—'}</td><td>${r.qayta_yamalgan ?? '—'}</td></tr>`).join('')
      : `<tr><td colspan="3" class="empty">Bu davrda yozuvlar yo'q</td></tr>`;
  }

  _renderYamchiqChart();
}

function setYamchiqMode(mode) {
  _yamchiqMode = mode;
  _yamchiqWeekOffset = 0;
  ['oylik', 'haftalik'].forEach(m => {
    const btn = document.getElementById('yqTab-' + m);
    if (btn) btn.classList.toggle('active', m === mode);
  });
  _renderYamchiqChart();
}

function toggleYamchiqWeek() {
  _yamchiqWeekOffset = _yamchiqWeekOffset === 0 ? 1 : 0;
  _renderYamchiqChart();
}

function _yqCurrentWeek() {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = (day === 0) ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

function _yqPrevWeek() {
  const { start, end } = _yqCurrentWeek();
  const prevStart = new Date(start);
  prevStart.setDate(start.getDate() - 7);
  const prevEnd = new Date(end);
  prevEnd.setDate(end.getDate() - 7);
  return { start: prevStart, end: prevEnd };
}

function _yqFmtDay(d) {
  return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0');
}

function _yqLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function _renderYamchiqChart() {
  destroyC('yamchiq');
  const canvas = document.getElementById('cYamchiq');
  if (!canvas) return;
  const data = _yamchiqData;
  const weekRange = document.getElementById('yqWeekRange');
  let labels = [], mahsulotVals = [], qaytaVals = [], datasets = [];

  if (_yamchiqMode === 'oylik') {
    if (weekRange) weekRange.textContent = "Vaqt bo'yicha tahlil";
    const tw = document.getElementById('yqWeekToggleWrap');
    if (tw) tw.style.display = 'none';
    const map = {};
    data.forEach(r => {
      const d   = new Date(r.date + 'T00:00:00');
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { m: 0, q: 0 };
      map[key].m += r.mahsulot_soni || 0;
      map[key].q += r.qayta_yamalgan || 0;
    });
    const months = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
    const keys = Object.keys(map).sort();
    labels       = keys.map(k => { const [y, m] = k.split('-'); return months[parseInt(m) - 1] + ' ' + y; });
    mahsulotVals = keys.map(k => map[k].m);
    qaytaVals    = keys.map(k => map[k].q);
    datasets = [
      { label: 'Yamalgan',      data: mahsulotVals, borderColor: '#ff9f43', backgroundColor: '#ff9f4322', tension: 0.35, fill: true, pointRadius: 3, pointBackgroundColor: '#ff9f43', borderWidth: 2 },
      { label: 'Qayta yamalgan', data: qaytaVals,   borderColor: '#4f8ef7', backgroundColor: '#4f8ef722', tension: 0.35, fill: true, pointRadius: 3, pointBackgroundColor: '#4f8ef7', borderWidth: 2 },
    ];
  } else {
    const DAY_ABBR = ['Du','Se','Ch','Pa','Ju','Sh','Ya'];
    const week = _yamchiqWeekOffset === 0 ? _yqCurrentWeek() : _yqPrevWeek();
    const isCurrent = _yamchiqWeekOffset === 0;

    if (weekRange) {
      weekRange.textContent = (isCurrent ? 'Joriy hafta: ' : 'Oldingi hafta: ')
        + _yqFmtDay(week.start) + ' – ' + _yqFmtDay(week.end);
    }
    const toggleWrap = document.getElementById('yqWeekToggleWrap');
    const toggleBtn  = document.getElementById('yqWeekToggleBtn');
    if (toggleWrap) toggleWrap.style.display = '';
    if (toggleBtn)  toggleBtn.textContent = isCurrent ? '← Oldingi hafta' : 'Joriy hafta →';

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(week.start);
      d.setDate(week.start.getDate() + i);
      days.push(d);
    }
    labels = days.map((d, i) => DAY_ABBR[i] + ' ' + d.getDate());

    function daySum(day, field) {
      const ds = _yqLocalDateStr(day);
      return data.filter(r => r.date === ds).reduce((s, r) => s + (r[field] || 0), 0);
    }

    mahsulotVals = days.map(d => daySum(d, 'mahsulot_soni'));
    qaytaVals    = days.map(d => daySum(d, 'qayta_yamalgan'));

    datasets = [
      { label: 'Yamalgan',      data: mahsulotVals, borderColor: '#ff9f43', backgroundColor: '#ff9f4322', tension: 0.35, fill: true, pointRadius: 3, pointBackgroundColor: '#ff9f43', borderWidth: 2 },
      { label: 'Qayta yamalgan', data: qaytaVals,   borderColor: '#4f8ef7', backgroundColor: '#4f8ef722', tension: 0.35, fill: true, pointRadius: 3, pointBackgroundColor: '#4f8ef7', borderWidth: 2 },
    ];
  }

  charts['yamchiq'] = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: true, labels: { color: '#9da3b4', font: { size: 11 }, boxWidth: 12 } } },
      scales: {
        x: { grid: { color: GRID }, ticks: { color: TC, font: { size: 10 } } },
        y: { grid: { color: GRID }, ticks: { color: TC, font: { size: 10 } }, beginAtZero: true }
      }
    }
  });
}

async function saveYamchiqRecord() {
  const date          = document.getElementById('yqDate').value;
  const mahsulot_soni = parseInt(document.getElementById('yqMahsulot').value);
  const qayta         = parseInt(document.getElementById('yqQayta').value) || 0;

  if (!date || !mahsulot_soni || mahsulot_soni < 1) {
    toast("Sana va mahsulot sonini to'ldiring.", 'e');
    return;
  }

  try {
    await apiPostYamchiqRecord({ date, mahsulot_soni, qayta_yamalgan: qayta });
    const succEl = document.getElementById('yamchiqSuccMsg');
    if (succEl) { succEl.style.display = 'flex'; setTimeout(() => { succEl.style.display = 'none'; }, 2000); }
    toast('Saqlandi!', 's');
    document.getElementById('yqMahsulot').value = '';
    document.getElementById('yqQayta').value    = '';
    _yamchiqData = await apiGetYamchiqRecords() || [];
    _renderYamchiqContent();
  } catch (err) {
    toast(err.message || 'Saqlashda xatolik', 'e');
  }
}

function renderCatPage(catId) {
  const cat     = CATS.find(c => c.id === catId);
  const allData = getData();
  const data    = allData.filter(r => r.cat === catId);
  const now  = new Date(); const today = todayLocal();

  const total      = data.reduce((s, r) => s + r.qty, 0);
  const monthTotal = data.filter(r => { const d = new Date(r.date + 'T00:00:00'); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); }).reduce((s, r) => s + r.qty, 0);
  const todayTotal = data.filter(r => r.date === today).reduce((s, r) => s + r.qty, 0);
  const ac = cat.accentCls;

  const allTimeTotal  = allData.reduce((s, r) => s + r.qty, 0);
  const allMonthTotal = allData.filter(r => { const d = new Date(r.date + 'T00:00:00'); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); }).reduce((s, r) => s + r.qty, 0);
  const pctTotal = allTimeTotal  > 0 ? (total      / allTimeTotal  * 100).toFixed(1) : '0.0';
  const pctMonth = allMonthTotal > 0 ? (monthTotal / allMonthTotal * 100).toFixed(1) : '0.0';

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
        <div class="kpi-lbl">Jami nuqsonlar</div><div class="kpi-val">${total}</div><div class="kpi-sub">Barcha vaqt davomida</div><div class="kpi-sub">${pctTotal}% — Barcha vaqt davomida jami brakdan</div></div>
      <div class="kpi ${ac}"><div class="kpi-ico"><i class="fas fa-calendar-alt"></i></div>
        <div class="kpi-lbl">Shu oyda</div><div class="kpi-val">${monthTotal}</div><div class="kpi-sub">Joriy oy natijalari</div><div class="kpi-sub">${pctMonth}% — Joriy oy jami brakdan</div></div>
      <div class="kpi ${ac}"><div class="kpi-ico"><i class="fas fa-clock"></i></div>
        <div class="kpi-lbl">Bugun</div><div class="kpi-val">${todayTotal}</div><div class="kpi-sub">Bugungi nuqsonlar</div></div>
    </div>
    <div class="g2" style="margin-bottom:16px">
      <div class="tcard" style="margin-bottom:0">
        <div class="thead">
          <div>
            <div class="thead-t">So'nggi yozuvlar</div>
            <div class="thead-s">${cat.label}</div>
          </div>
          ${['qayta','yamala','orta'].includes(catId) ? `<div class="trend-tabs">
            <button class="ttab${(_catTableFilter[catId]||'oylik')==='oylik'?' active':''}" onclick="setCatTableFilter('${catId}','oylik')">Oylik</button>
            <button class="ttab${(_catTableFilter[catId]||'oylik')==='haftalik'?' active':''}" onclick="setCatTableFilter('${catId}','haftalik')">Haftalik</button>
          </div>` : ''}
        </div>
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

  const _ctf = _catTableFilter[catId];
  let recent;
  if (_ctf === 'haftalik') {
    recent = [...data].filter(r => _dateInThisWeek(r.date)).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50);
  } else if (_ctf === 'oylik') {
    recent = [...data].filter(r => _dateInThisMonth(r.date)).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50);
  } else {
    recent = [...data].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  }
  const tb = document.getElementById('catTb-' + catId);
  if (!recent.length) {
    tb.innerHTML = `<tr><td colspan="4" class="empty">${_ctf ? "Bu davrda yozuvlar yo'q" : "Bu turkumda yozuvlar yo'q."}</td></tr>`;
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

// ── CAT TABLE FILTER (yamala, orta) ──────────────────────────
const _catTableFilter = { qayta: 'oylik', yamala: 'oylik', orta: 'oylik' };

function setCatTableFilter(catId, mode) {
  _catTableFilter[catId] = mode;
  renderCatPage(catId);
}

function _dateInThisWeek(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return date >= monday && date <= sunday;
}

function _dateInThisMonth(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
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
      <td style="color:var(--text2);font-size:12px">${fmtDate(u.created_at ? ymdLocal(new Date(u.created_at)) : null)}</td>
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

// ── HISTOGRAMMA MODULE ───────────────────────────────────────
let _histData    = [];
let _histMat        = null;
let _histNonAdmin2Razmer = null;
let _histGrammCache    = {};
let _histModelsCache   = {};
let _histSelectedSizes  = [];
let _histSizeConfigCache = {};
const _HIST_SIZES        = [35,36,37,38,39,40,41,42,43,44,45,46,47];
let _histPUMode      = 'oylik';
let _histTEPMode = 'oylik';
let _histPUModel  = '';
let _histTEPModel = '';

function _isHistAdmin2() { return getCurrentUser()?.username === 'admin2'; }
function _isHistAdmin()  { return getCurrentUser()?.username === 'admin'; }

function renderHistSizeBtns() {
  const box = document.getElementById('hSizeBtnRow');
  if (!box) return;
  box.innerHTML = _HIST_SIZES.map(s =>
    `<button type="button" class="hist-size-btn${_histSelectedSizes.includes(s) ? ' active' : ''}" onclick="toggleHistSize(${s})">${s}</button>`
  ).join('');
}

function renderHistSizesDisplay() {
  const el = document.getElementById('hSizeDisplay');
  if (!el) return;
  el.textContent = _histSelectedSizes.length
    ? _histSelectedSizes.length + ' ta razmer tanlangan'
    : '';
}

function toggleHistSize(s) {
  const idx = _histSelectedSizes.indexOf(s);
  if (idx >= 0) _histSelectedSizes.splice(idx, 1);
  else _histSelectedSizes.push(s);
  renderHistSizeBtns();
  renderHistSizesDisplay();
  renderHistSizeGramsInputs();
}

function renderHistSizeGramsInputs() {
  const box = document.getElementById('hSizeGramsTable');
  if (!box) return;
  if (!_histSelectedSizes.length) { box.style.display = 'none'; return; }
  box.style.display = 'block';
  const model = document.getElementById('hModel')?.value?.trim() || '';
  const mat   = _histMat || '';
  const existing = (_histSizeConfigCache[mat] || []).filter(r => r.model === model);
  const sorted = [..._histSelectedSizes].sort((a, b) => a - b);
  box.innerHTML = `
    <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">GRAMM DIAPAZONI (har bir razmer uchun)</div>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr>
        <th style="text-align:left;font-size:11px;color:var(--muted);padding:4px 8px;font-weight:600">RAZMER</th>
        <th style="text-align:left;font-size:11px;color:var(--muted);padding:4px 8px;font-weight:600">DAN</th>
        <th style="text-align:left;font-size:11px;color:var(--muted);padding:4px 8px;font-weight:600">GACHA</th>
      </tr></thead>
      <tbody>${sorted.map(s => {
        const ex = existing.find(r => r.size === s);
        return `<tr>
          <td style="padding:4px 8px;font-size:13px;font-weight:600;color:var(--blue)">${s}</td>
          <td style="padding:3px 4px"><input type="number" class="fi" id="hSizeMin-${s}" min="1" style="padding:6px 10px" placeholder="Dan" value="${ex ? ex.min_gram : ''}"></td>
          <td style="padding:3px 4px"><input type="number" class="fi" id="hSizeMax-${s}" min="1" style="padding:6px 10px" placeholder="Gacha" value="${ex ? ex.max_gram : ''}"></td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
}

function renderHistConfigTable() {
  if (!_isHistAdmin2()) return;
  const wrap = document.getElementById('histConfigTableWrap');
  if (!wrap) return;
  wrap.style.display = 'block';
  const sub = document.getElementById('histConfigTableSub');
  if (sub) sub.textContent = _histMat ? _histMat + " bo'yicha" : 'Barcha materiallar';
  const rows = _histMat
    ? (_histSizeConfigCache[_histMat] || []).map(r => ({ ...r, material_type: _histMat }))
    : [
        ...(_histSizeConfigCache['PU']  || []).map(r => ({ ...r, material_type: 'PU' })),
        ...(_histSizeConfigCache['TEP'] || []).map(r => ({ ...r, material_type: 'TEP' }))
      ];
  const tbody = document.getElementById('histConfigTbody');
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty">Hozircha saqlangan ma'lumot yo'q</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><span class="mbadge">${r.material_type}</span></td>
      <td>${r.model}</td>
      <td><span class="mbadge">${r.size}</span></td>
      <td>${r.min_gram}–${r.max_gram}</td>
      <td><button class="reason-add-btn" onclick="editHistConfig('${r.material_type}','${r.model.replace(/'/g, "\\'")}')"><i class="fas fa-edit"></i> Tahrirlash</button></td>
    </tr>`).join('');
}

function editHistConfig(material_type, model) {
  selectHistMat(material_type);
  document.getElementById('hModel').value = model;
  renderHistModelList(model);
  const configs = (_histSizeConfigCache[material_type] || []).filter(r => r.model === model);
  _histSelectedSizes = configs.map(r => r.size);
  document.getElementById('hGrammInputWrap').style.display = 'block';
  renderHistSizeBtns();
  renderHistSizesDisplay();
  renderHistSizeGramsInputs();
  document.getElementById('page-histogramma')?.scrollTo({ top: 0, behavior: 'smooth' });
}

function _applyHistRoles() {
  const isA2   = _isHistAdmin2();
  const addBtn = document.getElementById('hModelAddBtn');
  if (addBtn) addBtn.style.display = isA2 ? '' : 'none';
  const dateWrap = document.getElementById('hDateWrap');
  if (dateWrap) dateWrap.style.display = isA2 ? 'none' : '';
}

function setHistModelFilter(material, model) {
  if (material === 'PU') _histPUModel = model;
  else _histTEPModel = model;
  _renderHistCharts();
}

function _refreshHistModelSelects() {
  ['PU', 'TEP'].forEach(mat => {
    const sel = document.getElementById('histModelSel-' + mat);
    if (!sel) return;
    const cur    = mat === 'PU' ? _histPUModel : _histTEPModel;
    const models = (_histModelsCache[mat] || []).map(r => r.model);
    sel.innerHTML = '<option value="">Barcha modellar</option>' +
      models.map(m => `<option value="${m}"${m === cur ? ' selected' : ''}>${m}</option>`).join('');
  });
}

function _getHistCustomModels(mat) {
  try { return JSON.parse(localStorage.getItem('hist_models_' + mat) || '[]'); } catch { return []; }
}
function _saveHistCustomModel(mat, name) {
  const list = _getHistCustomModels(mat);
  if (!list.includes(name)) {
    list.push(name);
    localStorage.setItem('hist_models_' + mat, JSON.stringify(list));
  }
}
function _getAllHistModels(mat) {
  return [...new Set([...(HIST_MODELS[mat] || []), ..._getHistCustomModels(mat)])];
}

function _getHistGrams(mat, model) {
  try { return JSON.parse(localStorage.getItem('hist_grams_' + mat + '_' + model) || '[]'); } catch { return []; }
}
function _saveHistGram(mat, model, gram) {
  const list = _getHistGrams(mat, model);
  if (!list.includes(String(gram))) { list.push(String(gram)); localStorage.setItem('hist_grams_' + mat + '_' + model, JSON.stringify(list)); }
}
function _renderGramSelect(mat, model) {
  const grams = _getHistGrams(mat, model);
  const sel   = document.getElementById('hGram');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Grammni tanlang —</option>' +
    grams.map(g => `<option value="${g}">${g} gr</option>`).join('');
}

function onHistGramChange() {
  const val = document.getElementById('hGram').value;
  document.getElementById('hMiqdorWrap').style.display = val ? 'block' : 'none';
  const saveBtn = document.getElementById('histSaveBtn');
  if (saveBtn) saveBtn.style.display = val ? 'flex' : 'none';
}

function toggleGramAdd() {
  const row = document.getElementById('hGramAddRow');
  if (!row) return;
  const open = row.style.display === 'block';
  row.style.display = open ? 'none' : 'block';
  if (!open) { const inp = document.getElementById('hNewGram'); if (inp) inp.value = ''; }
}

function addHistCustomGram() {
  if (!_histMat) return;
  const model = document.getElementById('hModel').value.trim();
  const gram  = document.getElementById('hNewGram').value.trim();
  if (!model) { toast("Avval model tanlang.", 'e'); return; }
  if (!gram || isNaN(parseFloat(gram)) || parseFloat(gram) < 1) { toast("Gramm qiymatini kiriting.", 'e'); return; }
  _saveHistGram(_histMat, model, gram);
  _renderGramSelect(_histMat, model);
  document.getElementById('hGram').value = gram;
  document.getElementById('hGramAddRow').style.display = 'none';
  document.getElementById('hNewGram').value = '';
  onHistGramChange();
  toast("Gramm qo'shildi!", 's');
}

function renderNonAdmin2RazmerPick(model) {
  const box = document.getElementById('hRazmerPickList');
  if (!box) return;
  const configs = (_histSizeConfigCache[_histMat] || []).filter(r => r.model === model);
  if (!configs.length) {
    box.innerHTML = '<div style="padding:10px 13px;color:var(--muted);font-size:13px">Razmerlar aniqlanmagan</div>';
    return;
  }
  const sizes = [...new Set(configs.map(r => r.size))].sort((a, b) => a - b);
  box.innerHTML = sizes.map(s =>
    `<div class="hist-model-item" onclick="selectNonAdmin2Razmer(${s})">${s}</div>`
  ).join('');
}

function selectNonAdmin2Razmer(size) {
  _histNonAdmin2Razmer = size;
  const model = document.getElementById('hModel').value.trim();
  const configs = (_histSizeConfigCache[_histMat] || []).filter(r => r.model === model);
  const cfg = configs.find(r => r.size === size);

  const box = document.getElementById('hRazmerPickList');
  if (box) {
    box.querySelectorAll('.hist-model-item').forEach(el => {
      el.classList.toggle('selected', parseInt(el.textContent) === size);
    });
  }

  document.getElementById('hGramWrap').style.display = 'block';
  const hGramInput = document.getElementById('hGramInput');
  if (hGramInput) hGramInput.value = '';
  const hGram = document.getElementById('hGram');
  if (hGram) hGram.value = '';
  const hint = document.getElementById('hGramStandartHint');
  if (hint) hint.textContent = cfg ? `Standart: ${cfg.min_gram}–${cfg.max_gram} gr` : '';
  document.getElementById('hMiqdorWrap').style.display = 'none';
  const saveBtn = document.getElementById('histSaveBtn');
  if (saveBtn) saveBtn.style.display = 'none';
}

function onHistGramFreeInput() {
  const hGramInput = document.getElementById('hGramInput');
  const hGram = document.getElementById('hGram');
  if (hGram && hGramInput) hGram.value = hGramInput.value;
  onHistGramChange();
}

function renderHistModelList(q) {
  const mat = _histMat || 'PU';
  const all = (_histModelsCache[mat] || []).map(r => r.model);
  const filtered = q ? all.filter(m => m.toLowerCase().includes(q.toLowerCase())) : all;
  const sel      = document.getElementById('hModel').value.trim();
  const box      = document.getElementById('hModelListBox');
  if (!box) return;
  box.innerHTML = filtered.map(m =>
    `<div class="hist-model-item${m === sel ? ' selected' : ''}" onclick="selectHistModelFromList('${m.replace(/'/g, "\\'")}')">${m}</div>`
  ).join('') || '<div style="padding:10px 13px;color:var(--muted);font-size:13px">Topilmadi</div>';
}

function selectHistModelFromList(model) {
  document.getElementById('hModel').value = model;
  renderHistModelList(model);
  if (_isHistAdmin2() && _histMat) {
    document.getElementById('hGrammInputWrap').style.display = 'block';
    document.getElementById('hGramWrap').style.display = 'none';
    document.getElementById('hMiqdorWrap').style.display = 'none';
    const saveBtn = document.getElementById('histSaveBtn');
    if (saveBtn) saveBtn.style.display = 'none';
    const configs = (_histSizeConfigCache[_histMat] || []).filter(r => r.model === model);
    _histSelectedSizes = configs.map(r => r.size);
    renderHistSizeBtns();
    renderHistSizesDisplay();
    renderHistSizeGramsInputs();
  } else if (_histMat) {
    document.getElementById('hGrammInputWrap').style.display = 'none';
    document.getElementById('hGramWrap').style.display = 'none';
    document.getElementById('hMiqdorWrap').style.display = 'none';
    const saveBtn = document.getElementById('histSaveBtn');
    if (saveBtn) saveBtn.style.display = 'none';
    _histNonAdmin2Razmer = null;
    const hGram = document.getElementById('hGram');
    if (hGram) hGram.value = '';
    const hGramInput = document.getElementById('hGramInput');
    if (hGramInput) hGramInput.value = '';
    const hint = document.getElementById('hGramStandartHint');
    if (hint) hint.textContent = '';
    const razmerWrap = document.getElementById('hRazmerPickWrap');
    if (razmerWrap) razmerWrap.style.display = 'block';
    renderNonAdmin2RazmerPick(model);
  }
}

function setupHistogramma() {
  document.getElementById('hDate').value = todayLocal();
  document.getElementById('hModelWrap').style.display  = 'none';
  document.getElementById('hGramWrap').style.display   = 'none';
  document.getElementById('hMiqdorWrap').style.display = 'none';
  const hGrammInputWrap = document.getElementById('hGrammInputWrap');
  if (hGrammInputWrap) hGrammInputWrap.style.display = 'none';
  const hRazmerPickWrap = document.getElementById('hRazmerPickWrap');
  if (hRazmerPickWrap) hRazmerPickWrap.style.display = 'none';
  const hGramInput = document.getElementById('hGramInput');
  if (hGramInput) hGramInput.value = '';
  const hGramStandartHint = document.getElementById('hGramStandartHint');
  if (hGramStandartHint) hGramStandartHint.textContent = '';
  _histNonAdmin2Razmer = null;
  const hSizeGramsTable = document.getElementById('hSizeGramsTable');
  if (hSizeGramsTable) hSizeGramsTable.style.display = 'none';
  const saveBtn = document.getElementById('histSaveBtn');
  if (saveBtn) saveBtn.style.display = 'none';
  document.getElementById('hModel').value  = '';
  document.getElementById('hMiqdor').value = '';
  const hGram = document.getElementById('hGram');
  if (hGram) hGram.value = '';
  document.getElementById('histSuccMsg').style.display = 'none';
  document.querySelectorAll('.hist-mat-btn').forEach(b => b.classList.remove('active'));
  _histMat = null;
  _histSelectedSizes = [];
  renderHistSizeBtns();
  renderHistSizesDisplay();
  _applyHistRoles();
  renderHistConfigTable();
}

function selectHistMat(mat) {
  _histMat = mat;
  document.querySelectorAll('.hist-mat-btn').forEach(b =>
    b.classList.toggle('active', b.id === 'hMatBtn-' + mat)
  );
  document.getElementById('hModel').value  = '';
  document.getElementById('hMiqdor').value = '';
  const hGram = document.getElementById('hGram');
  if (hGram) hGram.value = '';
  document.getElementById('hModelWrap').style.display  = 'block';
  document.getElementById('hGramWrap').style.display   = 'none';
  document.getElementById('hMiqdorWrap').style.display = 'none';
  const hGrammInputWrap = document.getElementById('hGrammInputWrap');
  if (hGrammInputWrap) hGrammInputWrap.style.display = 'none';
  const hRazmerPickWrap2 = document.getElementById('hRazmerPickWrap');
  if (hRazmerPickWrap2) hRazmerPickWrap2.style.display = 'none';
  const hGramInput2 = document.getElementById('hGramInput');
  if (hGramInput2) hGramInput2.value = '';
  const hGramStandartHint2 = document.getElementById('hGramStandartHint');
  if (hGramStandartHint2) hGramStandartHint2.textContent = '';
  _histNonAdmin2Razmer = null;
  const hSizeGramsTable2 = document.getElementById('hSizeGramsTable');
  if (hSizeGramsTable2) hSizeGramsTable2.style.display = 'none';
  const saveBtn = document.getElementById('histSaveBtn');
  if (saveBtn) saveBtn.style.display = 'none';
  _histSelectedSizes = [];
  renderHistSizeBtns();
  renderHistSizesDisplay();
  renderHistModelList('');
  fetchAndCacheModels(mat);
  _applyHistRoles();
  renderHistConfigTable();
}

function onHistModelInput() {
  renderHistModelList(document.getElementById('hModel').value.trim());
}

function addHistCustomModel() {
  const val = document.getElementById('hModel').value.trim();
  if (!val || !_histMat) { toast("Model nomini kiriting.", 'e'); return; }
  selectHistModelFromList(val);
}

async function saveHistogramma() {
  const date          = document.getElementById('hDate').value;
  const material_type = _histMat;
  const model         = document.getElementById('hModel').value.trim();
  const gram          = document.getElementById('hGram').value.trim();
  const qty           = parseInt(document.getElementById('hMiqdor').value);

  if (!date || !material_type || !model || !gram || !qty || qty < 1) {
    toast("Barcha maydonlarni to'ldiring.", 'e');
    return;
  }
  if (!_histNonAdmin2Razmer) {
    toast("Razmerni tanlang.", 'e');
    return;
  }

  try {
    await apiPostHistogramma({ date, material_type, model, razmer: _histNonAdmin2Razmer, qty, gramm: parseInt(gram) });
    const succEl = document.getElementById('histSuccMsg');
    succEl.style.display = 'flex';
    toast('Saqlandi!', 's');
    setTimeout(() => { succEl.style.display = 'none'; }, 2000);
    _histData = await apiGetHistogramma() || [];
    _renderHistCharts();
    document.getElementById('hMiqdor').value = '';
    document.getElementById('hGram').value   = '';
    const hGramInput = document.getElementById('hGramInput');
    if (hGramInput) hGramInput.value = '';
    document.getElementById('hMiqdorWrap').style.display = 'none';
    const saveBtn = document.getElementById('histSaveBtn');
    if (saveBtn) saveBtn.style.display = 'none';
  } catch (err) {
    toast(err.message || 'Saqlashda xatolik', 'e');
  }
}

async function saveHistSizeGrams() {
  if (!_isHistAdmin2()) return;
  const material_type = _histMat;
  const model         = document.getElementById('hModel').value.trim();

  if (!material_type || !model) {
    toast("Material turi va modelni tanlang.", 'e');
    return;
  }
  if (!_histSelectedSizes.length) {
    toast("Kamida bitta razmer tanlang.", 'e');
    return;
  }

  const sizes = [];
  for (const s of [..._histSelectedSizes].sort((a, b) => a - b)) {
    const minVal = document.getElementById('hSizeMin-' + s)?.value || '';
    const maxVal = document.getElementById('hSizeMax-' + s)?.value || '';
    const minInt = parseInt(minVal), maxInt = parseInt(maxVal);
    if (!minVal || isNaN(minInt) || minInt <= 0) {
      toast(`${s} razmer: dan gramm 0 dan katta bo'lishi kerak.`, 'e');
      return;
    }
    if (!maxVal || isNaN(maxInt) || maxInt < minInt) {
      toast(`${s} razmer: gacha gramm dan grammdan katta yoki teng bo'lishi kerak.`, 'e');
      return;
    }
    sizes.push({ size: s, min_gram: minInt, max_gram: maxInt });
  }

  try {
    await apiPostSizeGrams(material_type, model, sizes);
    // Update size config cache
    const otherEntries = (_histSizeConfigCache[material_type] || []).filter(r => r.model !== model);
    const newEntries   = sizes.map(s => ({ model, size: s.size, min_gram: s.min_gram, max_gram: s.max_gram }));
    _histSizeConfigCache[material_type] = [...otherEntries, ...newEntries];
    // Update _histModelsCache overall range for non-admin2 gramm picker
    const overallMin = Math.min(...sizes.map(s => s.min_gram));
    const overallMax = Math.max(...sizes.map(s => s.max_gram));
    const modelCache = _histModelsCache[material_type] || [];
    const mIdx = modelCache.findIndex(r => r.model === model);
    if (mIdx >= 0) { modelCache[mIdx].min_gram = overallMin; modelCache[mIdx].max_gram = overallMax; }
    else { modelCache.push({ model, min_gram: overallMin, max_gram: overallMax }); modelCache.sort((a, b) => a.model.localeCompare(b.model)); }
    _histModelsCache[material_type] = modelCache;

    toast('Saqlandi!', 's');
    document.getElementById('hGrammInputWrap').style.display = 'none';
    document.getElementById('hModel').value = '';
    const hSizeGramsTable = document.getElementById('hSizeGramsTable');
    if (hSizeGramsTable) hSizeGramsTable.style.display = 'none';
    _histSelectedSizes = [];
    renderHistSizeBtns();
    renderHistSizesDisplay();
    renderHistModelList('');
    renderHistConfigTable();
  } catch (err) {
    toast(err.message || 'Saqlashda xatolik', 'e');
  }
}

async function fetchAndCacheModels(mat) {
  try {
    const [models, sizeConfigs] = await Promise.all([apiGetModelGrams(mat), apiGetSizeGrams(mat)]);
    _histModelsCache[mat]     = Array.isArray(models)      ? models      : [];
    _histSizeConfigCache[mat] = Array.isArray(sizeConfigs) ? sizeConfigs : [];
  } catch {
    _histModelsCache[mat]     = [];
    _histSizeConfigCache[mat] = [];
  }
  renderHistModelList('');
  renderHistConfigTable();
}

function renderHistGrammSelectList(min_gram, max_gram, q) {
  const box = document.getElementById('hGrammSelectList');
  if (!box) return;
  if (min_gram == null || max_gram == null) {
    box.innerHTML = '<div style="padding:10px 13px;color:var(--muted);font-size:13px">Gramm diapazoni aniqlanmagan</div>';
    return;
  }
  const cur = document.getElementById('hGram')?.value || '';
  const all = [];
  for (let g = min_gram; g <= max_gram; g++) all.push(g);
  const filtered = q ? all.filter(g => String(g).startsWith(q)) : all;
  if (!filtered.length) {
    box.innerHTML = '<div style="padding:10px 13px;color:var(--muted);font-size:13px">Gramm qiymatlari topilmadi</div>';
    return;
  }
  box.innerHTML = filtered.map(g =>
    `<div class="hist-model-item${String(g) === cur ? ' selected' : ''}" onclick="selectHistGrammFromList(${g})">${g} gr</div>`
  ).join('');
}

function filterHistGrammList() {
  const model  = document.getElementById('hModel')?.value?.trim() || '';
  const cached = (_histModelsCache[_histMat] || []).find(r => r.model === model);
  const q      = (document.getElementById('hGrammSearch')?.value || '').trim();
  renderHistGrammSelectList(cached ? cached.min_gram : null, cached ? cached.max_gram : null, q);
}

function selectHistGrammFromList(gramm) {
  const hGram = document.getElementById('hGram');
  if (hGram) hGram.value = String(gramm);
  const model  = document.getElementById('hModel')?.value?.trim() || '';
  const cached = (_histModelsCache[_histMat] || []).find(r => r.model === model);
  renderHistGrammSelectList(cached ? cached.min_gram : null, cached ? cached.max_gram : null,
    (document.getElementById('hGrammSearch')?.value || '').trim());
  onHistGramChange();
}

function setHistMode(material, mode) {
  if (material === 'PU') _histPUMode = mode;
  else _histTEPMode = mode;
  ['oylik', 'haftalik'].forEach(m => {
    const btn = document.getElementById('hist' + material + 'Tab-' + m);
    if (btn) btn.classList.toggle('active', m === mode);
  });
  _renderHistCharts();
}

async function renderHistogramma() {
  if (!localStorage.getItem('histogram_data_cleared_v2') && (_isHistAdmin2() || _isHistAdmin())) {
    localStorage.setItem('histogram_data_cleared_v2', '1');
    Object.keys(localStorage)
      .filter(k => k.startsWith('hist_models_') || k.startsWith('hist_grams_'))
      .forEach(k => localStorage.removeItem(k));
    try { await apiDeleteHistogramma(); } catch {}
  }
  try {
    _histData = await apiGetHistogramma() || [];
  } catch {
    _histData = _histData || [];
  }
  await Promise.all(['PU', 'TEP'].map(mat => fetchAndCacheModels(mat)));
  _refreshHistModelSelects();
  _renderHistCharts();
}

function _renderHistCharts() {
  const data = _histData;
  const now  = new Date();

  function filterByMode(mat, mode) {
    const modelFilter = mat === 'PU' ? _histPUModel : _histTEPModel;
    let matData = data.filter(r => r.material_type === mat && (!modelFilter || r.model === modelFilter));
    if (mode === 'haftalik') {
      const dow = now.getDay();
      const mon = new Date(now);
      mon.setDate(now.getDate() + (dow === 0 ? -6 : 1 - dow));
      mon.setHours(0, 0, 0, 0);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      const monStr = ymdLocal(mon), sunStr = ymdLocal(sun);
      return matData.filter(r => r.date >= monStr && r.date <= sunStr);
    }
    return matData.filter(r => {
      const d = new Date(r.date + 'T00:00:00');
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  }

  function aggregateByModel(filtered) {
    const map = {};
    filtered.forEach(r => {
      const key = r.model;
      if (!map[key]) map[key] = { qty: 0, grams: {} };
      map[key].qty += (parseInt(r.qty) || 1);
      const g = String(r.gram || '');
      map[key].grams[g] = (map[key].grams[g] || 0) + 1;
    });
    return Object.entries(map)
      .map(([model, d]) => ({
        model,
        qty: d.qty,
        gram: Object.entries(d.grams).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
      }))
      .sort((a, b) => b.qty - a.qty);
  }

  function makeBarLabelPlugin(entries) {
    return {
      id: 'histBarLabel',
      afterDatasetsDraw(chart) {
        const ctx = chart.ctx;
        chart.data.datasets.forEach((ds, i) => {
          chart.getDatasetMeta(i).data.forEach((bar, j) => {
            const e = entries[j]; if (!e || !e.qty) return;
            const lbl = e.gram ? `${e.qty} (${e.gram} gr)` : String(e.qty);
            ctx.save();
            ctx.fillStyle = 'rgba(228,228,248,.9)';
            ctx.font = 'bold 10px Segoe UI,sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(lbl, bar.x, bar.y - 3);
            ctx.restore();
          });
        });
      }
    };
  }

  function makeDeletePlugin(entryList, material) {
    const zones = [];
    return {
      id: 'histDel_' + material,
      afterDatasetsDraw(chart) {
        if (!_isHistAdmin2()) return;
        zones.length = 0;
        const ctx = chart.ctx;
        chart.getDatasetMeta(0).data.forEach((bar, j) => {
          const e = entryList[j];
          if (!e || !e.qty) return;
          const barH = bar.base - bar.y;
          if (barH < 20) return;
          const bw = 14, bh = 14;
          const bx = bar.x - bw / 2;
          const by = bar.y + 3;
          zones.push({ x: bx, y: by, w: bw, h: bh, model: e.model });
          ctx.save();
          ctx.fillStyle = 'rgba(255,71,87,.85)';
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 3);
          else { ctx.rect(bx, by, bw, bh); }
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.95)';
          ctx.font = 'bold 9px Segoe UI,sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('✕', bx + bw / 2, by + bh / 2);
          ctx.restore();
        });
      },
      afterEvent(chart, args) {
        if (!_isHistAdmin2() || args.event.type !== 'click') return;
        const { x, y } = args.event;
        for (const z of zones) {
          if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) {
            deleteHistModel(material, z.model);
            break;
          }
        }
      }
    };
  }

  function buildChart(material, canvasId, barColor, borderColor) {
    const mode     = material === 'PU' ? _histPUMode : _histTEPMode;
    const filtered = filterByMode(material, mode);
    destroyC('hist' + material);
    const canvas = document.getElementById(canvasId);
    const listEl = document.getElementById(material === 'PU' ? 'histListPU' : 'histListTEP');

    if (mode === 'haftalik') {
      const wkDays  = currentWeekDays();
      const dayQtys = wkDays.map(d => filtered.filter(r => r.date === d.date).reduce((s, r) => s + (parseInt(r.qty) || 1), 0));
      const dayEntr = wkDays.map((d, i) => ({ model: d.label, qty: dayQtys[i], gram: '' }));
      const hasData = dayQtys.some(v => v > 0);
      if (hasData && canvas) {
        charts['hist' + material] = new Chart(canvas.getContext('2d'), {
          type: 'bar',
          data: { labels: wkDays.map(d => d.label), datasets: [{ data: dayQtys,
            backgroundColor: barColor, borderColor: borderColor, borderWidth: 1, borderRadius: 6, borderSkipped: false
          }]},
          options: {
            responsive: true, maintainAspectRatio: false, layout: { padding: { top: 22 } },
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { color: GRID }, ticks: { color: TC, font: { size: 9 } } },
              y: { grid: { color: GRID }, ticks: { color: TC, font: { size: 10 }, precision: 0 }, beginAtZero: true }
            }
          },
          plugins: [makeBarLabelPlugin(dayEntr)]
        });
      }
      return;
    }

    const entries = aggregateByModel(filtered);
    if (entries.length && canvas) {
      charts['hist' + material] = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: entries.map(e => e.model),
          datasets: [{
            data: entries.map(e => e.qty),
            backgroundColor: barColor,
            borderColor: borderColor,
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { top: 22 } },
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: GRID }, ticks: { color: TC, font: { size: 9 }, maxRotation: 35 } },
            y: { grid: { color: GRID }, ticks: { color: TC, font: { size: 10 }, precision: 0 }, beginAtZero: true }
          }
        },
        plugins: _isHistAdmin2()
          ? [makeBarLabelPlugin(entries), makeDeletePlugin(entries, material)]
          : [makeBarLabelPlugin(entries)]
      });
    }
  }

  buildChart('PU',  'cHistPU',  'rgba(79,142,247,.75)', '#4f8ef7');
  buildChart('TEP', 'cHistTEP', 'rgba(46,213,115,.75)', '#2ed573');
}

async function deleteHistModel(material, model) {
  if (!_isHistAdmin2()) return;
  if (!confirm(`"${model}" modelining barcha ma'lumotlarini o'chirish?`)) return;
  try {
    await apiDeleteHistogrammaModel(material, model);
    _histData = _histData.filter(r => !(r.material_type === material && r.model === model));
    _renderHistCharts();
    toast("O'chirildi!", 's');
  } catch (err) {
    toast(err.message || "O'chirishda xatolik", 'e');
  }
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
