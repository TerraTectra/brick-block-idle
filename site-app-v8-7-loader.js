(() => {
  const SOURCE = "./site-app-v7.js?v=7";

  function patchRuntime(source) {
    let code = source;

    code = code.replace(
      'const RUN_KEY = "brick_block_idle_run_v7";',
      'const RUN_KEY = "brick_block_idle_run_v8_7";',
    );

    code = code.replace(
      'const forms = [\n    { key: "plasma", name: "Плазма", color: "#ff4d6d", desc: "При ударе наносит слабый урон соседним блокам." },\n    { key: "storm", name: "Гроза", color: "#f9f871", desc: "После добивания бьёт цепной молнией по случайным блокам." },\n    { key: "drill", name: "Бур", color: "#ff9f1c", desc: "Лучше пробивает броню, щиты и тяжёлые блоки." },\n    { key: "crit", name: "Крит", color: "#b517ff", desc: "Имеет шанс нанести усиленный удар." },\n    { key: "comet", name: "Комета", color: "#2ec4b6", desc: "Часть скорости превращается в дополнительный урон." },\n    { key: "collector", name: "Сборщик", color: "#60a5fa", desc: "Получает больше опыта и осколков." }\n  ];',
      'const forms = [\n    { key: "striker", rarity: "common", name: "Ударный", color: "#93c5fd", damage: 1.15, speed: 1.0, radius: 1.0, desc: "Надёжный прямой урон. Хороший базовый выбор." },\n    { key: "swift", rarity: "common", name: "Быстрый", color: "#67e8f9", damage: 0.75, speed: 1.45, radius: 0.9, desc: "Быстрее бьёт, но слабее за удар." },\n    { key: "heavy", rarity: "common", name: "Тяжёлый", color: "#cbd5e1", damage: 1.55, speed: 0.65, radius: 1.15, desc: "Медленный тяжёлый шар с высоким уроном." },\n    { key: "collector", rarity: "common", name: "Сборщик", color: "#60a5fa", damage: 0.7, speed: 1.05, radius: 1.0, desc: "Слабее в бою, но лучше фармит XP и осколки." },\n    { key: "ricochet", rarity: "common", name: "Рикошет", color: "#a7f3d0", damage: 0.9, speed: 1.15, radius: 0.9, desc: "Чаще попадает за счёт скорости и рикошетного стиля." },\n    { key: "plasma", rarity: "rare", name: "Плазма", color: "#ff4d6d", damage: 0.9, speed: 0.95, radius: 1.05, desc: "Процентный урон по области. Сильна против жирных блоков." },\n    { key: "storm", rarity: "rare", name: "Гроза", color: "#f9f871", damage: 0.8, speed: 1.18, radius: 0.95, desc: "После добивания цепляет молнией несколько блоков." },\n    { key: "poison", rarity: "rare", name: "Ядовитый", color: "#84cc16", damage: 0.78, speed: 0.9, radius: 1.05, desc: "Накладывает яд и добивает блоки периодическим уроном." },\n    { key: "drill", rarity: "rare", name: "Бур", color: "#ff9f1c", damage: 1.35, speed: 0.72, radius: 0.9, desc: "Пробивает броню, щиты и тяжёлые блоки." },\n    { key: "crit", rarity: "rare", name: "Крит", color: "#b517ff", damage: 1.05, speed: 1.0, radius: 1.0, desc: "Шанс мощного критического удара." },\n    { key: "comet", rarity: "rare", name: "Комета", color: "#2ec4b6", damage: 0.92, speed: 1.32, radius: 0.85, desc: "Скорость превращается в дополнительный урон." },\n    { key: "frost", rarity: "epic", name: "Ледяной", color: "#bae6fd", damage: 0.95, speed: 0.85, radius: 1.1, desc: "Ослабляет и замедляет живые/реген-блоки." },\n    { key: "vampire", rarity: "epic", name: "Вампирический", color: "#fb7185", damage: 1.0, speed: 1.0, radius: 1.0, desc: "Добивания временно усиливают шар до конца этапа." },\n    { key: "shard", rarity: "epic", name: "Осколочный", color: "#f0abfc", damage: 0.85, speed: 1.05, radius: 1.0, desc: "Добивания выпускают дополнительные осколочные удары." },\n    { key: "gravity", rarity: "epic", name: "Гравитационный", color: "#818cf8", damage: 0.9, speed: 0.9, radius: 1.15, desc: "Лучше цепляет область и тянет урон к скоплениям." },\n    { key: "rift", rarity: "epic", name: "Разлом", color: "#c084fc", damage: 1.1, speed: 0.8, radius: 1.05, desc: "Пробивает линию блоков через разломный урон." },\n    { key: "singularity", rarity: "legendary", name: "Сингулярный", color: "#facc15", damage: 1.05, speed: 0.85, radius: 1.2, desc: "Чем меньше блоков осталось, тем сильнее удар." },\n    { key: "quantum", rarity: "legendary", name: "Квантовый", color: "#22d3ee", damage: 1.05, speed: 1.1, radius: 1.0, desc: "Иногда бьёт дополнительные случайные цели." },\n    { key: "solar", rarity: "legendary", name: "Солнечный", color: "#f97316", damage: 1.2, speed: 0.75, radius: 1.25, desc: "Периодически даёт вспышку по полю." },\n    { key: "royal", rarity: "legendary", name: "Королевский", color: "#eab308", damage: 0.65, speed: 0.95, radius: 1.0, desc: "Слабее сам, но усиливает остальные шары." }\n  ];\n  const rarityInfo = { common: { label: "Обычный", weight: 55 }, rare: { label: "Редкий", weight: 28 }, epic: { label: "Эпический", weight: 13 }, legendary: { label: "Легендарный", weight: 4 } };\n  const rarityRank = { common: 1, rare: 2, epic: 3, legendary: 4 };',
    );

    code = code.replace(
      '{ id: "coreBank", row: 12, name: "Экстра: банк ядра", type: "extra", max: 1, cost: 55, req: ["discount1", "prestige2"], effect: { bank: 1 }, desc: "10% осколков переходят в следующий забег." }',
      '{ id: "coreBank", row: 12, name: "Экстра: банк ядра", type: "extra", max: 1, cost: 55, req: ["discount1", "prestige2"], effect: { bank: 1 }, desc: "10% осколков переходят в следующий забег." },\n    { id: "startRare", row: 13, name: "Экстра: редкий старт", type: "extra", max: 1, cost: 75, req: ["coreBank"], effect: { startRare: 1 }, desc: "Новый забег начинается с одним редким шаром." },\n    { id: "startEpic", row: 14, name: "Экстра: эпический старт", type: "extra", max: 1, cost: 140, req: ["startRare", "starterBall4"], effect: { startEpic: 1 }, desc: "Новый забег начинается с одним эпическим шаром." },\n    { id: "startLegendary", row: 15, name: "Экстра: легендарный старт", type: "extra", max: 1, cost: 260, req: ["startEpic", "prestige2"], effect: { startLegendary: 1 }, desc: "Новый забег начинается с одним легендарным шаром." },\n    { id: "rareLuck", row: 13, name: "Удача редкости I", type: "normal", max: 10, cost: 12, req: ["autoEvolution"], effect: { rareLuck: 1 }, desc: "Повышает шанс редких и выше вариантов в эволюции." },\n    { id: "choicePlus", row: 14, name: "Широкий выбор", type: "extra", max: 1, cost: 95, req: ["rareLuck"], effect: { choiceBonus: 1 }, desc: "Даёт +1 вариант при выборе архетипа." }'
    );

    code = code.replace(
      'const out = { damage: 0, speed: 0, xp: 0, startFragments: 0, autoEvolution: 0, starterBalls: 0, prestigeBoost: 0, discount: 0, startLevel: 1, bank: 0 };',
      'const out = { damage: 0, speed: 0, xp: 0, startFragments: 0, autoEvolution: 0, starterBalls: 0, prestigeBoost: 0, discount: 0, startLevel: 1, bank: 0, startRare: 0, startEpic: 0, startLegendary: 0, rareLuck: 0, choiceBonus: 0 };'
    );

    code = code.replace(
      'else if (key === "autoEvolution" || key === "bank") out[key] = Math.max(out[key], value);',
      'else if (key === "autoEvolution" || key === "bank" || key === "startRare" || key === "startEpic" || key === "startLegendary" || key === "choiceBonus") out[key] = Math.max(out[key], value);'
    );

    code = code.replace(
      'const state = { level: 1, fragments: 0, total: 0, paused: false, bricks: [], balls: [], upgrades: { damage: 0, speed: 0, xp: 0 }, log: ["v7: игра и мета объединены."] };',
      'const state = { level: 1, fragments: 0, total: 0, paused: false, bricks: [], balls: [], upgrades: { damage: 1, speed: 0, xp: 0 }, log: ["v8.7: редкости шаров и стартовые редкие архетипы."] };',
    );

    code = code.replace(
      'function stageHp(level) { return Math.max(1, Math.floor(level + Math.pow(Math.max(0, level - 3), 1.42) * 2.4 + Math.pow(Math.max(0, level - 15), 1.86) * 0.9)); }',
      'function stageHp(level) { return Math.max(1, Math.floor(1 + level * 0.75 + Math.pow(Math.max(0, level - 25), 1.18) * 0.28 + Math.pow(Math.max(0, level - 250), 1.32) * 0.06)); }',
    );
    code = code.replace(
      'function brickReward(level, typeReward) { return Math.ceil((1.2 + level * 0.42 + Math.pow(level, 1.04) * 0.22) * typeReward); }',
      'function brickReward(level, typeReward) { return Math.ceil((2 + level * 0.75 + Math.pow(level, 1.08) * 0.35) * typeReward); }',
    );
    code = code.replace(
      'function xpNeed(level) { if (level <= 1) return 55; return Math.floor(55 + level * 34 + Math.pow(level, 2.02) * 32 + Math.pow(Math.max(0, level - 8), 2.25) * 42 + (milestones.includes(level) ? level * 140 : 0)); }',
      'function xpNeed(level) { if (level <= 1) return 32; return Math.floor(32 + level * 18 + Math.pow(level, 1.52) * 10 + Math.pow(Math.max(0, level - 20), 1.82) * 8 + (milestones.includes(level) ? level * 70 : 0)); }',
    );
    code = code.replace(
      'function xpGain(brick, ball) { if (isEvolutionLocked(ball)) return 0; const bonus = ball.form === "collector" ? 1 + ball.evo * 0.06 : 1; return Math.max(1, Math.ceil(brick.xp * 0.08 * xpMult() * bonus)); }',
      'function xpGain(brick, ball) { if (isEvolutionLocked(ball)) return 0; const bonus = ball.form === "collector" ? 1 + ball.evo * 0.08 : 1; const stageXpBonus = 1 + Math.pow(Math.max(1, state.level), 0.45) * 0.035; return Math.max(1, Math.ceil(brick.xp * 0.08 * xpMult() * bonus * stageXpBonus)); }',
    );
    code = code.replace(
      'function fragGain(brick, ball) { const bonus = ball.form === "collector" ? 1 + ball.evo * 0.08 : 1; return Math.max(1, Math.ceil(brick.xp * 0.34 * bonus)); }',
      'function fragGain(brick, ball) { const bonus = ball.form === "collector" ? 1 + ball.evo * 0.1 : 1; return Math.max(1, Math.ceil(brick.xp * 0.34 * bonus)); }',
    );
    code = code.replace(
      'function ballCost() { return Math.floor(320 * Math.pow(2.15, Math.max(0, state.balls.length - 2)) * (1 - discount())); }',
      'function ballCost() { return Math.floor(180 * Math.pow(1.78, Math.max(0, state.balls.length - 2)) * (1 - discount())); }',
    );
    code = code.replace(
      'function upgradeCost(key) { const base = key === "damage" ? 280 : key === "speed" ? 380 : 420; const growth = key === "damage" ? 2.28 : key === "speed" ? 2.45 : 2.55; const level = state.upgrades[key] || 0; return Math.floor(base * Math.pow(growth, level + Math.pow(level, 1.36) * 0.82) * (1 - discount())); }',
      'function upgradeCost(key) { const base = key === "damage" ? 95 : key === "speed" ? 130 : 150; const growth = key === "damage" ? 1.62 : key === "speed" ? 1.7 : 1.74; const level = state.upgrades[key] || 0; return Math.floor(base * Math.pow(growth, level + Math.pow(level, 1.18) * 0.34) * (1 - discount())); }',
    );

    code = code.replace(
      'function damageFor(ball) { const base = 1 + (ball.level - 1) * 0.25 + Math.pow(ball.level - 1, 1.05) * 0.045; const evo = 1 + ball.evo * 0.14 + Math.pow(ball.evo, 1.15) * 0.025; return +(base * evo * upgradePower(effectiveUpgrade("damage"), "damage")).toFixed(2); }',
      'function formStats(ball) { return forms.find((item) => item.key === ball.form) || { damage: 1, speed: 1, radius: 1, rarity: "common" }; }\n  function damageFor(ball) { const stats = formStats(ball); const rarityBonus = 1 + ((rarityRank[stats.rarity] || 1) - 1) * 0.08; const base = 1 + (ball.level - 1) * 0.25 + Math.pow(ball.level - 1, 1.05) * 0.045; const evo = 1 + ball.evo * 0.16 + Math.pow(ball.evo, 1.18) * 0.03; return +(base * evo * rarityBonus * (stats.damage || 1) * upgradePower(effectiveUpgrade("damage"), "damage")).toFixed(2); }',
    );
    code = code.replace(
      'function personalSpeed(ball) { const comet = ball.form === "comet" ? ball.evo * 0.012 : 0; return clamp(1 + (ball.level - 1) * 0.0018 + ball.evo * 0.014 + comet, 1, 1.95); }',
      'function personalSpeed(ball) { const stats = formStats(ball); const comet = ball.form === "comet" ? ball.evo * 0.02 : 0; return clamp((1 + (ball.level - 1) * 0.0042 + ball.evo * 0.02 + comet) * (stats.speed || 1), 0.55, 3.2); }',
    );
    code = code.replace(
      'function prestigeReward() { if (state.level < 10) return 0; return Math.max(1, Math.floor(Math.pow(state.level - 9, 0.74) * (1 + metaEffects().prestigeBoost))); }',
      'function prestigeReward() { if (state.level < 10) return 0; return Math.max(1, Math.floor((Math.pow(state.level - 9, 0.72) + state.level / 180) * (1 + metaEffects().prestigeBoost))); }',
    );
    code = code.replace(
      'state.fragments = (eff.startFragments || 0) + (meta.bankedFragments || 0);',
      'state.fragments = 420 + (eff.startFragments || 0) + (meta.bankedFragments || 0);',
    );
    code = code.replace(
      'state.upgrades = { damage: 0, speed: 0, xp: 0 };',
      'state.upgrades = { damage: 1, speed: 0, xp: 0 };',
    );
    code = code.replace(
      'const move = 1.15 * totalSpeed(ball);',
      'const calculatedSpeed = totalSpeed(ball); ball.__speedGuard = Math.max(ball.__speedGuard || 0, calculatedSpeed); const move = 1.15 * Math.max(calculatedSpeed, ball.__speedGuard);',
    );

    code = code.replace(
      'function chooseThreeForms(ball) { const random = rng(Date.now() + ball.id * 1337 + ball.level * 17); const pool = [...forms]; const result = []; while (result.length < 3 && pool.length) result.push(pool.splice(Math.floor(random() * pool.length), 1)[0]); return result; }',
      'function weightedForm(random) { const eff = metaEffects(); const luck = eff.rareLuck || 0; const weights = { common: Math.max(25, 55 - luck * 2), rare: 28 + luck * 1.2, epic: 13 + luck * 0.65, legendary: 4 + luck * 0.18 }; const total = Object.values(weights).reduce((a, b) => a + b, 0); let roll = random() * total; let rarity = "common"; for (const key of ["common", "rare", "epic", "legendary"]) { roll -= weights[key]; if (roll <= 0) { rarity = key; break; } } const pool = forms.filter((form) => form.rarity === rarity); return pool[Math.floor(random() * pool.length)] || forms[0]; }\n  function chooseThreeForms(ball) { const random = rng(Date.now() + ball.id * 1337 + ball.level * 17); const result = []; const target = 3 + (metaEffects().choiceBonus || 0); while (result.length < target && result.length < forms.length) { const form = weightedForm(random); if (!result.some((item) => item.key === form.key)) result.push(form); } return result.sort((a, b) => (rarityRank[b.rarity] || 1) - (rarityRank[a.rarity] || 1)); }\n  function pickStarterForm(rarity, index) { const pool = forms.filter((form) => form.rarity === rarity); return pool[index % pool.length] || pool[0] || forms[0]; }\n  function forceBallForm(ball, form) { ball.form = form.key; ball.formName = form.name; ball.color = form.color; ball.evo = Math.max(ball.evo || 0, 1); ball.rarity = form.rarity; ball.r = 9 + Math.min(12, ball.evo * 0.95) * (form.radius || 1); ball.evolved = ball.evolved || []; if (!ball.evolved.includes(10)) ball.evolved.push(10); ball.pendingEvolution = null; ball.dmg = damageFor(ball); }'
    );

    code = code.replace(
      'function applyEvolution(ballId, formKey) { const ball = state.balls.find((item) => item.id === ballId); const form = forms.find((item) => item.key === formKey); if (!ball || !form) return; const milestone = ball.pendingEvolution || pendingMilestone(ball); if (!milestone) return; ball.evo += 1; ball.form = form.key; ball.formName = form.name; ball.color = form.color; ball.r = 9 + Math.min(8, ball.evo * 0.85); ball.evolved.push(milestone); ball.pendingEvolution = null; ball.xp = 0; ball.need = xpNeed(ball.level); ball.dmg = damageFor(ball); log(`Шар-${ball.id} эволюционировал: ${form.name}.`); }',
      'function applyEvolution(ballId, formKey) { const ball = state.balls.find((item) => item.id === ballId); const form = forms.find((item) => item.key === formKey); if (!ball || !form) return; const milestone = ball.pendingEvolution || pendingMilestone(ball); if (!milestone) return; if (ball.form !== "basic") { const current = forms.find((item) => item.key === ball.form) || form; ball.evo += 1; ball.evolved.push(milestone); ball.pendingEvolution = null; ball.xp = 0; ball.need = xpNeed(ball.level); ball.r = 9 + Math.min(12, ball.evo * 0.95) * (formStats(ball).radius || 1); ball.dmg = damageFor(ball); log(`Шар-${ball.id}: усилена форма ${current.name}.`); return; } ball.evo += 1; ball.form = form.key; ball.formName = form.name; ball.color = form.color; ball.rarity = form.rarity; ball.r = 9 + Math.min(12, ball.evo * 0.95) * (form.radius || 1); ball.evolved.push(milestone); ball.pendingEvolution = null; ball.xp = 0; ball.need = xpNeed(ball.level); ball.dmg = damageFor(ball); log(`Шар-${ball.id} выбрал ${rarityInfo[form.rarity]?.label || "Обычный"}: ${form.name}.`); }',
    );

    code = code.replace(
      'function showEvolution(ballId) { const ball = state.balls.find((item) => item.id === ballId); if (!ball) return; const milestone = ball.pendingEvolution || pendingMilestone(ball); if (!milestone) return; if (metaEffects().autoEvolution) { applyEvolution(ball.id, chooseThreeForms(ball)[0].key); return; } ball.pendingEvolution = milestone; const choices = chooseThreeForms(ball); document.querySelector(".evo-modal")?.remove(); const modal = document.createElement("div"); modal.className = "evo-modal"; modal.innerHTML = `<div class="evo-box"><h2>Эволюция Шара-${ball.id}</h2><p>Шар достиг ${milestone} уровня. Опыт остановлен до выбора формы.</p><div class="evo-grid">${choices.map((form) => `<button class="evo-choice" data-ball="${ball.id}" data-form="${form.key}"><span class="dot" style="background:${form.color}"></span><b>${form.name}</b><small>${form.desc}</small></button>`).join("")}</div><button class="control evo-close">Позже</button></div>`; modal.addEventListener("pointerdown", (event) => { const choice = event.target.closest(".evo-choice"); if (choice) { applyEvolution(Number(choice.dataset.ball), choice.dataset.form); modal.remove(); ui(); return; } if (event.target.closest(".evo-close")) modal.remove(); }); document.body.appendChild(modal); }',
      'function showEvolution(ballId) { const ball = state.balls.find((item) => item.id === ballId); if (!ball) return; const milestone = ball.pendingEvolution || pendingMilestone(ball); if (!milestone) return; if (ball.form !== "basic") { applyEvolution(ball.id, ball.form); ui(); return; } const choices = chooseThreeForms(ball); if (metaEffects().autoEvolution) { applyEvolution(ball.id, choices[0].key); return; } ball.pendingEvolution = milestone; document.querySelector(".evo-modal")?.remove(); const modal = document.createElement("div"); modal.className = "evo-modal"; modal.innerHTML = `<div class="evo-box"><h2>Архетип Шара-${ball.id}</h2><p>Шар достиг ${milestone} уровня. Выбери редкость и специализацию. Следующие эволюции будут усиливать её.</p><div class="evo-grid">${choices.map((form) => `<button class="evo-choice" data-ball="${ball.id}" data-form="${form.key}"><span class="dot" style="background:${form.color}"></span><b>${rarityInfo[form.rarity]?.label || "Обычный"}: ${form.name}</b><small>${form.desc}<br>Урон x${form.damage} · Скорость x${form.speed}</small></button>`).join("")}</div><button class="control evo-close">Позже</button></div>`; modal.addEventListener("pointerdown", (event) => { const choice = event.target.closest(".evo-choice"); if (choice) { applyEvolution(Number(choice.dataset.ball), choice.dataset.form); modal.remove(); ui(); return; } if (event.target.closest(".evo-close")) modal.remove(); }); document.body.appendChild(modal); }',
    );

    code = code.replace(
      'function hitDamage(ball, brick) { let amount = ball.dmg; if (ball.form === "crit" && Math.random() < clamp(0.1 + ball.evo * 0.025, 0.1, 0.36)) amount *= 1.5 + ball.evo * 0.1; if (ball.form === "drill" && brick.hp / brick.max > 0.5) amount *= 1.12 + ball.evo * 0.08; if (ball.form === "comet") amount *= 1 + Math.min(0.55, (personalSpeed(ball) - 1) * 0.16); return amount; }',
      'function hitDamage(ball, brick) { let amount = ball.dmg; if (ball.form === "plasma") amount += Math.max(1, brick.max * (0.015 + ball.evo * 0.006)); if (ball.form === "singularity") amount *= 1 + Math.max(0, 1 - state.bricks.length / 120) * (0.8 + ball.evo * 0.18); if (ball.form === "crit" && Math.random() < clamp(0.1 + ball.evo * 0.03, 0.1, 0.42)) amount *= 1.55 + ball.evo * 0.12; if (ball.form === "drill" && brick.hp / brick.max > 0.5) amount *= 1.18 + ball.evo * 0.1; if (ball.form === "comet") amount *= 1 + Math.min(0.75, (personalSpeed(ball) - 1) * 0.22); if (ball.form === "solar" && ball.hits % Math.max(12, 34 - ball.evo * 3) === 0) amount += brick.max * (0.03 + ball.evo * 0.006); return amount; }',
    );

    code = code.replace(
      'function dealDamage(index, amount, ball, source = "direct") { const brick = state.bricks[index]; if (!brick || !ball) return false; brick.hp -= amount * damageMult(ball, brick, source); if (brick.hp > 0) return false;',
      'function dealDamage(index, amount, ball, source = "direct") { const brick = state.bricks[index]; if (!brick || !ball) return false; if (ball.form === "poison" && source === "direct") brick.poison = Math.max(brick.poison || 0, 4 + ball.evo * 2); brick.hp -= amount * damageMult(ball, brick, source); if (brick.hp > 0) return false;',
    );
    code = code.replace(
      'if (ball.form === "plasma" && ball.evo > 0) { const targets = state.bricks.map((b, j) => ({ j, d: Math.hypot(b.x + b.w / 2 - center.x, b.y + b.h / 2 - center.y) })).filter((item) => item.d <= 54 + ball.evo * 8).map((item) => item.j).sort((a, b) => b - a); for (const target of targets) dealDamage(target, ball.dmg * (0.08 + ball.evo * 0.015), ball, "splash"); }',
      'if (ball.form === "plasma" && ball.evo > 0) { const targets = state.bricks.map((b, j) => ({ j, d: Math.hypot(b.x + b.w / 2 - center.x, b.y + b.h / 2 - center.y) })).filter((item) => item.d <= 48 + ball.evo * 14).map((item) => item.j).sort((a, b) => b - a); for (const target of targets) { const b = state.bricks[target]; if (b) dealDamage(target, Math.max(1, b.max * (0.01 + ball.evo * 0.005)), ball, "splash"); } } if (ball.form === "shard" && destroyed) { const shots = clamp(1 + ball.evo, 1, 8); for (let s = 0; s < shots && state.bricks.length > 0; s += 1) dealDamage(Math.floor(Math.random() * state.bricks.length), ball.dmg * 0.22, ball, "shard"); } if (ball.form === "quantum" && Math.random() < 0.04 + ball.evo * 0.015 && state.bricks.length > 0) dealDamage(Math.floor(Math.random() * state.bricks.length), ball.dmg * 0.8, ball, "quantum"); if (ball.form === "royal") { for (const ally of state.balls) if (ally.id !== ball.id) ally.dmg = damageFor(ally) * (1 + ball.evo * 0.025); }',
    );
    code = code.replace(
      'if (ball.form === "storm" && destroyed && state.bricks.length > 0) { const jumps = clamp(1 + Math.floor(ball.evo / 3), 1, 4); for (let n = 0; n < jumps && state.bricks.length > 0; n += 1) dealDamage(Math.floor(Math.random() * state.bricks.length), ball.dmg * (0.36 + ball.evo * 0.045), ball, "chain"); }',
      'if (ball.form === "storm" && destroyed && state.bricks.length > 0) { const jumps = clamp(1 + ball.evo, 1, 10); for (let n = 0; n < jumps && state.bricks.length > 0; n += 1) dealDamage(Math.floor(Math.random() * state.bricks.length), ball.dmg * (0.32 + ball.evo * 0.04), ball, "chain"); }',
    );
    code = code.replace(
      'for (const brick of state.bricks) if (brick.type === "regen" && brick.hp < brick.max) brick.hp = Math.min(brick.max, brick.hp + Math.max(0.01, stageHp(state.level) * 0.001));',
      'for (let p = state.bricks.length - 1; p >= 0; p -= 1) { const brick = state.bricks[p]; if (brick.poison) { brick.poison -= 1 / 60; brick.hp -= Math.max(0.015, brick.max * 0.0008); if (brick.hp <= 0) { const poisonOwner = state.balls.find((ball) => ball.form === "poison") || state.balls[0]; const destroyed = state.bricks.splice(p, 1)[0]; if (poisonOwner && destroyed) reward(poisonOwner, destroyed); continue; } } if (brick.type === "regen" && brick.hp < brick.max) brick.hp = Math.min(brick.max, brick.hp + Math.max(0.01, stageHp(state.level) * 0.001)); }',
    );
    code = code.replace(
      'const prevX = ball.x - ball.dx * move; if (prevX < brick.x || prevX > brick.x + brick.w) ball.dx *= -1; else ball.dy *= -1; normalize(ball); ball.hits += 1;',
      `const prevX = ball.x - ball.dx * move;
        const prevY = ball.y - ball.dy * move;
        ball.x = prevX;
        ball.y = prevY;
        const hitFromSide = prevX < brick.x || prevX > brick.x + brick.w;
        const hitFromVertical = prevY < brick.y || prevY > brick.y + brick.h;
        if (hitFromSide && hitFromVertical) {
          const brickCenterX = brick.x + brick.w / 2;
          const brickCenterY = brick.y + brick.h / 2;
          const relativeX = Math.abs(prevX - brickCenterX) / Math.max(1, brick.w / 2);
          const relativeY = Math.abs(prevY - brickCenterY) / Math.max(1, brick.h / 2);
          if (relativeX > relativeY) ball.dx *= -1;
          else ball.dy *= -1;
        } else if (hitFromSide) ball.dx *= -1;
        else ball.dy *= -1;
        ball.x += ball.dx * 0.75;
        ball.y += ball.dy * 0.75;
        normalize(ball); ball.hits += 1;`,
    );

    code = code.replace(
      'const count = 2 + (eff.starterBalls || 0); for (let i = 0; i < count; i += 1) state.balls.push(makeBall(i + 1, i)); generateBricks();',
      'const count = 2 + (eff.starterBalls || 0) + (eff.startRare ? 1 : 0) + (eff.startEpic ? 1 : 0) + (eff.startLegendary ? 1 : 0); for (let i = 0; i < count; i += 1) state.balls.push(makeBall(i + 1, i)); let starterIndex = 0; if (eff.startRare) forceBallForm(state.balls[starterIndex++], pickStarterForm("rare", 0)); if (eff.startEpic) forceBallForm(state.balls[starterIndex++], pickStarterForm("epic", 1)); if (eff.startLegendary) forceBallForm(state.balls[starterIndex++], pickStarterForm("legendary", 2)); generateBricks();'
    );

    code = code.replace(
      'const formLabel = ball.formName || forms.find((f) => f.key === ball.form)?.name || "Базовый";',
      'const formData = forms.find((f) => f.key === ball.form); const formLabel = ball.formName || formData?.name || "Базовый"; const rarityLabel = formData ? (rarityInfo[formData.rarity]?.label || "Обычный") + " · " : "";'
    );
    code = code.replace(
      '<small>${formLabel} · Ур. ${ball.level} · Урон ${ball.dmg} · Скорость x${totalSpeed(ball).toFixed(2)} · XP ${locked ? "СТОП" : `${Math.floor(ball.xp)}/${ball.need}`}</small>',
      '<small>${rarityLabel}${formLabel} · Ур. ${ball.level} · Урон ${ball.dmg} · Скорость x${totalSpeed(ball).toFixed(2)} · XP ${locked ? "СТОП" : `${Math.floor(ball.xp)}/${ball.need}`}</small>'
    );

    code = code.replace(
      "if (!load()) newRun(); bindUi(); ui(); renderMeta(); loop();",
      `if (!load()) newRun();
  function grantManualXp(target, brick) {
    if (!target || isEvolutionLocked(target)) return;
    target.xp += Math.max(1, Math.ceil(brick.xp * 0.08 * xpMult() * 0.45 * (1 + Math.pow(Math.max(1, state.level), 0.45) * 0.035)));
    while (!isEvolutionLocked(target) && target.xp >= target.need) {
      target.xp -= target.need;
      target.level += 1;
      target.need = xpNeed(target.level);
      target.dmg = damageFor(target);
      log(\`Шар-\${target.id}: \${target.level} ур.\`);
      const milestone = pendingMilestone(target);
      if (milestone) {
        target.pendingEvolution = milestone;
        target.xp = 0;
        log(\`Шар-\${target.id} ждёт эволюцию \${milestone} ур.\`);
        if (metaEffects().autoEvolution) showEvolution(target.id);
        break;
      }
    }
  }
  function manualHitAt(x, y) {
    for (let i = state.bricks.length - 1; i >= 0; i -= 1) {
      const brick = state.bricks[i];
      if (!brick) continue;
      if (x < brick.x || x > brick.x + brick.w || y < brick.y || y > brick.y + brick.h) continue;
      brick.hp -= 1;
      if (brick.hp <= 0) {
        const destroyed = state.bricks.splice(i, 1)[0];
        state.fragments += Math.max(1, Math.ceil(destroyed.xp * 0.34));
        state.total += 1;
        const target = [...state.balls]
          .filter((ball) => !isEvolutionLocked(ball))
          .sort((a, b) => a.level - b.level || a.xp - b.xp)[0];
        grantManualXp(target, destroyed);
      }
      ui();
      return true;
    }
    return false;
  }
  canvas.style.cursor = "crosshair";
  canvas.addEventListener("pointerdown", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (W / rect.width);
    const y = (event.clientY - rect.top) * (H / rect.height);
    manualHitAt(x, y);
  });
  bindUi(); ui(); renderMeta(); loop();`,
    );

    return code + "\n//# sourceURL=site-app-v8-7-runtime.js";
  }

  fetch(SOURCE, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`Не удалось загрузить ${SOURCE}`);
      return response.text();
    })
    .then((source) => {
      const script = document.createElement("script");
      script.textContent = patchRuntime(source);
      document.body.appendChild(script);
    })
    .catch((error) => {
      console.error("Ошибка запуска v8.7:", error);
      const box = document.createElement("pre");
      box.style.cssText = "position:fixed;inset:16px;z-index:9999;background:#020617;color:#fecaca;padding:16px;border:1px solid #ef4444;border-radius:12px;white-space:pre-wrap";
      box.textContent = `Ошибка запуска игры v8.7:\n${error.message}`;
      document.body.appendChild(box);
    });
})();
