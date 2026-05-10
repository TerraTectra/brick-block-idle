(() => {
  "use strict";

  const RUN_KEY = "brick_block_idle_run_v10";
  const META_KEY = "brick_block_idle_meta_v4";
  const CHOICE_KEY = "brick_block_idle_evolution_choice_fix_v2";
  const EVO_LEVELS = [10, 25, 50, 100, 200, 500, 1000];

  const rarity = {
    common: { label: "Обычная", mult: 1, weight: 82.5, color: "#cbd5e1" },
    rare: { label: "Редкая", mult: 1.8, weight: 15, color: "#38bdf8" },
    epic: { label: "Эпическая", mult: 3, weight: 2, color: "#c084fc" },
    legendary: { label: "Легендарная", mult: 5, weight: 0.5, color: "#facc15" },
  };

  const cardPool = [
    { key: "damage", name: "Урон формы", desc: "Постоянно усиливает удар этого шара." },
    { key: "speed", name: "Импульс формы", desc: "Постоянно повышает скорость этого шара." },
    { key: "xp", name: "Боевой опыт", desc: "Этот шар быстрее набирает следующие уровни." },
    { key: "classPower", name: "Классовая техника", desc: "Усиливает архетип через дополнительный evo-ранг." },
    { key: "bossDamage", name: "Охотник на боссов", desc: "Добавляет силу против боссов и толстых целей." },
  ];

  function readJson(key, fallback) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "null");
      return data && typeof data === "object" ? data : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getRun() {
    const run = readJson(RUN_KEY, null);
    return run && Array.isArray(run.balls) ? run : null;
  }

  function setRun(run) {
    if (run && Array.isArray(run.balls)) saveJson(RUN_KEY, run);
  }

  function getMeta() {
    return readJson(META_KEY, { nodes: {} });
  }

  function rareLuckRank() {
    const meta = getMeta();
    return Number(meta.nodes?.rareLuck || 0);
  }

  function getState() {
    const state = readJson(CHOICE_KEY, { opened: null, chosen: {} });
    state.opened = state.opened && typeof state.opened === "object" ? state.opened : null;
    state.chosen = state.chosen && typeof state.chosen === "object" ? state.chosen : {};
    return state;
  }

  function setState(state) {
    saveJson(CHOICE_KEY, state);
  }

  function ballId(ball, index) {
    if (!ball.__bbChoiceFixId) ball.__bbChoiceFixId = String(ball.id || `${ball.form || ball.type || "ball"}_${index}`);
    return ball.__bbChoiceFixId;
  }

  function ballLevel(ball) {
    return Math.max(1, Number(ball.level || ball.lvl || ball.rank || 1));
  }

  function ballLabel(ball, index) {
    const form = String(ball.form || ball.type || ball.name || "шар");
    return `Шар #${index + 1} · ур. ${ballLevel(ball)} · ${form}`;
  }

  function pendingThreshold(ball, state, index) {
    const id = ballId(ball, index);
    const pending = ball.pendingEvolution;
    if (pending) {
      const value = typeof pending === "object" ? Number(pending.level || pending.threshold || pending.stage || 0) : Number(pending);
      if (value && !state.chosen[`${id}:${value}`]) return value;
    }
    const level = ballLevel(ball);
    const evolved = Array.isArray(ball.evolved) ? ball.evolved : [];
    for (const threshold of EVO_LEVELS) {
      if (level >= threshold && !evolved.includes(threshold) && !state.chosen[`${id}:${threshold}`]) return threshold;
    }
    if (level > 1000) {
      const threshold = Math.floor(level / 100) * 100;
      if (!evolved.includes(threshold) && !state.chosen[`${id}:${threshold}`]) return threshold;
    }
    return 0;
  }

  function availableEvolutions(run, state) {
    if (!run) return [];
    return run.balls.map((ball, index) => ({ ball, index, threshold: pendingThreshold(ball, state, index) })).filter((item) => item.threshold);
  }

  function rarityWeights() {
    const luck = Math.max(0, rareLuckRank());
    return {
      common: Math.max(38, 82.5 - luck * 3.2),
      rare: 15 + luck * 2.15,
      epic: 2 + luck * 0.75,
      legendary: 0.5 + luck * 0.3,
    };
  }

  function rollRarity() {
    const weights = rarityWeights();
    const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
    let roll = Math.random() * total;
    for (const key of ["common", "rare", "epic", "legendary"]) {
      roll -= weights[key];
      if (roll <= 0) return key;
    }
    return "common";
  }

  function makeCard(ballIndex, threshold) {
    const base = cardPool[Math.floor(Math.random() * cardPool.length)];
    const tier = rollRarity();
    return { id: `${ballIndex}:${threshold}:${base.key}:${tier}:${Math.random().toString(36).slice(2)}`, ballIndex, threshold, key: base.key, name: base.name, desc: base.desc, tier };
  }

  function openCards(ballIndex, threshold) {
    const state = getState();
    const cards = [];
    while (cards.length < 3) {
      const card = makeCard(ballIndex, threshold);
      if (!cards.some((item) => item.key === card.key)) cards.push(card);
    }
    state.opened = { ballIndex, threshold, cards };
    setState(state);
    render(true);
  }

  function effectValue(card) {
    const mult = rarity[card.tier]?.mult || 1;
    if (card.key === "damage") return 0.14 * mult;
    if (card.key === "speed") return 0.07 * mult;
    if (card.key === "xp") return 0.09 * mult;
    if (card.key === "classPower") return 1 * mult;
    if (card.key === "bossDamage") return 0.12 * mult;
    return 0;
  }

  function applyCard(card) {
    const run = getRun();
    if (!run || !run.balls[card.ballIndex]) return false;
    const ball = run.balls[card.ballIndex];
    const value = effectValue(card);
    if (card.key === "damage") ball.infiniteDamage = Number(ball.infiniteDamage || 0) + value;
    if (card.key === "speed") ball.infiniteSpeed = Number(ball.infiniteSpeed || 0) + value;
    if (card.key === "xp") ball.infiniteXp = Number(ball.infiniteXp || 0) + value;
    if (card.key === "classPower") ball.evo = Number(ball.evo || 0) + Math.max(1, Math.ceil(value));
    if (card.key === "bossDamage") ball.stagePower = Number(ball.stagePower || 0) + value;
    ball.evolved = Array.isArray(ball.evolved) ? ball.evolved : [];
    if (!ball.evolved.includes(card.threshold)) ball.evolved.push(card.threshold);
    const pending = ball.pendingEvolution;
    const pendingValue = pending && (typeof pending === "object" ? Number(pending.level || pending.threshold || pending.stage || 0) : Number(pending));
    if (!pendingValue || pendingValue === card.threshold) ball.pendingEvolution = null;
    setRun(run);
    return true;
  }

  function chooseCard(index) {
    const state = getState();
    if (!state.opened || !state.opened.cards[index]) return;
    const card = state.opened.cards[index];
    if (!applyCard(card)) return;
    const run = getRun();
    const ball = run?.balls?.[card.ballIndex];
    const id = ball ? ballId(ball, card.ballIndex) : String(card.ballIndex);
    state.chosen[`${id}:${card.threshold}`] = card;
    state.opened = null;
    setState(state);
    render(true);
  }

  function cardHtml(card, index) {
    const info = rarity[card.tier] || rarity.common;
    const raw = effectValue(card);
    const power = card.key === "classPower" ? `+${Math.max(1, Math.ceil(raw))} evo` : `+${Math.round(raw * 100)}%`;
    return `<div class="evo-choice" style="border-color:${info.color}"><b style="color:${info.color}">${card.name} · ${info.label}</b><p>${card.desc}</p><small>Сила: ${power}</small><button class="evo-btn" data-direct-evo-pick="${index}">Выбрать</button></div>`;
  }

  function chancesText() {
    const w = rarityWeights();
    const total = w.common + w.rare + w.epic + w.legendary;
    return `Обычная ${Math.round(w.common / total * 1000) / 10}% · Редкая ${Math.round(w.rare / total * 1000) / 10}% · Эпик ${Math.round(w.epic / total * 1000) / 10}% · Лега ${Math.round(w.legendary / total * 1000) / 10}%`;
  }

  function renderLauncher(force = false) {
    const box = document.getElementById("balls");
    const run = getRun();
    if (!box || !run) return;
    const state = getState();
    const available = availableEvolutions(run, state);
    const current = state.opened ? { ball: run.balls[state.opened.ballIndex], index: state.opened.ballIndex, threshold: state.opened.threshold } : available[0];
    const signature = JSON.stringify({ opened: state.opened, available: available.map((item) => [ballId(item.ball, item.index), item.threshold]), chances: chancesText() });
    if (!force && box.dataset.directEvoTopSignature === signature && document.getElementById("evoDirectTop")) return;
    box.dataset.directEvoTopSignature = signature;
    document.getElementById("evoDirectTop")?.remove();

    const top = document.createElement("div");
    top.id = "evoDirectTop";
    top.className = "bb-evo-direct entry";

    if (!current) {
      top.innerHTML = `<b>Усиление архетипа</b><p>Доступных усилений нет. Следующие пороги: 10 / 25 / 50 / 100 / 200 / 500 / 1000.</p><small>${chancesText()}</small>`;
      box.prepend(top);
      return;
    }

    const opened = state.opened && state.opened.ballIndex === current.index && state.opened.threshold === current.threshold;
    top.innerHTML = `<b>Доступное усиление архетипа</b><p>${ballLabel(current.ball, current.index)} · порог ${current.threshold}</p><small>${chancesText()}</small><button class="evo-btn" data-direct-evo-open="${current.index}" data-direct-evo-threshold="${current.threshold}">${opened ? "Карты открыты" : "Открыть 3 карты"}</button>${opened ? `<div class="evo-choices">${state.opened.cards.map(cardHtml).join("")}</div>` : ""}`;
    box.prepend(top);
  }

  function renderRows() {
    const box = document.getElementById("balls");
    const run = getRun();
    if (!box || !run) return;
    const state = getState();
    const rows = Array.from(box.children).filter((node) => !node.classList.contains("bb-evo-direct") && !node.classList.contains("bb-livefix-evo") && node.id !== "evoDirectTop");
    box.querySelectorAll(".bb-evo-direct-row").forEach((node) => node.remove());
    run.balls.forEach((ball, index) => {
      const threshold = pendingThreshold(ball, state, index);
      const row = rows[index];
      if (!threshold || !row) return;
      const wrap = document.createElement("div");
      wrap.className = "bb-evo-direct bb-evo-direct-row entry";
      wrap.innerHTML = `<b>Усиление доступно · ур. ${threshold}</b><button class="evo-btn" data-direct-evo-open="${index}" data-direct-evo-threshold="${threshold}">Открыть выбор</button>`;
      row.after(wrap);
    });
  }

  function render(force = false) {
    renderLauncher(force);
    renderRows();
  }

  document.addEventListener("click", (event) => {
    const pick = event.target.closest?.("[data-direct-evo-pick]");
    if (pick) { event.preventDefault(); event.stopPropagation(); chooseCard(Number(pick.dataset.directEvoPick)); return; }
    const open = event.target.closest?.("[data-direct-evo-open]");
    if (open) { event.preventDefault(); event.stopPropagation(); openCards(Number(open.dataset.directEvoOpen), Number(open.dataset.directEvoThreshold)); }
  }, true);

  window.__brickBlockEvolutionChoiceFix = { render, openCards, chooseCard, rarityWeights };
  window.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => render(true), 500);
    setInterval(() => render(false), 500);
  });
})();
