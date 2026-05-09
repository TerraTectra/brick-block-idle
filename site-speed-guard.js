(() => {
  "use strict";

  const trackedBalls = new Set();
  const originalPush = Array.prototype.push;
  const TEST_SPEED_MULTIPLIER = 5;
  const MIN_KEEP_RATIO = 0.94;
  const HARD_MIN_NATURAL_SPEED = 0.8;
  const EDGE_MARGIN = 34;
  const WALL_NUDGE = 0.085;
  const MIN_AXIS_RATIO = 0.16;
  const FIELD_W = 1120;
  const FIELD_H = 720;

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

  function naturalSpeedOf(ball, currentSpeed) {
    const observed = Math.max(currentSpeed, HARD_MIN_NATURAL_SPEED);
    const lastTarget = ball.__bbSpeedTarget || 0;
    const looksLikeGuardedSpeed = lastTarget > 0 && observed > lastTarget * 0.72;
    if (!looksLikeGuardedSpeed) {
      ball.__bbNaturalSpeed = Math.max(ball.__bbNaturalSpeed || 0, observed);
    }
    return Math.max(ball.__bbNaturalSpeed || observed, HARD_MIN_NATURAL_SPEED);
  }

  function targetSpeedOf(ball) {
    const natural = naturalSpeedOf(ball, speedOf(ball));
    const external = Math.max(1, Number(ball.__bbExternalSpeedMult || 1));
    const target = natural * TEST_SPEED_MULTIPLIER * external;
    ball.__bbSpeedTarget = target;
    return target;
  }

  function rememberBall(ball) {
    if (!isBallLike(ball)) return;
    trackedBalls.add(ball);
    const speed = speedOf(ball);
    naturalSpeedOf(ball, speed);
  }

  function preserveSpeed(ball, targetSpeed) {
    const speed = speedOf(ball);
    if (speed <= 0.01) return;
    const scale = targetSpeed / speed;
    ball.vx *= scale;
    ball.vy *= scale;
  }

  function nudgeFromWalls(ball) {
    if (!isBallLike(ball)) return;
    const speed = speedOf(ball);
    if (speed <= 0.01) return;

    const now = performance.now();
    const nearLeft = ball.x <= EDGE_MARGIN && ball.vx < 0;
    const nearRight = ball.x >= FIELD_W - EDGE_MARGIN && ball.vx > 0;
    const nearTop = ball.y <= EDGE_MARGIN && ball.vy < 0;
    const nearBottom = ball.y >= FIELD_H - EDGE_MARGIN && ball.vy > 0;
    const nearVerticalWall = nearLeft || nearRight;
    const nearHorizontalWall = nearTop || nearBottom;

    if (!nearVerticalWall && !nearHorizontalWall) return;
    if (now - (ball.__bbLastWallNudge || 0) < 160) return;

    const sx = Math.abs(ball.vx) / speed;
    const sy = Math.abs(ball.vy) / speed;
    const signX = ball.vx >= 0 ? 1 : -1;
    const signY = ball.vy >= 0 ? 1 : -1;

    if (nearVerticalWall) {
      const push = (nearLeft ? 1 : -1) * speed * WALL_NUDGE;
      ball.vx += push;
      ball.vy += signY * speed * 0.035;
    }

    if (nearHorizontalWall) {
      const push = (nearTop ? 1 : -1) * speed * WALL_NUDGE;
      ball.vy += push;
      ball.vx += signX * speed * 0.055;
    }

    if (sx < MIN_AXIS_RATIO) ball.vx = signX * speed * MIN_AXIS_RATIO;
    if (sy < MIN_AXIS_RATIO) ball.vy = signY * speed * MIN_AXIS_RATIO;

    preserveSpeed(ball, speed);
    ball.__bbLastWallNudge = now;
  }

  function stabilizeBall(ball) {
    if (!isBallLike(ball)) return;
    nudgeFromWalls(ball);
    const speed = speedOf(ball);
    const target = targetSpeedOf(ball);

    if (speed > target * 1.08) {
      ball.__bbNaturalSpeed = speed / TEST_SPEED_MULTIPLIER;
      return;
    }

    if (speed > 0.01 && speed < target * MIN_KEEP_RATIO) {
      preserveSpeed(ball, target);
      return;
    }

    if (speed <= 0.01) {
      const angle = Math.random() * Math.PI * 2;
      ball.vx = Math.cos(angle) * target;
      ball.vy = Math.sin(angle) * target;
    }
  }

  Array.prototype.push = function (...items) {
    for (const item of items) rememberBall(item);
    return originalPush.apply(this, items);
  };

  function tick() {
    trackedBalls.forEach(stabilizeBall);
    requestAnimationFrame(tick);
  }

  window.__brickBlockSpeedGuard = {
    trackedBalls,
    testSpeedMultiplier: TEST_SPEED_MULTIPLIER,
    rememberBall,
    stabilizeNow() {
      trackedBalls.forEach(stabilizeBall);
    },
  };

  requestAnimationFrame(tick);
})();
