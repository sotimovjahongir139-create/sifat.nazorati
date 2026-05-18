/* Sifat Nazorati — API client (frontend/api.js) */
'use strict';

const API_BASE = '/api';

// ── TOKEN STORAGE ───────────────────────────────────────────
function getToken()       { return localStorage.getItem('qc_token'); }
function setToken(t)      { localStorage.setItem('qc_token', t); }
function getStoredUser()  { try { return JSON.parse(localStorage.getItem('qc_user')); } catch { return null; } }
function setStoredUser(u) { localStorage.setItem('qc_user', JSON.stringify(u)); }
function clearAuth()      { localStorage.removeItem('qc_token'); localStorage.removeItem('qc_user'); }

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
    window.location.reload();
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

// ── ENTRIES ─────────────────────────────────────────────────
async function apiGetEntries(params = {}) {
  const q = new URLSearchParams(params).toString();
  return apiFetch('/entries' + (q ? '?' + q : ''));
}

async function apiPostEntry(entry) {
  return apiFetch('/entries', { method: 'POST', body: entry });
}

async function apiDeleteEntry(id) {
  return apiFetch('/entries/' + id, { method: 'DELETE' });
}

// ── ANALYTICS ───────────────────────────────────────────────
async function apiGetDashboard() {
  return apiFetch('/analytics/dashboard');
}

async function apiGetTopModels() {
  return apiFetch('/analytics/top-models');
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
