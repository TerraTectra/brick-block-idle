(() => {
  "use strict";

  const RUN_KEY = "brick_block_idle_run_v10";
  const BOOST_FIELD = "__bbBaseSpeedX2Applied";
  const BOOST_AMOUNT = 1;
  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;
  const originalPush = Array.prototype.push;

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

  function applyBoost(ball) {
    if (!isBallLike(ball) || ball[BOOST_FIELD]) return;
    ball[BOOST_FIELD] = true;
    ball.infiniteSpeed = Math.max(0, Number(ball.infiniteSpeed || 0)) + BOOST_AMOUNT;
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

  window.__brickBlockSpeedX2 = {
    boostAmount: BOOST_AMOUNT,
    applyBoost,
  };
})();
