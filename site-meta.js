(() => {
  const META_KEY = "brick_block_idle_meta_v1";
  const RUN_KEY = "brick_block_idle_static_v6";
  const INJECT_KEY = "brick_block_idle_meta_injected_v1";

  const nodes = [
    { id: "dmg1", name: "Калибровка урона I", type: "normal", max: 5, cost: 1, effect: { damage: 1 }, desc: "+1 виртуальный уровень апгрейда урона за ранг." },
    { id: "spd1", name: "Магнитный разгон I", type: "normal", max: 4, cost: 1, effect: { speed: 1 }, desc: "+1 виртуальный уровень скорости за ранг." },
    { id: "xp1", name: "Память ядра I", type: "normal", max: 4, cost: 1, effect: { xp: 1 }, desc: "+1 виртуальный уровень опыта за ранг." },
    { id: "startFragments", name: "Стартовый запас", type: "extra", max: 1, cost: 3, effect: { startFragments: 120 }, desc: "После сингулярности новый забег начинается со 120 осколками." },

    { id: "dmg2", name: "Калибровка урона II", type: "normal", max: 7, cost: 2, req: ["dmg1"], effect: { damage: 1 }, desc: "Второй слой постоянного урона." },
    { id: "spd2", name: "Магнитный разгон II", type: "normal", max: 6, cost: 2, req: ["spd1"], effect: { speed: 1 }, desc: "Второй слой постоянной скорости." },
    { id: "crystal1", name: "Кристальный резонатор", type: "normal", max: 5, cost: 2, effect: { startFragments: 45 }, desc: "+45 стартовых осколков за ранг." },
    { id: "autoEvolution", name: "Автоэволюция", type: "extra", max: 1, cost: 6, req: ["xp1"], effect: { autoEvolution: 1 }, desc: "Когда шар ждёт эволюцию, система сама выбирает первый вариант." },

    { id: "xp2", name: "Память ядра II", type: "normal", max: 8, cost: 3, req: ["xp1"], effect: { xp: 1 }, desc: "Второй слой постоянного опыта." },
    { id: "dmg3", name: "Калибровка урона III", type: "normal", max: 10, cost: 4, req: ["dmg2"], effect: { damage: 1 }, desc: "Поздний постоянный урон для дальних этапов." },
    { id: "starterBall", name: "Третий стартовый шар", type: "extra", max: 1, cost: 10, req: ["startFragments", "dmg2"], effect: { starterBall: 1 }, desc: "Новый забег начинается с третьим шаром после перезагрузки страницы." },
    { id: "prestigeBoost", name: "Глубокая сингулярность", type: "extra", max: 1, cost: 14, req: ["autoEvolution"], effect: { prestigeBoost: 1 }, desc: "Сингулярность даёт на 25% больше ядер." }
  ];

  function getMeta() {
    try {
      return JSON.parse(localStorage.getItem(META_KEY)) || { cores: 0, spent: 0, nodes: {} };
    } catch {
      return { cores: 0, spent: 0, nodes: {} };
    }
  }

  function setMeta(meta) {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  }

  function getRun() {
    try {
      return JSON.parse(localStorage.getItem(RUN_KEY));
    } catch {
      return null;
    }
  }

  function setRun(run) {
    localStorage.setItem(RUN_KEY, JSON.stringify(run));
  }

  function getInjected() {
    try {
      return JSON.parse(localStorage.getItem(INJECT_KEY)) || { damage: 0, speed: 0, xp: 0 };
    } catch {
      return { damage: 0, speed: 0, xp: 0 };
    }
  }

  function setInjected(data) {
    localStorage.setItem(INJECT_KEY, JSON.stringify(data));
  }

  function levelOf(meta, id) {
    return meta.nodes[id] || 0;
  }

  function nodeCost(node, level) {
    return Math.ceil(node.cost * Math.pow(1.55, level));
  }

  function isUnlocked(meta, node) {
    return !node.req || node.req.every((id) => levelOf(meta, id) > 0);
  }

  function effects(meta) {
    const out = { damage: 0, speed: 0, xp: 0, startFragments: 0, autoEvolution: 0, starterBall: 0, prestigeBoost: 0 };
    for (const node of nodes) {
      const rank = levelOf(meta, node.id);
      if (!rank) continue;
      for (const [key, value] of Object.entries(node.effect)) {
        out[key] += value * rank;
      }
    }
    return out;
  }

  function prestigeReward(level, meta) {
    if (level < 10) return 0;
    const base = Math.floor(Math.pow(level - 9, 0.72));
    const boost = effects(meta).prestigeBoost ? 1.25 : 1;
    return Math.max(1, Math.floor(base * boost));
  }

  function defaultRun(eff) {
    return {
      level: 1,
      fragments: eff.startFragments || 0,
      total: 0,
      upgrades: { damage: eff.damage, speed: eff.speed, xp: eff.xp },
      meta: { autoEvolution: Boolean(eff.autoEvolution) },
      balls: []
    };
  }

  function applyMetaToRun() {
    const meta = getMeta();
    const eff = effects(meta);
    const prev = getInjected();
    const run = getRun() || defaultRun(eff);
    run.upgrades = run.upgrades || { damage: 0, speed: 0, xp: 0 };
    run.upgrades.damage = Math.max(0, (run.upgrades.damage || 0) - (prev.damage || 0)) + eff.damage;
    run.upgrades.speed = Math.max(0, (run.upgrades.speed || 0) - (prev.speed || 0)) + eff.speed;
    run.upgrades.xp = Math.max(0, (run.upgrades.xp || 0) - (prev.xp || 0)) + eff.xp;
    run.meta = { ...(run.meta || {}), autoEvolution: Boolean(eff.autoEvolution) };
    if (!run.__metaStartApplied && eff.startFragments) {
      run.fragments = (run.fragments || 0) + eff.startFragments;
      run.__metaStartApplied = true;
    }
    if (eff.starterBall && Array.isArray(run.balls) && run.balls.length >= 2 && run.balls.length < 3) {
      run.balls.push({ id: 3, level: 1, xp: 0, evo: 0, form: "basic", color: "#4cc9f0", evolved: [] });
    }
    setRun(run);
    setInjected({ damage: eff.damage, speed: eff.speed, xp: eff.xp });
  }

  function performPrestige() {
    const meta = getMeta();
    const run = getRun();
    const level = run?.level || Number(document.getElementById("level")?.textContent || 1);
    const reward = prestigeReward(level, meta);
    if (reward <= 0) return;
    meta.cores += reward;
    setMeta(meta);
    localStorage.removeItem(RUN_KEY);
    localStorage.removeItem(INJECT_KEY);
    location.reload();
  }

  function buyNode(id) {
    const meta = getMeta();
    const node = nodes.find((item) => item.id === id);
    if (!node || !isUnlocked(meta, node)) return;
    const level = levelOf(meta, id);
    if (level >= node.max) return;
    const cost = nodeCost(node, level);
    if (meta.cores < cost) return;
    meta.cores -= cost;
    meta.spent += cost;
    meta.nodes[id] = level + 1;
    setMeta(meta);
    applyMetaToRun();
    renderMeta();
  }

  function renderMeta() {
    const root = document.getElementById("meta");
    if (!root) return;
    const meta = getMeta();
    const run = getRun();
    const runLevel = run?.level || Number(document.getElementById("level")?.textContent || 1);
    const reward = prestigeReward(runLevel, meta);
    root.innerHTML = `
      <div class="prestige-box">
        <b class="meta-badge">Ядра: ${meta.cores} · Потрачено: ${meta.spent}</b>
        <small>Сингулярность сбрасывает текущий забег и выдаёт ядра за достигнутый этап. Доступна с 10 этапа.</small>
        <button class="prestige-btn" data-prestige ${reward <= 0 ? "disabled" : ""}>Сингулярность: +${reward} ядер</button>
      </div>
      <div class="meta-tree">
        ${nodes.map((node) => {
          const rank = levelOf(meta, node.id);
          const unlocked = isUnlocked(meta, node);
          const maxed = rank >= node.max;
          const cost = nodeCost(node, rank);
          return `<div class="meta-node ${node.type === "extra" ? "extra" : ""} ${!unlocked ? "locked" : ""} ${maxed ? "maxed" : ""}">
            <b>${node.name} ${node.type === "extra" ? "◆" : ""}</b>
            <small>Ранг: ${rank}/${node.max} · ${node.desc}</small>
            ${node.req ? `<small>Требуется: ${node.req.join(", ")}</small>` : ""}
            <button data-meta-node="${node.id}" ${!unlocked || maxed || meta.cores < cost ? "disabled" : ""}>${maxed ? "Максимум" : `Купить за ${cost}`}</button>
          </div>`;
        }).join("")}
      </div>
    `;
  }

  function bindMeta() {
    document.addEventListener("pointerdown", (event) => {
      const prestige = event.target.closest("[data-prestige]");
      if (prestige && !prestige.disabled) {
        event.preventDefault();
        performPrestige();
        return;
      }
      const node = event.target.closest("[data-meta-node]");
      if (node && !node.disabled) {
        event.preventDefault();
        buyNode(node.dataset.metaNode);
      }
    });

    setInterval(() => {
      renderMeta();
      const meta = getMeta();
      if (!effects(meta).autoEvolution) return;
      const evoButton = document.querySelector("[data-evolve-ball]");
      if (evoButton) evoButton.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      setTimeout(() => {
        const choice = document.querySelector(".evo-choice");
        if (choice) choice.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      }, 60);
    }, 1000);
  }

  applyMetaToRun();
  window.addEventListener("DOMContentLoaded", () => {
    bindMeta();
    renderMeta();
  });
})();
