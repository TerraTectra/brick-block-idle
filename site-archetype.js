(() => {
  "use strict";

  const EVO_KEY = "brick_block_idle_ball_evolution_cards_v3";
  const EVO_LEVELS = [10, 25, 50, 100, 200, 500, 1000];

  const rarity = {
    common: { label: "Обычная", mult: 1, weight: 68, color: "#cbd5e1" },
    rare: { label: "Редкая", mult: 1.8, weight: 23, color: "#38bdf8" },
    epic: { label: "Эпическая", mult: 3.0, weight: 7, color: "#c084fc" },
    legendary: { label: "Легендарная", mult: 5.0, weight: 2, color: "#facc15" },
  };

  const cardPool = [
    { key: "damage", name: "Урон формы", desc: "Этот шар получает больше прямого урона." },
    { key: "speed", name: "Импульс формы", desc: "Этот шар быстрее летит и чаще касается блоков." },
    { key: "classPower", name: "Классовая техника", desc: "Классовая особенность формы становится сильнее." },
    { key: "xp", name: "Боевой опыт", desc: "Этот шар быстрее получает уровни." },
    { key: "bossDamage", name: "Охотник на боссов", desc: "Этот шар сильнее бьёт боссов." },
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

  function getState() {
    const state = readJson(EVO_KEY, { chosen: [], opened: null, seen: {}, ballIds: {} });
    state.chosen = Array.isArray(state.chosen) ? state.chosen : [];
    state.opened = state.opened && typeof state.opened === "object" ? state.opened : null;
    state.seen = state.seen && typeof state.seen === "object" ? state.seen : {};
    state.ballIds = state.ballIds && typeof state.ballIds === "object" ? state.ballIds : {};
    return state;
  }

  function setState(state) {
    saveJson(EVO_KEY, state);
  }

  function trackedBalls() {
    const fromUnlimiter = window.__brickBlockObjectUnlimiter?.tracked;
    if (fromUnlimiter && typeof fromUnlimiter.forEach === "function") return Array.from(fromUnlimiter);
    const fromSpeed = window.__brickBlockSpeedGuard?.trackedBalls;
    if (fromSpeed && typeof fromSpeed.forEach === "function") return Array.from(fromSpeed);
    return [];
  }

  function ballId(ball, index) {
    if (ball.__bbBallEvoId) return ball.__bbBallEvoId;
    const form = ball.form || ball.type || ball.name || "ball";
    ball.__bbBallEvoId = `${form}_${index}_${Math.random().toString(36).slice(2)}`;
    return ball.__bbBallEvoId;
  }

  function ballLevel(ball) {
    return Math.max(1, Number(ball.level || ball.lvl || ball.rank || 1));
  }

  function nextAvailableThreshold(ball, id, state) {
    const level = ballLevel(ball);
    for (const threshold of EVO_LEVELS) {
      if (level >= threshold && !state.seen[`${id}:${threshold}`]) return threshold;
    }
    if (level > 1000) {
      const threshold = Math.floor(level / 100) * 100;
      if (!state.seen[`${id}:${threshold}`]) return threshold;
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

  function makeCard(ballIdValue, threshold) {
    const base = cardPool[Math.floor(Math.random() * cardPool.length)];
    const tier = rollRarity();
    return {
      id: `${ballIdValue}_${threshold}_${base.key}_${tier}_${Math.random().toString(36).slice(2)}`,
      ballId: ballIdValue,
      threshold,
      key: base.key,
      name: base.name,
      desc: base.desc,
      tier,
      createdAt: Date.now(),
    };
  }

  function openCards(ballIdValue, threshold) {
    const state = getState();
    const cards = [];
    while (cards.length < 3) {
      const card = makeCard(ballIdValue, threshold);
      if (!cards.some((item) => item.key === card.key)) cards.push(card);
    }
    state.opened = { ballId: ballIdValue, threshold, cards };
    setState(state);
    renderAll();
  }

  function effectValue(card) {
    const r = rarity[card.tier]?.mult || 1;
    if (card.key === "damage") return 0.12 * r;
    if (card.key === "speed") return 0.08 * r;
    if (card.key === "classPower") return 0.10 * r;
    if (card.key === "xp") return 0.11 * r;
    if (card.key === "bossDamage") return 0.14 * r;
    return 0;
  }

  function chooseCard(index) {
    const state = getState();
    if (!state.opened || !state.opened.cards[index]) return;
    const card = state.opened.cards[index];
    state.chosen.push(card);
    state.seen[`${state.opened.ballId}:${state.opened.threshold}`] = true;
    state.opened = null;
    setState(state);
    applyToBalls();
    renderAll();
  }

  function totalsForBall(ballIdValue) {
    const state = getState();
    const out = { damage: 0, speed: 0, classPower: 0, xp: 0, bossDamage: 0 };
    for (const card of state.chosen) {
      if (!card || card.ballId !== ballIdValue) continue;
      out[card.key] = (out[card.key] || 0) + effectValue(card);
    }
    return out;
  }

  function globalTotals() {
    const state = getState();
    const out = { damage: 0, speed: 0, classPower: 0, xp: 0, bossDamage: 0 };
    for (const card of state.chosen) {
      if (!card) continue;
      out[card.key] = (out[card.key] || 0) + effectValue(card);
    }
    return out;
  }

  function applyToBalls() {
    const balls = trackedBalls();
    balls.forEach((ball, index) => {
      const id = ballId(ball, index);
      const boost = totalsForBall(id);
      ball.__bbExternalSpeedMult = 1 + boost.speed;
      ball.__bbArchDamageMult = 1 + boost.damage;
      ball.__bbClassPowerMult = 1 + boost.classPower;
      ball.__bbXpMult = 1 + boost.xp;
      ball.__bbBossDamageMult = 1 + boost.bossDamage;
      if (typeof ball.damage === "number") {
        ball.damage = Math.max(ball.damage, ball.damage * (1 + boost.damage * 0.002));
      }
    });
    window.__brickBlockSpeedGuard?.stabilizeNow?.();
  }

  function rarityText(card) {
    const info = rarity[card.tier] || rarity.common;
    return `<span class="arch-pill" style="background:${info.color}">${info.label}</span>`;
  }

  function renderCards(state, ballIdValue, threshold) {
    if (!state.opened || state.opened.ballId !== ballIdValue || state.opened.threshold !== threshold) return "";
    return `<div class="arch-options">${state.opened.cards.map((card, index) => {
      const value = Math.round(effectValue(card) * 100);
      return `<div class="arch-option ${card.tier}"><h4>${card.name}${rarityText(card)}</h4><p>${card.desc}</p><p>Редкость по шансам · сила +${value}%</p><button class="arch-buy" data-evo-card="${index}">Выбрать карту</button></div>`;
    }).join("")}</div>`;
  }

  function evolutionButtonHtml(ball, index, state) {
    const id = ballId(ball, index);
    const threshold = nextAvailableThreshold(ball, id, state);
    if (!threshold) return `<span class="soft-note">След. эволюция: ${nextThresholdText(ballLevel(ball))}</span>`;
    const isOpen = state.opened && state.opened.ballId === id && state.opened.threshold === threshold;
    return `<button class="arch-buy" data-evo-open="${id}" data-evo-threshold="${threshold}">${isOpen ? "Карты открыты" : `Эволюция ур. ${threshold}`}</button>${renderCards(state, id, threshold)}`;
  }

  function nextThresholdText(level) {
    for (const threshold of EVO_LEVELS) if (level < threshold) return threshold;
    if (level <= 1000) return "1000+";
    return Math.ceil((level + 1) / 100) * 100;
  }

  function renderBallEvolutionPanel() {
    const state = getState();
    const balls = trackedBalls();
    if (!balls.length) {
      return `<div class="arch-card"><h3>Эволюция шаров</h3><p>Жду данные шаров. Если список шаров уже виден, выбор появится после достижения уровня 10.</p></div>`;
    }
    return balls.map((ball, index) => {
      const id = ballId(ball, index);
      const boost = totalsForBall(id);
      return `<div class="arch-card"><h3>Шар #${index + 1} · ур. ${ballLevel(ball)}</h3><p>Эволюции этого шара: урон +${Math.round(boost.damage * 100)}%, скорость +${Math.round(boost.speed * 100)}%, класс +${Math.round(boost.classPower * 100)}%, XP +${Math.round(boost.xp * 100)}%, боссы +${Math.round(boost.bossDamage * 100)}%</p>${evolutionButtonHtml(ball, index, state)}</div>`;
    }).join("");
  }

  function injectIntoBallsPanel() {
    const ballsBox = document.getElementById("balls");
    if (!ballsBox) return;
    const state = getState();
    const balls = trackedBalls();
    if (!balls.length) return;

    const rows = Array.from(ballsBox.children).filter((node) => !node.classList.contains("evo-row-injected"));
    balls.forEach((ball, index) => {
      const row = rows[index];
      if (!row || row.dataset.evoEnhanced === "1") return;
      row.dataset.evoEnhanced = "1";
      const id = ballId(ball, index);
      const threshold = nextAvailableThreshold(ball, id, state);
      if (!threshold) return;
      const wrap = document.createElement("div");
      wrap.className = "evo-row-injected arch-card";
      wrap.innerHTML = `<div class="ui-block-title">Эволюция шара <span>ур. ${threshold}</span></div>${evolutionButtonHtml(ball, index, state)}`;
      row.after(wrap);
    });
  }

  function renderAll() {
    const box = document.getElementById("archetype");
    const state = getState();
    const total = globalTotals();
    if (box) {
      box.innerHTML = `<div class="arch-wrap"><div class="arch-card"><h3>Эволюции шаров</h3><p>Эволюция появляется напротив конкретного шара, когда он достигает уровня 10 / 25 / 50 / 100 / 200 / 500 / 1000. Нажатие открывает 3 карты, выбрать можно одну.</p><p>Шансы: обычная 68%, редкая 23%, эпическая 7%, легендарная 2%.</p></div><div class="arch-card"><h3>Суммарные выбранные бонусы</h3><p>Урон +${Math.round(total.damage * 100)}% · Скорость +${Math.round(total.speed * 100)}% · Класс +${Math.round(total.classPower * 100)}% · XP +${Math.round(total.xp * 100)}% · Боссы +${Math.round(total.bossDamage * 100)}%</p></div>${renderBallEvolutionPanel()}</div>`;
    }
    document.querySelectorAll("[data-evo-open]").forEach((button) => {
      button.addEventListener("click", () => openCards(button.dataset.evoOpen, Number(button.dataset.evoThreshold)));
    });
    document.querySelectorAll("[data-evo-card]").forEach((button) => {
      button.addEventListener("click", () => chooseCard(Number(button.dataset.evoCard)));
    });
    injectIntoBallsPanel();
  }

  window.__brickBlockArchetype = { totals: globalTotals, applyToBalls, renderAll };

  window.addEventListener("DOMContentLoaded", () => {
    renderAll();
    setInterval(() => {
      applyToBalls();
      renderAll();
    }, 1000);
  });
})();
