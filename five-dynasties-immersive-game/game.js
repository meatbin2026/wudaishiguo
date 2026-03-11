(function () {
  const DATA = window.GAME_DATA;
  const Engine = window.GAME_ENGINE;
  if (!DATA || !Engine) return;

  const screens = {
    intro: document.getElementById('screen-intro'),
    roles: document.getElementById('screen-roles'),
    story: document.getElementById('screen-story'),
    ending: document.getElementById('screen-ending')
  };

  const roleGrid = document.getElementById('roles-grid');
  const startBtn = document.getElementById('btn-start');
  const continueBtn = document.getElementById('btn-continue');
  const backIntroBtn = document.getElementById('btn-back-intro');
  const backRolesBtn = document.getElementById('btn-back-roles');
  const resetBtn = document.getElementById('btn-reset');
  const toggleStatsBtn = document.getElementById('btn-toggle-stats');

  const statusRole = document.getElementById('status-role');
  const statusChapter = document.getElementById('status-chapter');
  const statsPanel = document.getElementById('stats-panel');
  const storyLocation = document.getElementById('story-location');
  const storyTitle = document.getElementById('story-title');
  const storyText = document.getElementById('story-text');
  const quoteSpeaker = document.getElementById('quote-speaker');
  const quoteText = document.getElementById('quote-text');
  const optionsEl = document.getElementById('options');
  const chronicleList = document.getElementById('chronicle-list');
  const endingTitle = document.getElementById('ending-title');
  const endingText = document.getElementById('ending-text');
  const restartBtn = document.getElementById('btn-restart');

  const SAVE_KEY = 'five_dynasties_save_v1';

  let state = null;
  let statsOpen = true;

  function showScreen(name) {
    Object.values(screens).forEach((el) => el.classList.remove('active'));
    screens[name].classList.add('active');
  }

  function save() {
    if (!state) return;
    localStorage.setItem(SAVE_KEY, Engine.serializeState(state));
  }

  function loadSave() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
      return Engine.restoreState(raw);
    } catch (err) {
      return null;
    }
  }

  function clearSave() {
    localStorage.removeItem(SAVE_KEY);
  }

  function initState(role) {
    state = {
      roleId: role.id,
      route: role.route,
      chapterIndex: 0,
      stats: { ...role.stats },
      flags: {},
      log: [],
      nodeId: null,
      ended: false
    };
  }

  function addLog(entry) {
    state.log.unshift(entry);
    if (state.log.length > 6) state.log.length = 6;
  }

  function renderStats() {
    statsPanel.innerHTML = '';
    statsPanel.style.display = statsOpen ? 'grid' : 'none';
    if (!statsOpen) return;
    DATA.stats.forEach((stat) => {
      const value = state.stats[stat.key] ?? 0;
      const item = document.createElement('div');
      item.className = 'stat-item';
      item.innerHTML = `
        <div class="stat-head">
          <span class="stat-label">${stat.label}</span>
          <span class="stat-value">${value}</span>
        </div>
        <div class="stat-bar">
          <span style="width:${value}% ; background:${stat.color}"></span>
        </div>
      `;
      statsPanel.appendChild(item);
    });
  }

  function renderChronicle() {
    chronicleList.innerHTML = '';
    if (!state.log.length) {
      const li = document.createElement('li');
      li.textContent = '尚未落笔。';
      chronicleList.appendChild(li);
      return;
    }
    state.log.forEach((entry) => {
      const li = document.createElement('li');
      li.textContent = entry;
      chronicleList.appendChild(li);
    });
  }

  function renderStory() {
    const role = DATA.roles.find((r) => r.id === state.roleId);
    statusRole.textContent = role ? role.name : '—';
    statusChapter.textContent = `第 ${state.chapterIndex + 1} 回 · ${DATA.chapters[state.chapterIndex].title}`;

    const chapter = DATA.chapters[state.chapterIndex];
    const node = Engine.chooseNode(chapter, state);
    state.nodeId = node.id;

    storyLocation.textContent = node.location;
    storyTitle.textContent = node.title;

    storyText.innerHTML = '';
    node.text.forEach((line) => {
      const p = document.createElement('p');
      p.textContent = line;
      storyText.appendChild(p);
    });

    quoteSpeaker.textContent = node.speaker || '旁白';
    quoteText.textContent = node.quote || node.text[0];

    optionsEl.innerHTML = '';
    node.options.forEach((opt, index) => {
      const btn = document.createElement('button');
      btn.className = 'option-card';
      const hint = Engine.formatEffects(opt.effects);
      btn.innerHTML = `
        <div class="option-title">${opt.text}</div>
        <div class="option-meta">${opt.hint || hint}</div>
      `;
      btn.addEventListener('click', () => chooseOption(opt, index));
      optionsEl.appendChild(btn);
    });

    renderStats();
    renderChronicle();
  }

  function chooseOption(option, index) {
    const chapter = DATA.chapters[state.chapterIndex];
    const node = chapter.nodes.find((n) => n.id === state.nodeId);
    Engine.applyOption(state, option);
    addLog(`${DATA.chapters[state.chapterIndex].title}：${option.text}`);

    if (state.chapterIndex >= DATA.chapters.length - 1) {
      const ending = Engine.pickEnding(state, DATA);
      renderEnding(ending);
      save();
      return;
    }

    state.chapterIndex += 1;
    renderStory();
    save();
  }

  function renderEnding(ending) {
    state.ended = true;
    endingTitle.textContent = ending.title;
    endingText.innerHTML = '';
    ending.text.forEach((line) => {
      const p = document.createElement('p');
      p.textContent = line;
      endingText.appendChild(p);
    });
    showScreen('ending');
  }

  function renderRoles() {
    roleGrid.innerHTML = '';
    DATA.roles.forEach((role) => {
      const card = document.createElement('button');
      card.className = 'role-card';
      card.type = 'button';
      card.innerHTML = `
        <div class="role-name">${role.name}</div>
        <div class="role-title">${role.title}</div>
        <div class="role-desc">${role.desc}</div>
        <div class="role-route">${Engine.routeLabel(role.route)}</div>
        <div class="role-stats">
          ${DATA.stats.map((stat) => `
            <div class="role-stat">
              <span>${stat.label}</span>
              <em>${role.stats[stat.key]}</em>
            </div>
          `).join('')}
        </div>
      `;
      card.addEventListener('click', () => {
        initState(role);
        showScreen('story');
        renderStory();
        save();
      });
      roleGrid.appendChild(card);
    });
  }

  function boot() {
    const saved = loadSave();
    if (!saved) {
      continueBtn.disabled = true;
      continueBtn.classList.add('disabled');
    }

    renderRoles();

    startBtn.addEventListener('click', () => showScreen('roles'));
    backIntroBtn.addEventListener('click', () => showScreen('intro'));
    backRolesBtn.addEventListener('click', () => showScreen('roles'));
    restartBtn.addEventListener('click', () => {
      clearSave();
      showScreen('roles');
    });
    resetBtn.addEventListener('click', () => {
      clearSave();
      showScreen('roles');
    });
    toggleStatsBtn.addEventListener('click', () => {
      statsOpen = !statsOpen;
      renderStats();
    });

  continueBtn.addEventListener('click', () => {
    const savedState = loadSave();
    if (!savedState) return;
    state = savedState;
    if (state.ended || state.chapterIndex >= DATA.chapters.length) {
      const ending = Engine.pickEnding(state, DATA);
      renderEnding(ending);
      return;
    }
    showScreen('story');
    renderStory();
  });

    window.addEventListener('keydown', (event) => {
      if (!screens.story.classList.contains('active')) return;
      const idx = Number(event.key) - 1;
      if (Number.isNaN(idx) || idx < 0) return;
      const chapter = DATA.chapters[state.chapterIndex];
      const node = Engine.chooseNode(chapter, state);
      const option = node.options[idx];
      if (option) chooseOption(option, idx);
    });
  }

  boot();
})();
