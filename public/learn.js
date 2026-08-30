/**
 * ============================================================
 * DOLPHY — learn.js
 * Loaded ONLY by app.html. Manages the learning path UI,
 * sidebar navigation, quests, leaderboard, chess init.
 * ============================================================
 * Depends on: app.js (ThemeManager, DesignSystem, XPBurst,
 *             StatsPanel, LessonTracker, App, LESSON_DATA)
 * ============================================================
 */

"use strict";

/* ============================================================
   PANEL MANAGER — Controls which content panel is visible
   ============================================================ */
class PanelManager {
  static currentPanel = 'learn';

  static PANEL_MAP = {
    'learn':        'panel-learn',
    'chess':        'panel-chess',
    'matches':      'panel-matches',
    'leaderboards': 'panel-leaderboards',
    'quests':       'panel-quests',
    'profile':      'panel-profile',
    'more':         'panel-more',
  };

  static show(id) {
    document.querySelectorAll('.content-panel').forEach(p => p.style.display = 'none');
    const panelId = PanelManager.PANEL_MAP[id];
    if (!panelId) return;
    const panel = document.getElementById(panelId);
    if (panel) panel.style.display = '';
    PanelManager.currentPanel = id;

    if (id === 'chess' && !ChessGame.initialized) {
      ChessGame.init(panel);
    }
  }
}

/* ============================================================
   NAV ITEM — Left sidebar navigation button
   ============================================================ */
class NavItem {
  constructor({ id, icon, label, isActive = false }) {
    this.id       = id;
    this.icon     = icon;
    this.label    = label;
    this.isActive = isActive;
    this.el       = this._render();
  }

  _render() {
    const btn = document.createElement('button');
    btn.className  = `nav-item${this.isActive ? ' active' : ''}`;
    btn.dataset.id = this.id;
    btn.setAttribute('aria-label', this.label);
    btn.innerHTML  = `
      <span class="nav-item__icon" aria-hidden="true">${this.icon}</span>
      <span class="nav-item__label">${this.label}</span>
    `;
    btn.addEventListener('click', () => {
      if (this.id === 'profile') {
        window.location.href = 'profil.html';
        return;
      }
      SidebarNav.setActive(this.id);
      MobileNav.setActive(this.id);
      PanelManager.show(this.id);
    });
    return btn;
  }

  setActive(active) {
    this.isActive = active;
    this.el.classList.toggle('active', active);
  }
}

/* ============================================================
   SIDEBAR NAV
   ============================================================ */
class SidebarNav {
  static setActive(id) {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });
  }
}

/* ============================================================
   MOBILE NAV ITEM
   ============================================================ */
class MobileNavItem {
  constructor({ id, icon, label, isActive = false }) {
    this.id       = id;
    this.icon     = icon;
    this.label    = label;
    this.isActive = isActive;
    this.el       = this._render();
  }

  _render() {
    const btn = document.createElement('button');
    btn.className  = `mobile-nav-item${this.isActive ? ' active' : ''}`;
    btn.dataset.id = this.id;
    btn.setAttribute('aria-label', this.label);
    btn.innerHTML  = `<span class="mobile-nav-icon" aria-hidden="true">${this.icon}</span><span>${this.label}</span>`;
    btn.addEventListener('click', () => {
      if (this.id === 'profile') { window.location.href = 'profil.html'; return; }
      if (this.id === 'stats') { App.openDrawer && App.openDrawer('stats'); MobileDrawer.openDrawer(); return; }
      MobileNav.setActive(this.id);
      SidebarNav.setActive(this.id);
      PanelManager.show(this.id);
    });
    return btn;
  }

  setActive(active) {
    this.isActive = active;
    this.el.classList.toggle('active', active);
  }
}

/* ============================================================
   MOBILE NAV
   ============================================================ */
class MobileNav {
  static setActive(id) {
    document.querySelectorAll('.mobile-nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });
  }
}

/* ============================================================
   NODE BUTTON — Individual learning path node
   ============================================================ */
class NodeButton {
  static STATES = Object.freeze({
    LOCKED:     'locked',
    AVAILABLE:  'available',
    COMPLETED:  'completed',
    BOSS:       'boss',
    CHECKPOINT: 'checkpoint',
  });

