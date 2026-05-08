(() => {
  const SOURCE = "./site-app-v7.js?v=7";

  function patchRuntime(source) {
    let code = source;

    code = code.replace(
      'const RUN_KEY = "brick_block_idle_run_v7";',
      'const RUN_KEY = "brick_block_idle_run_v8_2";',
    );

    code = code.replace(
      'const state = { level: 1, fragments: 0, total: 0, paused: false, bricks: [], balls: [], upgrades: { damage: 0, speed: 0, xp: 0 }, log: ["v7: игра и мета объединены."] };',
      'const state = { level: 1, fragments: 0, total: 0, paused: false, bricks: [], balls: [], upgrades: { damage: 1, speed: 0, xp: 0 }, log: ["v8.2: дальняя idle-кривая до 1000+ этапов."] };',
    );

    code = code.replace(
      'function stageHp(level) { return Math.max(1, Math.floor(level + Math.pow(Math.max(0, level - 3), 1.42) * 2.4 + Math.pow(Math.max(0, level - 15), 1.86) * 0.9)); }',
      'function stageHp(level) { return Math.max(1, Math.floor(1 + level * 0.75 + Math.pow(Math.max(0, level - 25), 1.18) * 0.28 + Math.pow(Math.max(0, level - 250), 1.32) * 0.06)); }',
    );

    code = code.replace(
      'function brickReward(level, typeReward) { return Math.ceil((1.2 + level * 0.42 + Math.pow(level, 1.04) * 0.22) * typeReward); }',
      'function brickReward(level, typeReward) { return Math.ceil((2 + level * 0.75 + Math.pow(level, 1.08) * 0.35) * typeReward); }',
    );

    code = code.replace(
      'function xpNeed(level) { if (level <= 1) return 55; return Math.floor(55 + level * 34 + Math.pow(level, 2.02) * 32 + Math.pow(Math.max(0, level - 8), 2.25) * 42 + (milestones.includes(level) ? level * 140 : 0)); }',
      'function xpNeed(level) { if (level <= 1) return 32; return Math.floor(32 + level * 18 + Math.pow(level, 1.52) * 10 + Math.pow(Math.max(0, level - 20), 1.82) * 8 + (milestones.includes(level) ? level * 70 : 0)); }',
    );

    code = code.replace(
      'function personalSpeed(ball) { const comet = ball.form === "comet" ? ball.evo * 0.012 : 0; return clamp(1 + (ball.level - 1) * 0.0018 + ball.evo * 0.014 + comet, 1, 1.95); }',
      'function personalSpeed(ball) { const comet = ball.form === "comet" ? ball.evo * 0.018 : 0; return clamp(1 + (ball.level - 1) * 0.0042 + ball.evo * 0.02 + comet, 1, 2.65); }',
    );

    code = code.replace(
      'function ballCost() { return Math.floor(320 * Math.pow(2.15, Math.max(0, state.balls.length - 2)) * (1 - discount())); }',
      'function ballCost() { return Math.floor(180 * Math.pow(1.78, Math.max(0, state.balls.length - 2)) * (1 - discount())); }',
    );

    code = code.replace(
      'function upgradeCost(key) { const base = key === "damage" ? 280 : key === "speed" ? 380 : 420; const growth = key === "damage" ? 2.28 : key === "speed" ? 2.45 : 2.55; const level = state.upgrades[key] || 0; return Math.floor(base * Math.pow(growth, level + Math.pow(level, 1.36) * 0.82) * (1 - discount())); }',
      'function upgradeCost(key) { const base = key === "damage" ? 95 : key === "speed" ? 130 : 150; const growth = key === "damage" ? 1.62 : key === "speed" ? 1.7 : 1.74; const level = state.upgrades[key] || 0; return Math.floor(base * Math.pow(growth, level + Math.pow(level, 1.18) * 0.34) * (1 - discount())); }',
    );

    code = code.replace(
      'function prestigeReward() { if (state.level < 10) return 0; return Math.max(1, Math.floor(Math.pow(state.level - 9, 0.74) * (1 + metaEffects().prestigeBoost))); }',
      'function prestigeReward() { if (state.level < 10) return 0; return Math.max(1, Math.floor((Math.pow(state.level - 9, 0.72) + state.level / 180) * (1 + metaEffects().prestigeBoost))); }',
    );

    code = code.replace(
      'state.fragments = (eff.startFragments || 0) + (meta.bankedFragments || 0);',
      'state.fragments = 420 + (eff.startFragments || 0) + (meta.bankedFragments || 0);',
    );

    code = code.replace(
      'state.upgrades = { damage: 0, speed: 0, xp: 0 };',
      'state.upgrades = { damage: 1, speed: 0, xp: 0 };',
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

    return code + "\n//# sourceURL=site-app-v8-2-runtime.js";
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
      console.error("Ошибка запуска v8.2:", error);
      const box = document.createElement("pre");
      box.style.cssText = "position:fixed;inset:16px;z-index:9999;background:#020617;color:#fecaca;padding:16px;border:1px solid #ef4444;border-radius:12px;white-space:pre-wrap";
      box.textContent = `Ошибка запуска игры v8.2:\n${error.message}`;
      document.body.appendChild(box);
    });
})();
