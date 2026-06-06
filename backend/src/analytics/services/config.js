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
  if (!getApiKey()) {
    return {
      ok:     false,
      status: 503,
      error:  "AI xizmati vaqtincha mavjud emas. Administrator bilan bog'laning.",
    };
  }
  if (!isAIAvailable()) {
    return {
      ok:     false,
      status: 503,
      error:  "AI xizmati vaqtincha mavjud emas. Administrator bilan bog'laning.",
    };
  }
  return { ok: true };
}

module.exports = { getApiKey, isAIAvailable, checkAI };