  /* Decorative side emojis (mental health / nature theme) */
  static DECO = ['🌸','✨','🦋','🌿','💫','🌈','🎵','🌺','🍃','🌻','🌊','🦢','⭐','🫧','🕊️','🌾'];

  constructor({ id, state, offset, lesson, index }) {
    this.id     = id;
    this.state  = state;
    this.offset = offset;
    this.lesson = lesson;
    this.index  = index;
    this.el     = this._render();
  }

  /** Emoji to display on the node based on state */
  _getNodeEmoji() {
    if (this.state === NodeButton.STATES.COMPLETED)  return '✅';
    return this.lesson?.emoji || '⭐';
  }

  _render() {
    const wrapper = document.createElement('div');
    wrapper.className = 'node-row';
    wrapper.setAttribute('role', 'listitem');
    wrapper.style.position = 'relative';

    /* Spacer (invisible — used only for layout height, SVG draws the line) */
    if (this.index > 0) {
      const spacer = document.createElement('div');
      spacer.className = 'node-spacer';
      spacer.setAttribute('aria-hidden', 'true');
      wrapper.appendChild(spacer);
    }

    /* Node button */
    const btn = document.createElement('button');
    btn.className = ['node-btn', `node-btn--${this.state}`, `node-offset--${this.offset}`].join(' ');
    btn.setAttribute('aria-label', this.lesson?.title || `Task ${this.id}`);
    btn.dataset.nodeId = this.id;

    /* START tooltip for available node */
    if (this.state === NodeButton.STATES.AVAILABLE) {
      const tooltip = document.createElement('div');
      tooltip.className = 'node-tooltip';
      tooltip.textContent = 'START';
      tooltip.setAttribute('aria-hidden', 'true');
      btn.appendChild(tooltip);
    }

    /* Emoji icon */
    const icon = document.createElement('span');
    icon.className = 'node-btn__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = this._getNodeEmoji();
    btn.appendChild(icon);

    /* Click handlers */
    if (this.state !== NodeButton.STATES.LOCKED) {
      btn.addEventListener('click', (e) => this._handleClick(e, btn));
    } else {
      btn.addEventListener('click', () => DesignSystem.shake(btn));
    }

    wrapper.appendChild(btn);
    this._btn = btn;

    /* Decorative side emoji (opposite side from node offset) */
    this._addDecoEmoji(wrapper);

    return wrapper;
  }

  _addDecoEmoji(wrapper) {
    const deco = document.createElement('div');
    deco.className = 'node-deco-emoji';
    deco.setAttribute('aria-hidden', 'true');
    deco.textContent = NodeButton.DECO[this.index % NodeButton.DECO.length];
    deco.style.animationDelay = `${(this.index * 0.37) % 2}s`;

    /* Place on the opposite side from the node */
    if (this.offset === 'left') {
      deco.style.right = '12px';
      deco.style.left  = 'auto';
    } else if (this.offset === 'right') {
      deco.style.left  = '12px';
      deco.style.right = 'auto';
    } else {
      /* center node — alternate sides */
      if (this.index % 2 === 0) { deco.style.left = '8px'; }
      else                       { deco.style.right = '8px'; }
    }

    wrapper.appendChild(deco);
  }

  _handleClick(e, btn) {
    const rect = btn.getBoundingClientRect();
    new XPBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, this.lesson?.emoji || '⭐').fire(4);
    LessonModal.open(this.lesson);
  }

  markCompleted() {
    this.state = NodeButton.STATES.COMPLETED;
    this._btn.className = this._btn.className.replace(/node-btn--\w+/, `node-btn--${this.state}`);
    const icon = this._btn.querySelector('.node-btn__icon');
    if (icon) icon.textContent = '✅';
    const tooltip = this._btn.querySelector('.node-tooltip');
    if (tooltip) tooltip.remove();
    DesignSystem.bounceIn(this._btn);
  }
}

/* ============================================================
   NODE PATH — Sinuous path with SVG diagonal connectors
   ============================================================ */
class NodePath {
  static OFFSETS = ['center', 'right', 'right', 'center', 'left', 'left', 'center'];

  constructor(container, lessons, completedCount) {
    this.container      = container;
    this.lessons        = lessons;
    this.completedCount = completedCount;
    this.nodes          = [];
    this._build();
  }

