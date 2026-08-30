/**
 * ============================================================
 * DOLPHY — signup.js
 * Loaded ONLY by signup.html.
 * ============================================================
 * Depends on: api.js (API), app.js (ThemeManager, App, DesignSystem)
 * ============================================================
 */

"use strict";

class SignupPage {
  static init() {
    /* Zaten giriş yapılmışsa app'e yönlendir */
    if (API.isLoggedIn()) {
      App.navigate('app');
      return;
    }

    /* Password visibility toggle */
    const toggleBtn = document.getElementById('btn-toggle-password');
    const pwInput   = document.getElementById('signup-password');
    if (toggleBtn && pwInput) {
      toggleBtn.addEventListener('click', () => {
        const isText    = pwInput.type === 'text';
        pwInput.type    = isText ? 'password' : 'text';
        toggleBtn.textContent = isText ? '👁' : '🙈';
      });
    }

    /* Form submit */
    const form = document.getElementById('signup-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        SignupPage.handleSubmit();
      });
    }

    /* Social buttons */
    document.getElementById('btn-google-signup')?.addEventListener('click', () => App.navigate('app'));
    document.getElementById('btn-facebook-signup')?.addEventListener('click', () => App.navigate('app'));
    document.getElementById('btn-login-corner')?.addEventListener('click', () => App.navigate('login'));
    document.getElementById('btn-back')?.addEventListener('click', () => App.navigate('landing'));
  }

  static async handleSubmit() {
    const email = document.getElementById('signup-email')?.value?.trim();
    const pw    = document.getElementById('signup-password')?.value;
    const name  = document.getElementById('signup-name')?.value?.trim() || '';

    /* Client-side validasyon */
    if (!email || !pw) {
      SignupPage._showError('Please fill in your email and password.');
      return;
    }
    if (!email.includes('@')) {
      SignupPage._showError('Please enter a valid email address.');
      return;
    }
    if (pw.length < 6) {
      SignupPage._showError('Password must be at least 6 characters.');
      return;
    }

    const submitBtn = document.getElementById('signup-submit-btn') ||
                      document.querySelector('#signup-form button[type="submit"]');
    const originalText = submitBtn?.textContent;

    try {
      /* UI: yükleniyor durumu */
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Creating account…'; }
      SignupPage._clearError();

      /* Gerçek API çağrısı */
      await API.auth.signup(email, pw, name);

      /* Başarılı — app'e git */
      App.navigate('app');

    } catch (err) {
      SignupPage._showError(err.message || 'Signup failed. Please try again.');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
    }
  }

  static _showError(msg) {
    let errEl = document.getElementById('signup-error');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.id = 'signup-error';
      errEl.className = 'auth-error';
      document.getElementById('signup-form')?.prepend(errEl);
    }
    errEl.textContent = msg;
    DesignSystem.shake(errEl);
  }

  static _clearError() {
    const errEl = document.getElementById('signup-error');
    if (errEl) errEl.textContent = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  SignupPage.init();
});
