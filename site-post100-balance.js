(() => {
  "use strict";

  const RUN_KEY = "brick_block_idle_run_v10";
  const META_KEY = "brick_block_idle_meta_v4";
  const BALANCE_FIELD = "__bbPost100Balanced";
  const originalSetItem = Storage.prototype.setItem;
  const originalGetItem = Storage.prototype.getItem;
  const originalPush = Array.prototype.push;
  const tracked = new Set();

  function isBallLike(value) {
    return value &&
      typeof value === "object" &&
      typeof value.x === "number" &&
      typeof value.y === "number" &&
      typeof value.vx === "number" &&
      typeof value.vy === "number" &&
      !Object.prototype.hasOwnProperty.call(value, "w") &&
      !Object.prototype.hasOwnProperty.call(value, "h");
  }

  function readJson(key, fallback) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "null");
      return data && typeof data === "object" ? data : fallback;
    } catch {
      return fallback;
    }
  }

  function metaNodeRank(id) {
    const meta = readJson(META_KEY, { nodes: {} });
    return Number(meta.nodes?.[id] || 0);
  }

  function post100Relief() {
    return 1 + metaNodeRank("post100Dmg") * 0.08 + metaNodeRank("post100Xp") * 0.05 + metaNodeRank("prestige2") * 0.03;
  }

  function applyBallWall(ball, level) {
    if (!isBallLike(ball) || level < 100) return;
    tracked.add(ball);

    const over = Math.max(0, level - 100);
    const wall = 1 + Math.pow(over / 42, 1.22);
    const relief = post100Relief();
    const softWall = Math.max(1, wall / relief);

    if (!ball[BALANCE_FIELD]) {
      ball[BALANCE_FIELD] = { damage: Number(ball.infiniteDamage || 0), xp: Number(ball.infiniteXp || 0), evo: Number(ball.evo || 0) };
    }

    const baseDamage = Number(ball[BALANCE_FIELD].damage || 0);
    const baseXp = Number(ball[BALANCE_FIELD].xp || 0);
    const baseEvo = Number(ball[BALANCE_FIELD].evo || 0);

    ball.infiniteDamage = baseDamage / softWall;
    ball.infiniteXp = baseXp / Math.sqrt(softWall);
    ball.evo = Math.max(0, baseEvo / Math.pow(softWall, 0.18));

    ball.__bbPost100Wall = softWall;
  }

  function patchRun(raw) {
    if (typeof raw !== "string") return raw;
    try {
      const run = JSON.parse(raw);
      if (!run || typeof run !== "object" || !Array.isArray(run.balls)) return raw;
      const level = Number(run.level || 1);
      run.balls.forEach((ball) => applyBallWall(ball, level));
      return JSON.stringify(run);
    } catch {
      return raw;
    }
  }

  Storage.prototype.getItem = function (key) {
    const value = originalGetItem.call(this, key);
    return key === RUN_KEY ? patchRun(value) : value;
  };

  Storage.prototype.setItem = function (key, value) {
    return originalSetItem.call(this, key, key === RUN_KEY ? patchRun(value) : value);
  };

  Array.prototype.push = function (...items) {
    const level = Number((document.getElementById("level")?.textContent || "1").replace(/[^0-9]/g, "")) || 1;
    items.forEach((item) => applyBallWall(item, level));
    return originalPush.apply(this, items);
  };

  setInterval(() => {
    const level = Number((document.getElementById("level")?.textContent || "1").replace(/[^0-9]/g, "")) || 1;
    tracked.forEach((ball) => applyBallWall(ball, level));
  }, 1200);

  window.__brickBlockPost100Balance = { tracked, post100Relief };
})();
