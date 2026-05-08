(() => {
  const SOURCE = "./site-app-v8-3-loader.js?v=8.3";

  function patchRuntime(source) {
    let code = source;

    code = code.replace(
      'const RUN_KEY = "brick_block_idle_run_v8_3";',
      'const RUN_KEY = "brick_block_idle_run_v8_4";',
    );

    code = code.replace(
      'log: ["v8.3: исправлен застревающий удар по углам блоков."]',
      'log: ["v8.4: XP теперь растёт от этапа."]',
    );

    code = code.replace(
      'return Math.max(1, Math.ceil(brick.xp * 0.08 * xpMult() * bonus));',
      'const stageXpBonus = 1 + Math.pow(Math.max(1, state.level), 0.45) * 0.035; return Math.max(1, Math.ceil(brick.xp * 0.08 * xpMult() * bonus * stageXpBonus));',
    );

    code = code.replace(
      'target.xp += Math.max(1, Math.ceil(brick.xp * 0.08 * xpMult() * 0.45));',
      'target.xp += Math.max(1, Math.ceil(brick.xp * 0.08 * xpMult() * 0.45 * (1 + Math.pow(Math.max(1, state.level), 0.45) * 0.035)));',
    );

    return code + "\n//# sourceURL=site-app-v8-4-loader-runtime.js";
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
      console.error("Ошибка запуска v8.4:", error);
      const box = document.createElement("pre");
      box.style.cssText = "position:fixed;inset:16px;z-index:9999;background:#020617;color:#fecaca;padding:16px;border:1px solid #ef4444;border-radius:12px;white-space:pre-wrap";
      box.textContent = `Ошибка запуска игры v8.4:\n${error.message}`;
      document.body.appendChild(box);
    });
})();
