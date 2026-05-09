(() => {
  "use strict";

  const RUN_KEY = "brick_block_idle_run_v10";
  const LIVE_KEY = "brick_block_idle_livefix_v1";
  const EVO_LEVELS = [10, 25, 50, 100, 200, 500, 1000];
  const SPEED_FIELDS = ["berserkSpeed", "stageSpeed", "speedBonus", "bonusSpeed", "infiniteSpeed"];
  const originalPush = Array.prototype.push;
  const originalSetItem = Storage.prototype.setItem;
  const tracked = new Set();
  const stableVectorByBall = new Map();
  const stableFieldByBall = new Map();
  const MAX_TRACKED = 96;
  const MIN_VECTOR_KEEP_RATIO = 0.92;
  const HARD_MIN_VECTOR_SPEED = 0.35;

  const rarity = {
    common: { label: "Обычная", mult: 1, weight: 68, color: "#cbd5e1" },
    rare: { label: "Редкая", mult: 1.8, weight: 23, color: "#38bdf8" },
    epic: { label: "Эпическая", mult: 3, weight: 7, color: "#c084fc" },
    legendary: { label: "Легендарная", mult: 5, weight: 2, color: "#facc15" },
  };

  const evoCards = [
    { key: "damage", name: "Урон формы", desc: "Повышает постоянную силу удара этого шара." },
    { key: "speed", name: "Импульс формы", desc: "Повышает постоянную скорость этого шара." },
    { key: "xp", name: "Боевой опыт", desc: "Этот шар быстрее набирает следующие уровни." },
    { key: "classPower", name: "Классовая техника", desc: "Усиливает архетип через дополнительный evo-ранг." },
    { key: "bossDamage", name: "Охотник на боссов", desc: "Даёт запас силы против боссов и толстых целей." },
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

  function liveState() {
    const state = readJson(LIVE_KEY, { chosen: {}, opened: null });
    state.chosen = state.chosen && typeof state.chosen === "object" ? state.chosen : {};
    state.opened = state.opened && typeof state.opened === "object" ? state.opened : null;
    return state;
  }

  function isBallLike(value) {
    return value &&
      typeof value === "object" &&
      typeof value.x === "number" &&
      typeof value.y === "number" &&
      typeof value.vx === "number" &&
      typeof value.vy === "number" &&
      !Object.prototype.hasOwnProperty.call(value, "w") &&
      !Object.prototype.hasOwnProperty.call(value, "h");
  }

  function ballLevel(ball) {
    return Math.max(1, Number(ball.level || ball.lvl || ball.rank || 1));
  }

  function ballKey(ball, index = 0) {
    if (!ball.__bbLiveFixId) {
      ball.__bbLiveFixId = String(ball.id ?? `${ball.form || ball.type || "ball"}_${index}_${Math.random().toString(36).slice(2)}`);
    }
    return ball.__bbLiveFixId;
  }

  function speedOf(ball) {
    return Math.hypot(ball.vx || 0, ball.vy || 0);
  }

  function preserveVectorSpeed(ball, target) {
    const speed = speedOf(ball);
    if (speed <= 0.001) return false;
    const scale = target / speed;
    ball.vx *= scale;
    ball.vy *= scale;
    return true;
  }

  function remember(ball) {
    if (!isBallLike(ball)) return;
    if (tracked.size >= MAX_TRACKED && !tracked.has(ball)) return;
    tracked.add(ball);
    const key = ballKey(ball, tracked.size);
    const speed = speedOf(ball);
    if (speed > HARD_MIN_VECTOR_SPEED) stableVectorByBall.set(key, Math.max(stableVectorByBall.get(key) || 0, speed));
  }

  function stabilizeBall(ball, index = 0) {
    if (!isBallLike(ball)) {
      tracked.delete(ball);
      return;
    }

    const key = ballKey(ball, index);
    const speed = speedOf(ball);
    const stableVector = Math.max(stableVectorByBall.get(key) || 0, HARD_MIN_VECTOR_SPEED);

    if (speed > stableVector) stableVectorByBall.set(key, speed);
    else if (speed > 0.001 && speed < stableVector * MIN_VECTOR_KEEP_RATIO) preserveVectorSpeed(ball, stableVector);
    else if (speed <= 0.001) {
      const angle = Math.random() * Math.PI * 2;
      ball.vx = Math.cos(angle) * stableVector;
      ball.vy = Math.sin(angle) * stableVector;
    }

    for (const field of SPEED_FIELDS) {
      if (typeof ball[field] !== "number") continue;
      const fieldKey = `${key}:${field}`;
      const previous = stableFieldByBall.get(fieldKey) || 0;
      if (ball[field] > previous) {
        stableFieldByBall.set(fieldKey, ball[field]);
      } else if (previous > 0 && ball[field] < previous * 0.85) {
        ball[field] = previous;
      }
    }
  }

  function stabilizeRun(run) {
    if (!run || typeof run !== "object" || !Array.isArray(run.balls)) return run;
    run.balls.forEach((ball, index) => {
      if (!isBallLike(ball)) return;
      stabilizeBall(ball, index);
    });
    return run;
  }

  function patchRunPayload(key, value) {
    if (key !== RUN_KEY || typeof value !== "string") return value;
    try {
      return JSON.stringify(stabilizeRun(JSON.parse(value)));
    } catch {
      return value;
    }
  }

  function nextThreshold(ball, id, state) {
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
    for (const [key, item] of Object.entries(rarity)) {
      roll -= item.weight;
      if (roll <= 0) return key;
    }
    return "common";
  }

  function makeCard(ballId, threshold) {
    const base = evoCards[Math.floor(Math.random() * evoCards.length)];
    const tier = rollRarity();
    return { ...base, tier, ballId, threshold, id: `${ballId}:${threshold}:${base.key}:${tier}:${Math.random().toString(36).slice(2)}` };
  }

  function openCards(ballId, threshold) {
    const state = liveState();
    const cards = [];
    while (cards.length < 3) {
      const card = makeCard(ballId, threshold);
      if (!cards.some((item) => item.key === card.key)) cards.push(card);
    }
    state.opened = { ballId, threshold, cards };
    saveJson(LIVE_KEY, state);
    renderEvolutionFallback(true);
  }

  function effectValue(card) {
    const mult = rarity[card.tier]?.mult || 1;
    if (card.key === "damage") return 0.16 * mult;
    if (card.key === "speed") return 0.08 * mult;
    if (card.key === "xp") return 0.12 * mult;
    if (card.key === "classPower") return 1 * mult;
    if (card.key === "bossDamage") return 0.14 * mult;
    return 0;
  }

  function findBall(id) {
    return Array.from(tracked).find((ball, index) => ballKey(ball, index) === id);
  }

  function chooseCard(index) {
    const state = liveState();
    if (!state.opened || !state.opened.cards[index]) return;
    const card = state.opened.cards[index];
    const ball = findBall(card.ballId);
    if (ball) {
      const value = effectValue(card);
      if (card.key === "damage") ball.infiniteDamage = Math.max(Number(ball.infiniteDamage || 0), Number(ball.infiniteDamage || 0) + value);
      if (card.key === "speed") ball.infiniteSpeed = Math.max(Number(ball.infiniteSpeed || 0), Number(ball.infiniteSpeed || 0) + value);
      if (card.key === "xp") ball.infiniteXp = Math.max(Number(ball.infiniteXp || 0), Number(ball.infiniteXp || 0) + value);
      if (card.key === "classPower") ball.evo = Math.max(Number(ball.evo || 0), Number(ball.evo || 0) + Math.ceil(value));
      if (card.key === "bossDamage") ball.stagePower = Math.max(Number(ball.stagePower || 0), Number(ball.stagePower || 0) + value);
      ball.evolved = Array.isArray(ball.evolved) ? ball.evolved : [];
      if (!ball.evolved.includes(card.threshold)) ball.evolved.push(card.threshold);
      if (ball.pendingEvolution && Number(ball.pendingEvolution.level || ball.pendingEvolution) === card.threshold) ball.pendingEvolution = null;
    }
    state.chosen[`${card.ballId}:${card.threshold}`] = card;
    state.opened = null;
    saveJson(LIVE_KEY, state);
    renderEvolutionFallback(true);
  }

  function cardHtml(card, index) {
    const info = rarity[card.tier] || rarity.common;
    const pct = Math.round(effectValue(card) * (card.key === "classPower" ? 1 : 100));
    const power = card.key === "classPower" ? `+${pct} evo` : `+${pct}%`;
    return `<div class="evo-choice" style="border-color:${info.color}"><b style="color:${info.color}">${card.name} · ${info.label}</b><p>${card.desc}</p><small>Сила: ${power}</small><button class="evo-btn" data-live-evo-pick="${index}">Выбрать</button></div>`;
  }

  function renderEvolutionFallback(force = false) {
    const box = document.getElementById("balls");
    if (!box) return;
    const balls = Array.from(tracked).filter(isBallLike);
    const state = liveState();
    const signature = balls.map((ball, index) => `${ballKey(ball, index)}:${ballLevel(ball)}:${nextThreshold(ball, ballKey(ball, index), state)}`).join("|") + JSON.stringify(state.opened || {});
    if (!force && box.dataset.livefixSignature === signature) return;
    box.dataset.livefixSignature = signature;

    box.querySelectorAll(".bb-livefix-evo").forEach((node) => node.remove());
    const rows = Array.from(box.children).filter((node) => !node.classList.contains("bb-livefix-evo"));

    balls.forEach((ball, index) => {
      const row = rows[index];
      if (!row) return;
      const id = ballKey(ball, index);
      const threshold = nextThreshold(ball, id, state);
      if (!threshold) return;
      const opened = state.opened && state.opened.ballId === id && state.opened.threshold === threshold;
      const wrap = document.createElement("div");
      wrap.className = "bb-livefix-evo entry";
      wrap.innerHTML = `<b>Эволюция шара · ур. ${threshold}</b><p>Открой 3 карты и выбери одну. Шансы: обычная 68%, редкая 23%, эпическая 7%, легендарная 2%.</p><button class="evo-btn" data-live-evo-open="${id}" data-live-evo-threshold="${threshold}">${opened ? "Карты открыты" : "Эволюция"}</button>${opened ? `<div class="evo-choices">${state.opened.cards.map(cardHtml).join("")}</div>` : ""}`;
      row.after(wrap);
    });
  }

  Array.prototype.push = function (...items) {
    for (const item of items) remember(item);
    return originalPush.apply(this, items);
  };

  Storage.prototype.setItem = function (key, value) {
    return originalSetItem.call(this, key, patchRunPayload(key, value));
  };

  document.addEventListener("click", (event) => {
    const openButton = event.target.closest?.("[data-live-evo-open]");
    if (openButton) {
      openCards(openButton.dataset.liveEvoOpen, Number(openButton.dataset.liveEvoThreshold));
      return;
    }
    const pickButton = event.target.closest?.("[data-live-evo-pick]");
    if (pickButton) chooseCard(Number(pickButton.dataset.liveEvoPick));
  });

  window.__brickBlockLiveFix = {
    tracked,
    stabilizeNow() {
      Array.from(tracked).forEach(stabilizeBall);
    },
    renderEvolutionFallback,
  };

  setInterval(() => {
    Array.from(tracked).forEach(stabilizeBall);
    renderEvolutionFallback(false);
  }, 350);
})();
