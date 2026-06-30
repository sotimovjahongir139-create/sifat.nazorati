/* Sifat Nazorati — API client (in-memory JWT) */
'use strict';

const API_BASE = '/api';

// ── TOKEN IN MEMORY (never in localStorage) ─────────────────
let _token = null;
let _currentUser = null;

function getToken()      { return _token; }
function setToken(t)     { _token = t; }
function getStoredUser() { return _currentUser; }
function setStoredUser(u){ _currentUser = u; }
function clearAuth()     { _token = null; _currentUser = null; }

// ── CORE FETCH ──────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers || {}),
  };

  let body;
  if (opts.body !== undefined) {
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(API_BASE + path, { ...opts, headers, body });

  if (res.status === 401) {
    clearAuth();
    showLogin();
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Server xatosi');
  return data;
}

// ── AUTH ────────────────────────────────────────────────────
async function apiLogin(username, password) {
  const data = await apiFetch('/auth/login', { method: 'POST', body: { username, password } });
  setToken(data.token);
  setStoredUser(data.user);
  return data;
}

async function apiMe() {
  return apiFetch('/auth/me');
}

// ── DEFECTS ─────────────────────────────────────────────────
async function apiGetDefects(params = {}) {
  const q = new URLSearchParams(params).toString();
  return apiFetch('/defects' + (q ? '?' + q : ''));
}

async function apiPostDefect(entry) {
  return apiFetch('/defects', { method: 'POST', body: entry });
}

async function apiDeleteDefect(id) {
  return apiFetch('/defects/' + id, { method: 'DELETE' });
}

async function apiGetWeeklySummary() {
  return apiFetch('/defects/weekly-summary');
}

async function apiGetModelCauses(model, month) {
  return apiFetch('/defects/model-causes?model=' + encodeURIComponent(model) + '&month=' + encodeURIComponent(month));
}

async function apiGetCategoryModels(category, month) {
  return apiFetch('/defects/category-models?category=' + encodeURIComponent(category) + '&month=' + encodeURIComponent(month));
}

// ── ANALYTICS ───────────────────────────────────────────────
async function apiGetDashboard() {
  return apiFetch('/stats/dashboard');
}

async function apiGetTopModels() {
  return apiFetch('/stats/top-models');
}

// ── MODELS (distinct SKU list) ───────────────────────────────
async function apiGetModels() {
  return apiFetch('/models');
}

// ── REASONS ─────────────────────────────────────────────────
async function apiGetReasons() {
  return apiFetch('/reasons');
}
async function apiPostReason(name) {
  return apiFetch('/reasons', { method: 'POST', body: { name } });
}

// ── HISTOGRAMMA ─────────────────────────────────────────────
async function apiGetHistogramma(params = {}) {
  const q = new URLSearchParams(params).toString();
  return apiFetch('/histogramma' + (q ? '?' + q : ''));
}

async function apiPostHistogramma(record) {
  return apiFetch('/histogramma', { method: 'POST', body: record });
}

async function apiDeleteHistogramma() {
  return apiFetch('/histogramma', { method: 'DELETE' });
}

async function apiDeleteHistogrammaModel(material_type, model) {
  const q = new URLSearchParams({ material_type, model }).toString();
  return apiFetch('/histogramma/model?' + q, { method: 'DELETE' });
}

async function apiGetModelGrams(material_type, model) {
  const p = model ? { material_type, model } : { material_type };
  return apiFetch('/histogramma/grams?' + new URLSearchParams(p).toString());
}

async function apiPostModelGram(material_type, model, min_gram, max_gram, sizes) {
  return apiFetch('/histogramma/grams', { method: 'POST', body: { material_type, model, min_gram, max_gram, sizes } });
}

async function apiGetSizeGrams(material_type) {
  return apiFetch('/histogramma/size-grams?material_type=' + encodeURIComponent(material_type));
}

async function apiPostSizeGrams(material_type, model, sizes) {
  return apiFetch('/histogramma/size-grams', { method: 'POST', body: { material_type, model, sizes } });
}

// ── QAYTA PADOSH RECORDS ─────────────────────────────────────
async function apiGetQaytaPadosh() { return apiFetch('/qayta-padosh'); }
async function apiPostQaytaPadosh(record) { return apiFetch('/qayta-padosh', { method: 'POST', body: record }); }

// ── BOLIM ISH VAQTI ─────────────────────────────────────────
async function apiGetBolim() {
  return apiFetch('/bolim');
}
async function apiPostBolim(record) {
  return apiFetch('/bolim', { method: 'POST', body: record });
}

// ── YAMCHIQ RECORDS ─────────────────────────────────────────
async function apiGetYamchiqRecords() {
  return apiFetch('/yamchiq-records');
}
async function apiPostYamchiqRecord(record) {
  return apiFetch('/yamchiq-records', { method: 'POST', body: record });
}
async function apiGetYamchiqSummary() {
  return apiFetch('/yamchiq-records/summary');
}

// ── USERS (admin only) ──────────────────────────────────────
async function apiGetUsers() {
  return apiFetch('/users');
}

async function apiPostUser(user) {
  return apiFetch('/users', { method: 'POST', body: user });
}

async function apiDeleteUser(id) {
  return apiFetch('/users/' + id, { method: 'DELETE' });
}
