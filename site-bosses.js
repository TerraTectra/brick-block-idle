(() => {
  "use strict";

  const RUN_KEY = "brick_block_idle_run_v10";
  const BOSS_KEY = "brick_block_idle_boss_meta_v2";
  const EARLY_KEY = "brick_block_idle_early_boost_v1";
  const FIGHT_KEY = "brick_block_idle_boss_fight_v1";

  const bossNodes = [
    { id: "autoBoss", name: "Автобой с боссом", cost: 1, desc: "Босс получает +25% пассивного урона от шаров. Позже станет основой автофарма." },
    { id: "evoMaster", name: "Мастер эволюции", cost: 2, desc: "Капитальный задел под повышение редкости выбора эволюций." },
    { id: "deepStart", name: "Глубокий старт", cost: 3, desc: "Новый забег стартует бодрее: больше ранних ресурсов и меньше мёртвого ожидания." },
    { id: "bossCore", name: "Ядро босса", cost: 5, desc: "Каждый убитый босс даёт +1 дополнительное очко босса." },
    { id: "legendGate", name: "Легендарные врата", cost: 8, desc: "Позже откроет легендарные стартовые условия и особые формы." },
  ];

  function readLevel() {
    const node = document.getElementById("level");
    const value = Number((node?.textContent || "1").replace(/[^0-9]/g, ""));
    return Number.isFinite(value) && value > 0 ? value : 1;
  }

  function readNumber(id) {
    const node = document.getElementById(id);
    const value = Number((node?.textContent || "0").replace(/[^0-9.,-]/g, "").replace(",", "."));
    return Number.isFinite(value) ? value : 0;
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
    const meta = readJson(BOSS_KEY, { points: 0, earned: 0, killed: {}, nodes: {} });
    meta.points = Number(meta.points || 0);
    meta.earned = Number(meta.earned || 0);
    meta.killed = meta.killed && typeof meta.killed === "object" ? meta.killed : {};
    meta.nodes = meta.nodes && typeof meta.nodes === "object" ? meta.nodes : {};
    return meta;
  }

  function setBossMeta(meta) {
    saveJson(BOSS_KEY, meta);
  }

  function getFight() {
    const fight = readJson(FIGHT_KEY, { active: false, stage: 0, hp: 0, maxHp: 0, lastLevel: 1, lastHitAt: 0 });
    fight.active = Boolean(fight.active);
    fight.stage = Number(fight.stage || 0);
    fight.hp = Number(fight.hp || 0);
    fight.maxHp = Number(fight.maxHp || 0);
    fight.lastLevel = Number(fight.lastLevel || 1);
    fight.lastHitAt = Number(fight.lastHitAt || 0);
    return fight;
  }

  function setFight(fight) {
    saveJson(FIGHT_KEY, fight);
  }

  function bossReward(stage, meta) {
    const base = Math.max(1, Math.floor(stage / 100));
    const bonus = meta.nodes.bossCore ? 1 : 0;
    return base + bonus;
  }

  function bossHp(stage) {
    return Math.floor(700 + stage * 18 + Math.pow(stage / 100, 2.15) * 1400);
  }

  function toast(text) {
    const log = document.getElementById("log");
    if (!log) return;
    const line = document.createElement("div");
    line.className = "entry";
    line.textContent = text;
    log.prepend(line);
  }

  function activateBoss(stage) {
    const meta = getBossMeta();
    if (stage < 100 || stage % 100 !== 0 || meta.killed[stage]) return;
    const current = getFight();
    if (current.active && current.stage === stage) return;
    const maxHp = bossHp(stage);
    const fight = { active: true, stage, hp: maxHp, maxHp, lastLevel: stage, lastHitAt: Date.now() };
    setFight(fight);
    toast(`Босс этапа ${stage} появился. HP: ${maxHp}`);
    renderBossPanel();
  }

  function killBoss(fight) {
    const meta = getBossMeta();
    if (meta.killed[fight.stage]) return;
    const reward = bossReward(fight.stage, meta);
    meta.killed[fight.stage] = true;
    meta.points += reward;
    meta.earned += reward;
    setBossMeta(meta);
    setFight({ active: false, stage: 0, hp: 0, maxHp: 0, lastLevel: readLevel(), lastHitAt: Date.now() });
    toast(`Босс этапа ${fight.stage} уничтожен: +${reward} очк. босса`);
    renderBossPanel();
  }

  function damageBoss(amount, reason = "hit") {
    const fight = getFight();
    if (!fight.active || fight.hp <= 0) return false;
    fight.hp = Math.max(0, fight.hp - Math.max(0, amount));
    fight.lastHitAt = Date.now();
    if (fight.hp <= 0) {
      killBoss(fight);
    } else {
      setFight(fight);
    }
    return true;
  }

  function buyBossNode(id) {
    const node = bossNodes.find((item) => item.id === id);
    if (!node) return;
    const meta = getBossMeta();
    if (meta.nodes[id] || meta.points < node.cost) return;
    meta.points -= node.cost;
    meta.nodes[id] = true;
    setBossMeta(meta);
    applyEarlyBoost(true);
    toast(`Капитальный апгрейд куплен: ${node.name}`);
    renderBossPanel();
  }

  function nextBoss(level, meta) {
    const next = Math.ceil(Math.max(1, level + 1) / 100) * 100;
    if (!meta.killed[next]) return next;
    return next + 100;
  }

  function passiveBossDps() {
    const ballsText = document.getElementById("balls")?.textContent || "";
    const count = Math.max(1, (ballsText.match(/Ур\./g) || []).length || 1);
    const level = readLevel();
    const frags = readNumber("frags");
    const meta = getBossMeta();
    const auto = meta.nodes.autoBoss ? 1.25 : 1;
    return (8 + Math.sqrt(Math.max(0, frags)) * 0.13 + level * 0.18) * count * auto;
  }

  function renderBossPanel() {
    const box = document.getElementById("bosses");
    if (!box) return;
    const level = readLevel();
    const meta = getBossMeta();
    const fight = getFight();
    const next = nextBoss(level, meta);
    const hpPct = fight.maxHp > 0 ? Math.max(0, Math.min(100, (fight.hp / fight.maxHp) * 100)) : 0;
    const fightHtml = fight.active ? `<div class="boss-fight"><h3>Активный босс: этап ${fight.stage}</h3><p>Шары наносят пассивный урон. Клик по полю дополнительно снимает 1 HP.</p><div class="boss-hpbar" style="--boss-hp:${hpPct}%"><span></span></div><p>${Math.ceil(fight.hp)} / ${fight.maxHp} HP</p></div>` : `<div class="boss-fight"><h3>Босс не активен</h3><p>Следующий настоящий босс появится на этапе ${next}. Награда выдаётся только после убийства.</p></div>`;
    const nodes = bossNodes.map((node) => {
      const owned = Boolean(meta.nodes[node.id]);
      const canBuy = !owned && meta.points >= node.cost;
      return `<div class="boss-node ${owned ? "owned" : ""}"><h3>${owned ? "✓ " : ""}${node.name}</h3><p>${node.desc}</p><button class="boss-buy" data-boss-node="${node.id}" ${owned || !canBuy ? "disabled" : ""}>${owned ? "Куплено" : `Купить за ${node.cost}`}</button></div>`;
    }).join("");

    box.innerHTML = `<div class="boss-wrap"><div class="boss-banner"><h3>Боссы каждые 100 этапов</h3><p>Это второй слой меты: очков мало, но апгрейды капитальные.</p></div>${fightHtml}<div class="boss-currency"><div class="boss-stat"><small>Очки босса</small><b>${meta.points}</b></div><div class="boss-stat"><small>Всего получено</small><b>${meta.earned}</b></div><div class="boss-stat"><small>Следующий босс</small><b>${next}</b></div><div class="boss-stat"><small>Текущий этап</small><b>${level}</b></div></div>${nodes}</div>`;
    box.querySelectorAll("[data-boss-node]").forEach((button) => button.addEventListener("click", () => buyBossNode(button.dataset.bossNode)));
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
    saveJson(RUN_KEY, patchRunForEarlyBoost(run, deep));
    marker.applied = true;
    if (deep) marker.deepApplied = true;
    saveJson(EARLY_KEY, marker);
  }

  function tickBosses() {
    const level = readLevel();
    if (level >= 100 && level % 100 === 0) activateBoss(level);
    const fight = getFight();
    if (fight.active) damageBoss(passiveBossDps() / 2.5, "passive");
    renderBossPanel();
  }

  window.__brickBlockBosses = { getBossMeta, getFight, damageBoss, activateBoss };

  window.addEventListener("DOMContentLoaded", () => {
    applyEarlyBoost(false);
    const canvas = document.getElementById("game");
    if (canvas) canvas.addEventListener("pointerdown", () => damageBoss(1, "manual"), true);
    renderBossPanel();
    setInterval(tickBosses, 1400);
  });
})();
