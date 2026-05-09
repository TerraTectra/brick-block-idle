(() => {
  "use strict";

  const SOURCE = "./site-app-v9.js?v=9";

  function patch(source) {
    let code = source;

    code = code.replace(
      'const RUN_KEY = "brick_block_idle_run_v9";',
      'const RUN_KEY = "brick_block_idle_run_v9_2";',
    );

    code = code.replace(
      '    { key: "royal", rarity: "legendary", name: "Королевский", color: "#eab308", damage: 0.65, speed: 0.95, radius: 1.0, desc: "Слабее сам, но усиливает остальные шары." },\n    { key: "infinite", rarity: "legendary", name: "Бесконечный", color: "#ffffff", damage: 1.0, speed: 1.0, radius: 1.0, desc: "Каждое усиление даёт случайный постоянный бонус." },',
      '    { key: "royal", rarity: "legendary", name: "Королевский", color: "#eab308", damage: 0.65, speed: 0.95, radius: 1.0, desc: "Слабее сам, но усиливает остальные шары." },\n    { key: "sniper", rarity: "legendary", name: "Снайпер", color: "#e5e7eb", damage: 1.15, speed: 0.95, radius: 0.82, desc: "При отскоке от стены перенаводится на ближайший блок." },\n    { key: "berserk", rarity: "legendary", name: "Берсерк", color: "#ef4444", damage: 0.9, speed: 1.0, radius: 1.0, desc: "За каждое добивание получает скорость до конца этапа без верхнего лимита." },\n    { key: "infinite", rarity: "legendary", name: "Бесконечный", color: "#ffffff", damage: 1.0, speed: 1.0, radius: 1.0, desc: "Каждое усиление даёт случайный постоянный бонус." },',
    );

    code = code.replace(
      'function personalSpeed(ball) { const stats = formStats(ball); const comet = ball.form === "comet" ? ball.evo * 0.02 : 0; const infiniteSpeed = ball.infiniteSpeed || 0; return clamp((1 + (ball.level - 1) * 0.0042 + ball.evo * 0.02 + comet + infiniteSpeed) * (stats.speed || 1), 0.55, 3.2); }',
      'function personalSpeed(ball) { const stats = formStats(ball); const comet = ball.form === "comet" ? ball.evo * 0.02 : 0; const infiniteSpeed = ball.infiniteSpeed || 0; const berserkSpeed = ball.form === "berserk" ? (ball.berserkSpeed || 0) : 0; const raw = (1 + (ball.level - 1) * 0.0042 + ball.evo * 0.02 + comet + infiniteSpeed + berserkSpeed) * (stats.speed || 1); return ball.form === "berserk" ? Math.max(0.55, raw) : clamp(raw, 0.55, 3.2); }',
    );

    code = code.replace(
      'if (target.form === "vampire") { target.stagePower = Math.min(1.2, (target.stagePower || 0) + 0.015 + target.evo * 0.003); target.dmg = damageFor(target); } if (isEvolutionLocked(target))',
      'if (target.form === "vampire") { target.stagePower = Math.min(1.2, (target.stagePower || 0) + 0.015 + target.evo * 0.003); target.dmg = damageFor(target); } if (!manual && target.form === "berserk") { target.berserkSpeed = (target.berserkSpeed || 0) + 0.035 + target.evo * 0.008; } if (isEvolutionLocked(target))',
    );

    code = code.replace(
      'function collide(ball, brick) { const nearestX = clamp(ball.x, brick.x, brick.x + brick.w); const nearestY = clamp(ball.y, brick.y, brick.y + brick.h); const dx = ball.x - nearestX; const dy = ball.y - nearestY; return dx * dx + dy * dy <= ball.r * ball.r; }',
      'function collide(ball, brick) { const nearestX = clamp(ball.x, brick.x, brick.x + brick.w); const nearestY = clamp(ball.y, brick.y, brick.y + brick.h); const dx = ball.x - nearestX; const dy = ball.y - nearestY; return dx * dx + dy * dy <= ball.r * ball.r; }\n  function aimAtNearestBlock(ball) { if (!state.bricks.length) return; let best = null; let bestDistance = Infinity; for (const brick of state.bricks) { const tx = brick.x + brick.w / 2; const ty = brick.y + brick.h / 2; const distance = Math.hypot(tx - ball.x, ty - ball.y); if (distance < bestDistance) { bestDistance = distance; best = { x: tx, y: ty }; } } if (!best) return; ball.dx = best.x - ball.x; ball.dy = best.y - ball.y; normalize(ball); }',
    );

    code = code.replace(
      'if (ball.x - ball.r <= 0 || ball.x + ball.r >= W) { ball.dx *= -1; ball.x = clamp(ball.x, ball.r, W - ball.r); } if (ball.y - ball.r <= 0 || ball.y + ball.r >= H) { ball.dy *= -1; ball.y = clamp(ball.y, ball.r, H - ball.r); } normalize(ball);',
      'let bouncedWall = false; if (ball.x - ball.r <= 0 || ball.x + ball.r >= W) { ball.dx *= -1; ball.x = clamp(ball.x, ball.r, W - ball.r); bouncedWall = true; } if (ball.y - ball.r <= 0 || ball.y + ball.r >= H) { ball.dy *= -1; ball.y = clamp(ball.y, ball.r, H - ball.r); bouncedWall = true; } normalize(ball); if (bouncedWall && ball.form === "sniper") aimAtNearestBlock(ball);',
    );

    code = code.replace(
      'for (const ball of state.balls) { ball.stagePower = 0; ball.dmg = damageFor(ball); normalize(ball); }',
      'for (const ball of state.balls) { ball.stagePower = 0; ball.berserkSpeed = 0; ball.dmg = damageFor(ball); normalize(ball); }',
    );

    code = code.replace(
      'log("Новый забег запущен.");',
      'log("v9.2: добавлены легендарные шары Снайпер и Берсерк.");',
    );

    return code + "\n//# sourceURL=site-app-v9-2-runtime.js";
  }

  fetch(SOURCE, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`Не удалось загрузить ${SOURCE}`);
      return response.text();
    })
    .then((source) => {
      const script = document.createElement("script");
      script.textContent = patch(source);
      document.body.appendChild(script);
    })
    .catch((error) => {
      console.error("Ошибка запуска v9.2:", error);
      const box = document.createElement("pre");
      box.style.cssText = "position:fixed;inset:16px;z-index:9999;background:#020617;color:#fecaca;padding:16px;border:1px solid #ef4444;border-radius:12px;white-space:pre-wrap";
      box.textContent = `Ошибка запуска игры v9.2:\n${error.message}`;
      document.body.appendChild(box);
    });
})();
