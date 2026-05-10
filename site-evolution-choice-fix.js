(() => {
  "use strict";

  const RUN_KEY = "brick_block_idle_run_v10";
  const CHOICE_KEY = "brick_block_idle_evolution_choice_fix_v1";
  const EVO_LEVELS = [10, 25, 50, 100, 200, 500, 1000];

  const rarity = {
    common: { label: "Обычная", mult: 1, weight: 68, color: "#cbd5e1" },
    rare: { label: "Редкая", mult: 1.8, weight: 23, color: "#38bdf8" },
    epic: { label: "Эпическая", mult: 3, weight: 7, color: "#c084fc" },
    legendary: { label: "Легендарная", mult: 5, weight: 2, color: "#facc15" },
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

  function rollRarity() {
    const total = Object.values(rarity).reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;
    for (const [key, info] of Object.entries(rarity)) {
      roll -= info.weight;
      if (roll <= 0) return key;
    }
    return "common";
  }

  function makeCard(ballIndex, threshold) {
    const base = cardPool[Math.floor(Math.random() * cardPool.length)];
    const tier = rollRarity();
    return {
      id: `${ballIndex}:${threshold}:${base.key}:${tier}:${Math.random().toString(36).slice(2)}`,
      ballIndex,
      threshold,
      key: base.key,
      name: base.name,
      desc: base.desc,
      tier,
    };
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
    if (card.key === "damage") return 0.18 * mult;
    if (card.key === "speed") return 0.1 * mult;
    if (card.key === "xp") return 0.14 * mult;
    if (card.key === "classPower") return 1 * mult;
    if (card.key === "bossDamage") return 0.16 * mult;
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

  function rows() {
    const box = document.getElementById("balls");
    if (!box) return [];
    return Array.from(box.children).filter((node) => !node.classList.contains("bb-evo-direct") && !node.classList.contains("bb-livefix-evo"));
  }

  function cardHtml(card, index) {
    const info = rarity[card.tier] || rarity.common;
    const raw = effectValue(card);
    const power = card.key === "classPower" ? `+${Math.max(1, Math.ceil(raw))} evo` : `+${Math.round(raw * 100)}%`;
    return `<div class="evo-choice" style="border-color:${info.color}"><b style="color:${info.color}">${card.name} · ${info.label}</b><p>${card.desc}</p><small>Сила: ${power}</small><button class="evo-btn" data-direct-evo-pick="${index}">Выбрать</button></div>`;
  }

  function render(force = false) {
    const box = document.getElementById("balls");
    const run = getRun();
    if (!box || !run) return;
    const state = getState();
    const currentRows = rows();
    const signature = run.balls.map((ball, index) => `${ballId(ball, index)}:${ballLevel(ball)}:${pendingThreshold(ball, state, index)}:${JSON.stringify(ball.evolved || [])}`).join("|") + JSON.stringify(state.opened || {});
    const expected = run.balls.filter((ball, index) => pendingThreshold(ball, state, index)).length;
    const existing = box.querySelectorAll(".bb-evo-direct").length;
    if (!force && existing >= expected && box.dataset.directEvoSignature === signature) return;
    box.dataset.directEvoSignature = signature;
    box.querySelectorAll(".bb-evo-direct").forEach((node) => node.remove());

    run.balls.forEach((ball, index) => {
      const row = currentRows[index];
      if (!row) return;
      const threshold = pendingThreshold(ball, state, index);
      if (!threshold) return;
      const opened = state.opened && state.opened.ballIndex === index && state.opened.threshold === threshold;
      const wrap = document.createElement("div");
      wrap.className = "bb-evo-direct entry";
      wrap.innerHTML = `<b>Усиление архетипа · ур. ${threshold}</b><p>Открывает 3 карты. Выбрать можно только одну.</p><button class="evo-btn" data-direct-evo-open="${index}" data-direct-evo-threshold="${threshold}">${opened ? "Карты открыты" : "Открыть выбор"}</button>${opened ? `<div class="evo-choices">${state.opened.cards.map(cardHtml).join("")}</div>` : ""}`;
      row.after(wrap);
    });
  }

  document.addEventListener("click", (event) => {
    const pick = event.target.closest?.("[data-direct-evo-pick]");
    if (pick) {
      event.preventDefault();
      event.stopPropagation();
      chooseCard(Number(pick.dataset.directEvoPick));
      return;
    }

    const open = event.target.closest?.("[data-direct-evo-open]");
    if (open) {
      event.preventDefault();
      event.stopPropagation();
      openCards(Number(open.dataset.directEvoOpen), Number(open.dataset.directEvoThreshold));
      return;
    }

    const nativeButton = event.target.closest?.("#balls button");
    if (nativeButton && /усил|эволюц|выбор/i.test(nativeButton.textContent || "")) {
      const currentRows = rows();
      const row = currentRows.find((item) => item.contains(nativeButton));
      const index = currentRows.indexOf(row);
      const run = getRun();
      const state = getState();
      const threshold = run?.balls?.[index] ? pendingThreshold(run.balls[index], state, index) : 0;
      if (index >= 0 && threshold) {
        event.preventDefault();
        event.stopPropagation();
        openCards(index, threshold);
      }
    }
  }, true);

  window.__brickBlockEvolutionChoiceFix = { render, openCards, chooseCard };
  window.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => render(true), 400);
    setInterval(() => render(false), 500);
  });
})();
