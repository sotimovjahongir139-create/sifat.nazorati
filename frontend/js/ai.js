/* Sifat Nazorati — AI Analitika module */
'use strict';

let _aiHistory  = [];
let _aiAnalyzed = false;

async function setupAI() {
  _aiHistory  = [];
  _aiAnalyzed = false;
  const out  = document.getElementById('aiOutput');
  const chat = document.getElementById('aiChatWrap');
  if (out)  { out.style.display  = 'none'; out.innerHTML  = ''; }
  if (chat) { chat.style.display = 'none'; }
  const log = document.getElementById('aiChatLog');
  if (log)  log.innerHTML = '';
  const btn = document.getElementById('aiAnalyzeBtn');
  if (btn)  { btn.disabled = false; btn.innerHTML = '<i class="fas fa-robot"></i> AI Tahlil Boshlash'; }
  await loadAIStats();
}

async function loadAIStats() {
  try {
    const [dash, topModels] = await Promise.all([
      apiGetDashboard(),
      apiGetTopModels(),
    ]);
    renderAIStats(dash, topModels);
  } catch (e) {
    console.error('loadAIStats:', e);
  }
}

function renderAIStats(dash) {
  const el = document.getElementById('aiStatsRow');
  if (!el) return;
  const trend     = dash.trend || [];
  const prevTotal = trend.length >= 2 ? parseInt(trend[trend.length - 2]?.total || 0) : 0;
  const currTotal = trend.length >= 1 ? parseInt(trend[trend.length - 1]?.total || 0) : 0;
  const pct       = prevTotal > 0 ? ((currTotal - prevTotal) / prevTotal * 100).toFixed(1) : null;
  const pctHtml   = pct !== null
    ? ` <span style="font-size:11px;color:${parseFloat(pct) > 0 ? 'var(--red)' : 'var(--green)'}">(${parseFloat(pct) > 0 ? '+' : ''}${pct}%)</span>`
    : '';
  el.innerHTML = `
    <div class="ai-stat-card">
      <div class="ai-stat-ico" style="background:rgba(255,71,87,.15);color:var(--red)"><i class="fas fa-exclamation-triangle"></i></div>
      <div class="ai-stat-body"><div class="ai-stat-val">${dash.today || 0}</div><div class="ai-stat-lbl">Bugungi nuqsonlar</div></div>
    </div>
    <div class="ai-stat-card">
      <div class="ai-stat-ico" style="background:rgba(79,142,247,.15);color:var(--blue)"><i class="fas fa-calendar-alt"></i></div>
      <div class="ai-stat-body"><div class="ai-stat-val">${dash.month || 0}</div><div class="ai-stat-lbl">Bu oyda jami${pctHtml}</div></div>
    </div>
    <div class="ai-stat-card">
      <div class="ai-stat-ico" style="background:rgba(255,107,53,.15);color:var(--orange)"><i class="fas fa-shoe-prints"></i></div>
      <div class="ai-stat-body"><div class="ai-stat-val" style="font-size:14px">${dash.top_model?.sku || '—'}</div><div class="ai-stat-lbl">Eng muammoli model</div></div>
    </div>
    <div class="ai-stat-card">
      <div class="ai-stat-ico" style="background:rgba(156,106,248,.15);color:var(--purple)"><i class="fas fa-bug"></i></div>
      <div class="ai-stat-body"><div class="ai-stat-val" style="font-size:12px;line-height:1.3">${dash.top_reason?.reason || '—'}</div><div class="ai-stat-lbl">Asosiy nuqson sababi</div></div>
    </div>
  `;
}

async function startAIAnalysis() {
  const btn  = document.getElementById('aiAnalyzeBtn');
  const out  = document.getElementById('aiOutput');
  const chat = document.getElementById('aiChatWrap');

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Tahlil qilinmoqda...';

  out.innerHTML = `
    <div class="ai-loading">
      <div class="ai-pulse"></div>
      <p>Ma'lumotlar yig'ilmoqda va Claude AI tahlil qilmoqda...</p>
      <p style="font-size:12px;color:var(--muted);margin-top:8px">Bu 15–40 soniya davom etishi mumkin</p>
    </div>`;
  out.style.display = 'block';

  try {
    _aiHistory = [];
    const result = await _aiApiFetch([]);
    _aiAnalyzed  = true;

    _aiHistory = [
      { role: 'user',      content: "Ushbu ma'lumotlarni to'liq tahlil qil. Barcha bo'limlarni qamrab ol." },
      { role: 'assistant', content: result.text },
    ];

    _renderAIResponse(result.text, out);
    chat.style.display = 'block';
    btn.innerHTML = '<i class="fas fa-sync-alt"></i> Qayta tahlil qilish';
    btn.disabled  = false;
  } catch (e) {
    out.innerHTML = `<div class="ai-error"><i class="fas fa-exclamation-circle"></i> Xatolik: ${_esc(e.message || 'Server bilan ulanishda muammo')}</div>`;
    btn.innerHTML = '<i class="fas fa-robot"></i> AI Tahlil Boshlash';
    btn.disabled  = false;
  }
}

