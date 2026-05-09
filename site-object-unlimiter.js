(() => {
  "use strict";

  const tracked = new Set();
  const originalPush = Array.prototype.push;
  const originalUnshift = Array.prototype.unshift;
  const originalSplice = Array.prototype.splice;
  const MILESTONES = [10, 25, 50, 100, 200, 500, 1000];

  function isBall(value) {
    return value &&
      typeof value === "object" &&
      typeof value.x === "number" &&
      typeof value.y === "number" &&
      typeof value.vx === "number" &&
      typeof value.vy === "number" &&
      !Object.prototype.hasOwnProperty.call(value, "w") &&
      !Object.prototype.hasOwnProperty.call(value, "h");
  }

  function remember(value) {
    if (!isBall(value)) return;
    tracked.add(value);
  }

  function scan(items) {
    for (const item of items) remember(item);
  }

  function unlimitedEvoFor(level) {
    const safeLevel = Math.max(1, Number(level || 1));
    if (safeLevel < 10) return 0;
    return Math.floor(safeLevel / 10);
  }

  function unlimitBall(ball) {
    if (!isBall(ball)) return;

    if (typeof ball.level === "number") {
      ball.level = Math.max(1, ball.level);
    }

    if (typeof ball.xp === "number") {
      ball.xp = Math.max(0, ball.xp);
    }

    const virtualEvo = unlimitedEvoFor(ball.level);
    if (typeof ball.evo === "number") {
      ball.evo = Math.max(ball.evo, virtualEvo, Number(ball.__bbVirtualEvo || 0));
    } else {
      ball.evo = Math.max(virtualEvo, Number(ball.__bbVirtualEvo || 0));
    }

    if (Array.isArray(ball.evolved)) {
      for (const milestone of MILESTONES) {
        if (Number(ball.level || 1) >= milestone && !ball.evolved.includes(milestone)) {
          ball.evolved.push(milestone);
        }
      }
    }

    if (ball.pendingEvolution && Number(ball.level || 1) > 1000) {
      ball.pendingEvolution = null;
    }

    if (typeof ball.damage === "number") {
      const dmgMult = Math.max(1, Number(ball.__bbUnlimitedDamageMult || 1), Number(ball.__bbArchDamageMult || 1));
      ball.damage = Math.max(ball.damage, dmgMult);
    }

    ball.__bbNoLimits = true;
  }

  Array.prototype.push = function (...items) {
    scan(items);
    return originalPush.apply(this, items);
  };

  Array.prototype.unshift = function (...items) {
    scan(items);
    return originalUnshift.apply(this, items);
  };

  Array.prototype.splice = function (...args) {
    scan(args.slice(2));
    return originalSplice.apply(this, args);
  };

  function tick() {
    tracked.forEach(unlimitBall);
    requestAnimationFrame(tick);
  }

  window.__brickBlockObjectUnlimiter = {
    tracked,
    remember,
    unlimitAll() {
      tracked.forEach(unlimitBall);
    },
  };

  requestAnimationFrame(tick);
})();
