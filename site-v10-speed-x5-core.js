(() => {
  "use strict";

  const RUN_KEY = "brick_block_idle_run_v10";
  const BOOST_FIELD = "__bbBaseSpeedX5Applied";
  const SPEED_BONUS = 4;
  const VECTOR_MULT = 5;
  const SPEED_CLAMP_MAX = 3.2;
  const SPEED_CLAMP_MIN = 0.55;
  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;
  const originalPush = Array.prototype.push;
  const originalUnshift = Array.prototype.unshift;
  const originalSplice = Array.prototype.splice;
  const originalMathMin = Math.min;
  const tracked = new Set();

  Math.min = function (...args) {
    if (
      args.length === 2 &&
      args[0] === SPEED_CLAMP_MAX &&
      typeof args[1] === "number" &&
      args[1] >= SPEED_CLAMP_MIN &&
      args[1] < 20
    ) {
      return args[1] * VECTOR_MULT;
    }
    return originalMathMin.apply(Math, args);
  };

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

  function speedOf(ball) {
    return Math.hypot(ball.vx || 0, ball.vy || 0);
  }

  function scaleVector(ball, mult) {
    const speed = speedOf(ball);
    if (speed <= 0.001) return;
    ball.vx *= mult;
    ball.vy *= mult;
  }

  function applyBoost(ball) {
    if (!isBallLike(ball)) return;
    tracked.add(ball);

    ball.infiniteSpeed = Math.max(Number(ball.infiniteSpeed || 0), SPEED_BONUS);
    ball.speedBonus = Math.max(Number(ball.speedBonus || 0), SPEED_BONUS);
    ball.bonusSpeed = Math.max(Number(ball.bonusSpeed || 0), SPEED_BONUS);
    ball.__bbSpeedClampUnlocked = true;

    if (!ball[BOOST_FIELD]) {
      ball[BOOST_FIELD] = true;
      scaleVector(ball, VECTOR_MULT);
    }
  }

  function patchRun(raw) {
    if (typeof raw !== "string") return raw;
    try {
      const run = JSON.parse(raw);
      if (!run || typeof run !== "object" || !Array.isArray(run.balls)) return raw;
      run.balls.forEach(applyBoost);
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
    items.forEach(applyBoost);
    return originalPush.apply(this, items);
  };

  Array.prototype.unshift = function (...items) {
    items.forEach(applyBoost);
    return originalUnshift.apply(this, items);
  };

  Array.prototype.splice = function (...args) {
    args.slice(2).forEach(applyBoost);
    return originalSplice.apply(this, args);
  };

  setInterval(() => {
    tracked.forEach(applyBoost);
  }, 250);

  window.__brickBlockSpeedX5Core = {
    speedBonus: SPEED_BONUS,
    vectorMult: VECTOR_MULT,
    tracked,
    applyBoost,
  };
})();
