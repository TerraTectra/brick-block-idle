(() => {
  "use strict";

  const RUN_KEY = "brick_block_idle_run_v10";
  const UNLIMITED_KEY = "brick_block_idle_unlimited_core_v1";

  const upgrades = [
    { id: "damage", name: "Бесконечный урон", base: 120, growth: 1.18, desc: "Каждый ранг навсегда усиливает урон всех шаров. Лимита нет." },
    { id: "speed", name: "Бесконечная скорость", base: 140, growth: 1.2, desc: "Каждый ранг добавляет множитель скорости. Лимита нет." },
    { id: "xp", name: "Бесконечный опыт", base: 110, growth: 1.17, desc: "Каждый ранг ускоряет рост уровней шаров. Лимита нет." },
    { id: "classPower", name: "Бесконечная классовая сила", base: 220, growth: 1.23, desc: "Каждый ранг усиливает классовые эффекты архетипов. Лимита нет." },
    { id: "evo", name: "Бесконечная эволюция", base: 360, growth: 1.26, desc: "Каждый ранг добавляет виртуальные evo-ранги всем шарам. Лимита нет." },
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

  function readFragments() {
    const node = document.getElementById("frags");
    const value = Number((node?.textContent || "0").replace(/[^0-9.,-]/g, "").replace(",", "."));
    return Number.isFinite(value) ? value : 0;
  }

  function getRun() {
    return readJson(RUN_KEY, null);
  }

  function setRun(run) {
    if (run && typeof run === "object") saveJson(RUN_KEY, run);
  }

  function getCore() {
    const core = readJson(UNLIMITED_KEY, { ranks: {} });
    core.ranks = core.ranks && typeof core.ranks === "object" ? core.ranks : {};
    for (const item of upgrades) core.ranks[item.id] = Number(core.ranks[item.id] || 0);
    return core;
  }

  function setCore(core) {
    saveJson(UNLIMITED_KEY, core);
  }

  function costOf(item, rank) {
    return Math.ceil(item.base * Math.pow(item.growth, rank));
  }

  function fmt(value, digits = 0) {
    if (!Number.isFinite(value)) return "0";
    if (value >= 1e12) return (value / 1e12).toFixed(2) + "T";
    if (value >= 1e9) return (value / 1e9).toFixed(2) + "B";
    if (value >= 1e6) return (value / 1e6).toFixed(2) + "M";
    if (value >= 1e3) return (value / 1e3).toFixed(1) + "K";
    return value.toFixed(digits);
  }

  function totals() {
    const core = getCore();
    const dmg = core.ranks.damage;
    const spd = core.ranks.speed;
    const xp = core.ranks.xp;
    const cls = core.ranks.classPower;
    const evo = core.ranks.evo;
    return {
      damageMult: Math.pow(1.085, dmg),
      speedMult: Math.pow(1.055, spd),
      xpMult: Math.pow(1.09, xp),
      classMult: Math.pow(1.1, cls),
      virtualEvo: evo,
      totalRanks: dmg + spd + xp + cls + evo,
    };
  }

  function buy(id) {
    const item = upgrades.find((entry) => entry.id === id);
    if (!item) return;
    const core = getCore();
    const rank = core.ranks[id] || 0;
    const cost = costOf(item, rank);
    const fragments = readFragments();
    if (fragments < cost) return;

    const run = getRun();
    if (run && typeof run === "object") {
      run.fragments = Math.max(0, Number(run.fragments || 0) - cost);
      setRun(run);
    }

    core.ranks[id] = rank + 1;
    setCore(core);
    applyUnlimited();
    render();
  }

  function applyRunPatch() {
    const run = getRun();
    if (!run || typeof run !== "object") return;
    run.level = Math.max(1, Number(run.level || 1));
    run.fragments = Math.max(0, Number(run.fragments || 0));
    run.total = Math.max(Number(run.total || 0), run.fragments);
    run.upgrades = run.upgrades && typeof run.upgrades === "object" ? run.upgrades : { damage: 1, speed: 0, xp: 0 };
    run.upgrades.damage = Math.max(1, Number(run.upgrades.damage || 1));
    run.upgrades.speed = Math.max(0, Number(run.upgrades.speed || 0));
    run.upgrades.xp = Math.max(0, Number(run.upgrades.xp || 0));
    setRun(run);
  }

  function applyUnlimited() {
    applyRunPatch();
    const boost = totals();
    const balls = window.__brickBlockSpeedGuard?.trackedBalls;
    if (!balls) return;
    balls.forEach((ball) => {
      ball.__bbExternalSpeedMult = Math.max(Number(ball.__bbExternalSpeedMult || 1), boost.speedMult);
      ball.__bbUnlimitedDamageMult = boost.damageMult;
      ball.__bbClassPowerMult = Math.max(Number(ball.__bbClassPowerMult || 1), boost.classMult);
      ball.__bbVirtualEvo = boost.virtualEvo;
      if (typeof ball.evo === "number") ball.evo = Math.max(ball.evo, boost.virtualEvo);
      if (typeof ball.level === "number") ball.level = Math.max(1, ball.level);
      if (typeof ball.xp === "number") ball.xp = Math.max(0, ball.xp * boost.xpMult);
      if (typeof ball.damage === "number") ball.damage = Math.max(ball.damage, ball.damage * (1 + (boost.damageMult - 1) * 0.02));
    });
    window.__brickBlockSpeedGuard?.stabilizeNow?.();
  }

  function render() {
    const box = document.getElementById("unlimited");
    if (!box) return;
    const core = getCore();
    const boost = totals();
    const fragments = readFragments();
    const rows = upgrades.map((item) => {
      const rank = core.ranks[item.id] || 0;
      const cost = costOf(item, rank);
      const disabled = fragments < cost ? "disabled" : "";
      return `<div class="unlimited-upgrade"><h3>${item.name} · ранг ${rank}</h3><p>${item.desc}</p><button class="unlimited-buy" data-unlimited-buy="${item.id}" ${disabled}>Купить за ${fmt(cost)} осколков</button></div>`;
    }).join("");

    box.innerHTML = `<div class="unlimited-wrap"><div class="unlimited-card"><h3>Unlimited Core</h3><p>Правило режима: никаких потолков. Уровни, этапы, прокачка, урон, скорость и evo-ранги растут бесконечно. Старые лимиты считаются ранней оболочкой, этот слой их перекрывает.</p></div><div class="unlimited-grid"><div class="unlimited-stat"><small>Рангов всего</small><b>${fmt(boost.totalRanks)}</b></div><div class="unlimited-stat"><small>Урон</small><b>x${fmt(boost.damageMult, 2)}</b></div><div class="unlimited-stat"><small>Скорость</small><b>x${fmt(boost.speedMult, 2)}</b></div><div class="unlimited-stat"><small>Вирт. evo</small><b>${fmt(boost.virtualEvo)}</b></div></div>${rows}</div>`;
    box.querySelectorAll("[data-unlimited-buy]").forEach((button) => button.addEventListener("click", () => buy(button.dataset.unlimitedBuy)));
  }

  window.__brickBlockUnlimited = { getCore, totals, applyUnlimited };

  window.addEventListener("DOMContentLoaded", () => {
    render();
    setInterval(() => {
      applyUnlimited();
      render();
    }, 1000);
  });
})();
