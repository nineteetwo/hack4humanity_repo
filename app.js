/**
 * ============================================================
 * DOLPHY — SHARED JavaScript (app.js)
 * Loaded by ALL pages. Contains only truly shared code.
 * ============================================================
 * Classes:
 *  - ThemeManager   : Light/dark mode + localStorage persistence
 *  - DesignSystem   : CSS var helpers & animation utils
 *  - XPBurst        : Particle effect on XP/wellness points gain
 *  - StatsPanel     : User stats with localStorage persistence
 *  - LessonTracker  : Tracks completed lessons in localStorage
 *  - App            : Page router (window.location.href based)
 *  - LESSON_DATA    : Shared mental health task data
 * ============================================================
 */

"use strict";

/* ============================================================
   SHARED LESSON DATA — Mental Health Daily Tasks
   Used by learn.js (node path) and quest.js (task UI)
   ============================================================ */
const LESSON_DATA = [
  { id: 'l1',  title: 'Morning Breathing',    emoji: '🌅', xp: 10,
    desc: 'Begin your day with 5 minutes of deep diaphragmatic breathing. Inhale for 4 counts, hold for 4, exhale for 6. This activates your parasympathetic nervous system.',
    taskType: 'breathe', type: 'lesson', duration: 300 },

  { id: 'l2',  title: 'Mood Check-In',        emoji: '💭', xp: 12,
    desc: 'How are you feeling right now? Naming your emotions is the first and most powerful step toward understanding them. There are no wrong answers.',
    taskType: 'mood', type: 'lesson' },

  { id: 'l3',  title: 'First Milestone!',     emoji: '🏅', xp: 15,
    desc: 'You completed your first set of daily wellness tasks. Every expert was once a beginner. Your journey has officially begun!',
    taskType: 'celebrate', type: 'checkpoint' },

  { id: 'l4',  title: 'Gratitude Journal',    emoji: '📝', xp: 14,
    desc: 'Write down 3 things you are grateful for today — big or small. Research shows daily gratitude practice physically rewires the brain toward positivity over time.',
    taskType: 'journal', type: 'lesson',
    prompt: 'What are 3 things you are grateful for today?' },

  { id: 'l5',  title: 'Mindful Walk',         emoji: '🚶', xp: 16,
    desc: 'Take a 10-minute walk outside. Focus completely on your surroundings — what you see, hear, smell, and feel underfoot. No phone, no music.',
    taskType: 'timer', type: 'lesson', duration: 600 },

  { id: 'l6',  title: 'Weekly Challenge',     emoji: '⚡', xp: 30,
    desc: 'Complete a 20-minute mindfulness session. Sit comfortably, close your eyes, and gently return your attention to your breath each time your mind wanders.',
    taskType: 'timer', type: 'boss', duration: 1200 },

  { id: 'l7',  title: 'Connect',              emoji: '💬', xp: 12,
    desc: 'Reach out to one person you care about — a friend, family member, or someone you haven\'t spoken to in a while. A simple "thinking of you" goes a long way.',
    taskType: 'confirm', type: 'lesson' },

  { id: 'l8',  title: 'Body Scan',            emoji: '🧘', xp: 18,
    desc: 'Lie down comfortably. Slowly move your attention from your toes to the top of your head, pausing at each area and consciously releasing any tension you find there.',
    taskType: 'breathe', type: 'lesson', duration: 480 },

  { id: 'l9',  title: 'Hydration Check',      emoji: '💧', xp: 20,
    desc: 'Physical and mental health are deeply connected. Have you had 8 glasses of water today? Even mild dehydration worsens mood, focus, and anxiety.',
    taskType: 'confirm', type: 'lesson' },

  { id: 'l10', title: 'Week Complete!',        emoji: '🌟', xp: 20,
    desc: 'You finished a full week of daily wellness tasks. That is genuinely remarkable. Most people give up within 3 days. You didn\'t. Celebrate yourself!',
    taskType: 'celebrate', type: 'checkpoint' },

  { id: 'l11', title: 'Sleep Routine',        emoji: '🌙', xp: 22,
    desc: 'Set a consistent bedtime tonight. Turn off all screens 30 minutes before sleep. Poor sleep is one of the strongest predictors of anxiety and depression.',
    taskType: 'confirm', type: 'lesson' },

  { id: 'l12', title: 'Affirmations',         emoji: '💪', xp: 24,
    desc: 'Stand in front of a mirror and repeat 5 positive affirmations aloud with conviction. You deserve the same kindness you freely give to others.',
    taskType: 'journal', type: 'lesson',
    prompt: 'Write 5 positive affirmations about yourself:' },

  { id: 'l13', title: 'Month Milestone!',     emoji: '🏆', xp: 50,
    desc: 'One full month of daily mental wellness practice. You have built something truly remarkable. You are a Dolphy champion — and proof that small daily steps lead to real change.',
    taskType: 'celebrate', type: 'boss' },
];

/* ============================================================
   THEME MANAGER — Light/dark mode with localStorage
   ============================================================ */
class ThemeManager {
  static STORAGE_KEY = 'dolphy-theme';
  static currentTheme = 'dark';