  _getState(index) {
    if (index < this.completedCount)   return NodeButton.STATES.COMPLETED;
    if (index === this.completedCount) return NodeButton.STATES.AVAILABLE;
    return NodeButton.STATES.LOCKED;
  }

  _getNodeState(lesson, index) {
    const base = this._getState(index);
    if (base !== NodeButton.STATES.LOCKED && lesson.type === 'boss')       return NodeButton.STATES.BOSS;
    if (base !== NodeButton.STATES.LOCKED && lesson.type === 'checkpoint') return NodeButton.STATES.CHECKPOINT;
    return base;
  }

  _build() {
    this.container.innerHTML = '';
    this.nodes = [];

    this.lessons.forEach((lesson, i) => {
      const state  = this._getNodeState(lesson, i);
      const offset = NodePath.OFFSETS[i % NodePath.OFFSETS.length];
      const node   = new NodeButton({ id: lesson.id, state, offset, lesson, index: i });
      this.nodes.push(node);
      this.container.appendChild(node.el);
    });

    /* Draw SVG connectors after layout is settled (double rAF for safety) */
    requestAnimationFrame(() => requestAnimationFrame(() => this._drawConnectors()));
  }

  /**
   * _drawConnectors — Draws an SVG dashed line between every consecutive
   * pair of node button centers, producing diagonal lines that faithfully
   * follow the zigzag offset pattern.
   */
  _drawConnectors() {
    const old = this.container.querySelector('.path-svg');
    if (old) old.remove();

    if (this.nodes.length < 2) return;

    const canvasH = this.container.scrollHeight;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('path-svg');
    svg.setAttribute('width',  '100%');
    svg.setAttribute('height', canvasH);
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = `position:absolute;top:0;left:0;width:100%;height:${canvasH}px;pointer-events:none;z-index:0;overflow:visible;`;

    /** Get element center relative to this.container using offsetTop/offsetLeft walk */
    const getCenterRelToContainer = (el) => {
      let x = el.offsetLeft + el.offsetWidth  / 2;
      let y = el.offsetTop  + el.offsetHeight / 2;
      let parent = el.offsetParent;
      while (parent && parent !== this.container) {
        x += parent.offsetLeft;
        y += parent.offsetTop;
        parent = parent.offsetParent;
      }
      return { x, y };
    };

    for (let i = 1; i < this.nodes.length; i++) {
      const prevBtn = this.nodes[i - 1]._btn;
      const currBtn = this.nodes[i]._btn;
      if (!prevBtn || !currBtn) continue;

      const p1 = getCenterRelToContainer(prevBtn);
      const p2 = getCenterRelToContainer(currBtn);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', p1.x);
      line.setAttribute('y1', p1.y);
      line.setAttribute('x2', p2.x);
      line.setAttribute('y2', p2.y);
      line.setAttribute('stroke',          'rgba(128,90,200,0.35)');
      line.setAttribute('stroke-width',    '5');
      line.setAttribute('stroke-dasharray','12 9');
      line.setAttribute('stroke-linecap',  'round');
      svg.appendChild(line);
    }

    /* Prepend so nodes render on top */
    this.container.style.position = 'relative';
    this.container.prepend(svg);
  }

  completeNode(nodeId) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node || node.state === NodeButton.STATES.LOCKED) return;

    node.markCompleted();
    this.completedCount++;
    LessonTracker.markComplete(nodeId);

    const nextNode = this.nodes[this.completedCount];
    if (nextNode) {
      nextNode.state = NodeButton.STATES.AVAILABLE;
      nextNode._btn.className = nextNode._btn.className.replace(/node-btn--\w+/, `node-btn--${NodeButton.STATES.AVAILABLE}`);
      /* Re-add tooltip */
      const tooltip = document.createElement('div');
      tooltip.className = 'node-tooltip';
      tooltip.textContent = 'START';
      nextNode._btn.prepend(tooltip);
      const icon = nextNode._btn.querySelector('.node-btn__icon');
      if (icon) icon.textContent = nextNode.lesson?.emoji || '⭐';
      nextNode._btn.addEventListener('click', (e) => nextNode._handleClick(e, nextNode._btn));
      DesignSystem.bounceIn(nextNode._btn);
    }

    /* Redraw connectors to reflect new state */
    requestAnimationFrame(() => requestAnimationFrame(() => this._drawConnectors()));
  }
}

