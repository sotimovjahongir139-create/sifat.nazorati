/* Sifat Nazorati — AI Analytics module (admin14 only) */
'use strict';

let _ai14History  = [];
let _ai14Analyzed = false;
let _ai14Analysis = null;
let _ai14ActiveTab = 'signals';

const AI14_TABS = [
  { id: 'signals',    icon: '🚨', label: 'Signallar'            },
  { id: 'forecast',   icon: '📈', label: 'Prognoz'              },
  { id: 'recs',       icon: '✅', label: 'Tavsiyalar'           },
  { id: 'rootcause',  icon: '🔍', label: 'Asosiy sabab tahlili' },
  { id: 'chat',       icon: '💬', label: 'AI bilan suhbat'      },
];

// ── SETUP ────────────────────────────────────────────────────

function setupAI14() {
  _ai14History  = [];
  _ai14Analyzed = false;
  _ai14Analysis = null;
  _ai14ActiveTab = 'signals';
  _ai14RenderShell();
}

function _ai14RenderShell() {
  const page = document.getElementById('page-ai14');
  if (!page) return;

  page.innerHTML = `
    <div class="ai14-header">
      <div class="ai14-header-left">
        <div class="ai14-header-icon"><i class="fas fa-brain"></i></div>
        <div>
          <h2>AI Analytics — Aqlli Tahlil Tizimi</h2>
          <p>Real vaqtdagi fabrika ma'lumotlarini statistik tahlil va Claude AI orqali chuqur o'rganing. Signallar, prognozlar, tavsiyalar va sabab tahlili.</p>
        </div>
      </div>
      <button class="ai14-run-btn" id="ai14RunBtn" onclick="ai14Run()">
        <i class="fas fa-play"></i> Tahlilni boshlash
      </button>
    </div>

    <div class="ai14-chips" id="ai14Chips" style="display:none"></div>

    <div class="ai14-tabs" id="ai14Tabs">
      ${AI14_TABS.map(t => `
        <div class="ai14-tab${t.id === _ai14ActiveTab ? ' active' : ''}"
             id="ai14Tab-${t.id}" onclick="ai14SwitchTab('${t.id}')">
          <span>${t.icon}</span><span>${t.label}</span>
          <span class="ai14-tab-badge" id="ai14Badge-${t.id}" style="display:none">0</span>
        </div>`).join('')}
    </div>

    ${AI14_TABS.map(t => `
      <div class="ai14-panel${t.id === _ai14ActiveTab ? ' active' : ''}" id="ai14Panel-${t.id}">
        <div class="ai14-placeholder"><div class="ai14-big-ico">${t.icon}</div>
          <p>${t.id === 'chat' ? 'Tahlilni boshlab, AI ga savollar bering' : 'Tahlilni boshlash uchun yuqoridagi tugmani bosing'}</p></div>
      </div>`).join('')}
  `;
}

function ai14SwitchTab(id) {
  _ai14ActiveTab = id;
  document.querySelectorAll('.ai14-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.ai14-panel').forEach(p => p.classList.remove('active'));
  const tab = document.getElementById('ai14Tab-' + id);
  const panel = document.getElementById('ai14Panel-' + id);
  if (tab)   tab.classList.add('active');
  if (panel) panel.classList.add('active');
}

// ── MAIN ANALYSIS RUN ────────────────────────────────────────

