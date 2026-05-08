(() => {
  const W = 980;
  const H = 650;
  const SAVE_KEY = "brick_block_idle_static_v5";
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const milestones = [10, 25, 50, 100, 200, 500, 1000];
  const forms = [
    ["plasma", "Плазма", "#ff4d6d"],
    ["storm", "Гроза", "#f9f871"],
    ["drill", "Бур", "#ff9f1c"],
    ["crit", "Крит", "#b517ff"],
    ["comet", "Комета", "#2ec4b6"],
    ["collector", "Сборщик", "#60a5fa"],
  ];
  const types = [
    { key: "normal", name: "Обычный", color: "#4cc9f0", min: 1, weight: 100, reward: 1 },
    { key: "armored", name: "Броня", color: "#94a3b8", min: 5, weight: 14, reward: 1.25 },
    { key: "volatile", name: "Нестабильный", color: "#ff9f1c", min: 10, weight: 8, reward: 1.15 },
    { key: "regen", name: "Живой", color: "#2ec4b6", min: 18, weight: 8, reward: 1.35 },
    { key: "shield", name: "Щит", color: "#b517ff", min: 25, weight: 7, reward: 1.5 },
    { key: "heavy", name: "Тяжёлый", color: "#ff4d6d", min: 40, weight: 5, reward: 1.75 },
  ];
  const state = {
    level: 1,
    fragments: 0,
    total: 0,
    paused: false,
    bricks: [],
    balls: [],
    upgrades: { damage: 0, speed: 0, xp: 0 },
    log: ["Баланс v5: XP, осколки и скорость снижены."],
  };
  let frame = 0;

  const el = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function rng(seed) {
    let v = seed % 2147483647;
    if (v <= 0) v += 2147483646;
    return () => {
      v = (v * 16807) % 2147483647;
      return (v - 1) / 2147483646;
    };
  }
  function log(text) {
    state.log = [text, ...state.log].slice(0, 8);
  }
  function activeTypes() {
    return types.filter((t) => state.level >= t.min);
  }
  function stageHp(level) {
    return Math.max(1, Math.floor(level + Math.pow(Math.max(0, level - 3), 1.42) * 2.4 + Math.pow(Math.max(0, level - 15), 1.86) * 0.9));
  }
  function brickReward(level, typeReward) {
    return Math.ceil((1.2 + level * 0.42 + Math.pow(level, 1.04) * 0.22) * typeReward);
  }
  function upgradePower(level, kind = "generic") {
    if (level <= 0) return 1;
    const linear = kind === "speed" ? 0.34 : kind === "xp" ? 0.38 : 0.46;
    const curve = kind === "speed" ? 0.08 : kind === "xp" ? 0.1 : 0.14;
    return +(1 + level * linear + (Math.pow(level, 1.28) - level) * curve).toFixed(2);
  }
  function xpNeed(level) {
    if (level <= 1) return 55;
    return Math.floor(55 + level * 34 + Math.pow(level, 2.02) * 32 + Math.pow(Math.max(0, level - 8), 2.25) * 42 + (milestones.includes(level) ? level * 140 : 0));
  }
  function damageFor(ball) {
    const base = 1 + (ball.level - 1) * 0.25 + Math.pow(ball.level - 1, 1.05) * 0.045;
    const evo = 1 + ball.evo * 0.14 + Math.pow(ball.evo, 1.15) * 0.025;
    return +(base * evo * upgradePower(state.upgrades.damage, "damage")).toFixed(2);
  }
  function personalSpeed(ball) {
    const comet = ball.form === "comet" ? ball.evo * 0.012 : 0;
    return clamp(1 + (ball.level - 1) * 0.0018 + ball.evo * 0.014 + comet, 1, 1.95);
  }
  function totalSpeed(ball) {
    return personalSpeed(ball) * upgradePower(state.upgrades.speed, "speed");
  }
  function xpMult() {
    return upgradePower(state.upgrades.xp, "xp");
  }
  function xpGain(brick, ball) {
    const bonus = ball.form === "collector" ? 1 + ball.evo * 0.06 : 1;
    return Math.max(1, Math.ceil(brick.xp * 0.08 * xpMult() * bonus));
  }
  function fragGain(brick, ball) {
    const bonus = ball.form === "collector" ? 1 + ball.evo * 0.08 : 1;
    return Math.max(1, Math.ceil(brick.xp * 0.34 * bonus));
  }
  function ballCost() {
    return Math.floor(320 * Math.pow(2.15, Math.max(0, state.balls.length - 2)));
  }
  function upgradeCost(key) {
    const base = key === "damage" ? 280 : key === "speed" ? 380 : 420;
    const growth = key === "damage" ? 2.28 : key === "speed" ? 2.45 : 2.55;
    const level = state.upgrades[key] || 0;
    return Math.floor(base * Math.pow(growth, level + Math.pow(level, 1.36) * 0.82));
  }
  function normalize(ball) {
    const len = Math.hypot(ball.dx, ball.dy) || 1;
    ball.dx /= len;
    ball.dy /= len;
  }
  function makeBall(id, index, saved) {
    const angle = -Math.PI / 4 - index * 0.33;
    const ball = {
      id,
      level: 1,
      x: W / 2 + index * 34,
      y: H - 82 - index * 18,
      dx: Math.cos(angle) * (index % 2 ? -1 : 1),
      dy: -Math.abs(Math.sin(angle)),
      r: 9,
      xp: 0,
      need: 55,
      kills: 0,
      hits: 0,
      evo: 0,
      form: "basic",
      color: "#4cc9f0",
      evolved: [],
      ...(saved || {}),
    };
    if (typeof ball.dx !== "number" || typeof ball.dy !== "number") {
      ball.dx = Math.cos(angle);
      ball.dy = -Math.abs(Math.sin(angle));
    }
    normalize(ball);
    ball.need = xpNeed(ball.level);
    ball.dmg = damageFor(ball);
    return ball;
  }
  function pattern(row, col, rows, cols) {
    if (state.level === 1) return true;
    if (row === 0 || row === rows - 1) return true;
    const p = (state.level - 1) % 8;
    const cx = (cols - 1) / 2;
    const cy = (rows - 1) / 2;
    const dx = col - cx;
    const dy = row - cy;
    const d = Math.hypot(dx, dy);
    const a = Math.atan2(dy, dx);
    if (p === 0) return !((col + state.level) % 5 === 0 && row % 4 !== 0);
    if (p === 1) return (row + col + state.level) % 6 !== 0 && (row * 2 + col + state.level) % 11 !== 0;
    if (p === 2) return Math.abs((d + state.level * 0.35) % 4) > 0.85;
    if (p === 3) return Math.hypot(col - cols * 0.32, row - rows * 0.48) > 2.4 && Math.hypot(col - cols * 0.68, row - rows * 0.48) > 2.4;
    if (p === 4) return row % 4 !== 2 || (col + state.level) % 4 !== 0;
    if (p === 5) return Math.abs(Math.sin(a * 2.4 + d * 0.68 + state.level * 0.25)) > 0.26;
    if (p === 6) return (row + col * 2 + state.level) % 7 !== 0;
    return rng(state.level * 999 + row * 13 + col)() > 0.14;
  }
  function pickType(row, col, random) {
    const pool = activeTypes();
    if (pool.length === 1) return pool[0];
    const weighted = pool.map((type) => ({
      type,
      weight: type.key === "normal" ? Math.max(42, type.weight - state.level * 0.65) : type.weight + ((row * 11 + col * 7 + state.level) % 9) * 0.2,
    }));
    let roll = random() * weighted.reduce((sum, item) => sum + item.weight, 0);
    for (const item of weighted) {
      roll -= item.weight;
      if (roll <= 0) return item.type;
    }
    return pool[0];
  }
  function generateBricks() {
    const cols = clamp(18 + Math.floor(state.level / 10), 18, 24);
    const gap = 5;
    const marginX = 18;
    const top = 70;
    const brickH = 22;
    const rows = Math.floor((H - 24 - top + gap) / (brickH + gap));
    const brickW = (W - marginX * 2 - gap * (cols - 1)) / cols;
    const random = rng(state.level * 9973 + 41);
    const hp = stageHp(state.level);
    state.bricks = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (!pattern(row, col, rows, cols)) continue;
        const type = pickType(row, col, random);
        state.bricks.push({
          x: marginX + col * (brickW + gap),
          y: top + row * (brickH + gap),
          w: brickW,
          h: brickH,
          hp,
          max: hp,
          xp: brickReward(state.level, type.reward),
          type: type.key,
          name: type.name,
          color: type.color,
        });
      }
    }
  }
  function evolve(ball, milestone) {
    const form = forms[Math.floor(Math.random() * forms.length)];
    ball.evo += 1;
    ball.form = form[0];
    ball.color = form[2];
    ball.r = 9 + Math.min(8, ball.evo * 0.85);
    ball.evolved.push(milestone);
    ball.dmg = damageFor(ball);
    log(`Шар-${ball.id} получил форму: ${form[1]}.`);
  }
  function reward(ball, brick) {
    state.fragments += fragGain(brick, ball);
    state.total += 1;
    ball.kills += 1;
    ball.xp += xpGain(brick, ball);
    while (ball.xp >= ball.need) {
      ball.xp -= ball.need;
      ball.level += 1;
      ball.need = xpNeed(ball.level);
      ball.dmg = damageFor(ball);
      log(`Шар-${ball.id}: ${ball.level} ур.`);
      for (const milestone of milestones) {
        if (ball.level >= milestone && !ball.evolved.includes(milestone)) evolve(ball, milestone);
      }
    }
  }
  function damageMult(ball, brick, source) {
    let m = 1;
    if (brick.type === "armored") m = source === "direct" ? 0.55 : 0.75;
    if (brick.type === "regen") m = source === "direct" ? 0.85 : 0.7;
    if (brick.type === "shield") m = source === "direct" ? 0.8 : 0.35;
    if (brick.type === "heavy") m = source === "direct" ? 0.45 : 0.58;
    if (ball.form === "drill" && source === "direct" && m < 1) m += (1 - m) * clamp(0.35 + ball.evo * 0.08, 0.35, 0.82);
    return m;
  }
  function dealDamage(index, amount, ball, source = "direct") {
    const brick = state.bricks[index];
    if (!brick || !ball) return false;
    brick.hp -= amount * damageMult(ball, brick, source);
    if (brick.hp > 0) return false;
    const destroyed = state.bricks.splice(index, 1)[0];
    if (!destroyed) return false;
    reward(ball, destroyed);
    if (destroyed.type === "volatile") {
      const centerX = destroyed.x + destroyed.w / 2;
      const centerY = destroyed.y + destroyed.h / 2;
      const targets = state.bricks
        .map((b, i) => ({ i, d: Math.hypot(b.x + b.w / 2 - centerX, b.y + b.h / 2 - centerY) }))
        .filter((item) => item.d <= 62)
        .map((item) => item.i)
        .sort((a, b) => b - a);
      for (const target of targets) dealDamage(target, Math.max(1, stageHp(state.level) * 0.12 + ball.dmg * 0.12), ball, "explosion");
    }
    return true;
  }
  function hitDamage(ball, brick) {
    let amount = ball.dmg;
    if (ball.form === "crit" && Math.random() < clamp(0.1 + ball.evo * 0.025, 0.1, 0.36)) amount *= 1.5 + ball.evo * 0.1;
    if (ball.form === "drill" && brick.hp / brick.max > 0.5) amount *= 1.12 + ball.evo * 0.08;
    if (ball.form === "comet") amount *= 1 + Math.min(0.55, (personalSpeed(ball) - 1) * 0.16);
    return amount;
  }
  function collide(ball, brick) {
    const nx = clamp(ball.x, brick.x, brick.x + brick.w);
    const ny = clamp(ball.y, brick.y, brick.y + brick.h);
    const dx = ball.x - nx;
    const dy = ball.y - ny;
    return dx * dx + dy * dy <= ball.r * ball.r;
  }
  function step() {
    if (state.paused) return;
    for (const brick of state.bricks) {
      if (brick.type === "regen" && brick.hp < brick.max) brick.hp = Math.min(brick.max, brick.hp + Math.max(0.01, stageHp(state.level) * 0.001));
    }
    for (const ball of state.balls) {
      const move = 1.15 * totalSpeed(ball);
      ball.x += ball.dx * move;
      ball.y += ball.dy * move;
      if (ball.x - ball.r <= 0 || ball.x + ball.r >= W) {
        ball.dx *= -1;
        ball.x = clamp(ball.x, ball.r, W - ball.r);
      }
      if (ball.y - ball.r <= 0 || ball.y + ball.r >= H) {
        ball.dy *= -1;
        ball.y = clamp(ball.y, ball.r, H - ball.r);
      }
      normalize(ball);
      for (let i = state.bricks.length - 1; i >= 0; i -= 1) {
        const brick = state.bricks[i];
        if (!brick || !collide(ball, brick)) continue;
        const prevX = ball.x - ball.dx * move;
        if (prevX < brick.x || prevX > brick.x + brick.w) ball.dx *= -1;
        else ball.dy *= -1;
        normalize(ball);
        ball.hits += 1;
        const center = { x: brick.x + brick.w / 2, y: brick.y + brick.h / 2 };
        const destroyed = dealDamage(i, hitDamage(ball, brick), ball);
        if (ball.form === "plasma" && ball.evo > 0) {
          const targets = state.bricks
            .map((b, j) => ({ j, d: Math.hypot(b.x + b.w / 2 - center.x, b.y + b.h / 2 - center.y) }))
            .filter((item) => item.d <= 54 + ball.evo * 8)
            .map((item) => item.j)
            .sort((a, b) => b - a);
          for (const target of targets) dealDamage(target, ball.dmg * (0.08 + ball.evo * 0.015), ball, "splash");
        }
        if (ball.form === "storm" && destroyed && state.bricks.length > 0) {
          const jumps = clamp(1 + Math.floor(ball.evo / 3), 1, 4);
          for (let n = 0; n < jumps && state.bricks.length > 0; n += 1) dealDamage(Math.floor(Math.random() * state.bricks.length), ball.dmg * (0.36 + ball.evo * 0.045), ball, "chain");
        }
        break;
      }
    }
    if (state.bricks.length === 0) {
      state.level += 1;
      generateBricks();
      for (const ball of state.balls) normalize(ball);
      log(`Открыт этап ${state.level}. HP блока: ${stageHp(state.level)}.`);
    }
  }
  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#070b18");
    bg.addColorStop(1, "#111827");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(148,163,184,.08)";
    for (let x = 22; x < W; x += 42) for (let y = 76; y < H; y += 42) {
      ctx.beginPath();
      ctx.arc(x, y, 1.45, 0, Math.PI * 2);
      ctx.fill();
    }
    rr(22, 18, W - 44, 42, 16);
    ctx.fillStyle = "rgba(15,23,42,.82)";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "900 18px system-ui";
    ctx.fillText(`Этап ${state.level}`, 42, 45);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "800 13px system-ui";
    ctx.fillText(`HP: ${stageHp(state.level)}`, 142, 44);
    ctx.fillText(`Блоков: ${state.bricks.length}`, 225, 44);
    ctx.fillText(`Осколки: ${Math.floor(state.fragments)}`, 345, 44);
    for (const brick of state.bricks) {
      const ratio = clamp(brick.hp / brick.max, 0, 1);
      rr(brick.x, brick.y, brick.w, brick.h, 8);
      ctx.fillStyle = brick.color;
      ctx.shadowColor = brick.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      rr(brick.x + 5, brick.y + brick.h - 8, (brick.w - 10) * ratio, 4, 4);
      ctx.fillStyle = ratio > 0.35 ? "rgba(255,255,255,.86)" : "rgba(255,77,109,.95)";
      ctx.fill();
    }
    for (const ball of state.balls) {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r + 9, 0, Math.PI * 2);
      ctx.fillStyle = `${ball.color}33`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fillStyle = ball.color;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.stroke();
      ctx.fillStyle = "#020617";
      ctx.font = "900 10px system-ui";
      ctx.fillText(ball.level, ball.x - 4, ball.y + 4);
    }
  }
  function save() {
    if (frame % 90 !== 0) return;
    localStorage.setItem(SAVE_KEY, JSON.stringify({ level: state.level, fragments: state.fragments, total: state.total, upgrades: state.upgrades, balls: state.balls }));
  }
  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!data) return false;
      state.level = data.level ?? 1;
      state.fragments = data.fragments ?? 0;
      state.total = data.total ?? 0;
      state.upgrades = data.upgrades ?? state.upgrades;
      state.balls = (data.balls ?? []).map((ball, index) => makeBall(ball.id ?? index + 1, index, ball));
      if (state.balls.length === 0) state.balls = [makeBall(1, 0), makeBall(2, 1)];
      generateBricks();
      log("Сохранение загружено.");
      return true;
    } catch {
      return false;
    }
  }
  function ui() {
    el("level").textContent = state.level;
    el("hp").textContent = stageHp(state.level);
    el("count").textContent = state.bricks.length;
    el("frags").textContent = Math.floor(state.fragments);
    el("pauseBtn").textContent = state.paused ? "Продолжить" : "Пауза";
    el("types").innerHTML = activeTypes().map((type) => `<small><span class="dot" style="background:${type.color}"></span>${type.name}</small>`).join("");
    el("balls").innerHTML = state.balls.map((ball) => `<div class="ball-card"><b>Шар-${ball.id}</b><small>Ур. ${ball.level} · Урон ${ball.dmg} · Скорость x${totalSpeed(ball).toFixed(2)} · XP ${Math.floor(ball.xp)}/${ball.need}</small></div>`).join("");
    el("upgrades").innerHTML = [
      ["damage", "Урон", upgradePower(state.upgrades.damage, "damage")],
      ["speed", "Скорость", upgradePower(state.upgrades.speed, "speed")],
      ["xp", "Опыт", upgradePower(state.upgrades.xp, "xp")],
    ].map(([key, name, power]) => `<button class="buy" data-upgrade="${key}">${name} x${power} — ${upgradeCost(key)} оск.</button>`).join("") + `<button class="buy" data-action="ball">Новый шар — ${ballCost()} оск.</button>`;
    el("log").innerHTML = state.log.slice(0, 8).map((line) => `<small>${line}</small>`).join("");
  }
  function buyUpgrade(key) {
    const cost = upgradeCost(key);
    if (state.fragments < cost) return;
    state.fragments -= cost;
    state.upgrades[key] += 1;
    for (const ball of state.balls) ball.dmg = damageFor(ball);
    log(`Улучшение куплено: ${key}.`);
  }
  function buyBall() {
    const cost = ballCost();
    if (state.fragments < cost) return;
    state.fragments -= cost;
    const id = Math.max(...state.balls.map((ball) => ball.id)) + 1;
    state.balls.push(makeBall(id, state.balls.length));
    log(`Добавлен Шар-${id}.`);
  }
  function bindUi() {
    el("pauseBtn").onclick = () => { state.paused = !state.paused; ui(); };
    el("resetBtn").onclick = () => { localStorage.removeItem(SAVE_KEY); location.reload(); };
    el("upgrades").addEventListener("pointerdown", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      event.preventDefault();
      if (button.dataset.upgrade) buyUpgrade(button.dataset.upgrade);
      if (button.dataset.action === "ball") buyBall();
      ui();
    });
  }
  function loop() {
    frame += 1;
    step();
    draw();
    if (frame % 8 === 0) ui();
    save();
    requestAnimationFrame(loop);
  }
  if (!load()) {
    state.balls = [makeBall(1, 0), makeBall(2, 1)];
    generateBricks();
  }
  bindUi();
  ui();
  loop();
})();
