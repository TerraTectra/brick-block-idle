(() => {
  "use strict";

  const ARCH_KEY = "brick_block_idle_archetype_evolution_choices_v2";
  const EVO_LEVELS = [10, 25, 50, 100, 200, 500, 1000];

  const rarity = {
    common: { label: "Обычное", mult: 1, weight: 68, color: "#cbd5e1" },
    rare: { label: "Редкое", mult: 1.8, weight: 23, color: "#38bdf8" },
    epic: { label: "Эпическое", mult: 3.0, weight: 7, color: "#c084fc" },
    legendary: { label: "Легендарное", mult: 5.0, weight: 2, color: "#facc15" },
  };

  const archetypePool = [
    { key: "damage", name: "Усиление урона", desc: "Архетип получает больше прямого урона." },
    { key: "speed", name: "Усиление скорости", desc: "Архетип быстрее разгоняется и чаще касается блоков." },
    { key: "classPower", name: "Усиление способности", desc: "Классовая особенность архетипа становится сильнее." },
    { key: "xp", name: "Усиление опыта", desc: "Шары быстрее набирают уровни после ударов." },
    { key: "bossDamage", name: "Урон по боссам", desc: "Архетип наносит больше урона боссам." },
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
    const state = readJson(ARCH_KEY, { chosen: [], pending: null, seen: {}, totals: {} });
    state.chosen = Array.isArray(state.chosen) ? state.chosen : [];
    state.pending = state.pending && typeof state.pending === "object" ? state.pending : null;
    state.seen = state.seen && typeof state.seen === "object" ? state.seen : {};
    state.totals = state.totals && typeof state.totals === "object" ? state.totals : {};
    return state;
  }

  function setState(state) {
    saveJson(ARCH_KEY, state);
  }

  function fmt(value) {
    value = Number(value || 0);
    if (value >= 1000) return (value / 1000).toFixed(1) + "K";
    return Math.round(value).toString();
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

  function effectValue(choice) {
    const r = rarity[choice.tier]?.mult || 1;
    if (choice.key === "damage") return 0.12 * r;
    if (choice.key === "speed") return 0.08 * r;
    if (choice.key === "classPower") return 0.10 * r;
    if (choice.key === "xp") return 0.11 * r;
    if (choice.key === "bossDamage") return 0.14 * r;
    return 0;
  }

  function totals() {
    const state = getState();
    const out = { damage: 0, speed: 0, classPower: 0, xp: 0, bossDamage: 0 };
    for (const choice of state.chosen) {
      if (!choice || !choice.key) continue;
      out[choice.key] = (out[choice.key] || 0) + effectValue(choice);
    }
    state.totals = out;
    setState(state);
    return out;
  }

  function makeChoice(trigger) {
    const base = archetypePool[Math.floor(Math.random() * archetypePool.length)];
    const tier = rollRarity();
    return {
      id: `${trigger.ballId}_${trigger.level}_${base.key}_${tier}_${Math.random().toString(36).slice(2)}`,
      key: base.key,
      name: base.name,
      desc: base.desc,
      tier,
      level: trigger.level,
      ballId: trigger.ballId,
      createdAt: Date.now(),
    };
  }

  function makePending(trigger) {
    const picked = [];
    while (picked.length < 3) {
      const choice = makeChoice(trigger);
      if (!picked.some((item) => item.key === choice.key)) picked.push(choice);
    }
    return {
      trigger,
      choices: picked,
    };
  }

  function ballId(ball, index) {
    if (!ball.__bbArchId) ball.__bbArchId = `ball_${index}_${Math.random().toString(36).slice(2)}`;
    return ball.__bbArchId;
  }

  function trackedBalls() {
    const fromUnlimiter = window.__brickBlockObjectUnlimiter?.tracked;
    if (fromUnlimiter && typeof fromUnlimiter.forEach === "function") return Array.from(fromUnlimiter);
    const fromSpeed = window.__brickBlockSpeedGuard?.trackedBalls;
    if (fromSpeed && typeof fromSpeed.forEach === "function") return Array.from(fromSpeed);
    return [];
  }

  function evolutionThreshold(level) {
    let threshold = 0;
    for (const evoLevel of EVO_LEVELS) {
      if (level >= evoLevel) threshold = evoLevel;
    }
    if (level > 1000) threshold = Math.floor(level / 100) * 100;
    return threshold;
  }

  function detectEvolutionChoice() {
    const state = getState();
    if (state.pending) return;

    const balls = trackedBalls();
    balls.forEach((ball, index) => {
      if (state.pending) return;
      const level = Number(ball.level || 0);
      const threshold = evolutionThreshold(level);
      if (!threshold) return;
      const id = ballId(ball, index);
      const seenKey = `${id}:${threshold}`;
      if (state.seen[seenKey]) return;
      state.seen[seenKey] = true;
      state.pending = makePending({ ballId: id, level: threshold });
      setState(state);
    });
  }

  function choose(index) {
    const state = getState();
    if (!state.pending || !state.pending.choices[index]) return;
    const choice = state.pending.choices[index];
    state.chosen.push(choice);
    state.pending = null;
    setState(state);
    applyToBalls();
    render();
  }

  function applyToBalls() {
    const boost = totals();
    const balls = trackedBalls();
    balls.forEach((ball) => {
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

  function renderPending(state) {
    if (!state.pending) {
      return `<div class="arch-card"><h3>Эволюционный выбор</h3><p>Новый выбор появится, когда шар достигнет уровня эволюции: 10 / 25 / 50 / 100 / 200 / 500 / 1000, дальше каждые 100 уровней.</p></div>`;
    }

    const trigger = state.pending.trigger;
    const cards = state.pending.choices.map((choice, index) => {
      const info = rarity[choice.tier] || rarity.common;
      const value = Math.round(effectValue(choice) * 100);
      return `<div class="arch-option ${choice.tier}"><h4>${choice.name}<span class="arch-pill">${info.label}</span></h4><p>${choice.desc}</p><p>Эволюция: уровень ${trigger.level} · Сила: +${value}%</p><button class="arch-buy" data-arch-choice="${index}">Выбрать</button></div>`;
    }).join("");

    return `<div class="arch-card"><h3>Выбор эволюции</h3><p>Шар достиг порога эволюции ${trigger.level}. Выбери одно усиление. Редкость выпала по шансам.</p></div><div class="arch-options">${cards}</div>`;
  }

  function renderHistory(state) {
    const latest = state.chosen.slice(-8).reverse();
    if (!latest.length) return `<div class="arch-card"><h3>История усилений</h3><p>Пока нет выбранных эволюционных усилений.</p></div>`;
    return `<div class="arch-card"><h3>Последние усиления</h3>${latest.map((choice) => {
      const info = rarity[choice.tier] || rarity.common;
      return `<p><b style="color:${info.color}">${choice.name}</b> · ${info.label} · ур. ${choice.level}</p>`;
    }).join("")}</div>`;
  }

  function render() {
    const box = document.getElementById("archetype");
    if (!box) return;
    const state = getState();
    const boost = totals();
    box.innerHTML = `<div class="arch-wrap"><div class="arch-card"><h3>Архетипные эволюции</h3><p>Это не магазин. Усиления выпадают только при прокачке эволюции шара. Редкость: обычное 68%, редкое 23%, эпическое 7%, легендарное 2%.</p></div><div class="arch-card"><h3>Текущие бонусы</h3><p>Урон: +${Math.round(boost.damage * 100)}% · Скорость: +${Math.round(boost.speed * 100)}% · Класс: +${Math.round(boost.classPower * 100)}% · XP: +${Math.round(boost.xp * 100)}% · Боссы: +${Math.round(boost.bossDamage * 100)}%</p></div>${renderPending(state)}${renderHistory(state)}</div>`;
    box.querySelectorAll("[data-arch-choice]").forEach((button) => {
      button.addEventListener("click", () => choose(Number(button.dataset.archChoice)));
    });
  }

  window.__brickBlockArchetype = { totals, applyToBalls, detectEvolutionChoice };

  window.addEventListener("DOMContentLoaded", () => {
    render();
    setInterval(() => {
      detectEvolutionChoice();
      applyToBalls();
      render();
    }, 1000);
  });
})();
