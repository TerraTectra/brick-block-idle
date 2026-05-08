const W = 980;
const H = 650;
const SAVE_KEY = "brick_block_idle_static_v2";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const state = {
  level: 1,
  fragments: 0,
  total: 0,
  paused: false,
  bricks: [],
  balls: [],
  upgrades: { damage: 0, speed: 0, xp: 0 },
  log: ["Автозачистка запущена."],
};

const brickTypes = [
  { key: "normal", name: "Обычный", color: "#4cc9f0", min: 1, weight: 100, reward: 1 },
  { key: "armored", name: "Броня", color: "#94a3b8", min: 5, weight: 14, reward: 1.35 },
  { key: "volatile", name: "Нестабильный", color: "#ff9f1c", min: 10, weight: 11, reward: 1.25 },
  { key: "regen", name: "Живой", color: "#2ec4b6", min: 18, weight: 8, reward: 1.55 },
  { key: "shield", name: "Щит", color: "#b517ff", min: 25, weight: 7, reward: 1.75 },
  { key: "heavy", name: "Тяжёлый", color: "#ff4d6d", min: 40, weight: 5, reward: 2.1 },
];

const forms = [
  { key: "plasma", name: "Плазма", color: "#ff4d6d" },
  { key: "storm", name: "Гроза", color: "#f9f871" },
  { key: "drill", name: "Бур", color: "#ff9f1c" },
  { key: "crit", name: "Крит", color: "#b517ff" },
  { key: "comet", name: "Комета", color: "#2ec4b6" },
  { key: "collector", name: "Сборщик", color: "#60a5fa" },
];

const milestones = [10, 25, 50, 100, 200, 500, 1000];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function seededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function log(message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 8);
}

function activeTypes() {
  return brickTypes.filter((type) => state.level >= type.min);
}

function upgradePower(level) {
  if (level <= 0) return 1;
  const bonus = (Math.pow(level, 1.55) - level) * 0.45;
  return +(1 + level + bonus).toFixed(2);
}

function xpNeed(level) {
  if (level <= 1) return 10;
  return Math.floor(
    10 +
      level * 7 +
      Math.pow(level, 1.72) * 8 +
      Math.pow(Math.max(0, level - 10), 2.12) * 14 +
      (milestones.includes(level) ? level * 28 : 0),
  );
}

function damageFor(ball) {
  const base = 1 + (ball.level - 1) * 0.55 + Math.pow(ball.level - 1, 1.2) * 0.14;
  const evo = 1 + ball.evo * 0.24 + Math.pow(ball.evo, 1.28) * 0.06;
  return +(base * evo * upgradePower(state.upgrades.damage)).toFixed(2);
}

function ballSpeed(ball) {
  const comet = ball.form === "comet" ? ball.evo * 0.035 : 0;
  return clamp(1 + (ball.level - 1) * 0.012 + ball.evo * 0.055 + comet, 1, 4.2);
}

function globalSpeed() {
  return upgradePower(state.upgrades.speed);
}

function globalXp() {
  return upgradePower(state.upgrades.xp);
}

function newBallCost() {
  return Math.floor(150 * Math.pow(1.7, Math.max(0, state.balls.length - 2)));
}

function upgradeCost(key) {
  const base = key === "damage" ? 120 : key === "speed" ? 160 : 180;
  const growth = key === "damage" ? 1.62 : key === "speed" ? 1.68 : 1.7;
  const level = state.upgrades[key];
  return Math.floor(base * Math.pow(growth, level + Math.pow(level, 1.28) * 0.55));
}

function makeBall(id, index, saved) {
  const ball = saved || {
    id,
    level: 1,
    x: W / 2 + index * 34,
    y: H - 82 - index * 18,
    vx: (2.15 + index * 0.26) * (index % 2 ? -1 : 1),
    vy: -(2.55 + index * 0.17),
    r: 9,
    xp: 0,
    need: 10,
    kills: 0,
    hits: 0,
    evo: 0,
    form: "basic",
    color: "#4cc9f0",
    evolved: [],
  };
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
  const distance = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  if (p === 0) return !((col + state.level) % 5 === 0 && row % 4 !== 0);
  if (p === 1) return (row + col + state.level) % 6 !== 0 && (row * 2 + col + state.level) % 11 !== 0;
  if (p === 2) return Math.abs((distance + state.level * 0.35) % 4) > 0.85;
  if (p === 3) return Math.hypot(col - cols * 0.32, row - rows * 0.48) > 2.4 && Math.hypot(col - cols * 0.68, row - rows * 0.48) > 2.4;
  if (p === 4) return row % 4 !== 2 || (col + state.level) % 4 !== 0;
  if (p === 5) return Math.abs(Math.sin(angle * 2.4 + distance * 0.68 + state.level * 0.25)) > 0.26;
  if (p === 6) return (row + col * 2 + state.level) % 7 !== 0;

  return seededRandom(state.level * 999 + row * 13 + col)() > 0.14;
}

