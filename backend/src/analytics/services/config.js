'use strict';

// Central AI configuration — Gemini API.
// No secrets are logged or exposed via API.

function getApiKey() {
  return process.env.GEMINI_API_KEY || null;
}

function isAIAvailable() {
  const key = getApiKey();
  return !!(key && key.trim().length > 10);
}

// Call before any Gemini API request.
// Returns { ok: true } or { ok: false, status: 503, error: '...' }
function checkAI() {
  const key = getApiKey();
  if (!key || key.trim().length === 0) {
    return {
      ok:     false,
      status: 503,
      error:  "AI xizmati vaqtincha mavjud emas — GEMINI_API_KEY muhit o'zgaruvchisi o'rnatilmagan.",
      reason: 'missing_key',
    };
  }
  if (key.trim().length < 10) {
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
    console.log(`[AI] GEMINI_API_KEY: SET (${key.length} chars, prefix: ${key.slice(0, 7)}...)`);
  } else {
    console.warn('[AI] GEMINI_API_KEY: MISSING — AI endpoints will return 503. Set the key in Render environment variables.');
  }
}

// Convert Anthropic-style messages to Gemini history format.
// Gemini uses role='model' instead of role='assistant'.
function toGeminiHistory(messages) {
  return messages.map(m => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content || '') }],
  }));
}

module.exports = { getApiKey, isAIAvailable, checkAI, aiStatus, logStartup, toGeminiHistory };
