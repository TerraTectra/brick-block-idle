(() => {
  const SOURCE = "./site-app-v7.js?v=7";

  function patchRuntime(source) {
    let code = source;

    code = code.replace(
      'const RUN_KEY = "brick_block_idle_run_v7";',
      'const RUN_KEY = "brick_block_idle_run_v8_1";',
    );

    code = code.replace(
      "(ball.level - 1) * 0.0018",
      "(ball.level - 1) * 0.0036",
    );

    code = code.replace(
      "if (!load()) newRun(); bindUi(); ui(); renderMeta(); loop();",
      `if (!load()) newRun();
  function grantManualXp(target, brick) {
    if (!target || isEvolutionLocked(target)) return;
    target.xp += Math.max(1, Math.ceil(brick.xp * 0.08 * xpMult() * 0.45));
    while (!isEvolutionLocked(target) && target.xp >= target.need) {
      target.xp -= target.need;
      target.level += 1;
      target.need = xpNeed(target.level);
      target.dmg = damageFor(target);
      log(\`Шар-\${target.id}: \${target.level} ур.\`);
      const milestone = pendingMilestone(target);
      if (milestone) {
        target.pendingEvolution = milestone;
        target.xp = 0;
        log(\`Шар-\${target.id} ждёт эволюцию \${milestone} ур.\`);
        if (metaEffects().autoEvolution) showEvolution(target.id);
        break;
      }
    }
  }
  function manualHitAt(x, y) {
    for (let i = state.bricks.length - 1; i >= 0; i -= 1) {
      const brick = state.bricks[i];
      if (!brick) continue;
      if (x < brick.x || x > brick.x + brick.w || y < brick.y || y > brick.y + brick.h) continue;
      brick.hp -= 1;
      log("Ручной удар: -1 HP.");
      if (brick.hp <= 0) {
        const destroyed = state.bricks.splice(i, 1)[0];
        state.fragments += Math.max(1, Math.ceil(destroyed.xp * 0.34));
        state.total += 1;
        const target = [...state.balls]
          .filter((ball) => !isEvolutionLocked(ball))
          .sort((a, b) => a.level - b.level || a.xp - b.xp)[0];
        grantManualXp(target, destroyed);
      }
      ui();
      return true;
    }
    return false;
  }
  canvas.style.cursor = "crosshair";
  canvas.addEventListener("pointerdown", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (W / rect.width);
    const y = (event.clientY - rect.top) * (H / rect.height);
    manualHitAt(x, y);
  });
  bindUi(); ui(); renderMeta(); loop();`,
    );

    return code + "\n//# sourceURL=site-app-v8-1-runtime.js";
  }

  fetch(SOURCE, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`Не удалось загрузить ${SOURCE}`);
      return response.text();
    })
    .then((source) => {
      const script = document.createElement("script");
      script.textContent = patchRuntime(source);
      document.body.appendChild(script);
    })
    .catch((error) => {
      console.error("Ошибка запуска v8.1:", error);
      const box = document.createElement("pre");
      box.style.cssText = "position:fixed;inset:16px;z-index:9999;background:#020617;color:#fecaca;padding:16px;border:1px solid #ef4444;border-radius:12px;white-space:pre-wrap";
      box.textContent = `Ошибка запуска игры v8.1:\n${error.message}`;
      document.body.appendChild(box);
    });
})();