/* ============================================================
   PATH MANAGER — Section/Unit management (mental health themed)
   ============================================================ */
class PathManager {
  static currentSection = 1;
  static currentUnit    = 1;
  static nodePath       = null;
  static canvas         = null;

  static sections = [
    { section: 1, unit: 1, title: 'Daily Wellness Foundations',   lessons: LESSON_DATA },
    { section: 2, unit: 1, title: 'Building Inner Resilience',     lessons: LESSON_DATA.slice(0, 8) },
    { section: 3, unit: 1, title: 'Advanced Mindfulness Practice', lessons: LESSON_DATA.slice(0, 6) },
  ];

  static get current() {
    return PathManager.sections.find(
      s => s.section === PathManager.currentSection && s.unit === PathManager.currentUnit
    ) || PathManager.sections[0];
  }

  static init(canvas) {
    PathManager.canvas = canvas;
    PathManager._render();
  }

  static _render() {
    const sec        = PathManager.current;
    const labelEl    = document.getElementById('banner-label');
    const titleEl    = document.getElementById('banner-title');
    const completed  = Math.min(LessonTracker.getCompletedCount(), sec.lessons.length - 1);

    if (labelEl) labelEl.textContent = `SECTION ${sec.section}, UNIT ${sec.unit}`;
    if (titleEl) titleEl.textContent = sec.title;

    PathManager.nodePath = new NodePath(PathManager.canvas, sec.lessons, completed);
  }

  static nextSection() {
    if (PathManager.currentSection < PathManager.sections.length) {
      PathManager.currentSection++;
      PathManager._render();
    }
  }

  static prevSection() {
    if (PathManager.currentSection > 1) {
      PathManager.currentSection--;
      PathManager._render();
    }
  }

  static completeLesson(lessonId) {
    PathManager.nodePath?.completeNode(lessonId);
    StatsPanel.addXP(15);
  }
}

/* ============================================================
   QUEST CARD — Individual daily quest display
   ============================================================ */
class QuestCard {
  constructor({ id, icon, label, reward, xp, current, total }) {
    this.id      = id;
    this.icon    = icon;
    this.label   = label;
    this.reward  = reward;
    this.xp      = xp;
    this.current = current;
    this.total   = total;
    this.el      = this._render();
  }

  _render() {
    const card = document.createElement('div');
    card.className       = 'quest-card';
    card.dataset.questId = this.id;
    card.style.cursor    = 'pointer'; // Make it look clickable
    this._update(card);
    
    card.addEventListener('click', () => {
      // Don't open modal if already completed
      if (this.current >= this.total) return;
      
      const isDaily = this.id.startsWith('q-daily-');
      const realId = this.id.replace('q-daily-', '').replace('q-', '');
      
      // Fake a lesson object for the modal
      const fakeLesson = {
        id: this.id, // e.g. q-daily-5
        title: this.label,
        taskType: this.task_type || 'breathe',
        emoji: this.icon,
        desc: `Complete this daily quest to earn ${this.reward}`,
        xp: this.xp || 10,
        isDailyQuest: true,
        questDbId: realId
      };
      
      LessonModal.open(fakeLesson);
    });
    
    return card;
  }

  _update(card) {
    const pct      = Math.min((this.current / this.total) * 100, 100);
    const complete = this.current >= this.total;
    card.innerHTML = `
      <div class="quest-card__top">
        <div class="quest-card__icon-label">
          <div class="quest-card__icon" aria-hidden="true">${this.icon}</div>
          <span class="quest-card__label">${this.label}</span>
        </div>
        <span class="quest-card__reward">${this.reward}</span>
      </div>
      <div class="quest-progress-bar" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100">
        <div class="quest-progress-fill ${complete ? 'quest-progress-fill--complete' : ''}" style="width:${pct}%"></div>
      </div>
      <div class="quest-card__progress-label">
        <span>${this.current}/${this.total}</span>
        <span>${complete ? '✅ Done!' : 'In progress'}</span>
      </div>
    `;
  }

  increment(amount = 1) {
    this.current = Math.min(this.current + amount, this.total);
    this._update(this.el);
    DesignSystem.bounceIn(this.el);
  }
}

