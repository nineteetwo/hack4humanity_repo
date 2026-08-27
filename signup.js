/**
 * ============================================================
 * DOLPHY — signup.js
 * Loaded ONLY by signup.html.
 * ============================================================
 * Depends on: app.js (ThemeManager, App)
 * ============================================================
 */

"use strict";

class SignupPage {
  static init() {
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

  static handleSubmit() {
    const email = document.getElementById('signup-email')?.value?.trim();
    const pw    = document.getElementById('signup-password')?.value;

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

    /* Save basic session (no real auth here) */
    localStorage.setItem('dolphy-user', JSON.stringify({ email, name: document.getElementById('signup-name')?.value || '' }));

    /* Navigate to app */
    App.navigate('app');
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
}

document.addEventListener('DOMContentLoaded', () => {
  SignupPage.init();
});
