/**
 * ============================================================
 * DOLPHY — quest.js
 * Loaded ONLY by quest.html.
 * Handles the task/quest solving UI.
 * ============================================================
 * Depends on: app.js (ThemeManager, DesignSystem, XPBurst,
 *             StatsPanel, LessonTracker, App, LESSON_DATA)
 * ============================================================
 * QuestSolver renders different UI based on lesson.taskType:
 *   - 'breathe'   → animated breathing circle
 *   - 'mood'      → emoji mood picker
 *   - 'journal'   → text area with prompt
 *   - 'timer'     → countdown timer
 *   - 'confirm'   → simple "I did it!" button
 *   - 'celebrate' → milestone celebration with XP burst
 * ============================================================
 */

"use strict";

class QuestSolver {
  constructor(lesson) {
    this.lesson      = lesson;
    this.completed   = false;
    this.timerRef    = null;
    // Submission payload: mood ve journal tiplerinde doldurulur
    this._submission = { task_type: lesson.taskType, mood_value: null, text_content: null };
  }

  static async init() {
    const params   = new URLSearchParams(window.location.search);
    const lessonId = params.get('lesson');
    const dailyQuestId = params.get('dailyQuest');
    
    let lesson;
    let isDaily = false;
    
    if (dailyQuestId) {
        // Fetch daily quests and find this one
        if (typeof API !== 'undefined' && API.isLoggedIn()) {
            const dailyQuests = await API.quests.getDaily();
            const dq = dailyQuests.find(q => q.id == dailyQuestId);
            if (dq) {
                lesson = {
                    id: `daily_${dq.id}`,
                    title: dq.label,
                    taskType: dq.task_type || 'breathe',
                    emoji: dq.icon,
                    desc: `Complete this daily quest to earn ${dq.reward_gems} gems!`,
                    xp: dq.reward_xp,
                    dailyQuestId: dq.id
                };
                isDaily = true;
            }
        }
    } else {
        lesson = LESSON_DATA.find(l => l.id === lessonId);
    }

    if (!lesson) {
      window.location.href = 'learn.html';
      return;
    }

    /* Populate title area */
    document.title = `${lesson.title} — Dolphy`;
    const titleEl = document.getElementById('quest-title');
    if (titleEl) titleEl.textContent = lesson.title;
    const emojiEl = document.getElementById('quest-nav-emoji');
    if (emojiEl) emojiEl.textContent = lesson.emoji;
    const xpEl = document.getElementById('quest-xp-badge');
    if (xpEl) xpEl.textContent = `+${lesson.xp} pts`;

    const solver = new QuestSolver(lesson);
    solver.isDaily = isDaily;
    solver.render(document.getElementById('quest-content'));

    /* Already completed? */
    let alreadyComplete = false;
    if (!isDaily) {
        alreadyComplete = LessonTracker.isComplete(lessonId);
        if (typeof API !== 'undefined' && API.isLoggedIn()) {
          try {
            const completed = await API.lessons.getCompleted();
            alreadyComplete = completed.includes(lessonId);
          } catch (e) {
            console.warn('[QuestSolver] completed-lessons check failed:', e.message);
          }
        }
    } else {
        // Daily quests could be completed, we might need a check, but for now allow doing it
    }
    
    if (alreadyComplete) {
      solver._showAlreadyComplete();
    }
  }

  render(container) {
    if (!container) return;
    switch (this.lesson.taskType) {
      case 'breathe':   this._renderBreathe(container);   break;
      case 'mood':      this._renderMood(container);      break;
      case 'journal':   this._renderJournal(container);   break;
      case 'timer':     this._renderTimer(container);     break;
      case 'celebrate': this._renderCelebrate(container); break;
      default:          this._renderConfirm(container);   break;
    }
  }