/* ============================================================
   QUEST MANAGER — Dynamic from backend
   ============================================================ */
class QuestManager {
  static quests = [];

  static async init(containerIds) {
    let submissions = [];
    let userStreak = 0;
    let dailyQuests = [];
    try {
      if (API.isLoggedIn()) {
        submissions = await API.quests.mySubmissions();
        const me = StatsPanel.state;
        userStreak = me.streak || 0;
        dailyQuests = await API.quests.getDaily();
      }
    } catch (e) {
      console.warn('[QuestManager] Submission sync failed:', e.message);
    }

    /* If backend fails or not logged in, show placeholders */
    if (!dailyQuests || dailyQuests.length === 0) {
      dailyQuests = [
        { id: 'q-breathe', icon: '🌅', label: 'Nefes egzersizi yap', reward_gems: 10, task_type: 'breathe', target: 3 },
        { id: 'q-journal', icon: '📝', label: '3 gün günlük yaz', reward_gems: 20, task_type: 'journal', target: 3 },
        { id: 'q-streak',  icon: '🌿', label: 'Serisini koru (5 gün)', reward_gems: 5,  task_type: '_streak', target: 5 },
      ];
    }

    /* Calculate completed task type amounts */
    const counts = {};
    submissions.forEach(s => {
      counts[s.task_type] = (counts[s.task_type] || 0) + 1;
    });

    QuestManager.quests = dailyQuests.map(def => {
      const current = def.task_type === '_streak'
        ? Math.min(userStreak, def.target)
        : Math.min(counts[def.task_type] || 0, def.target);
      return new QuestCard({
        id: `q-daily-${def.id || def.task_type}`,
        icon: def.icon,
        label: def.label,
        reward: `+${def.reward_gems} 💎`,
        xp: def.reward_xp,
        current: current,
        total: def.target
      });
    });
    
    // Attach task_type to the card instances for the click handler
    QuestManager.quests.forEach((q, idx) => {
        q.task_type = dailyQuests[idx].task_type;
    });

    containerIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;gap:10px;';
      QuestManager.quests.forEach(q => wrap.appendChild(q.el));
      el.appendChild(wrap);
    });
  }
}

/* ============================================================
   LEADERBOARD ENTRY
   ============================================================ */
class LeaderboardEntry {
  static RANK_CLASSES = { 1: 'lb-rank--gold', 2: 'lb-rank--silver', 3: 'lb-rank--bronze' };

  constructor({ rank, avatar, name, xp, isMe = false }) {
    this.rank = rank; this.avatar = avatar;
    this.name = name; this.xp    = xp; this.isMe = isMe;
    this.el   = this._render();
  }

  _render() {
    const div = document.createElement('div');
    div.className = `leaderboard-entry${this.isMe ? ' leaderboard-entry--me' : ''}`;
    const rankClass = LeaderboardEntry.RANK_CLASSES[this.rank] || '';
    div.innerHTML = `
      <span class="lb-rank ${rankClass}">${this.rank}</span>
      <div class="lb-avatar" aria-hidden="true">${this.avatar}</div>
      <span class="lb-name">${this.name}${this.isMe ? ' (You)' : ''}</span>
      <span class="lb-xp">${this.xp.toLocaleString()} pts</span>
    `;
    return div;
  }
}

/* ============================================================
   LEADERBOARD PANEL (sağ sidebar önizleme, API'dan)
   ============================================================ */
class LeaderboardPanel {
  static AVATARS = ['🌸','🦋','🌿','💧','🌺','🌟','💫','✨','🌈','🐬'];

  static async init(container) {
    if (!container) return;
    container.innerHTML = '<div class="lb-loading">⏳ Loading...</div>';
    try {
      const entries = await API.leaderboard.top(5);
      const myName  = StatsPanel.state.name || '';

      container.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

      entries.forEach((e, i) => {
        const isMe = !!myName && e.name === myName;
        const avatar = LeaderboardPanel.AVATARS[i % LeaderboardPanel.AVATARS.length];
        wrap.appendChild(new LeaderboardEntry({ rank: e.rank, avatar, name: e.name, xp: e.xp, isMe }).el);
      });
      container.appendChild(wrap);
    } catch (err) {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:12px;padding:8px">Leaderboard failed to load.</p>';
    }
  }
}

