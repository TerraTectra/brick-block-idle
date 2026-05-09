(() => {
  "use strict";

  const RUN_KEY = "brick_block_idle_run_v10";
  const BOSS_KEY = "brick_block_idle_boss_meta_v1";
  const EARLY_KEY = "brick_block_idle_early_boost_v1";

  const bossNodes = [
    { id: "autoBoss", name: "Автобой с боссом", cost: 1, desc: "После 100 этапа босс-награды начисляются без ручного подтверждения. Первый капитальный комфорт-апгрейд." },
    { id: "evoMaster", name: "Мастер эволюции", cost: 2, desc: "При выборе эволюции редкие варианты появляются заметно чаще. Капитально ускоряет рост шаров." },
    { id: "deepStart", name: "Глубокий старт", cost: 3, desc: "Новый забег должен стартовать заметно бодрее: больше ранних ресурсов и меньше мёртвого ожидания." },
    { id: "bossCore", name: "Ядро босса", cost: 5, desc: "Каждый босс даёт +1 дополнительное очко босса. Дорогой, но ключевой snowball для второй меты." },
    { id: "legendGate", name: "Легендарные врата", cost: 8, desc: "Позже этот узел откроет особые легендарные стартовые условия и редкие формы." },
  ];

  function readLevel() {
    const node = document.getElementById("level");
    const value = Number((node?.textContent || "1").replace(/[^0-9]/g, ""));
    return Number.isFinite(value) && value > 0 ? value : 1;
  }

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

  function getBossMeta() {
    const meta = readJson(BOSS_KEY, { points: 0, earned: 0, claimed: {}, nodes: {} });
    meta.points = Number(meta.points || 0);
    meta.earned = Number(meta.earned || 0);
    meta.claimed = meta.claimed && typeof meta.claimed === "object" ? meta.claimed : {};
    meta.nodes = meta.nodes && typeof meta.nodes === "object" ? meta.nodes : {};
    return meta;
  }

  function setBossMeta(meta) {
    saveJson(BOSS_KEY, meta);
  }

  function bossReward(stage, meta) {
    const base = Math.max(1, Math.floor(stage / 100));
    const bonus = meta.nodes.bossCore ? 1 : 0;
    return base + bonus;
  }

  function claimBoss(stage, auto = false) {
    if (stage < 100 || stage % 100 !== 0) return false;
    const meta = getBossMeta();
    if (meta.claimed[stage]) return false;
    const reward = bossReward(stage, meta);
    meta.claimed[stage] = true;
    meta.points += reward;
    meta.earned += reward;
    setBossMeta(meta);
    toast(`${auto ? "Авто-босс" : "Босс"} этапа ${stage} повержен: +${reward} очк. босса`);
    renderBossPanel();
    return true;
  }

  function toast(text) {
    const log = document.getElementById("log");
    if (!log) return;
    const line = document.createElement("div");
    line.className = "entry";
    line.textContent = text;
    log.prepend(line);
  }

  function buyBossNode(id) {
    const node = bossNodes.find((item) => item.id === id);
    if (!node) return;
    const meta = getBossMeta();
    if (meta.nodes[id]) return;
    if (meta.points < node.cost) return;
    meta.points -= node.cost;
    meta.nodes[id] = true;
    setBossMeta(meta);
    applyEarlyBoost(true);
    toast(`Капитальный апгрейд куплен: ${node.name}`);
    renderBossPanel();
  }

  function nextBoss(level, meta) {
    const next = Math.ceil(Math.max(1, level + 1) / 100) * 100;
    if (!meta.claimed[next]) return next;
    return next + 100;
  }

  function renderBossPanel() {
    const box = document.getElementById("bosses");
    if (!box) return;
    const level = readLevel();
    const meta = getBossMeta();
    const next = nextBoss(level, meta);
    const nodes = bossNodes.map((node) => {
      const owned = Boolean(meta.nodes[node.id]);
      const canBuy = !owned && meta.points >= node.cost;
      return `<div class="boss-node ${owned ? "owned" : ""}">
        <h3>${owned ? "✓ " : ""}${node.name}</h3>
        <p>${node.desc}</p>
        <button class="boss-buy" data-boss-node="${node.id}" ${owned || !canBuy ? "disabled" : ""}>${owned ? "Куплено" : `Купить за ${node.cost}`}</button>
      </div>`;
    }).join("");

    box.innerHTML = `<div class="boss-wrap">
      <div class="boss-banner"><h3>Боссы каждые 100 этапов</h3><p>Это второй слой меты. Обычные ядра — массовая прокачка. Очки босса падают редко, но покупают капитальные улучшения.</p></div>
      <div class="boss-currency">
        <div class="boss-stat"><small>Очки босса</small><b>${meta.points}</b></div>
        <div class="boss-stat"><small>Всего получено</small><b>${meta.earned}</b></div>
        <div class="boss-stat"><small>Следующий босс</small><b>${next}</b></div>
        <div class="boss-stat"><small>Текущий этап</small><b>${level}</b></div>
      </div>
      ${nodes}
    </div>`;

    box.querySelectorAll("[data-boss-node]").forEach((button) => {
      button.addEventListener("click", () => buyBossNode(button.dataset.bossNode));
    });
  }

  function patchRunForEarlyBoost(run, deep) {
    if (!run || typeof run !== "object") return run;
    const level = Number(run.level || 1);
    if (level > 10) return run;
    run.fragments = Math.max(Number(run.fragments || 0), deep ? 900 : 520);
    run.upgrades = run.upgrades && typeof run.upgrades === "object" ? run.upgrades : { damage: 1, speed: 0, xp: 0 };
    run.upgrades.damage = Math.max(Number(run.upgrades.damage || 0), deep ? 3 : 2);
    run.upgrades.speed = Math.max(Number(run.upgrades.speed || 0), deep ? 2 : 1);
    run.upgrades.xp = Math.max(Number(run.upgrades.xp || 0), deep ? 2 : 1);
    return run;
  }

  function applyEarlyBoost(force = false) {
    const bossMeta = getBossMeta();
    const marker = readJson(EARLY_KEY, { applied: false, deepApplied: false });
    const deep = Boolean(bossMeta.nodes.deepStart);
    if (!force && marker.applied && (!deep || marker.deepApplied)) return;
    const run = readJson(RUN_KEY, null);
    if (!run) return;
    const patched = patchRunForEarlyBoost(run, deep);
    saveJson(RUN_KEY, patched);
    marker.applied = true;
    if (deep) marker.deepApplied = true;
    saveJson(EARLY_KEY, marker);
  }

  function tickBosses() {
    const level = readLevel();
    const meta = getBossMeta();
    if (level >= 100) {
      const bossStage = Math.floor(level / 100) * 100;
      if (meta.nodes.autoBoss || bossStage === 100) claimBoss(bossStage, Boolean(meta.nodes.autoBoss));
    }
    renderBossPanel();
  }

  window.addEventListener("DOMContentLoaded", () => {
    applyEarlyBoost(false);
    renderBossPanel();
    setInterval(tickBosses, 1600);
  });
})();
