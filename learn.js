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
    'shop':         'panel-shop',
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
  static items    = [];
  static activeId = 'learn';

  static NAV_DATA = [
    { id: 'learn',        icon: '🌿', label: 'Learn'        },
    { id: 'chess',        icon: '♟️', label: 'Chess'        },
    { id: 'matches',      icon: '⚔️', label: 'Matches'      },
    { id: 'leaderboards', icon: '🏆', label: 'Leaderboards' },
    { id: 'quests',       icon: '🗺️', label: 'Quests'       },
    { id: 'shop',         icon: '🛍️', label: 'Shop'         },
    { id: 'profile',      icon: '👤', label: 'Profile'      },
    { id: 'more',         icon: '⚙️', label: 'More'         },
  ];

  static init(container) {
    SidebarNav.items = SidebarNav.NAV_DATA.map(data =>
      new NavItem({ ...data, isActive: data.id === SidebarNav.activeId })
    );
    SidebarNav.items.forEach(item => container.appendChild(item.el));
  }

  static setActive(id) {
    SidebarNav.activeId = id;
    SidebarNav.items.forEach(item => item.setActive(item.id === id));
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
  static items    = [];
  static activeId = 'learn';

  static NAV_DATA = [
    { id: 'learn',   icon: '🌿', label: 'Learn'   },
    { id: 'chess',   icon: '♟️', label: 'Chess'   },
    { id: 'quests',  icon: '🗺️', label: 'Quests'  },
    { id: 'stats',   icon: '📊', label: 'Stats'   },
    { id: 'profile', icon: '👤', label: 'Profile' },
  ];

  static init(container) {
    MobileNav.items = MobileNav.NAV_DATA.map(data =>
      new MobileNavItem({ ...data, isActive: data.id === MobileNav.activeId })
    );
    MobileNav.items.forEach(item => container.appendChild(item.el));
  }

  static setActive(id) {
    MobileNav.activeId = id;
    MobileNav.items.forEach(item => item.setActive(item.id === id));
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
  constructor({ id, icon, label, reward, current, total }) {
    this.id      = id;
    this.icon    = icon;
    this.label   = label;
    this.reward  = reward;
    this.current = current;
    this.total   = total;
    this.el      = this._render();
  }

  _render() {
    const card = document.createElement('div');
    card.className       = 'quest-card';
    card.dataset.questId = this.id;
    this._update(card);
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
   QUEST MANAGER
   ============================================================ */
class QuestManager {
  static quests = [];

  static QUEST_DATA = [
    { id: 'q1', icon: '🌅', label: 'Complete a breathing task',  reward: '+10 💎', current: 1,  total: 3  },
    { id: 'q2', icon: '📝', label: 'Journal for 3 days',         reward: '+20 💎', current: 1,  total: 3  },
    { id: 'q3', icon: '💬', label: 'Connect with someone',        reward: '+15 💎', current: 0,  total: 1  },
    { id: 'q4', icon: '🌿', label: 'Maintain your streak',        reward: '+5 💎',  current: 3,  total: 5  },
  ];

  static init(containerIds) {
    QuestManager.quests = QuestManager.QUEST_DATA.map(d => new QuestCard(d));
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
   LEADERBOARD PANEL
   ============================================================ */
class LeaderboardPanel {
  static ENTRIES = [
    { rank: 1, avatar: '🌸', name: 'MindfulMaya',   xp: 4820 },
    { rank: 2, avatar: '🦋', name: 'CalmSeeker',    xp: 4110 },
    { rank: 3, avatar: '🌿', name: 'ZenWalker',     xp: 3980 },
    { rank: 4, avatar: '💧', name: 'You',            xp: StatsPanel.state.xp, isMe: true },
    { rank: 5, avatar: '🌺', name: 'PeacefulMind',  xp: 2890 },
  ];

  static init(container) {
    if (!container) return;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:8px;';
    LeaderboardPanel.ENTRIES.forEach(data => {
      wrap.appendChild(new LeaderboardEntry(data).el);
    });
    container.appendChild(wrap);
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
    if (lesson) App.goToQuest(lesson.id);
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
document.addEventListener('DOMContentLoaded', () => {
  /* Left sidebar nav */
  const sidebarNav = document.getElementById('sidebar-nav');
  if (sidebarNav) SidebarNav.init(sidebarNav);

  /* Mobile bottom nav */
  const mobileNav = document.getElementById('mobile-bottom-nav');
  if (mobileNav) MobileNav.init(mobileNav);

  /* Show learn panel by default */
  PanelManager.show('learn');

  /* Node path */
  const canvas = document.getElementById('node-path-canvas');
  if (canvas) PathManager.init(canvas);

  /* Quests */
  QuestManager.init(['daily-quests-list', 'mobile-drawer-quests']);

  /* Leaderboard preview */
  LeaderboardPanel.init(document.getElementById('leaderboard-preview'));

  /* Drawer */
  MobileDrawer.init();
  _buildMobileDrawerContent();

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
    <button class="clay-btn clay-btn--ghost clay-btn--full" onclick="App.navigate('login')">Sign In / Create Profile</button>
  `;
  StatsPanel.update();
}