/* ============================================================
   LESSON MODAL — Preview popup before going to quest.html
   ============================================================ */
class LessonModal {
  static currentLesson = null;

  static open(lesson) {
    if (!lesson) return;
    LessonModal.currentLesson = lesson;

    const modal = document.getElementById('lesson-modal');
    const card  = document.getElementById('lesson-modal-card');
    if (!modal || !card) return;

    card.innerHTML = `
      <div class="lesson-modal-emoji" aria-hidden="true">${lesson.emoji}</div>
      <h2 class="lesson-modal-title">${lesson.title}</h2>
      <p class="lesson-modal-desc">${lesson.desc.split('.')[0]}.</p>
      <div class="lesson-modal-xp">
        <span aria-hidden="true">⚡</span>
        <span>+${lesson.xp} Wellness Points</span>
      </div>
      <div class="lesson-modal-actions">
        <button class="clay-btn clay-btn--ghost" style="flex:1" onclick="LessonModal.close()">Not Now</button>
        <button class="clay-btn clay-btn--primary" style="flex:2" onclick="LessonModal.startTask()">Start Task 🚀</button>
      </div>
    `;

    modal.classList.add('open');
  }

  static startTask() {
    const lesson = LessonModal.currentLesson;
    LessonModal.close();
    if (lesson) {
      if (lesson.isDailyQuest) {
        window.location.href = `quest.html?dailyQuest=${encodeURIComponent(lesson.questDbId)}`;
      } else {
        App.goToQuest(lesson.id);
      }
    }
  }

  static close() {
    document.getElementById('lesson-modal')?.classList.remove('open');
    LessonModal.currentLesson = null;
  }
}

/* ============================================================
   MOBILE DRAWER — Bottom sheet
   ============================================================ */
class MobileDrawer {
  static drawer  = null;
  static overlay = null;

  static init() {
    MobileDrawer.drawer  = document.getElementById('stats-drawer');
    MobileDrawer.overlay = document.getElementById('drawer-overlay');

    const overlay = document.getElementById('drawer-overlay');
    if (overlay) overlay.addEventListener('click', MobileDrawer.closeDrawer);
  }

  static openDrawer() {
    MobileDrawer.drawer?.classList.add('open');
    MobileDrawer.overlay?.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  static closeDrawer() {
    MobileDrawer.drawer?.classList.remove('open');
    MobileDrawer.overlay?.classList.remove('visible');
    document.body.style.overflow = '';
  }
}

/* ============================================================
   APP PAGE INIT — DOMContentLoaded for app.html
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  /* Left sidebar nav and Mobile bottom nav are now static HTML in app.html */

  /* Automatically detect the current page's panel and show it */
  const activePanel = document.querySelector('.content-panel');
  if (activePanel) {
    const pageId = activePanel.id.replace('panel-', '');
    PanelManager.show(pageId);
    if (pageId === 'leaderboards') {
      _loadFullLeaderboard();
    }
  }

  /* Node path — önce cache'den (hızlı ilk boyama), sonra backend'den
     gerçek "hangi lesson'lar tamamlandı" verisini bekleyip yeniden çizeriz.
     (app.js'deki LessonTracker.syncFromAPI() bunu asenkron ve "fire and
     forget" şekilde çağırıyor; ona sadece güvenmek burada bir yarış
     durumuna yol açıyordu — path, DB'deki gerçek ilerleme gelmeden,
     boş/eski cache ile çiziliyor ve BİR DAHA yeniden çizilmiyordu.) */
  const canvas = document.getElementById('node-path-canvas');
  if (canvas) {
    PathManager.init(canvas);
    if (typeof API !== 'undefined' && API.isLoggedIn()) {
      await LessonTracker.syncFromAPI();
      PathManager._render();
    }
  }

  /* Drawer — önce drawer içeriğini oluştur ki mobile-drawer-quests DOM'da olsun */
  MobileDrawer.init();
  _buildMobileDrawerContent();

  /* Quests (async — API'dan dinamik; drawer zaten oluştuktan sonra çağrılıyor) */
  QuestManager.init(['daily-quests-list', 'mobile-drawer-quests', 'quests-page-list']);

  /* Sağ sidebar leaderboard preview (API'dan) */
  LeaderboardPanel.init(document.getElementById('leaderboard-preview'));

