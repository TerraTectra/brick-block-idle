(() => {
  const META_KEY = "brick_block_idle_meta_v2";
  const RUN_KEY = "brick_block_idle_static_v6";
  const INJECT_KEY = "brick_block_idle_meta_injected_v2";

  const nodes = [
    { id: "dmg1", row: 1, name: "Калибровка урона I", type: "normal", max: 5, cost: 1, effect: { damage: 1 }, desc: "+1 постоянный уровень урона за ранг." },
    { id: "spd1", row: 1, name: "Магнитный разгон I", type: "normal", max: 4, cost: 1, effect: { speed: 1 }, desc: "+1 постоянный уровень скорости за ранг." },
    { id: "xp1", row: 1, name: "Память ядра I", type: "normal", max: 4, cost: 1, effect: { xp: 1 }, desc: "+1 постоянный уровень опыта за ранг." },
    { id: "frag1", row: 1, name: "Стартовый запас I", type: "normal", max: 5, cost: 1, effect: { startFragments: 40 }, desc: "+40 стартовых осколков за ранг." },
    { id: "firstExtra", row: 2, name: "Экстра: стартовый импульс", type: "extra", max: 1, cost: 4, req: ["dmg1", "frag1"], effect: { startFragments: 180, damage: 1 }, desc: "Новый забег начинается заметно быстрее." },

    { id: "dmg2", row: 3, name: "Калибровка урона II", type: "normal", max: 7, cost: 2, req: ["dmg1"], effect: { damage: 1 }, desc: "Второй слой постоянного урона." },
    { id: "spd2", row: 3, name: "Магнитный разгон II", type: "normal", max: 6, cost: 2, req: ["spd1"], effect: { speed: 1 }, desc: "Второй слой постоянной скорости." },
    { id: "xp2", row: 3, name: "Память ядра II", type: "normal", max: 6, cost: 2, req: ["xp1"], effect: { xp: 1 }, desc: "Второй слой постоянного опыта." },
    { id: "frag2", row: 3, name: "Стартовый запас II", type: "normal", max: 6, cost: 2, req: ["frag1"], effect: { startFragments: 70 }, desc: "+70 стартовых осколков за ранг." },
    { id: "autoEvolution", row: 4, name: "Экстра: автоэволюция", type: "extra", max: 1, cost: 7, req: ["xp2"], effect: { autoEvolution: 1 }, desc: "Когда шар ждёт эволюцию, система сама выбирает первый вариант." },

    { id: "dmg3", row: 5, name: "Калибровка урона III", type: "normal", max: 8, cost: 4, req: ["dmg2"], effect: { damage: 1 }, desc: "Поздний слой урона для дальних этапов." },
    { id: "spd3", row: 5, name: "Магнитный разгон III", type: "normal", max: 7, cost: 4, req: ["spd2"], effect: { speed: 1 }, desc: "Поздний слой скорости." },
    { id: "xp3", row: 5, name: "Память ядра III", type: "normal", max: 8, cost: 4, req: ["xp2"], effect: { xp: 1 }, desc: "Поздний слой опыта." },
    { id: "starterBall3", row: 6, name: "Экстра: третий стартовый шар", type: "extra", max: 1, cost: 12, req: ["firstExtra", "dmg2"], effect: { starterBalls: 1 }, desc: "Новый забег стартует с третьим шаром." },

    { id: "prestige1", row: 7, name: "Резонанс сингулярности I", type: "normal", max: 5, cost: 5, req: ["autoEvolution"], effect: { prestigeBoost: 0.08 }, desc: "+8% ядер за сингулярность за ранг." },
    { id: "discount1", row: 7, name: "Стабилизация цен I", type: "normal", max: 5, cost: 5, req: ["starterBall3"], effect: { discount: 0.03 }, desc: "Снижает цену обычных временных апгрейдов на 3% за ранг." },
    { id: "stageSkip1", row: 8, name: "Экстра: пропуск разгона", type: "extra", max: 1, cost: 18, req: ["prestige1", "discount1"], effect: { startLevel: 3 }, desc: "Новый забег начинается сразу с 3 этапа." },

    { id: "dmg4", row: 9, name: "Калибровка урона IV", type: "normal", max: 10, cost: 8, req: ["dmg3"], effect: { damage: 1 }, desc: "Глубокий слой урона." },
    { id: "spd4", row: 9, name: "Магнитный разгон IV", type: "normal", max: 8, cost: 8, req: ["spd3"], effect: { speed: 1 }, desc: "Глубокий слой скорости." },
    { id: "xp4", row: 9, name: "Память ядра IV", type: "normal", max: 10, cost: 8, req: ["xp3"], effect: { xp: 1 }, desc: "Глубокий слой опыта." },
    { id: "starterBall4", row: 10, name: "Экстра: четвёртый стартовый шар", type: "extra", max: 1, cost: 28, req: ["starterBall3", "dmg4"], effect: { starterBalls: 2 }, desc: "Новый забег стартует с четырьмя шарами." },

    { id: "prestige2", row: 11, name: "Резонанс сингулярности II", type: "normal", max: 8, cost: 10, req: ["prestige1"], effect: { prestigeBoost: 0.1 }, desc: "+10% ядер за сингулярность за ранг." },
    { id: "stageSkip2", row: 12, name: "Экстра: боевой старт", type: "extra", max: 1, cost: 42, req: ["stageSkip1", "prestige2"], effect: { startLevel: 6, startFragments: 600 }, desc: "Новый забег начинается с 6 этапа и запасом осколков." },
    { id: "coreBank", row: 12, name: "Экстра: банк ядра", type: "extra", max: 1, cost: 55, req: ["discount1", "prestige2"], effect: { bank: 1 }, desc: "После сингулярности оставляет 10% осколков в стартовом запасе следующего забега." }
  ];

  const el = (id) => document.getElementById(id);

  function getMeta() {
    try {
      return JSON.parse(localStorage.getItem(META_KEY)) || { cores: 0, spent: 0, nodes: {}, bankedFragments: 0 };
    } catch {
      return { cores: 0, spent: 0, nodes: {}, bankedFragments: 0 };
    }
  }
  function setMeta(meta) { localStorage.setItem(META_KEY, JSON.stringify(meta)); }
  function getRun() { try { return JSON.parse(localStorage.getItem(RUN_KEY)); } catch { return null; } }
  function setRun(run) { localStorage.setItem(RUN_KEY, JSON.stringify(run)); }
  function getInjected() { try { return JSON.parse(localStorage.getItem(INJECT_KEY)) || {}; } catch { return {}; } }
  function setInjected(data) { localStorage.setItem(INJECT_KEY, JSON.stringify(data)); }
  function levelOf(meta, id) { return meta.nodes[id] || 0; }
  function isUnlocked(meta, node) { return !node.req || node.req.every((id) => levelOf(meta, id) > 0); }
  function nodeCost(node, level) { return Math.ceil(node.cost * Math.pow(1.62, level)); }

  function effects(meta) {
    const out = { damage: 0, speed: 0, xp: 0, startFragments: 0, autoEvolution: 0, starterBalls: 0, prestigeBoost: 0, discount: 0, startLevel: 1, bank: 0 };
    for (const node of nodes) {
      const rank = levelOf(meta, node.id);
      if (!rank) continue;
      for (const [key, value] of Object.entries(node.effect)) {
        if (key === "startLevel") out.startLevel = Math.max(out.startLevel, value);
        else if (key === "starterBalls") out.starterBalls = Math.max(out.starterBalls, value);
        else if (key === "autoEvolution" || key === "bank") out[key] = Math.max(out[key], value);
        else out[key] += value * rank;
      }
    }
    return out;
  }

  function prestigeReward(level, meta) {
    if (level < 10) return 0;
    const eff = effects(meta);
    const base = Math.floor(Math.pow(level - 9, 0.74));
    return Math.max(1, Math.floor(base * (1 + eff.prestigeBoost)));
  }

  function defaultRun(eff, meta) {
    return {
      level: eff.startLevel || 1,
      fragments: (eff.startFragments || 0) + (meta.bankedFragments || 0),
      total: 0,
      upgrades: { damage: eff.damage, speed: eff.speed, xp: eff.xp },
      meta: { autoEvolution: Boolean(eff.autoEvolution), discount: eff.discount || 0 },
      balls: []
    };
  }

  function applyMetaToRun() {
    const meta = getMeta();
    const eff = effects(meta);
    const prev = getInjected();
    const run = getRun() || defaultRun(eff, meta);
    run.upgrades = run.upgrades || { damage: 0, speed: 0, xp: 0 };
    run.upgrades.damage = Math.max(0, (run.upgrades.damage || 0) - (prev.damage || 0)) + eff.damage;
    run.upgrades.speed = Math.max(0, (run.upgrades.speed || 0) - (prev.speed || 0)) + eff.speed;
    run.upgrades.xp = Math.max(0, (run.upgrades.xp || 0) - (prev.xp || 0)) + eff.xp;
    run.meta = { ...(run.meta || {}), autoEvolution: Boolean(eff.autoEvolution), discount: eff.discount || 0 };
    if (!run.__metaStartApplied) {
      run.fragments = (run.fragments || 0) + (eff.startFragments || 0) + (meta.bankedFragments || 0);
      run.level = Math.max(run.level || 1, eff.startLevel || 1);
      run.__metaStartApplied = true;
      meta.bankedFragments = 0;
      setMeta(meta);
    }
    if (Array.isArray(run.balls)) {
      const targetCount = 2 + (eff.starterBalls || 0);
      for (let id = run.balls.length + 1; run.balls.length < targetCount; id += 1) {
        run.balls.push({ id, level: 1, xp: 0, evo: 0, form: "basic", color: "#4cc9f0", evolved: [] });
      }
    }
    setRun(run);
    setInjected({ damage: eff.damage, speed: eff.speed, xp: eff.xp });
  }

  function performPrestige() {
    const meta = getMeta();
    const run = getRun();
    const level = run?.level || Number(el("level")?.textContent || 1);
    const reward = prestigeReward(level, meta);
    if (reward <= 0) return;
    const eff = effects(meta);
    if (eff.bank && run?.fragments) meta.bankedFragments = Math.floor(run.fragments * 0.1);
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
    const root = el("meta");
    if (!root) return;
    const meta = getMeta();
    const run = getRun();
    const level = run?.level || Number(el("level")?.textContent || 1);
    const reward = prestigeReward(level, meta);
    root.innerHTML = `
      <div class="prestige-box">
        <b class="meta-badge">Ядра: ${meta.cores} · Потрачено: ${meta.spent}</b>
        <small>Сингулярность сбрасывает забег и даёт ядра за максимальный этап. Доступна с 10 этапа.</small>
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
            <small>Слой ${node.row} · Ранг: ${rank}/${node.max}</small>
            <small>${node.desc}</small>
            ${node.req ? `<small>Требуется: ${node.req.join(", ")}</small>` : ""}
            <button data-meta-node="${node.id}" ${!unlocked || maxed || meta.cores < cost ? "disabled" : ""}>${maxed ? "Максимум" : `Купить за ${cost}`}</button>
          </div>`;
        }).join("")}
      </div>`;
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
      const eff = effects(getMeta());
      if (!eff.autoEvolution) return;
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
