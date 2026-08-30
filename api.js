/**
 * ============================================================
 * DOLPHY — api.js  (Frontend API Client)
 * Tüm backend HTTP çağrıları bu dosyadan yapılır.
 * Yükleme sırası: api.js → app.js → sayfa-özel JS
 * ============================================================
 * Kullanım:
 *   const token = await API.auth.login(email, password);
 *   const me    = await API.users.me();
 *   await API.quests.submit(lessonId, { task_type, mood_value, text_content });
 * ============================================================
 */

"use strict";

const API = (() => {
  /* ── CONFIG ──────────────────────────────────────────────────── */
  const BASE_URL    = "http://localhost:8000";
  const TOKEN_KEY   = "dolphy-token";
  const USER_KEY    = "dolphy-user";

  /* ── TOKEN HELPERS ───────────────────────────────────────────── */
  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function saveToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function isLoggedIn() {
    return !!getToken();
  }

  /**
   * Temel fetch wrapper. JSON döner veya hata fırlatır.
   * Kimlik doğrulama gereken endpoint'ler için auth=true.
   */
  async function request(method, path, body = null, auth = true) {
    const headers = { "Content-Type": "application/json" };
    if (auth) {
      const token = getToken();
      if (!token) {
        // Token yok — login sayfasına yönlendir
        window.location.href = "login.html";
        throw new Error("No auth token");
      }
      headers["Authorization"] = `Bearer ${token}`;
    }

    const opts = { method, headers };
    if (body !== null) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${path}`, opts);

    if (res.status === 401) {
      // Token süresi dolmuş
      clearToken();
      window.location.href = "login.html";
      throw new Error("Unauthorized — redirecting to login");
    }

    const data = await res.json();

    if (!res.ok) {
      const msg = data?.detail || `API error ${res.status}`;
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }

    return data;
  }

  /* ── AUTH ────────────────────────────────────────────────────── */
  const auth = {
    /**
     * Yeni hesap oluştur.
     * @returns {Promise<{access_token: string}>}
     */
    async signup(email, password, name = "") {
      const data = await request("POST", "/auth/signup", { email, password, name }, false);
      saveToken(data.access_token);
      return data;
    },

    /**
     * Mevcut hesapla giriş yap.
     * @returns {Promise<{access_token: string}>}
     */
    async login(email, password) {
      const data = await request("POST", "/auth/login", { email, password }, false);
      saveToken(data.access_token);
      return data;
    },

    /** Çıkış yap — token'ı sil ve landing'e git. */
    logout() {
      clearToken();
      window.location.href = "index.html";
    },

    isLoggedIn,
    getToken,
  };

  /* ── USERS ───────────────────────────────────────────────────── */
  const users = {
    /**
     * Mevcut kullanıcının profilini ve istatistiklerini getir.
     * @returns {Promise<UserOut>}  { id, email, name, streak, hp, xp, gems }
     */
    async me() {
      return request("GET", "/users/me");
    },
  };

  /* ── LESSONS ─────────────────────────────────────────────────── */
  const lessons = {
    /**
     * Tüm lesson listesini getir (auth gerektirmez).
     * @returns {Promise<LessonOut[]>}
     */
    async list() {
      return request("GET", "/lessons", null, false);
    },

    /**
     * Kullanıcının tamamladığı lesson ID'lerini getir.
     * @returns {Promise<string[]>}
     */
    async getCompleted() {
      return request("GET", "/lessons/completed");
    },

    /**
     * Lesson'ı tamamla — XP ve streak backend'de güncellenir.
     * Mood/journal olmayan task type'lar (breathe, timer, confirm, celebrate) için.
     * @returns {Promise<LessonCompleteOut>}
     */
    async complete(lessonId) {
      return request("POST", `/lessons/${encodeURIComponent(lessonId)}/complete`);
    },
  };

  /* ── QUESTS ──────────────────────────────────────────────────── */
  const quests = {
    /**
     * Anket/quest tamamlama cevabını backend'e kaydet.
     * Mood, journal ve diğer task type'lar için tek endpoint.
     *
     * @param {string} lessonId
     * @param {{ task_type: string, mood_value?: number, text_content?: string }} payload
     * @returns {Promise<QuestSubmitOut>}
     */
    async submit(lessonId, payload) {
      return request("POST", `/quests/${encodeURIComponent(lessonId)}/submit`, payload);
    },

    /**
     * Kullanıcının tüm submission geçmişini getir.
     * @returns {Promise<QuestSubmissionHistoryItem[]>}
     */
    async mySubmissions() {
      return request("GET", "/quests/my-submissions");
    },
  };

  /* ── LEADERBOARD ─────────────────────────────────────────────── */
  const leaderboard = {
    /**
     * XP sırasına göre top kullanıcıları getir.
     * @param {number} limit  - Kaç kullanıcı isteniyor (varsayılan 20)
     * @returns {Promise<LeaderboardEntry[]>}  { rank, name, xp, streak }
     */
    async top(limit = 20) {
      return request("GET", `/leaderboard?limit=${limit}`, null, false);
    },
  };

  /* ── PUBLIC API ──────────────────────────────────────────────── */
  return { auth, users, lessons, quests, leaderboard, BASE_URL, isLoggedIn, getToken, clearToken };
})();
