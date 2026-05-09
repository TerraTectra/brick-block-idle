(() => {
  "use strict";

  const tracked = new Set();
  const originalPush = Array.prototype.push;
  const MIN_KEEP_RATIO = 0.92;
  const HARD_MIN_SPEED = 0.35;
  const MAX_TRACKED = 128;

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

  function remember(ball) {
    if (!isBallLike(ball)) return;
    if (tracked.size >= MAX_TRACKED && !tracked.has(ball)) return;
    tracked.add(ball);
    const speed = speedOf(ball);
    if (speed > HARD_MIN_SPEED) {
      ball.__bbStableStageSpeed = Math.max(ball.__bbStableStageSpeed || 0, speed);
    }
  }

  function preserveSpeed(ball, target) {
    const speed = speedOf(ball);
    if (speed <= 0.001) return false;
    const scale = target / speed;
    ball.vx *= scale;
    ball.vy *= scale;
    return true;
  }

  function stabilize(ball) {
    if (!isBallLike(ball)) {
      tracked.delete(ball);
      return;
    }

    const speed = speedOf(ball);
    const stable = Math.max(ball.__bbStableStageSpeed || 0, HARD_MIN_SPEED);

    if (speed > stable) {
      ball.__bbStableStageSpeed = speed;
      return;
    }

    if (speed > 0.001 && speed < stable * MIN_KEEP_RATIO) {
      preserveSpeed(ball, stable);
      return;
    }

    if (speed <= 0.001) {
      const angle = Math.random() * Math.PI * 2;
      ball.vx = Math.cos(angle) * stable;
      ball.vy = Math.sin(angle) * stable;
    }
  }

  Array.prototype.push = function (...items) {
    for (const item of items) remember(item);
    return originalPush.apply(this, items);
  };

  window.__brickBlockStageSpeedFix = {
    tracked,
    remember,
    stabilizeNow() {
      tracked.forEach(stabilize);
    },
  };

  setInterval(() => {
    tracked.forEach(stabilize);
  }, 140);
})();