  static init() {
    const saved = localStorage.getItem(ThemeManager.STORAGE_KEY) || 'dark';
    ThemeManager.apply(saved);
  }

  static toggle() {
    const next = ThemeManager.currentTheme === 'dark' ? 'light' : 'dark';
    ThemeManager.apply(next);
    localStorage.setItem(ThemeManager.STORAGE_KEY, next);
  }

  static apply(theme) {
    ThemeManager.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    const icon = theme === 'dark' ? '🌙' : '☀️';
    document.querySelectorAll('.theme-toggle__icon').forEach(el => {
      el.textContent = icon;
    });
  }
}

/* ============================================================
   DESIGN SYSTEM — CSS var helpers & animation utils
   ============================================================ */
class DesignSystem {
  static get(varName) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(varName).trim();
  }

  static setVar(varName, value) {
    document.documentElement.style.setProperty(varName, value);
  }

  static shake(el) {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
    el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
  }

  static bounceIn(el) {
    el.classList.remove('bounce-in');
    void el.offsetWidth;
    el.classList.add('bounce-in');
    el.addEventListener('animationend', () => el.classList.remove('bounce-in'), { once: true });
  }
}

/* ============================================================
   XP BURST — Wellness point particle effect
   ============================================================ */
class XPBurst {
  constructor(x, y, emoji = '⭐') {
    this.x     = x;
    this.y     = y;
    this.emoji = emoji;
  }

  fire(count = 5) {
    const offsets = [-80, -40, 0, 40, 80, -60, 60, -20];
    offsets.slice(0, count).forEach((xOff, i) => {
      const el = document.createElement('div');
      el.className = 'xp-burst';
      el.textContent = this.emoji;
      el.style.left  = `${this.x + xOff}px`;
      el.style.top   = `${this.y}px`;
      el.style.animationDelay = `${i * 0.07}s`;
      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove(), { once: true });
    });
  }
}

/* ============================================================
   STATS PANEL — User stats with localStorage persistence
   ============================================================ */
class StatsPanel {
  static STORAGE_KEY = 'dolphy-stats';

  static get state() {
    try {
      const saved = localStorage.getItem(StatsPanel.STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return { streak: 3, hp: 5, xp: 120, gems: 40 };
  }

  static _save(state) {
    try {
      localStorage.setItem(StatsPanel.STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* ignore */ }
  }

  static update() {
    const { streak, hp, xp, gems } = StatsPanel.state;
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    setEl('m-streak', streak); setEl('d-streak', streak);
    setEl('m-hp',     hp);     setEl('d-hp',     hp);
    setEl('m-xp',     xp);     setEl('d-xp',     xp);
    setEl('d-gems',   gems);
  }

  static addXP(amount) {
    const s = StatsPanel.state;
    s.xp   += amount;
    s.gems += Math.max(1, Math.floor(amount / 5));
    StatsPanel._save(s);
    StatsPanel.update();
    const el = document.getElementById('d-xp') || document.getElementById('m-xp');
    if (el) DesignSystem.bounceIn(el.closest('.stats-item, .stat-chip') || el);
  }

  static incrementStreak() {
    const s = StatsPanel.state;
    const today = new Date().toDateString();
    if (s.lastStreakDate !== today) {
      s.streak++;
      s.lastStreakDate = today;
      StatsPanel._save(s);
      StatsPanel.update();
    }
  }

  static decrementHP() {
    const s = StatsPanel.state;
    if (s.hp > 0) { s.hp--; StatsPanel._save(s); StatsPanel.update(); }
  }
}

/* ============================================================
   LESSON TRACKER — Tracks completed lessons in localStorage
   ============================================================ */
class LessonTracker {
  static STORAGE_KEY = 'dolphy-completed';

  static getCompleted() {
    try {
      const saved = localStorage.getItem(LessonTracker.STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  }

  static markComplete(lessonId) {
    const completed = LessonTracker.getCompleted();
    if (!completed.includes(lessonId)) {
      completed.push(lessonId);
      localStorage.setItem(LessonTracker.STORAGE_KEY, JSON.stringify(completed));
    }
  }

  static isComplete(lessonId) {
    return LessonTracker.getCompleted().includes(lessonId);
  }

  static getCompletedCount() {
    return LessonTracker.getCompleted().length;
  }
}

/* ============================================================
   APP — Page router using window.location.href
   Works with separate HTML files (not SPA)
   ============================================================ */
class App {
  static PAGE_MAP = {
    'landing': 'index.html',
    'signup':  'signup.html',
    'login':   'login.html',
    'app':     'app.html',
  };

  static navigate(page) {
    const url = App.PAGE_MAP[page];
    if (url) window.location.href = url;
  }

  static goToQuest(lessonId) {
    window.location.href = `quest.html?lesson=${encodeURIComponent(lessonId)}`;
  }

  static goBack() {
    if (document.referrer) {
      window.history.back();
    } else {
      window.location.href = 'app.html';
    }
  }
}

/* ============================================================
   BOOT — Shared init on every page
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  StatsPanel.update();
});
