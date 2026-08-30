/**
 * ============================================================
 * DOLPHY — login.js
 * Loaded ONLY by login.html.
 * ============================================================
 * Depends on: api.js (API), app.js (ThemeManager, App, DesignSystem)
 * ============================================================
 */

"use strict";

class LoginPage {
  static init() {
    /* Zaten giriş yapılmışsa app'e yönlendir */
    if (API.isLoggedIn()) {
      App.navigate('app');
      return;
    }

    /* Form submit */
    const form = document.getElementById('login-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        LoginPage.handleSubmit();
      });
    }

    /* Toggle password */
    const toggleBtn = document.getElementById('btn-toggle-login-pw');
    const pwInput   = document.getElementById('login-password');
    if (toggleBtn && pwInput) {
      toggleBtn.addEventListener('click', () => {
        const isText = pwInput.type === 'text';
        pwInput.type = isText ? 'password' : 'text';
        toggleBtn.textContent = isText ? '👁' : '🙈';
      });
    }

    /* Forgot password */
    document.getElementById('btn-forgot')?.addEventListener('click', () => {
      alert('Password reset coming soon! For now, try signing up again.');
    });

    /* Social buttons — sadece navigate, gerçek OAuth değil */
    document.getElementById('btn-google-login')?.addEventListener('click', () => App.navigate('app'));
    document.getElementById('btn-facebook-login')?.addEventListener('click', () => App.navigate('app'));
    document.getElementById('link-signup')?.addEventListener('click', (e) => {
      e.preventDefault(); App.navigate('signup');
    });
    document.getElementById('btn-back')?.addEventListener('click', () => App.navigate('landing'));
  }

  static async handleSubmit() {
    const email = document.getElementById('login-email')?.value?.trim();
    const pw    = document.getElementById('login-password')?.value;

    if (!email || !pw) {
      LoginPage._showError('Please enter your email and password.');
      return;
    }

    const submitBtn = document.getElementById('login-submit-btn') ||
                      document.querySelector('#login-form button[type="submit"]');
    const originalText = submitBtn?.textContent;

    try {
      /* UI: yükleniyor durumu */
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Signing in…'; }
      LoginPage._clearError();

      /* Gerçek API çağrısı */
      await API.auth.login(email, pw);

      /* Başarılı — app'e git */
      App.navigate('app');

    } catch (err) {
      LoginPage._showError(err.message || 'Login failed. Please try again.');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
    }
  }

  static _showError(msg) {
    let errEl = document.getElementById('login-error');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.id = 'login-error';
      errEl.className = 'auth-error';
      document.getElementById('login-form')?.prepend(errEl);
    }
    errEl.textContent = msg;
    DesignSystem.shake(errEl);
  }

  static _clearError() {
    const errEl = document.getElementById('login-error');
    if (errEl) errEl.textContent = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  LoginPage.init();
});