  /* ── BREATHE ─────────────────────────────────────────── */
  _renderBreathe(container) {
    container.innerHTML = `
      <div class="qs-card">
        <div class="qs-emoji" aria-hidden="true">${this.lesson.emoji}</div>
        <h2 class="qs-title">${this.lesson.title}</h2>
        <p class="qs-desc">${this.lesson.desc}</p>

        <div class="qs-breathe-wrap">
          <div class="qs-breathe-ring" id="breathe-ring" aria-live="polite">
            <div class="qs-breathe-inner" id="breathe-inner"></div>
            <span class="qs-breathe-text" id="breathe-text">Tap to begin</span>
          </div>
          <div class="qs-breathe-counter" id="breathe-counter">0 / 5 breaths</div>
        </div>

        <button class="clay-btn clay-btn--primary clay-btn--xl qs-action-btn" id="qs-complete-btn" style="display:none" onclick="">
          ✅ I Completed the Exercise
        </button>
      </div>
    `;

    let phase   = 'idle'; // idle | inhale | hold | exhale
    let breaths = 0;
    const totalBreaths = 5;
    let timeoutRef = null;

    const ring    = document.getElementById('breathe-ring');
    const inner   = document.getElementById('breathe-inner');
    const text    = document.getElementById('breathe-text');
    const counter = document.getElementById('breathe-counter');
    const doneBtn = document.getElementById('qs-complete-btn');

    const next = () => {
      if (phase === 'idle' || phase === 'exhale') {
        /* Start inhale */
        phase = 'inhale';
        text.textContent = 'Inhale... 🫁';
        ring.classList.add('breathe-expand');
        ring.classList.remove('breathe-contract');
        timeoutRef = setTimeout(() => {
          /* Hold */
          phase = 'hold';
          text.textContent = 'Hold...';
          timeoutRef = setTimeout(() => {
            /* Exhale */
            phase = 'exhale';
            text.textContent = 'Exhale... 😮‍💨';
            ring.classList.remove('breathe-expand');
            ring.classList.add('breathe-contract');
            timeoutRef = setTimeout(() => {
              breaths++;
              counter.textContent = `${breaths} / ${totalBreaths} breaths`;
              if (breaths >= totalBreaths) {
                text.textContent = '✨ Beautiful!';
                ring.classList.remove('breathe-contract');
                doneBtn.style.display = '';
                doneBtn.addEventListener('click', () => this.complete(), { once: true });
              } else {
                next();
              }
            }, 6000);
          }, 4000);
        }, 4000);
      }
    };

    ring.addEventListener('click', () => { if (phase === 'idle') next(); });
  }