function chooseType(row, col, rand) {
  const pool = activeTypes();
  if (pool.length === 1) return pool[0];

  const weighted = pool.map((type) => ({
    type,
    weight: type.key === "normal" ? Math.max(45, type.weight - state.level * 0.55) : type.weight + ((row * 11 + col * 7 + state.level) % 9) * 0.18,
  }));

  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let roll = rand() * total;
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
  const rand = seededRandom(state.level * 9973 + 41);

  state.bricks = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (!pattern(row, col, rows, cols)) continue;
      const type = chooseType(row, col, rand);
      state.bricks.push({
        x: marginX + col * (brickW + gap),
        y: top + row * (brickH + gap),
        w: brickW,
        h: brickH,
        hp: state.level,
        max: state.level,
        xp: Math.ceil((2 + state.level * 1.15) * type.reward),
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
  ball.form = form.key;
  ball.color = form.color;
  ball.r = 9 + Math.min(8, ball.evo * 0.85);
  ball.evolved.push(milestone);
  ball.dmg = damageFor(ball);
  log(`Шар-${ball.id} получил форму: ${form.name}.`);
}

function reward(ball, brick) {
  const bonus = ball.form === "collector" ? 1 + ball.evo * 0.16 : 1;
  const gainedXp = Math.ceil(brick.xp * globalXp() * bonus);
  const gainedFragments = Math.ceil(brick.xp * bonus);

  state.fragments += gainedFragments;
  state.total += 1;
  ball.kills += 1;
  ball.xp += gainedXp;

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

function damageMultiplier(ball, brick, source = "direct") {
  let multiplier = 1;
  if (brick.type === "armored") multiplier = source === "direct" ? 0.55 : 0.75;
  if (brick.type === "regen") multiplier = source === "direct" ? 0.85 : 0.7;
  if (brick.type === "shield") multiplier = source === "direct" ? 0.8 : 0.35;
  if (brick.type === "heavy") multiplier = source === "direct" ? 0.45 : 0.58;

  if (ball.form === "drill" && source === "direct" && multiplier < 1) {
    const pierce = clamp(0.35 + ball.evo * 0.08, 0.35, 0.82);
    multiplier += (1 - multiplier) * pierce;
  }

  return multiplier;
}

function dealDamage(index, amount, ball, source = "direct") {
  const brick = state.bricks[index];
  if (!brick) return false;

  brick.hp -= amount * damageMultiplier(ball, brick, source);
  if (brick.hp > 0) return false;

  const destroyed = state.bricks.splice(index, 1)[0];
  reward(ball, destroyed);

  if (destroyed.type === "volatile") {
    for (let i = state.bricks.length - 1; i >= 0; i -= 1) {
      const b = state.bricks[i];
      const d = Math.hypot(b.x + b.w / 2 - (destroyed.x + destroyed.w / 2), b.y + b.h / 2 - (destroyed.y + destroyed.h / 2));
      if (d <= 62) dealDamage(i, Math.max(1, state.level * 0.42 + ball.dmg * 0.22), ball, "explosion");
    }
  }

  return true;
}

function hitDamage(ball, brick) {
  let amount = ball.dmg;

  if (ball.form === "crit" && Math.random() < clamp(0.1 + ball.evo * 0.035, 0.1, 0.48)) {
    amount *= 1.8 + ball.evo * 0.18;
  }

  if (ball.form === "drill" && brick.hp / brick.max > 0.5) amount *= 1.25 + ball.evo * 0.14;
  if (ball.form === "comet") amount *= 1 + Math.min(0.95, (ballSpeed(ball) - 1) * 0.28);

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
    if (brick.type === "regen" && brick.hp < brick.max) brick.hp = Math.min(brick.max, brick.hp + Math.max(0.01, state.level * 0.0018));
  }

  for (const ball of state.balls) {
    const speed = ballSpeed(ball) * globalSpeed();
    ball.x += ball.vx * speed;
    ball.y += ball.vy * speed;

    if (ball.x - ball.r <= 0 || ball.x + ball.r >= W) {
      ball.vx *= -1;
      ball.x = clamp(ball.x, ball.r, W - ball.r);
    }

    if (ball.y - ball.r <= 0 || ball.y + ball.r >= H) {
      ball.vy *= -1;
      ball.y = clamp(ball.y, ball.r, H - ball.r);
    }

    for (let i = state.bricks.length - 1; i >= 0; i -= 1) {
      const brick = state.bricks[i];
      if (!collide(ball, brick)) continue;

      const prevX = ball.x - ball.vx * speed;
      if (prevX < brick.x || prevX > brick.x + brick.w) ball.vx *= -1;
      else ball.vy *= -1;

      ball.hits += 1;
      const center = { x: brick.x + brick.w / 2, y: brick.y + brick.h / 2 };
      const destroyed = dealDamage(i, hitDamage(ball, brick), ball);

      if (ball.form === "plasma" && ball.evo > 0) {
        for (let j = state.bricks.length - 1; j >= 0; j -= 1) {
          const b = state.bricks[j];
          const d = Math.hypot(b.x + b.w / 2 - center.x, b.y + b.h / 2 - center.y);
          if (d <= 54 + ball.evo * 8) dealDamage(j, ball.dmg * (0.16 + ball.evo * 0.025), ball, "splash");
        }
      }

      if (ball.form === "storm" && destroyed && state.bricks.length > 0) {
        const jumps = clamp(1 + Math.floor(ball.evo / 3), 1, 4);
        for (let n = 0; n < jumps && state.bricks.length > 0; n += 1) {
          dealDamage(Math.floor(Math.random() * state.bricks.length), ball.dmg * (0.62 + ball.evo * 0.08), ball, "chain");
        }
      }

      break;
    }
  }

  if (state.bricks.length === 0) {
    state.level += 1;
    generateBricks();
    log(`Открыт этап ${state.level}.`);
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
  for (let x = 22; x < W; x += 42) {
    for (let y = 76; y < H; y += 42) {
      ctx.beginPath();
      ctx.arc(x, y, 1.45, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  rr(22, 18, W - 44, 42, 16);
  ctx.fillStyle = "rgba(15,23,42,.82)";
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "900 18px system-ui";
  ctx.fillText(`Этап ${state.level}`, 42, 45);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "800 13px system-ui";
  ctx.fillText(`Блоков: ${state.bricks.length}`, 142, 44);
  ctx.fillText(`Осколки: ${Math.floor(state.fragments)}`, 252, 44);

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
  localStorage.setItem(SAVE_KEY, JSON.stringify({
    level: state.level,
    fragments: state.fragments,
    total: state.total,
    upgrades: state.upgrades,
    balls: state.balls,
  }));
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
  document.getElementById("level").textContent = state.level;
  document.getElementById("hp").textContent = state.level;
  document.getElementById("count").textContent = state.bricks.length;
  document.getElementById("frags").textContent = Math.floor(state.fragments);
  document.getElementById("pauseBtn").textContent = state.paused ? "Продолжить" : "Пауза";

  document.getElementById("types").innerHTML = activeTypes()
    .map((type) => `<small><span class="dot" style="background:${type.color}"></span>${type.name}</small>`)
    .join("");

  document.getElementById("balls").innerHTML = state.balls
    .map((ball) => `<div class="ball-card"><b>Шар-${ball.id}</b><small>Ур. ${ball.level} · Урон ${ball.dmg} · Скорость x${ballSpeed(ball).toFixed(2)} · XP ${Math.floor(ball.xp)}/${ball.need}</small></div>`)
    .join("");

  document.getElementById("upgrades").innerHTML = [
    ["damage", "Урон", upgradePower(state.upgrades.damage)],
    ["speed", "Скорость", upgradePower(state.upgrades.speed)],
    ["xp", "Опыт", upgradePower(state.upgrades.xp)],
  ]
    .map(([key, name, power]) => `<button class="buy" data-upgrade="${key}">${name} x${power} — ${upgradeCost(key)} оск.</button>`)
    .join("") + `<button class="buy" data-action="ball">Новый шар — ${newBallCost()} оск.</button>`;

  document.getElementById("log").innerHTML = state.log.slice(0, 8).map((line) => `<small>${line}</small>`).join("");
}

function bindUi() {
  document.getElementById("pauseBtn").onclick = () => {
    state.paused = !state.paused;
    ui();
  };

  document.getElementById("resetBtn").onclick = () => {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  };

  document.getElementById("upgrades").onclick = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;

    const upgrade = target.dataset.upgrade;
    if (upgrade) {
      const cost = upgradeCost(upgrade);
      if (state.fragments >= cost) {
        state.fragments -= cost;
        state.upgrades[upgrade] += 1;
        for (const ball of state.balls) ball.dmg = damageFor(ball);
        log(`Улучшение куплено: ${upgrade}.`);
      }
    }

    if (target.dataset.action === "ball") {
      const cost = newBallCost();
      if (state.fragments >= cost) {
        state.fragments -= cost;
        const id = Math.max(...state.balls.map((ball) => ball.id)) + 1;
        state.balls.push(makeBall(id, state.balls.length));
        log(`Добавлен Шар-${id}.`);
      }
    }

    ui();
  };
}

function loop() {
  step();
  draw();
  ui();
  save();
  requestAnimationFrame(loop);
}

if (!load()) {
  state.balls = [makeBall(1, 0), makeBall(2, 1)];
  generateBricks();
}

bindUi();
loop();