async function ai14Run() {
  const btn = document.getElementById('ai14RunBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Tahlil qilinmoqda...';

  // Show loading in all panels
  AI14_TABS.forEach(t => {
    if (t.id === 'chat') return;
    const p = document.getElementById('ai14Panel-' + t.id);
    if (p) p.innerHTML = `
      <div class="ai14-loading">
        <div class="ai14-spinner"></div>
        <p>Ma'lumotlar yig'ilmoqda va tahlil qilinmoqda...</p>
        <p class="sub">Statistik hisob-kitob va AI tahlili — 20–40 soniya</p>
      </div>`;
  });

  try {
    _ai14History = [];
    const result = await _ai14Fetch([]);

    _ai14Analyzed = true;
    _ai14Analysis = result.analysis;

    _ai14History = [
      { role: 'user',      content: "Ushbu ma'lumotlarni to'liq tahlil qil." },
      { role: 'assistant', content: result.text },
    ];

    // Parse AI text sections
    const sections = _ai14ParseSections(result.text);

    // Render each panel
    _ai14RenderSignals(_ai14Analysis, sections.signallar);
    _ai14RenderForecast(_ai14Analysis, sections.prognoz);
    _ai14RenderRecs(_ai14Analysis, sections.tavsiyalar);
    _ai14RenderRootCause(_ai14Analysis, sections.sabab);
    _ai14RenderChat();

    // Summary chips
    _ai14RenderChips(_ai14Analysis);

    // Tab badges
    const sigCount = (_ai14Analysis.signals || []).length;
    const critCount = (_ai14Analysis.signals || []).filter(s => s.severity === 'critical' || s.severity === 'high').length;
    _ai14SetBadge('signals',  critCount > 0 ? critCount : sigCount, critCount > 0);
    _ai14SetBadge('forecast', '', false);
    _ai14SetBadge('recs',     (_ai14Analysis.recommendations || []).length, false);

    btn.innerHTML = '<i class="fas fa-sync-alt"></i> Qayta tahlil qilish';
    btn.disabled  = false;
  } catch (e) {
    AI14_TABS.forEach(t => {
      if (t.id === 'chat') return;
      const p = document.getElementById('ai14Panel-' + t.id);
      if (p) p.innerHTML = `<div class="ai14-card"><div class="ai14-card-body" style="color:var(--red)"><i class="fas fa-exclamation-circle"></i> Xatolik: ${_ai14Esc(e.message || 'Ulanishda muammo')}</div></div>`;
    });
    btn.innerHTML = '<i class="fas fa-play"></i> Tahlilni boshlash';
    btn.disabled  = false;
  }
}

function _ai14SetBadge(tab, count, isRed) {
  const el = document.getElementById('ai14Badge-' + tab);
  if (!el) return;
  if (!count && count !== 0) { el.style.display = 'none'; return; }
  el.style.display = 'inline-flex';
  el.textContent   = count;
  el.className     = 'ai14-tab-badge' + (isRed ? '' : ' ok');
}

function _ai14RenderChips(analysis) {
  const wrap = document.getElementById('ai14Chips');
  if (!wrap || !analysis) return;
  const s = analysis.summary || {};
  wrap.style.display = 'flex';
  wrap.innerHTML = `
    <div class="ai14-chip ${s.criticalSignals > 0 ? 'sig-r' : 'sig-g'}">
      <span class="ai14-chip-ico">${s.criticalSignals > 0 ? '🚨' : '✅'}</span>
      <span class="ai14-chip-val">${s.criticalSignals}</span>
      <span class="ai14-chip-lbl">Kritik signal</span>
    </div>
    <div class="ai14-chip">
      <span class="ai14-chip-ico">📅</span>
      <span class="ai14-chip-val">${s.today_total ?? '—'}</span>
      <span class="ai14-chip-lbl">Bugun (dashboard)</span>
    </div>
    <div class="ai14-chip">
      <span class="ai14-chip-ico">📦</span>
      <span class="ai14-chip-val">${s.month_total ?? '—'}</span>
      <span class="ai14-chip-lbl">Bu oy (dashboard)</span>
    </div>
    <div class="ai14-chip">
      <span class="ai14-chip-ico">🏭</span>
      <span class="ai14-chip-val">${s.uniqueModels || 0}</span>
      <span class="ai14-chip-lbl">Model turi</span>
    </div>
    <div class="ai14-chip">
      <span class="ai14-chip-ico">🔍</span>
      <span class="ai14-chip-val">${s.uniqueReasons || 0}</span>
      <span class="ai14-chip-lbl">Sabab turi</span>
    </div>
    <div class="ai14-chip">
      <span class="ai14-chip-ico">📊</span>
      <span class="ai14-chip-val">${analysis.forecast?.trendLabel || '—'}</span>
      <span class="ai14-chip-lbl">Trend</span>
    </div>
  `;
}

// ── SECTION PARSERS ──────────────────────────────────────────

function _ai14ParseSections(text) {
  const out = { signallar: '', prognoz: '', tavsiyalar: '', sabab: '', xulosa: '' };
  const lines = text.split('\n');
  let cur = null;
  const buffers = { signallar: [], prognoz: [], tavsiyalar: [], sabab: [], xulosa: [] };

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (/signal|ogohlan/i.test(lower) && /^#{1,3}\s|^##/.test(line))  { cur = 'signallar'; continue; }
    if (/prognoz|bashorat|forecast/i.test(lower) && /^#{1,3}/.test(line)) { cur = 'prognoz'; continue; }
    if (/tavsiya|recommend/i.test(lower) && /^#{1,3}/.test(line))     { cur = 'tavsiyalar'; continue; }
    if (/sabab|root.?cause|ildi/i.test(lower) && /^#{1,3}/.test(line)){ cur = 'sabab'; continue; }
    if (/xulosa|summary|conclusion/i.test(lower) && /^#{1,3}/.test(line)) { cur = 'xulosa'; continue; }
    if (/^#{1,3}/.test(line)) { cur = null; }
    if (cur && buffers[cur] !== undefined) buffers[cur].push(line);
  }

  Object.keys(buffers).forEach(k => { out[k] = buffers[k].join('\n').trim(); });
  // fallback: full text for first section
  if (!out.signallar && !out.prognoz) out.signallar = text;
  return out;
}

// ── PANEL RENDERERS ──────────────────────────────────────────

function _ai14RenderSignals(analysis, aiText) {
  const panel   = document.getElementById('ai14Panel-signals');
  if (!panel) return;
  const signals = analysis?.signals || [];

  let html = '';

  if (signals.length === 0) {
    html += `<div class="ai14-card">
      <div class="ai14-card-head">🚨 Signallar</div>
      <div class="ai14-card-body">
        <div class="ai14-no-signals"><i class="fas fa-check-circle"></i> Hech qanday anomal signal aniqlanmadi — barcha ko'rsatkichlar me'yorda!</div>
      </div></div>`;
  } else {
    const sevIcon = { critical:'🔴', high:'🟠', medium:'🟡', low:'🟢' };
    html += `<div class="ai14-card">
      <div class="ai14-card-head">🚨 Aniqlangan Signallar (${signals.length} ta)</div>
      <div class="ai14-card-body">
        ${signals.map(s => `
          <div class="ai14-signal ${s.severity}">
            <div class="ai14-signal-ico">${sevIcon[s.severity] || '⚠️'}</div>
            <div class="ai14-signal-body">
              <div class="ai14-signal-msg">
                ${_ai14Esc(s.message)}
                <span class="ai14-sev-badge ${s.severity}">${_sevLabel(s.severity)}</span>
              </div>
              <div class="ai14-signal-meta">${s.type === 'anomaly' ? `${s.sigma}σ og'ish` : s.type === 'trend_up' ? `${s.streak} kunlik ko'tarilish` : s.type === 'week_over_week' ? `+${s.pct}% haftalik o'sish` : ''}</div>
            </div>
          </div>`).join('')}
      </div></div>`;
  }

  if (aiText) {
    html += `<div class="ai14-card">
      <div class="ai14-card-body">
        <div class="ai14-ai-label"><i class="fas fa-robot"></i> Claude AI tahlili</div>
        <div class="ai14-ai-text">${_ai14Md(aiText)}</div>
      </div></div>`;
  }

  panel.innerHTML = html;
}

function _ai14RenderForecast(analysis, aiText) {
  const panel = document.getElementById('ai14Panel-forecast');
  if (!panel) return;
  const fc = analysis?.forecast || {};
  const preds = fc.predictions || [];
  const maxVal = preds.length > 0 ? Math.max(...preds.map(p => p.upper || p.predicted)) || 1 : 1;

  const trendClass = fc.trend === 'up' ? 'up' : fc.trend === 'down' ? 'down' : 'stable';

  let html = `<div class="ai14-card">
    <div class="ai14-card-head">📈 7 Kunlik Prognoz</div>
    <div class="ai14-card-body">
      <div class="ai14-trend-chip ${trendClass}">
        ${fc.trend === 'up' ? '↑' : fc.trend === 'down' ? '↓' : '→'}
        ${_ai14Esc(fc.trendLabel || '—')}
        ${fc.slope !== undefined ? `<span style="font-weight:400;font-size:12px">(${fc.slope > 0 ? '+' : ''}${fc.slope} ta/kun)</span>` : ''}
      </div>
      <div class="ai14-forecast-bar-wrap">
        ${preds.map(p => {
          const w = Math.round(p.predicted / maxVal * 100);
          return `<div class="ai14-forecast-day">
            <div class="ai14-forecast-date">${p.date}</div>
            <div class="ai14-forecast-bar-bg">
              <div class="ai14-forecast-bar-fill" style="width:${w}%"></div>
            </div>
            <div class="ai14-forecast-val">${p.predicted}</div>
          </div>`;
        }).join('')}
      </div>
      ${fc.nextWeekTotal !== undefined ? `<div style="margin-top:14px;font-size:13px;color:var(--text2)">Keyingi 7 kunlik jami prognoz: <strong style="color:var(--text)">${fc.nextWeekTotal} ta brak</strong></div>` : ''}
      ${fc.rmse !== undefined ? `<div style="margin-top:6px;font-size:12px;color:var(--muted)">Model xatosi (RMSE): ±${fc.rmse} | R²: ${fc.r2}</div>` : ''}
    </div></div>`;

  if (aiText) {
    html += `<div class="ai14-card">
      <div class="ai14-card-body">
        <div class="ai14-ai-label"><i class="fas fa-robot"></i> Claude AI prognoz tahlili</div>
        <div class="ai14-ai-text">${_ai14Md(aiText)}</div>
      </div></div>`;
  }

  panel.innerHTML = html;
}

function _ai14RenderRecs(analysis, aiText) {
  const panel = document.getElementById('ai14Panel-recs');
  if (!panel) return;
  const recs = analysis?.recommendations || [];

  let html = `<div class="ai14-card">
    <div class="ai14-card-head">✅ Tavsiyalar (${recs.length} ta)</div>
    <div class="ai14-card-body">
      ${recs.length === 0 ? '<div style="color:var(--text2);font-size:14px">Tavsiyalar mavjud emas</div>' :
        recs.map(r => `
          <div class="ai14-rec">
            <div class="ai14-rec-ico">${r.icon || '💡'}</div>
            <div class="ai14-rec-body">
              <div class="ai14-rec-title">
                ${_ai14Esc(r.title)}
                <span class="ai14-priority ${r.priority}">${_prioLabel(r.priority)}</span>
              </div>
              <div class="ai14-rec-detail">${_ai14Esc(r.detail)}</div>
            </div>
          </div>`).join('')}
    </div></div>`;

  if (aiText) {
    html += `<div class="ai14-card">
      <div class="ai14-card-body">
        <div class="ai14-ai-label"><i class="fas fa-robot"></i> Claude AI tavsiyalari</div>
        <div class="ai14-ai-text">${_ai14Md(aiText)}</div>
      </div></div>`;
  }

  panel.innerHTML = html;
}

function _ai14RenderRootCause(analysis, aiText) {
  const panel = document.getElementById('ai14Panel-rootcause');
  if (!panel) return;
  const rc = analysis?.rootCauses || {};

  const pairs   = rc.topModelReasonPairs || [];
  const dow     = rc.dayOfWeek || [];
  const cats    = rc.categories || [];
  const maxPair = pairs.length > 0 ? pairs[0].count : 1;

  let html = `<div class="ai14-grid2">`;

  // Model × Reason table
  html += `<div class="ai14-card">
    <div class="ai14-card-head">🔗 Model × Sabab jufti (Top 10)</div>
    <div class="ai14-card-body" style="padding:0">
      <table class="ai14-table">
        <thead><tr><th>#</th><th>Model</th><th>Sabab</th><th>Miqdor</th></tr></thead>
        <tbody>
          ${pairs.slice(0, 10).map((p, i) => `
            <tr><td style="color:var(--muted)">${i+1}</td>
            <td style="font-weight:600">${_ai14Esc(p.model)}</td>
            <td style="color:var(--text2)">${_ai14Esc(p.reason)}</td>
            <td><span class="rank-bar" style="width:${Math.round(p.count/maxPair*60)}px"></span>${p.count}</td></tr>`).join('')}
        </tbody>
      </table>
    </div></div>`;

  // Category breakdown
  html += `<div class="ai14-card">
    <div class="ai14-card-head">📂 Kategoriya taqsimoti</div>
    <div class="ai14-card-body">
      ${cats.map(c => {
        const catLabel = { qayta: "Qayta ishlab bo'lmaydigan", yamala: 'Yamaladigan', orta: "O'rta brak" };
        const catColor = { qayta: 'var(--red)', yamala: 'var(--blue)', orta: 'var(--yellow)' };
        return `<div style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px">
            <span style="color:${catColor[c.category]||'var(--text)'}">${catLabel[c.category] || c.category}</span>
            <span style="font-weight:700">${c.total} <span style="color:var(--muted);font-weight:400">(${c.pct}%)</span></span>
          </div>
          <div style="height:8px;background:rgba(255,255,255,.06);border-radius:4px;overflow:hidden">
            <div style="height:100%;width:${c.pct}%;background:${catColor[c.category]||'var(--blue)'};border-radius:4px;transition:width .5s"></div>
          </div></div>`;
      }).join('')}
    </div></div>`;

  html += `</div>`;

  // Day of week grid
  if (dow.length > 0) {
    const maxDow = Math.max(...dow.map(d => d.total)) || 1;
    html += `<div class="ai14-card">
      <div class="ai14-card-head">📅 Hafta kuni bo'yicha brak</div>
      <div class="ai14-card-body">
        <div class="ai14-dow-grid">
          ${dow.map(d => `
            <div class="ai14-dow-cell ${d.day === (rc.worstDayOfWeek?.day) ? 'worst' : ''}">
              <div class="ai14-dow-day">${d.day.slice(0,3)}</div>
              <div class="ai14-dow-val" style="color:${d.total === maxDow ? 'var(--red)' : 'var(--text)'}">${d.total}</div>
            </div>`).join('')}
        </div>
        ${rc.worstDayOfWeek ? `<div style="margin-top:12px;font-size:13px;color:var(--text2)">Eng ko'p brak kuni: <strong style="color:var(--red)">${rc.worstDayOfWeek.day} (${rc.worstDayOfWeek.total} ta)</strong></div>` : ''}
      </div></div>`;
  }

  if (aiText) {
    html += `<div class="ai14-card">
      <div class="ai14-card-body">
        <div class="ai14-ai-label"><i class="fas fa-robot"></i> Claude AI sabab tahlili</div>
        <div class="ai14-ai-text">${_ai14Md(aiText)}</div>
      </div></div>`;
  }

  panel.innerHTML = html;
}

function _ai14RenderChat() {
  const panel = document.getElementById('ai14Panel-chat');
  if (!panel) return;

  panel.innerHTML = `
    <div class="ai14-chat-wrap">
      <div class="ai14-chat-head"><i class="fas fa-comments"></i> AI bilan suhbat</div>
      <div class="ai14-lang-hint">
        <i class="fas fa-globe"></i>
        O'zbek (lotin), O'zbek (кирилл), Русский yoki English — AI avtomatik til aniqlaydi va shu tilda javob beradi
      </div>
      <div class="ai14-chat-log" id="ai14ChatLog"></div>
      <div class="ai14-chat-inp-row">
        <input class="ai14-chat-inp" id="ai14ChatInp" type="text"
               placeholder="Savol bering / Задайте вопрос / Ask a question...">
        <button class="ai14-chat-send" id="ai14ChatSend" onclick="ai14ChatSend()">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>`;
}

// ── CHAT ─────────────────────────────────────────────────────

async function ai14ChatSend() {
  const inp  = document.getElementById('ai14ChatInp');
  const msg  = inp?.value.trim();
  if (!msg)  return;
  inp.value  = '';

  if (!_ai14Analyzed) {
    const log = document.getElementById('ai14ChatLog');
    if (log) log.innerHTML += `<div style="color:var(--yellow);font-size:13px;padding:8px 0"><i class="fas fa-info-circle"></i> Avval tahlilni boshlang</div>`;
    return;
  }

  const log     = document.getElementById('ai14ChatLog');
  const sendBtn = document.getElementById('ai14ChatSend');
  if (!log) return;

  log.innerHTML += `
    <div class="ai14-chat-msg user">
      <div class="ai14-chat-av ai14-av-user"><i class="fas fa-user"></i></div>
      <div class="ai14-chat-bubble">${_ai14Esc(msg)}</div>
    </div>`;

  const loadId = 'ai14L_' + Date.now();
  log.innerHTML += `
    <div class="ai14-chat-msg" id="${loadId}">
      <div class="ai14-chat-av ai14-av-ai"><i class="fas fa-robot"></i></div>
      <div class="ai14-chat-bubble ai14-typing"><span></span><span></span><span></span></div>
    </div>`;
  log.scrollTop = log.scrollHeight;

  _ai14History.push({ role: 'user', content: msg });
  if (sendBtn) sendBtn.disabled = true;

  try {
    const result = await _ai14Fetch(_ai14History);
    _ai14History.push({ role: 'assistant', content: result.text });

    const el = document.getElementById(loadId);
    if (el) {
      el.querySelector('.ai14-chat-bubble').className = 'ai14-chat-bubble';
      el.querySelector('.ai14-chat-bubble').innerHTML = _ai14Md(result.text);
    }
  } catch (e) {
    const el = document.getElementById(loadId);
    if (el) el.querySelector('.ai14-chat-bubble').innerHTML =
      `<span style="color:var(--red)"><i class="fas fa-exclamation-circle"></i> ${_ai14Esc(e.message || 'Xatolik')}</span>`;
    _ai14History.pop();
  } finally {
    if (sendBtn) sendBtn.disabled = false;
    log.scrollTop = log.scrollHeight;
  }
}

// ── HELPERS ──────────────────────────────────────────────────

async function _ai14Fetch(messages) {
  return apiFetch('/ai-analytics/analyze', { method: 'POST', body: { messages } });
}

function _ai14Esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function _ai14Md(text) {
  return String(text || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

function _sevLabel(s) {
  return { critical:'Kritik', high:'Yuqori', medium:"O'rta", low:'Past' }[s] || s;
}
function _prioLabel(p) {
  return { critical:'Kritik', high:'Yuqori', medium:"O'rta", low:'Past' }[p] || p;
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey && document.activeElement?.id === 'ai14ChatInp') {
    e.preventDefault();
    ai14ChatSend();
  }
});
