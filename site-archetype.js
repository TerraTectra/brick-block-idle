(() => {
  "use strict";

  const ARCH_KEY = "brick_block_idle_archetype_boosts_v1";
  const rarity = {
    common: { label: "Обычное", mult: 1, color: "#cbd5e1" },
    rare: { label: "Редкое", mult: 1.75, color: "#38bdf8" },
    epic: { label: "Эпическое", mult: 2.8, color: "#c084fc" },
    legendary: { label: "Легендарное", mult: 4.5, color: "#facc15" },
  };

  const options = [
    { id: "damage_common", group: "damage", name: "Калибровка архетипа", tier: "common", cost: 160, desc: "+12% к урону всех шаров." },
    { id: "speed_common", group: "speed", name: "Разгон архетипа", tier: "common", cost: 180, desc: "+8% к скорости всех шаров сверх тестового x5." },
    { id: "class_common", group: "class", name: "Классовая настройка", tier: "common", cost: 220, desc: "+10% к классовым эффектам архетипов." },
    { id: "damage_rare", group: "damage", name: "Редкая калибровка", tier: "rare", cost: 680, desc: "Сильное усиление урона архетипов." },
    { id: "speed_rare", group: "speed", name: "Редкий разгон", tier: "rare", cost: 760, desc: "Сильное усиление скорости архетипов." },
    { id: "class_rare", group: "class", name: "Редкая специализация", tier: "rare", cost: 900, desc: "Классовые способности заметно сильнее." },
    { id: "damage_epic", group: "damage", name: "Эпический резонанс урона", tier: "epic", cost: 2400, desc: "Очень сильный прирост урона." },
    { id: "speed_epic", group: "speed", name: "Эпический разгон", tier: "epic", cost: 2800, desc: "Очень сильный прирост скорости." },
    { id: "class_epic", group: "class", name: "Эпическая специализация", tier: "epic", cost: 3200, desc: "Сильно усиливает классовую механику формы." },
    { id: "legend_core", group: "class", name: "Легендарное ядро архетипа", tier: "legendary", cost: 12000, desc: "Капитальное усиление всех архетипных бонусов." },
  ];

  function readFragments() {
    const node = document.getElementById("frags");
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

  function getState() {
    const state = readJson(ARCH_KEY, { owned: {}, rolls: [] });
    state.owned = state.owned && typeof state.owned === "object" ? state.owned : {};
    state.rolls = Array.isArray(state.rolls) ? state.rolls : [];
    return state;
  }

  function setState(state) {
    saveJson(ARCH_KEY, state);
  }

  function effectValue(option) {
    const r = rarity[option.tier]?.mult || 1;
    if (option.group === "damage") return 0.12 * r;
    if (option.group === "speed") return 0.08 * r;
    return 0.10 * r;
  }

  function totals() {
    const state = getState();
    const out = { damage: 0, speed: 0, classPower: 0 };
    for (const id of Object.keys(state.owned)) {
      const option = options.find((item) => item.id === id);
      if (!option) continue;
      const value = effectValue(option);
      if (option.group === "damage") out.damage += value;
      else if (option.group === "speed") out.speed += value;
      else out.classPower += value;
    }
    return out;
  }

  function pickRolls() {
    const state = getState();
    const available = options.filter((option) => !state.owned[option.id]);
    const weighted = [];
    for (const option of available) {
      const weight = option.tier === "legendary" ? 1 : option.tier === "epic" ? 3 : option.tier === "rare" ? 8 : 18;
      for (let i = 0; i < weight; i++) weighted.push(option);
    }
    const rolls = [];
    while (rolls.length < 3 && weighted.length) {
      const option = weighted[Math.floor(Math.random() * weighted.length)];
      if (!rolls.some((item) => item.id === option.id)) rolls.push(option);
    }
    state.rolls = rolls.map((item) => item.id);
    setState(state);
    render();
  }

  function buy(id) {
    const option = options.find((item) => item.id === id);
    if (!option) return;
    const fragments = readFragments();
    if (fragments < option.cost) return;
    const state = getState();
    state.owned[id] = true;
    state.rolls = [];
    setState(state);
    applyToBalls();
    render();
  }

  function applyToBalls() {
    const boost = totals();
    const balls = window.__brickBlockSpeedGuard?.trackedBalls;
    if (!balls) return;
    balls.forEach((ball) => {
      ball.__bbExternalSpeedMult = 1 + boost.speed;
      ball.__bbArchDamageMult = 1 + boost.damage;
      ball.__bbClassPowerMult = 1 + boost.classPower;
      if (ball.damage && typeof ball.damage === "number") ball.damage *= 1 + boost.damage * 0.015;
    });
    window.__brickBlockSpeedGuard?.stabilizeNow?.();
  }

  function render() {
    const box = document.getElementById("archetype");
    if (!box) return;
    const state = getState();
    const boost = totals();
    const fragments = readFragments();
    const rollIds = state.rolls.length ? state.rolls : options.filter((option) => !state.owned[option.id]).slice(0, 3).map((item) => item.id);
    const cards = rollIds.map((id) => options.find((item) => item.id === id)).filter(Boolean).map((option) => {
      const info = rarity[option.tier];
      const owned = Boolean(state.owned[option.id]);
      const canBuy = !owned && fragments >= option.cost;
      const value = Math.round(effectValue(option) * 100);
      return `<div class="arch-option ${option.tier}"><h4>${option.name}<span class="arch-pill">${info.label}</span></h4><p>${option.desc}</p><p>Сила усиления: +${value}% · Цена: ${option.cost} осколков</p><button class="arch-buy" data-arch-buy="${option.id}" ${owned || !canBuy ? "disabled" : ""}>${owned ? "Взято" : "Выбрать усиление"}</button></div>`;
    }).join("");

    box.innerHTML = `<div class="arch-wrap"><div class="arch-card"><h3>Усиление архетипа</h3><p>Это теперь выбор с тирами. Чем выше редкость усиления, тем сильнее бонус к характеристикам или классовой способности.</p></div><div class="arch-card"><h3>Текущие бонусы</h3><p>Урон: +${Math.round(boost.damage * 100)}% · Скорость: +${Math.round(boost.speed * 100)}% · Классовые эффекты: +${Math.round(boost.classPower * 100)}%</p><button class="arch-buy" data-arch-reroll="1">Перебросить варианты</button></div><div class="arch-options">${cards}</div></div>`;
    box.querySelectorAll("[data-arch-buy]").forEach((button) => button.addEventListener("click", () => buy(button.dataset.archBuy)));
    box.querySelector("[data-arch-reroll]")?.addEventListener("click", pickRolls);
  }

  window.__brickBlockArchetype = { totals, applyToBalls, pickRolls };

  window.addEventListener("DOMContentLoaded", () => {
    render();
    setInterval(() => {
      applyToBalls();
      render();
    }, 1400);
  });
})();
