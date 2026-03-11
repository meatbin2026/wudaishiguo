(function (global) {
  const STAT_KEYS = ['reputation', 'silver', 'military', 'public', 'strategy', 'prestige', 'loyalty', 'power'];

  function clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, value));
  }

  function applyEffects(base, delta = {}) {
    const next = { ...base };
    Object.keys(delta).forEach((key) => {
      next[key] = clamp((next[key] || 0) + delta[key]);
    });
    return next;
  }

  function applyFlags(flags, change) {
    const next = { ...flags };
    if (!change) return next;
    (change.set || []).forEach((f) => { next[f] = true; });
    (change.clear || []).forEach((f) => { delete next[f]; });
    return next;
  }

  function checkRequires(state, requires) {
    if (!requires) return true;
    if (requires.flags) {
      for (const f of requires.flags) {
        if (!state.flags[f]) return false;
      }
    }
    if (requires.notFlags) {
      for (const f of requires.notFlags) {
        if (state.flags[f]) return false;
      }
    }
    if (requires.stats) {
      for (const key of Object.keys(requires.stats)) {
        const rule = requires.stats[key];
        const value = state.stats[key] || 0;
        if (rule.gte !== undefined && value < rule.gte) return false;
        if (rule.lte !== undefined && value > rule.lte) return false;
      }
    }
    return true;
  }

  function chooseNode(chapter, state) {
    const candidates = chapter.nodes.filter((n) => n.route === state.route || n.route === 'any');
    for (const node of candidates) {
      if (checkRequires(state, node.requires)) return node;
    }
    return candidates[0] || chapter.nodes[0];
  }

  function applyOption(state, option) {
    state.stats = applyEffects(state.stats, option.effects);
    state.flags = applyFlags(state.flags, option.flags);
    if (option.routeShift) state.route = option.routeShift;
  }

  function pickEnding(state, data) {
    const candidates = data.endings.filter((e) => e.route === state.route || e.route === 'any');
    for (const ending of candidates) {
      if (checkRequires(state, ending.requires)) return ending;
    }
    return candidates[0] || data.endings[0];
  }

  function serializeState(state) {
    return JSON.stringify(state);
  }

  function restoreState(raw) {
    return JSON.parse(raw);
  }

  function formatEffects(effects = {}) {
    const map = {
      reputation: '声望',
      silver: '银两',
      military: '军势',
      public: '民心',
      strategy: '谋略',
      prestige: '威望',
      loyalty: '忠诚',
      power: '势力'
    };
    const parts = [];
    Object.keys(effects).forEach((key) => {
      const val = effects[key];
      if (!val) return;
      const sign = val > 0 ? '+' : '';
      parts.push(`${map[key]}${sign}${val}`);
    });
    return parts.length ? parts.join(' · ') : '局势暗动';
  }

  function routeLabel(route) {
    const map = {
      military: '军镇争霸线',
      court: '内廷权谋线',
      fiscal: '江淮财赋线',
      scholar: '江南士人线'
    };
    return map[route] || route;
  }

  const api = {
    STAT_KEYS,
    applyEffects,
    applyFlags,
    chooseNode,
    applyOption,
    pickEnding,
    serializeState,
    restoreState,
    formatEffects,
    routeLabel
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global.GAME_ENGINE = api;
  }
})(typeof window !== 'undefined' ? window : global);
