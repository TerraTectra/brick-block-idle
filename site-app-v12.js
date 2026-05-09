(() => {
  "use strict";

  const VERSION = "v0.12-core";
  const SAVE_KEY = "brick_block_idle_v12_save";
  const W = 1120;
  const H = 720;
  const BASE_SPEED_MULTIPLIER = 5;
  const canvas = document.getElementById("game");
  const ctx = canvas && canvas.getContext("2d");
  if (!canvas || !ctx) return;

  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = (v) => {
    v = Number(v || 0);
    if (v >= 1e12) return (v / 1e12).toFixed(2) + "T";
    if (v >= 1e9) return (v / 1e9).toFixed(2) + "B";
    if (v >= 1e6) return (v / 1e6).toFixed(2) + "M";
    if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
    return Math.floor(v).toString();
  };

  const forms = [
    { key: "striker", name: "Ударный", rarity: "common", color: "#93c5fd", dmg: 1.2, spd: 1.0, role: "Стабильный урон" },
    { key: "swift", name: "Быстрый", rarity: "common", color: "#67e8f9", dmg: 0.78, spd: 1.62, role: "Скорость" },
    { key: "heavy", name: "Тяжёлый", rarity: "common", color: "#cbd5e1", dmg: 1.75, spd: 0.72, role: "Большой удар" },
    { key: "collector", name: "Сборщик", rarity: "common", color: "#60a5fa", dmg: 0.72, spd: 1.05, role: "Фарм" },
    { key: "plasma", name: "Плазма", rarity: "rare", color: "#ff4d6d", dmg: 1.0, spd: 0.98, role: "Сплэш" },
    { key: "storm", name: "Гроза", rarity: "rare", color: "#facc15", dmg: 0.88, spd: 1.18, role: "Цепи" },
    { key: "drill", name: "Бур", rarity: "rare", color: "#fb923c", dmg: 1.38, spd: 0.82, role: "Пробитие" },
    { key: "frost", name: "Ледяной", rarity: "epic", color: "#bae6fd", dmg: 1.05, spd: 0.92, role: "Контроль" },
    { key: "vampire", name: "Вампир", rarity: "epic", color: "#fb7185", dmg: 1.0, spd: 1.0, role: "Снежный ком" },
    { key: "singularity", name: "Сингулярный", rarity: "legendary", color: "#fde047", dmg: 1.25, spd: 0.9, role: "Финишер" },
    { key: "berserk", name: "Берсерк", rarity: "legendary", color: "#ef4444", dmg: 1.0, spd: 1.1, role: "Разгон" },
  ];

  const brickTypes = [
    { key: "normal", name: "Обычный", min: 1, color: "#4cc9f0", hp: 1, reward: 1, info: "Без особенностей." },
    { key: "armored", name: "Броня", min: 8, color: "#94a3b8", hp: 1.35, reward: 1.25, info: "Режет часть прямого урона." },
    { key: "volatile", name: "Нестабильный", min: 15, color: "#fb923c", hp: 0.9, reward: 1.35, info: "Взрывает соседей при смерти." },
    { key: "regen", name: "Живой", min: 25, color: "#2dd4bf", hp: 1.25, reward: 1.55, info: "Регенерирует, пока жив." },
    { key: "shield", name: "Щит", min: 40, color: "#a855f7", hp: 1.55, reward: 1.8, info: "Сопротивляется непрямому урону." },
    { key: "heavy", name: "Тяжёлый", min: 70, color: "#fb7185", hp: 2.1, reward: 2.15, info: "Много HP и награды." },
  ];

  const tiers = [
    { key: "common", label: "Обычное", power: 1, weight: 60, color: "#cbd5e1" },
    { key: "rare", label: "Редкое", power: 1.8, weight: 28, color: "#38bdf8" },
    { key: "epic", label: "Эпическое", power: 3, weight: 10, color: "#c084fc" },
    { key: "legendary", label: "Легендарное", power: 5, weight: 2, color: "#facc15" },
  ];

  function formOf(ball) { return forms.find((f) => f.key === ball.form) || forms[0]; }
  function activeBrickTypes() { return brickTypes.filter((t) => state.level >= t.min); }
  function stageHp(level) { return Math.max(1, Math.floor(1 + level * 0.9 + Math.pow(level, 1.22) * 0.28)); }
  function xpNeed(level) { return Math.floor(20 + level * 14 + Math.pow(level, 1.35) * 7); }
  function upgradeCost(key) { const r = state.upgrades[key] || 0; const base = key === "ball" ? 800 : key === "xp" ? 90 : 110; return Math.ceil(base * Math.pow(1.18, r)); }
  function bossNodeCost(key) { const r = state.boss.nodes[key] || 0; return Math.ceil((key === "start" ? 2 : key === "reward" ? 4 : 3) * Math.pow(1.55, r)); }

  function makeBall(form = "striker", index = 0) {
    const a = -Math.PI / 3 - index * 0.22;
    return { id: Date.now() + Math.random(), form, x: W / 2, y: H - 78, vx: Math.cos(a), vy: Math.sin(a), r: 8, level: 1, xp: 0, evo: 0, kills: 0, stageSpeed: 0, stagePower: 0 };
  }

  function defaultState() {
    return {
      version: VERSION,
      level: 1,
      fragments: 350,
      total: 350,
      best: 1,
      paused: false,
      upgrades: { damage: 1, speed: 1, xp: 1, ball: 0 },
      arch: { damage: 0, speed: 0, classPower: 0, rolls: [] },
      boss: { points: 0, earned: 0, nodes: { damage: 0, start: 0, reward: 0 }, killed: {} },
      balls: [makeBall("striker")],
      bricks: [],
      activeBoss: null,
      log: ["v0.12-core запущен: всё собрано в один рантайм."],
      started: Date.now(),
    };
  }

  let state = load();
  let lastTime = performance.now();
  let uiFrame = 0;

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!raw || typeof raw !== "object") return defaultState();
      const fresh = defaultState();
      const merged = { ...fresh, ...raw };
      merged.upgrades = { ...fresh.upgrades, ...(raw.upgrades || {}) };
      merged.arch = { ...fresh.arch, ...(raw.arch || {}) };
      merged.boss = { ...fresh.boss, ...(raw.boss || {}) };
      merged.boss.nodes = { ...fresh.boss.nodes, ...(raw.boss?.nodes || {}) };
      merged.balls = Array.isArray(raw.balls) && raw.balls.length ? raw.balls : fresh.balls;
      merged.bricks = [];
      merged.activeBoss = null;
      merged.version = VERSION;
      return merged;
    } catch { return defaultState(); }
  }

  function save() {
    const copy = { ...state, bricks: [], activeBoss: state.activeBoss };
    localStorage.setItem(SAVE_KEY, JSON.stringify(copy));
  }

  function log(text) { state.log = [text, ...state.log].slice(0, 12); }

  function pickBrickType(rand) {
    const types = activeBrickTypes();
    const t = types[Math.floor(rand() * types.length)] || types[0];
    if (rand() < 0.65) return brickTypes[0];
    return t;
  }

  function rng(seed) {
    let x = seed % 2147483647;
    if (x <= 0) x += 2147483646;
    return () => ((x = x * 16807 % 2147483647) - 1) / 2147483646;
  }

  function patternFilled(row, col, level, rand) {
    const p = level % 7;
    if (p === 0) return (row + col) % 2 === 0 || rand() > 0.35;
    if (p === 1) return Math.abs(col - 7) <= row + 1 || rand() > 0.82;
    if (p === 2) return row % 2 === 0 ? col % 3 !== 1 : col % 4 !== 2;
    if (p === 3) return col === row || col === 13 - row || rand() > 0.28;
    if (p === 4) return row < 2 || col < 2 || col > 11 || rand() > 0.45;
    if (p === 5) return ((row * col + level) % 5) !== 0;
    return rand() > 0.22;
  }

  function generateStage() {
    state.bricks = [];
    state.activeBoss = null;
    state.best = Math.max(state.best, state.level);
    for (const b of state.balls) { b.stageSpeed = 0; b.stagePower = 0; }

    if (state.level % 100 === 0) {
      const maxHp = Math.floor(5000 + state.level * 100 + Math.pow(state.level / 100, 2.2) * 18000);
      state.activeBoss = { stage: state.level, hp: maxHp, maxHp, x: W / 2, y: 190, r: 74 };
      log(`Босс этапа ${state.level} появился.`);
      return;
    }

    const rand = rng(state.level * 999 + 17);
    const cols = 14;
    const rows = 8;
    const gap = 8;
    const bw = (W - 120 - gap * (cols - 1)) / cols;
    const bh = 34;
    const baseHp = stageHp(state.level);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!patternFilled(row, col, state.level, rand)) continue;
        const type = pickBrickType(rand);
        const hp = Math.ceil(baseHp * type.hp * (1 + row * 0.04));
        state.bricks.push({ x: 60 + col * (bw + gap), y: 76 + row * (bh + gap), w: bw, h: bh, hp, maxHp: hp, type: type.key, dead: false, poison: 0, frozen: 0 });
      }
    }
  }

  function damageMult() { return Math.pow(1.12, state.upgrades.damage) * Math.pow(1.08, state.arch.damage); }
  function speedMult() { return BASE_SPEED_MULTIPLIER * Math.pow(1.07, state.upgrades.speed) * Math.pow(1.055, state.arch.speed); }
  function xpMult() { return Math.pow(1.11, state.upgrades.xp); }
  function classMult() { return Math.pow(1.1, state.arch.classPower); }

  function ballDamage(ball) {
    const f = formOf(ball);
    const evo = Math.floor(ball.level / 10) + ball.evo;
    let dmg = (1 + ball.level * 0.42 + Math.pow(ball.level, 1.13) * 0.06) * (1 + evo * 0.16) * f.dmg * damageMult() * (1 + ball.stagePower);
    if (f.key === "singularity") dmg *= 1 + Math.max(0, 1 - state.bricks.filter((b) => !b.dead).length / 50) * classMult();
    return dmg;
  }

  function ballSpeed(ball) {
    const f = formOf(ball);
    const evo = Math.floor(ball.level / 10) + ball.evo;
    return (1.2 + ball.level * 0.012 + evo * 0.035 + ball.stageSpeed) * f.spd * speedMult();
  }

  function addXp(ball, amount) {
    ball.xp += amount * xpMult() * (formOf(ball).key === "collector" ? 1 + classMult() * 0.08 : 1);
    while (ball.xp >= xpNeed(ball.level)) {
      ball.xp -= xpNeed(ball.level);
      ball.level++;
      ball.evo = Math.max(ball.evo, Math.floor(ball.level / 10));
      if (ball.level % 10 === 0) rollArchetypeChoices();
    }
  }

  function rewardFor(typeKey) {
    const t = brickTypes.find((x) => x.key === typeKey) || brickTypes[0];
    return Math.ceil((2 + state.level * 0.9 + Math.pow(state.level, 1.05) * 0.28) * t.reward * (formOf(state.balls[0]).key === "collector" ? 1.05 : 1));
  }

  function killBrick(brick, sourceBall) {
    if (brick.dead) return;
    brick.dead = true;
    const gain = rewardFor(brick.type);
    state.fragments += gain;
    state.total += gain;
    sourceBall.kills++;
    if (formOf(sourceBall).key === "vampire") sourceBall.stagePower += 0.012 * classMult();
    if (formOf(sourceBall).key === "berserk") sourceBall.stageSpeed += 0.015 * classMult();
    addXp(sourceBall, 8 + state.level * 0.35);
    const t = brickTypes.find((x) => x.key === brick.type);
    if (t?.key === "volatile") splash(brick.x + brick.w / 2, brick.y + brick.h / 2, ballDamage(sourceBall) * 0.45, sourceBall, 72);
  }

  function splash(x, y, dmg, ball, radius) {
    for (const b of state.bricks) {
      if (b.dead) continue;
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      if (Math.hypot(cx - x, cy - y) <= radius) hitBrick(b, dmg, ball, true);
    }
  }

  function hitBrick(brick, dmg, ball, indirect = false) {
    const type = brickTypes.find((x) => x.key === brick.type) || brickTypes[0];
    if (type.key === "armored" && formOf(ball).key !== "drill") dmg *= 0.72;
    if (type.key === "shield" && indirect) dmg *= 0.38;
    if (type.key === "heavy" && formOf(ball).key !== "drill") dmg *= 0.8;
    if (formOf(ball).key === "plasma") splash(brick.x + brick.w / 2, brick.y + brick.h / 2, dmg * 0.12 * classMult(), ball, 52);
    brick.hp -= dmg;
    addXp(ball, 0.7 + dmg * 0.03);
    if (brick.hp <= 0) {
      killBrick(brick, ball);
      if (formOf(ball).key === "storm") chainStorm(ball);
    }
  }

  function chainStorm(ball) {
    const alive = state.bricks.filter((b) => !b.dead);
    const count = Math.max(1, Math.floor(classMult()));
    for (let i = 0; i < count && alive.length; i++) {
      const b = alive[Math.floor(Math.random() * alive.length)];
      hitBrick(b, ballDamage(ball) * 0.35, ball, true);
    }
  }

  function collideBallBrick(ball, brick) {
    const cx = clamp(ball.x, brick.x, brick.x + brick.w);
    const cy = clamp(ball.y, brick.y, brick.y + brick.h);
    const dx = ball.x - cx;
    const dy = ball.y - cy;
    return dx * dx + dy * dy <= ball.r * ball.r;
  }

  function wallBounce(ball) {
    let bounced = false;
    if (ball.x - ball.r <= 0 && ball.vx < 0) { ball.vx = Math.abs(ball.vx); bounced = true; }
    if (ball.x + ball.r >= W && ball.vx > 0) { ball.vx = -Math.abs(ball.vx); bounced = true; }
    if (ball.y - ball.r <= 0 && ball.vy < 0) { ball.vy = Math.abs(ball.vy); bounced = true; }
    if (ball.y + ball.r >= H && ball.vy > 0) { ball.vy = -Math.abs(ball.vy); bounced = true; }
    if (bounced) {
      const nudge = 0.12;
      ball.vx += (Math.random() - 0.42) * nudge;
      ball.vy += (Math.random() - 0.5) * nudge;
      normalize(ball);
    }
  }

  function normalize(ball) {
    const s = Math.hypot(ball.vx, ball.vy) || 1;
    ball.vx /= s;
    ball.vy /= s;
    if (Math.abs(ball.vx) < 0.16) ball.vx = Math.sign(ball.vx || Math.random() - 0.5) * 0.16;
    if (Math.abs(ball.vy) < 0.16) ball.vy = Math.sign(ball.vy || Math.random() - 0.5) * 0.16;
    const s2 = Math.hypot(ball.vx, ball.vy) || 1;
    ball.vx /= s2; ball.vy /= s2;
  }

  function update(dt) {
    if (state.paused) return;
    if (!state.bricks.length && !state.activeBoss) generateStage();

    for (const ball of state.balls) {
      const spd = ballSpeed(ball) * dt * 60;
      ball.x += ball.vx * spd;
      ball.y += ball.vy * spd;
      wallBounce(ball);

      if (state.activeBoss) {
        const b = state.activeBoss;
        if (Math.hypot(ball.x - b.x, ball.y - b.y) <= ball.r + b.r) {
          b.hp -= ballDamage(ball);
          addXp(ball, 8 + state.level);
          const dx = ball.x - b.x, dy = ball.y - b.y;
          const d = Math.hypot(dx, dy) || 1;
          ball.vx = dx / d; ball.vy = dy / d; normalize(ball);
        }
      } else {
        for (const brick of state.bricks) {
          if (brick.dead || !collideBallBrick(ball, brick)) continue;
          hitBrick(brick, ballDamage(ball), ball, false);
          const cx = brick.x + brick.w / 2, cy = brick.y + brick.h / 2;
          if (Math.abs(ball.x - cx) > Math.abs(ball.y - cy)) ball.vx *= -1; else ball.vy *= -1;
          normalize(ball);
          break;
        }
      }
    }

    for (const brick of state.bricks) {
      if (!brick.dead && brick.type === "regen") brick.hp = Math.min(brick.maxHp, brick.hp + dt * stageHp(state.level) * 0.018);
    }

    if (state.activeBoss && state.activeBoss.hp <= 0) killBoss();
    if (!state.activeBoss && state.bricks.length && state.bricks.every((b) => b.dead)) nextStage();
  }

  function nextStage() {
    state.level++;
    state.best = Math.max(state.best, state.level);
    state.bricks = [];
    state.activeBoss = null;
    if (state.level % 10 === 0) addBallMaybe();
    generateStage();
  }

  function killBoss() {
    const stage = state.activeBoss.stage;
    const base = Math.floor(stage / 100);
    const reward = base + (state.boss.nodes.reward || 0);
    state.boss.points += reward;
    state.boss.earned += reward;
    state.boss.killed[stage] = true;
    state.fragments += 500 * reward;
    state.total += 500 * reward;
    log(`Босс ${stage} уничтожен: +${reward} очк. босса.`);
    state.activeBoss = null;
    nextStage();
  }

  function addBallMaybe() {
    if (state.balls.length >= 1 + state.upgrades.ball) return;
    const form = forms[Math.floor(Math.random() * Math.min(forms.length, 4 + Math.floor(state.level / 25)))].key;
    state.balls.push(makeBall(form, state.balls.length));
  }

  function buyUpgrade(key) {
    const cost = upgradeCost(key);
    if (state.fragments < cost) return;
    state.fragments -= cost;
    state.upgrades[key] = (state.upgrades[key] || 0) + 1;
    if (key === "ball") state.balls.push(makeBall("striker", state.balls.length));
  }

  function rollTier() {
    const total = tiers.reduce((s, t) => s + t.weight, 0);
    let r = Math.random() * total;
    for (const t of tiers) { r -= t.weight; if (r <= 0) return t; }
    return tiers[0];
  }

  function rollArchetypeChoices() {
    const groups = ["damage", "speed", "classPower"];
    state.arch.rolls = groups.map((g) => ({ group: g, tier: rollTier().key }));
  }

  function takeArch(index) {
    const choice = state.arch.rolls[index];
    if (!choice) return;
    const tier = tiers.find((t) => t.key === choice.tier) || tiers[0];
    state.arch[choice.group] += tier.power;
    state.arch.rolls = [];
    log(`Архетип усилен: ${choice.group} +${tier.label}.`);
  }

  function buyBossNode(key) {
    const cost = bossNodeCost(key);
    if (state.boss.points < cost) return;
    state.boss.points -= cost;
    state.boss.nodes[key] = (state.boss.nodes[key] || 0) + 1;
  }

  function reset() {
    if (!confirm("Сбросить текущий прогресс v0.12-core?")) return;
    localStorage.removeItem(SAVE_KEY);
    state = defaultState();
    generateStage();
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (state.activeBoss) state.activeBoss.hp -= 1 + state.boss.nodes.damage;
    else {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      const brick = state.bricks.find((b) => !b.dead && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
      if (brick) hitBrick(brick, 1 + state.upgrades.damage, state.balls[0], false);
    }
  });

  $("pauseBtn")?.addEventListener("click", () => { state.paused = !state.paused; $("pauseBtn").textContent = state.paused ? "Продолжить" : "Пауза"; });
  $("resetBtn")?.addEventListener("click", reset);

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#07111f"); bg.addColorStop(1, "#020617");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(56,189,248,.22)"; ctx.lineWidth = 2; ctx.strokeRect(10, 10, W - 20, H - 20);

    if (state.activeBoss) {
      const b = state.activeBoss;
      ctx.save();
      ctx.shadowBlur = 34; ctx.shadowColor = "#facc15";
      ctx.fillStyle = "#7f1d1d"; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0; ctx.strokeStyle = "#facc15"; ctx.lineWidth = 5; ctx.stroke();
      ctx.fillStyle = "#fef3c7"; ctx.font = "bold 22px sans-serif"; ctx.textAlign = "center"; ctx.fillText(`БОСС ${b.stage}`, b.x, b.y + 7);
      const pct = clamp(b.hp / b.maxHp, 0, 1);
      ctx.fillStyle = "rgba(15,23,42,.85)"; ctx.fillRect(260, 36, 600, 18);
      ctx.fillStyle = "#facc15"; ctx.fillRect(260, 36, 600 * pct, 18);
      ctx.restore();
    }

    for (const b of state.bricks) {
      if (b.dead) continue;
      const t = brickTypes.find((x) => x.key === b.type) || brickTypes[0];
      ctx.fillStyle = t.color; ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = "rgba(2,6,23,.65)"; ctx.fillRect(b.x + 4, b.y + b.h - 7, b.w - 8, 4);
      ctx.fillStyle = "#e0f2fe"; ctx.fillRect(b.x + 4, b.y + b.h - 7, (b.w - 8) * clamp(b.hp / b.maxHp, 0, 1), 4);
    }

    for (const ball of state.balls) {
      const f = formOf(ball);
      ctx.save(); ctx.shadowBlur = 16; ctx.shadowColor = f.color; ctx.fillStyle = f.color;
      ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r + Math.min(8, ball.evo * 0.3), 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }

  function renderUi() {
    $("level") && ($("level").textContent = fmt(state.level));
    $("hp") && ($("hp").textContent = fmt(stageHp(state.level)));
    $("count") && ($("count").textContent = fmt(state.activeBoss ? 1 : state.bricks.filter((b) => !b.dead).length));
    $("frags") && ($("frags").textContent = fmt(state.fragments));

    const bosses = $("bosses");
    if (bosses) bosses.innerHTML = renderBosses();
    const stats = $("stats");
    if (stats) stats.innerHTML = renderStats();
    const upgrades = $("upgrades");
    if (upgrades) upgrades.innerHTML = renderUpgrades();
    const arch = $("archetype");
    if (arch) arch.innerHTML = renderArch();
    const unlim = $("unlimited");
    if (unlim) unlim.innerHTML = `<div class="unlimited-card"><h3>Без лимитов</h3><p>В v0.12-core лимитов нет в основной системе: уровни, этапы, ранги прокачки, evo и урон растут бесконечно. Отдельная “прокачка 2” больше не нужна.</p></div>`;
    const meta = $("meta");
    if (meta) meta.innerHTML = renderBossMeta();
    const balls = $("balls");
    if (balls) balls.innerHTML = renderBalls();
    const types = $("types");
    if (types) types.innerHTML = brickTypes.map((t) => `<div class="entry"><b style="color:${t.color}">${t.name}</b><br>${t.info}</div>`).join("");
    const logBox = $("log");
    if (logBox) logBox.innerHTML = state.log.map((x) => `<div class="entry">${x}</div>`).join("");

    document.querySelectorAll("[data-buy]").forEach((b) => b.onclick = () => buyUpgrade(b.dataset.buy));
    document.querySelectorAll("[data-arch]").forEach((b) => b.onclick = () => takeArch(Number(b.dataset.arch)));
    document.querySelectorAll("[data-boss-node]").forEach((b) => b.onclick = () => buyBossNode(b.dataset.bossNode));
  }

  function renderStats() {
    const minutes = Math.max(0.1, (Date.now() - state.started) / 60000);
    return `<div class="stat-section"><h3>Статистика</h3><div class="stat-list"><div class="stat-line"><small>Версия</small><b>${VERSION}</b></div><div class="stat-line"><small>Скорость</small><b>x${BASE_SPEED_MULTIPLIER}</b></div><div class="stat-line"><small>Лучший этап</small><b>${fmt(state.best)}</b></div><div class="stat-line"><small>Этапов/мин</small><b>${((state.level - 1) / minutes).toFixed(2)}</b></div></div></div>`;
  }

  function renderUpgrades() {
    const items = [
      ["damage", "Урон"], ["speed", "Скорость"], ["xp", "Опыт"], ["ball", "Новый шар"]
    ];
    return items.map(([k, n]) => `<div class="upgrade"><b>${n} · ранг ${state.upgrades[k] || 0}</b><p>Бесконечный ранг без потолка.</p><button class="buy" data-buy="${k}">Купить за ${fmt(upgradeCost(k))}</button></div>`).join("");
  }

  function renderArch() {
    if (!state.arch.rolls.length) rollArchetypeChoices();
    const groupName = { damage: "Урон", speed: "Скорость", classPower: "Классовая сила" };
    return `<div class="arch-card"><h3>Архетип</h3><p>Урон +${fmt(state.arch.damage)} · Скорость +${fmt(state.arch.speed)} · Класс +${fmt(state.arch.classPower)}</p></div>` + state.arch.rolls.map((r, i) => {
      const t = tiers.find((x) => x.key === r.tier) || tiers[0];
      return `<div class="arch-option ${t.key}"><h4>${groupName[r.group]}<span class="arch-pill">${t.label}</span></h4><p>Усиление +${t.power} к бесконечному архетипному рангу.</p><button class="arch-buy" data-arch="${i}">Выбрать</button></div>`;
    }).join("");
  }

  function renderBosses() {
    if (!state.activeBoss) return `<div class="boss-fight"><h3>Босс не активен</h3><p>Настоящий босс появляется каждые 100 этапов.</p></div>`;
    const b = state.activeBoss, pct = clamp(b.hp / b.maxHp, 0, 1) * 100;
    return `<div class="boss-fight"><h3>Босс этапа ${b.stage}</h3><p>${fmt(b.hp)} / ${fmt(b.maxHp)} HP</p><div class="boss-hpbar" style="--boss-hp:${pct}%"><span></span></div></div>`;
  }

  function renderBossMeta() {
    return `<div class="boss-banner"><h3>Босс-мета</h3><p>Очки босса: ${fmt(state.boss.points)} · всего: ${fmt(state.boss.earned)}</p></div>` + [["damage", "Урон по боссу"], ["start", "Стартовая мощь"], ["reward", "Больше наград"]].map(([k, n]) => `<div class="boss-node"><h3>${n} · ранг ${state.boss.nodes[k] || 0}</h3><button class="boss-buy" data-boss-node="${k}">Купить за ${fmt(bossNodeCost(k))} очк.</button></div>`).join("");
  }

  function renderBalls() {
    return state.balls.map((b, i) => { const f = formOf(b); return `<div class="entry"><b style="color:${f.color}">#${i + 1} ${f.name}</b><br>Ур. ${fmt(b.level)} · Evo ${fmt(Math.floor(b.level / 10) + b.evo)} · Урон ${fmt(ballDamage(b))} · ${f.role}</div>`; }).join("");
  }

  function loop(now) {
    const dt = Math.min(0.033, (now - lastTime) / 1000 || 0.016);
    lastTime = now;
    update(dt);
    draw();
    if (++uiFrame % 12 === 0) { renderUi(); save(); }
    requestAnimationFrame(loop);
  }

  generateStage();
  renderUi();
  requestAnimationFrame(loop);
})();
