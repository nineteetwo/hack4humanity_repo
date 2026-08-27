/**
 * ============================================================
 * DOLPHY — login.js
 * Loaded ONLY by login.html.
 * ============================================================
 * Depends on: app.js (ThemeManager, App, DesignSystem)
 * ============================================================
 */

"use strict";

class LoginPage {
  static init() {
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

    /* Social buttons */
    document.getElementById('btn-google-login')?.addEventListener('click', () => App.navigate('app'));
    document.getElementById('btn-facebook-login')?.addEventListener('click', () => App.navigate('app'));
    document.getElementById('link-signup')?.addEventListener('click', (e) => {
      e.preventDefault(); App.navigate('signup');
    });
    document.getElementById('btn-back')?.addEventListener('click', () => App.navigate('landing'));
  }

  static handleSubmit() {
    const email = document.getElementById('login-email')?.value?.trim();
    const pw    = document.getElementById('login-password')?.value;

    if (!email || !pw) {
      LoginPage._showError('Please enter your email and password.');
      return;
    }

    /* Basic session (no real auth) */
    localStorage.setItem('dolphy-user', JSON.stringify({ email }));
    App.navigate('app');
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
}

document.addEventListener('DOMContentLoaded', () => {
  LoginPage.init();
});