function _renderAIResponse(text, container) {
  const sections = _parseAISections(text);
  if (sections.length > 1) {
    container.innerHTML = sections.map(_renderSection).join('');
  } else {
    container.innerHTML = `<div class="ai-section"><div class="ai-section-body">${_md(text)}</div></div>`;
  }
}

const _SECTION_MAP = [
  { keywords: ['kritik','xavf','muammo'],             icon: '🔴', color: 'var(--red)'    },
  { keywords: ['model'],                              icon: '📊', color: 'var(--blue)'   },
  { keywords: ['sabab'],                              icon: '🔍', color: 'var(--orange)' },
  { keywords: ['bashorat','prognoz','keyingi 7'],     icon: '🔮', color: 'var(--purple)' },
  { keywords: ['tavsiya','qadam','yaxshilash','5 ta'],icon: '✅', color: 'var(--green)'  },
];

function _parseAISections(text) {
  const lines    = text.split('\n');
  const sections = [];
  let cur        = null;

  for (const line of lines) {
    const t = line.trim();
    const isHeader =
      /^#{1,3}\s/.test(t) ||
      /^\d+[\)\.]\s+\S/.test(t) ||
      /^[🔴📊🔍🔮✅⚠️💡🎯]\s/.test(t) ||
      (/^\*\*[^\*]/.test(t) && t.endsWith('**'));

    if (isHeader) {
      if (cur) sections.push(cur);
      const title = t
        .replace(/^#{1,3}\s+/, '')
        .replace(/^\d+[\)\.]\s+/, '')
        .replace(/\*\*/g, '')
        .replace(/^[🔴📊🔍🔮✅⚠️💡🎯]\s+/, '')
        .trim();
      const lower   = title.toLowerCase();
      const matched = _SECTION_MAP.find(s => s.keywords.some(k => lower.includes(k)));
      cur = {
        title,
        icon:  matched?.icon  || '📋',
        color: matched?.color || 'var(--text2)',
        body:  [],
      };
    } else if (cur) {
      cur.body.push(line);
    } else if (t) {
      cur = { title: '', icon: '📋', color: 'var(--text2)', body: [line] };
    }
  }
  if (cur) sections.push(cur);
  return sections.filter(s => s.body.some(l => l.trim()));
}

function _renderSection(s) {
  const head = s.title
    ? `<div class="ai-section-head" style="border-left-color:${s.color}">
         <span class="ai-section-ico">${s.icon}</span>
         <span class="ai-section-title" style="color:${s.color}">${_esc(s.title)}</span>
       </div>`
    : '';
  return `<div class="ai-section">${head}<div class="ai-section-body">${_md(s.body.join('\n'))}</div></div>`;
}

function _md(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/(Yuqori xavf|Yuqori)/g, '<span class="ai-badge ai-badge-r">$1</span>')
    .replace(/(O\'rta xavf|O\'rta)/g, '<span class="ai-badge ai-badge-y">$1</span>')
    .replace(/(Past xavf|Past)/g,     '<span class="ai-badge ai-badge-g">$1</span>')
    .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    .replace(/\n\n+/g, '</p><p style="margin-bottom:0">')
    .replace(/\n/g, '<br>');
}

function _esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function sendAIChat() {
  const inp = document.getElementById('aiChatInput');
  const msg = inp.value.trim();
  if (!msg) return;
  inp.value = '';

  const log     = document.getElementById('aiChatLog');
  const sendBtn = document.getElementById('aiChatSend');

  log.innerHTML += `
    <div class="ai-chat-msg user">
      <div class="ai-chat-av user-av"><i class="fas fa-user"></i></div>
      <div class="ai-chat-bubble">${_esc(msg)}</div>
    </div>`;

  const loadId = 'aiL_' + Date.now();
  log.innerHTML += `
    <div class="ai-chat-msg ai" id="${loadId}">
      <div class="ai-chat-av ai-av"><i class="fas fa-robot"></i></div>
      <div class="ai-chat-bubble ai-chat-typing"><span></span><span></span><span></span></div>
    </div>`;
  log.scrollTop = log.scrollHeight;

  _aiHistory.push({ role: 'user', content: msg });
  sendBtn.disabled = true;

  try {
    const result = await _aiApiFetch(_aiHistory);
    _aiHistory.push({ role: 'assistant', content: result.text });

    const loadEl = document.getElementById(loadId);
    if (loadEl) {
      const bubble = loadEl.querySelector('.ai-chat-bubble');
      bubble.className = 'ai-chat-bubble';
      bubble.innerHTML = _md(result.text);
    }
  } catch (e) {
    const loadEl = document.getElementById(loadId);
    if (loadEl) {
      loadEl.querySelector('.ai-chat-bubble').innerHTML =
        `<span style="color:var(--red)"><i class="fas fa-exclamation-circle"></i> ${_esc(e.message || 'Ulanishda muammo')}</span>`;
    }
    _aiHistory.pop();
  } finally {
    sendBtn.disabled = false;
    log.scrollTop = log.scrollHeight;
  }
}

async function _aiApiFetch(messages) {
  return apiFetch('/ai/analyze', { method: 'POST', body: { messages } });
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey && document.activeElement?.id === 'aiChatInput') {
    e.preventDefault();
    sendAIChat();
  }
});
