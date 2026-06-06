'use strict';

// Central AI configuration — read-only, sourced from environment only.
// No secrets are logged or exposed via API.

function getApiKey() {
  return process.env.ANTHROPIC_API_KEY || null;
}

function isAIAvailable() {
  const key = getApiKey();
  return !!(key && key.startsWith('sk-'));
}

// Call before any Anthropic API request.
// Returns { ok: true } or { ok: false, status: 503, error: '...' }
function checkAI() {
  const key = getApiKey();
  if (!key) {
    return {
      ok:     false,
      status: 503,
      error:  "AI xizmati vaqtincha mavjud emas — ANTHROPIC_API_KEY muhit o'zgaruvchisi o'rnatilmagan.",
      reason: 'missing_key',
    };
  }
  if (!key.startsWith('sk-')) {
    return {
      ok:     false,
      status: 503,
      error:  "AI xizmati vaqtincha mavjud emas — API kalit formati noto'g'ri.",
      reason: 'invalid_key_format',
    };
  }
  return { ok: true, reason: 'ok' };
}

// Returns a safe status object (no key value exposed).
function aiStatus() {
  const key   = getApiKey();
  const check = checkAI();
  return {
    available:  check.ok,
    key_set:    !!key,
    key_length: key ? key.length : 0,
    reason:     check.reason || 'ok',
  };
}

// Logs key presence at server startup — value never printed.
function logStartup() {
  const key = getApiKey();
  if (key) {
    console.log(`[AI] ANTHROPIC_API_KEY: SET (${key.length} chars, prefix: ${key.slice(0, 7)}...)`);
  } else {
    console.warn('[AI] ANTHROPIC_API_KEY: MISSING — AI endpoints will return 503. Set the key in Render environment variables.');
  }
}

module.exports = { getApiKey, isAIAvailable, checkAI, aiStatus, logStartup };