  /* Lesson modal close on overlay click */
  const lessonModal = document.getElementById('lesson-modal');
  if (lessonModal) lessonModal.addEventListener('click', (e) => {
    if (e.target === lessonModal) LessonModal.close();
  });

  /* Close drawer button */
  document.getElementById('btn-close-drawer')?.addEventListener('click', MobileDrawer.closeDrawer);

  /* Mobile stats chip → open drawer */
  document.querySelectorAll('.stat-chip').forEach(chip => {
    chip.addEventListener('click', MobileDrawer.openDrawer);
  });

  /* Leaderboards panel açılınca API'dan yükle */
  document.querySelectorAll('[data-id="leaderboards"], .nav-item[aria-label="Leaderboards"]').forEach(btn => {
    btn.addEventListener('click', () => _loadFullLeaderboard());
  });
});

function _buildMobileDrawerContent() {
  const body = document.getElementById('stats-drawer-body');
  if (!body) return;
  body.innerHTML = `
    <div class="right-card">
      <div class="right-card__header"><h3>My Progress</h3></div>
      <div class="stats-grid">
        <div class="stats-item stats-item--streak"><div class="stats-item__icon">🪴</div>
          <div class="stats-item__info"><span class="stats-item__val" id="md-streak">—</span><span class="stats-item__label">Day Streak</span></div></div>
        <div class="stats-item stats-item--hp"><div class="stats-item__icon">🍵</div>
          <div class="stats-item__info"><span class="stats-item__val" id="md-hp">—</span><span class="stats-item__label">Peace Tea</span></div></div>
        <div class="stats-item stats-item--xp"><div class="stats-item__icon">⚡</div>
          <div class="stats-item__info"><span class="stats-item__val" id="md-xp">—</span><span class="stats-item__label">Wellness Pts</span></div></div>
        <div class="stats-item stats-item--gems"><div class="stats-item__icon">💎</div>
          <div class="stats-item__info"><span class="stats-item__val" id="md-gems">—</span><span class="stats-item__label">Gems</span></div></div>
      </div>
    </div>
    <div class="right-card">
      <div class="right-card__header"><h3>Daily Quests</h3></div>
      <div id="mobile-drawer-quests"></div>
    </div>
  `;
  StatsPanel.update();
}

/* ============================================================
   FULL LEADERBOARD PANEL (İç panel — API'dan)
   ============================================================ */
async function _loadFullLeaderboard() {
  const container = document.getElementById('lb-full-list');
  if (!container) return;
  container.innerHTML = '<div class="lb-loading">⏳ Loading...</div>';
  try {
    const entries = await API.leaderboard.top(20);
    const myName  = StatsPanel.state.name || '';
    const AVATARS = ['🌸','🦋','🌿','💧','🌺','🌟','💫','✨','🌈','🐬','🎕','🐢','🦦','🍎','🌊','🚲','🎂','🦁','🧊','🐊'];
    container.innerHTML = '';
    if (!entries.length) {
      container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:24px">🚀 No users registered yet!</p>';
      return;
    }
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:10px;';
    entries.forEach((e, i) => {
      const isMe  = !!myName && e.name === myName;
      const avatar = AVATARS[i % AVATARS.length];
      const div = document.createElement('div');
      div.className = `leaderboard-entry${isMe ? ' leaderboard-entry--me' : ''}`;
      const RANK_CLASSES = { 1:'lb-rank--gold', 2:'lb-rank--silver', 3:'lb-rank--bronze' };
      div.innerHTML = `
        <span class="lb-rank ${RANK_CLASSES[e.rank] || ''}">${e.rank}</span>
        <div class="lb-avatar" aria-hidden="true">${avatar}</div>
        <span class="lb-name">${e.name}${isMe ? ' (You)' : ''}</span>
        <div style="margin-left:auto;text-align:right">
          <span class="lb-xp">${e.xp.toLocaleString()} pts</span>
          <div style="font-size:11px;color:var(--text-muted)">🪴 ${e.streak} day streak</div>
        </div>
      `;
      wrap.appendChild(div);
    });
    container.appendChild(wrap);
  } catch (err) {
    container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:24px">❌ Leaderboard failed to load.</p>';
  }
}


