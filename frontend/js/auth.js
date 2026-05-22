/* Sifat Nazorati — Auth logic */
'use strict';

function getCurrentUser() { return getStoredUser(); }

function showLogin() {
  document.getElementById('app').style.display = 'none';
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('lu').value = '';
  document.getElementById('lp').value = '';
  document.getElementById('lp').type = 'password';
  document.getElementById('eyeIco').className = 'fas fa-eye';
  hideLockMsg();
}

function showApp(user) {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  // Update sidebar user info
  const initials = (user.username || 'U')[0].toUpperCase();
  document.querySelector('.sb-av').textContent = initials;
  document.querySelector('.sb-ud h4').textContent = user.username;
  const roleLabel = { admin: 'Administrator', boss: 'Rahbar', operator: 'Operator' };
  document.querySelector('.sb-ud p').textContent = roleLabel[user.role] || user.role;
  // Show admin-only nav items
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = user.role === 'admin' ? '' : 'none';
  });
  goPage('dash');
}

function showLockMsg(msg) {
  const el = document.getElementById('lockMsg');
  el.innerHTML = '<i class="fas fa-lock" style="margin-right:7px"></i>' + msg;
  el.style.display = 'block';
}
function hideLockMsg() { document.getElementById('lockMsg').style.display = 'none'; }

async function doLogin() {
  hideLockMsg();
  const u   = document.getElementById('lu').value.trim();
  const p   = document.getElementById('lp').value.trim();
  const err = document.getElementById('lerr');
  err.style.display = 'none';

  if (!u || !p) {
    err.textContent = "Foydalanuvchi nomi va parolni kiriting.";
    err.style.display = 'block';
    return;
  }

  const btn = document.querySelector('.btn-login');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>&nbsp; Kirilmoqda...';

  try {
    const { user } = await apiLogin(u, p);
    showApp(user);
  } catch (e) {
    const msg = e.message || "Foydalanuvchi nomi yoki parol noto'g'ri.";
    if (msg.includes('bloklandi') || msg.includes('blok')) {
      showLockMsg(msg);
    } else {
      err.textContent = msg;
      err.style.display = 'block';
      setTimeout(() => { err.style.display = 'none'; }, 3500);
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i>&nbsp; Tizimga kirish';
  }
}

function doLogout() {
  clearAuth();
  showLogin();
}

function togglePw() {
  const inp = document.getElementById('lp');
  const ico = document.getElementById('eyeIco');
  if (inp.type === 'password') { inp.type = 'text';     ico.className = 'fas fa-eye-slash'; }
  else                         { inp.type = 'password'; ico.className = 'fas fa-eye'; }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('loginPage').style.display !== 'none') doLogin();
});
