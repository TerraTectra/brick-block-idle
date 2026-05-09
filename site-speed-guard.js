(() => {
  "use strict";

  const trackedBalls = new Set();
  const originalPush = Array.prototype.push;
  const MIN_KEEP_RATIO = 0.92;
  const HARD_MIN_SPEED = 0.8;

  function isBallLike(value) {
    return value &&
      typeof value === "object" &&
      typeof value.x === "number" &&
      typeof value.y === "number" &&
      typeof value.vx === "number" &&
      typeof value.vy === "number" &&
      (typeof value.level === "number" || typeof value.xp === "number" || typeof value.evo === "number") &&
      !Object.prototype.hasOwnProperty.call(value, "hp") &&
      !Object.prototype.hasOwnProperty.call(value, "maxHp");
  }

  function speedOf(ball) {
    return Math.hypot(ball.vx || 0, ball.vy || 0);
  }

  function rememberBall(ball) {
    if (!isBallLike(ball)) return;
    trackedBalls.add(ball);
    const speed = speedOf(ball);
    if (speed > HARD_MIN_SPEED) {
      ball.__bbStableSpeed = Math.max(ball.__bbStableSpeed || 0, speed);
    }
  }

  function stabilizeBall(ball) {
    if (!isBallLike(ball)) return;
    const speed = speedOf(ball);
    const stable = Math.max(ball.__bbStableSpeed || 0, HARD_MIN_SPEED);

    if (speed > stable) {
      ball.__bbStableSpeed = speed;
      return;
    }

    if (speed > 0.01 && speed < stable * MIN_KEEP_RATIO) {
      const scale = stable / speed;
      ball.vx *= scale;
      ball.vy *= scale;
      return;
    }

    if (speed <= 0.01) {
      const angle = Math.random() * Math.PI * 2;
      ball.vx = Math.cos(angle) * stable;
      ball.vy = Math.sin(angle) * stable;
    }
  }

  Array.prototype.push = function (...items) {
    for (const item of items) rememberBall(item);
    return originalPush.apply(this, items);
  };

  window.__brickBlockSpeedGuard = {
    trackedBalls,
    stabilizeNow() {
      trackedBalls.forEach(stabilizeBall);
    },
  };

  setInterval(() => {
    trackedBalls.forEach(stabilizeBall);
  }, 120);
})();