  /* ── MOOD ────────────────────────────────────────────── */
  _renderMood(container) {
    container.innerHTML = `
      <div class="qs-card">
        <div class="qs-emoji" aria-hidden="true">${this.lesson.emoji}</div>
        <h2 class="qs-title">${this.lesson.title}</h2>
        <p class="qs-desc">${this.lesson.desc}</p>

        <div class="qs-mood-grid" role="group" aria-label="Select your mood">
          ${[
            { emoji: '😭', label: 'Very Low',  val: 1 },
            { emoji: '😢', label: 'Low',       val: 2 },
            { emoji: '😐', label: 'Neutral',   val: 3 },
            { emoji: '😊', label: 'Good',      val: 4 },
            { emoji: '😄', label: 'Great',     val: 5 },
          ].map(m => `
            <button class="qs-mood-btn" data-val="${m.val}" aria-label="${m.label}">
              <span class="qs-mood-emoji">${m.emoji}</span>
              <span class="qs-mood-label">${m.label}</span>
            </button>
          `).join('')}
        </div>

        <div class="qs-mood-note-wrap" id="mood-note-wrap" style="display:none">
          <textarea class="clay-input qs-textarea" id="mood-note" rows="3"
            placeholder="Anything on your mind? (optional)"></textarea>
          <button class="clay-btn clay-btn--primary clay-btn--full" id="qs-mood-submit">
            Save Check-In ✨
          </button>
        </div>
      </div>
    `;

    let selectedVal = null;

    container.querySelectorAll('.qs-mood-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.qs-mood-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedVal = parseInt(btn.dataset.val);
        document.getElementById('mood-note-wrap').style.display = '';
        DesignSystem.bounceIn(btn);
      });
    });

    document.getElementById('qs-mood-submit')?.addEventListener('click', () => {
      if (selectedVal !== null) {
        const note = document.getElementById('mood-note')?.value || '';
        // Submission payload'unu doldur — complete() bunu API'ye gönderecek
        this._submission.task_type   = 'mood';
        this._submission.mood_value  = selectedVal;
        this._submission.text_content = note || null;
        this.complete();
      }
    });
  }

  /* ── JOURNAL ─────────────────────────────────────────── */
  _renderJournal(container) {
    const prompt = this.lesson.prompt || 'Write your thoughts here:';
    container.innerHTML = `
      <div class="qs-card">
        <div class="qs-emoji" aria-hidden="true">${this.lesson.emoji}</div>
        <h2 class="qs-title">${this.lesson.title}</h2>
        <p class="qs-desc">${this.lesson.desc}</p>

        <div class="qs-journal-wrap">
          <label class="qs-journal-prompt" for="journal-text">${prompt}</label>
          <textarea class="clay-input qs-textarea qs-textarea--lg" id="journal-text" rows="6"
            placeholder="Start writing here..."></textarea>
          <div class="qs-char-count" id="char-count">0 characters</div>
          <button class="clay-btn clay-btn--primary clay-btn--full" id="qs-journal-submit" disabled>
            Save Journal Entry ✨
          </button>
        </div>
      </div>
    `;

    const textarea  = document.getElementById('journal-text');
    const charCount = document.getElementById('char-count');
    const submitBtn = document.getElementById('qs-journal-submit');

    textarea.addEventListener('input', () => {
      const len = textarea.value.trim().length;
      charCount.textContent = `${len} character${len !== 1 ? 's' : ''} (min 5)`;
      submitBtn.disabled = len < 5;
    });

    submitBtn.addEventListener('click', () => {
      // Submission payload'unu doldur — complete() bunu API'ye gönderecek
      this._submission.task_type    = 'journal';
      this._submission.text_content = textarea.value;
      this.complete();
    });
  }

  /* ── TIMER ───────────────────────────────────────────── */
  _renderTimer(container) {
    const totalSec = this.lesson.duration || 600;

    container.innerHTML = `
      <div class="qs-card">
        <div class="qs-emoji" aria-hidden="true">${this.lesson.emoji}</div>
        <h2 class="qs-title">${this.lesson.title}</h2>
        <p class="qs-desc">${this.lesson.desc}</p>

        <div class="qs-timer-display" role="timer" aria-live="polite">
          <div class="qs-timer-ring" id="timer-ring">
            <svg viewBox="0 0 120 120" class="qs-timer-svg">
              <circle cx="60" cy="60" r="54" class="qs-timer-track"/>
              <circle cx="60" cy="60" r="54" class="qs-timer-fill" id="timer-fill"
                stroke-dasharray="339.3" stroke-dashoffset="0"/>
            </svg>
            <div class="qs-timer-inner">
              <span class="qs-timer-text" id="timer-text">${_fmtTime(totalSec)}</span>
              <span class="qs-timer-sublabel" id="timer-sublabel">Ready</span>
            </div>
          </div>
        </div>

        <div class="qs-timer-actions">
          <button class="clay-btn clay-btn--primary clay-btn--xl" id="qs-timer-start">▶ Start</button>
          <button class="clay-btn clay-btn--ghost" id="qs-timer-reset" style="display:none">↺ Reset</button>
        </div>
      </div>
    `;

    let remaining = totalSec;
    let running   = false;
    const fill    = document.getElementById('timer-fill');
    const text    = document.getElementById('timer-text');
    const sub     = document.getElementById('timer-sublabel');
    const startBtn = document.getElementById('qs-timer-start');
    const resetBtn = document.getElementById('qs-timer-reset');
    const circumference = 2 * Math.PI * 54;

    const updateDisplay = () => {
      text.textContent = _fmtTime(remaining);
      const pct = remaining / totalSec;
      fill.style.strokeDashoffset = circumference * (1 - pct);
    };

    startBtn.addEventListener('click', () => {
      if (!running) {
        running = true;
        startBtn.textContent = '⏸ Pause';
        sub.textContent = 'In progress...';
        resetBtn.style.display = '';
        this.timerRef = setInterval(() => {
          if (remaining <= 0) {
            clearInterval(this.timerRef);
            running = false;
            startBtn.style.display = 'none';
            sub.textContent = 'Complete! 🎉';
            fill.style.strokeDashoffset = 0;
            setTimeout(() => this.complete(), 1200);
            return;
          }
          remaining--;
          updateDisplay();
        }, 1000);
      } else {
        /* Pause */
        running = false;
        clearInterval(this.timerRef);
        startBtn.textContent = '▶ Resume';
        sub.textContent = 'Paused';
      }
    });

    resetBtn.addEventListener('click', () => {
      clearInterval(this.timerRef);
      running    = false;
      remaining  = totalSec;
      startBtn.textContent = '▶ Start';
      sub.textContent = 'Ready';
      updateDisplay();
    });
  }

  /* ── CONFIRM ─────────────────────────────────────────── */
  _renderConfirm(container) {
    container.innerHTML = `
      <div class="qs-card">
        <div class="qs-emoji" aria-hidden="true">${this.lesson.emoji}</div>
        <h2 class="qs-title">${this.lesson.title}</h2>
        <p class="qs-desc">${this.lesson.desc}</p>
        <div class="qs-confirm-area">
          <p class="qs-confirm-prompt">When you have completed this task, tap the button below:</p>
          <button class="clay-btn clay-btn--primary clay-btn--xl" id="qs-confirm-btn">
            ✅ I Did It!
          </button>
        </div>
      </div>
    `;
    document.getElementById('qs-confirm-btn')?.addEventListener('click', () => this.complete());
  }

  /* ── CELEBRATE ───────────────────────────────────────── */
  _renderCelebrate(container) {
    container.innerHTML = `
      <div class="qs-card qs-card--celebrate">
        <div class="qs-celebrate-burst" aria-hidden="true">
          ${Array.from({ length: 12 }, (_, i) =>
            `<div class="qs-confetti qs-confetti--${i}" aria-hidden="true"></div>`
          ).join('')}
        </div>
        <div class="qs-emoji qs-emoji--xl" aria-hidden="true">${this.lesson.emoji}</div>
        <h2 class="qs-title">${this.lesson.title}</h2>
        <p class="qs-desc">${this.lesson.desc}</p>
        <div class="qs-xp-badge">
          <span>⚡</span>
          <span>+${this.lesson.xp} Wellness Points!</span>
        </div>
        <button class="clay-btn clay-btn--primary clay-btn--xl" id="qs-claim-btn">
          🎉 Claim Reward
        </button>
      </div>
    `;
    document.getElementById('qs-claim-btn')?.addEventListener('click', () => this.complete());
    /* Trigger celebration XP burst */
    setTimeout(() => {
      new XPBurst(window.innerWidth / 2, window.innerHeight / 3, this.lesson.emoji).fire(8);
    }, 300);
  }

  /* ── ALREADY COMPLETE ────────────────────────────────── */
  _showAlreadyComplete() {
    const content = document.getElementById('quest-content');
    if (!content) return;
    const banner = document.createElement('div');
    banner.className = 'qs-already-done';
    banner.innerHTML = `✅ You already completed this task! Tap "Back" to return.`;
    content.prepend(banner);
  }

  /* ── COMPLETE ───────────────────────────────────────────── */
  async complete() {
    if (this.completed) return;
    this.completed = true;
    if (this.timerRef) clearInterval(this.timerRef);

    /* XP burst görseli hemen göster (kullanıcı beklemek zorunda kalmasın) */
    new XPBurst(window.innerWidth / 2, window.innerHeight / 2, this.lesson.emoji || '⭐').fire(8);

    /* Backend'e submission gönder + stats güncelle */
    if (typeof API !== 'undefined' && API.isLoggedIn()) {
      try {
        let result;
        if (this.isDaily) {
            result = await API.quests.submitDaily(this.lesson.dailyQuestId, this._submission);
            // Simulate standard structure for local usage
            result.user = {
                streak: StatsPanel.state.streak, // Doesn't change on daily
                hp: StatsPanel.state.hp,
                xp: result.user_xp,
                gems: result.user_gems
            };
            result.xp_awarded = result.xp_awarded;
        } else {
            result = await API.quests.submit(this.lesson.id, this._submission);
            LessonTracker.markComplete(this.lesson.id);
        }

        /* Cache'i backend'deki gerçek değerlerle güncelle */
        if (result.user) {
          StatsPanel._save({
            streak: result.user.streak,
            hp:     result.user.hp,
            xp:     result.user.xp,
            gems:   result.user.gems,
          });
          StatsPanel.update();
        }

        this._showCompletionOverlay(result.xp_awarded || this.lesson.xp);

      } catch (err) {
        console.error('[QuestSolver] submit failed:', err.message);
        /* API hatasında yerel fallback ile devam et */
        this._localComplete();
      }
    } else {
      /* Giriş yapılmamış — localStorage fallback */
      this._localComplete();
    }
  }

  /** API bağlantısı yoksa veya hata alınırsa yerel kayıt yap. */
  _localComplete() {
    LessonTracker.markComplete(this.lesson.id);
    StatsPanel.addXP(this.lesson.xp);
    StatsPanel.incrementStreak();
    this._showCompletionOverlay(this.lesson.xp);
  }

  _showCompletionOverlay(xpAwarded) {
    const overlay = document.getElementById('quest-complete-overlay');
    if (overlay) {
      document.getElementById('overlay-emoji').textContent = this.lesson.emoji;
      document.getElementById('overlay-title').textContent = 'Task Complete!';
      document.getElementById('overlay-xp').textContent = `+${xpAwarded} Wellness Points`;
      overlay.classList.add('open');
    }
  }
}

/* Helper: format seconds as MM:SS */
function _fmtTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

document.addEventListener('DOMContentLoaded', () => {
  /* Back button */
  document.getElementById('btn-back')?.addEventListener('click', App.goBack);

  /* Overlay back button */
  document.getElementById('overlay-back-btn')?.addEventListener('click', () => {
    window.location.href = 'learn.html';
  });

  QuestSolver.init();
});
