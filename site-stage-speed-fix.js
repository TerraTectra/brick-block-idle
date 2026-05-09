(() => {
  "use strict";

  const RUN_KEY = "brick_block_idle_run_v10";
  const originalSetItem = Storage.prototype.setItem;
  const MIN_KEEP_RATIO = 0.92;
  const HARD_MIN_SPEED = 0.35;
  const stableByBall = new Map();

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

  function ballKey(ball, index) {
    return String(ball.id ?? ball.form ?? ball.type ?? index);
  }

  function speedOf(ball) {
    return Math.hypot(ball.vx || 0, ball.vy || 0);
  }

  function preserveSpeed(ball, target) {
    const speed = speedOf(ball);
    if (speed <= 0.001) return false;
    const scale = target / speed;
    ball.vx *= scale;
    ball.vy *= scale;
    return true;
  }

  function stabilizeRun(run) {
    if (!run || typeof run !== "object" || !Array.isArray(run.balls)) return run;

    run.balls.forEach((ball, index) => {
      if (!isBallLike(ball)) return;
      const key = ballKey(ball, index);
      const speed = speedOf(ball);
      const stable = Math.max(stableByBall.get(key) || 0, HARD_MIN_SPEED);

      if (speed > stable) {
        stableByBall.set(key, speed);
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
    });

    return run;
  }

  function patchRunPayload(key, value) {
    if (key !== RUN_KEY || typeof value !== "string") return value;
    try {
      return JSON.stringify(stabilizeRun(JSON.parse(value)));
    } catch {
      return value;
    }
  }

  Storage.prototype.setItem = function (key, value) {
    return originalSetItem.call(this, key, patchRunPayload(key, value));
  };

  window.__brickBlockStageSpeedFix = {
    stableByBall,
    stabilizeSavedRun() {
      try {
        const raw = localStorage.getItem(RUN_KEY);
        if (!raw) return false;
        const next = patchRunPayload(RUN_KEY, raw);
        if (next !== raw) localStorage.setItem(RUN_KEY, next);
        return true;
      } catch {
        return false;
      }
    },
  };
})();
