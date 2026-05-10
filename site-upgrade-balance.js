(() => {
  "use strict";

  const RUN_KEY = "brick_block_idle_run_v10";
  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;
  const MAX_REFUND_LEVEL = 999999;

  function readRun(raw) {
    try {
      const run = JSON.parse(raw || "null");
      return run && typeof run === "object" ? run : null;
    } catch {
      return null;
    }
  }

  function patchRun(raw) {
    if (typeof raw !== "string") return raw;
    const run = readRun(raw);
    if (!run || typeof run !== "object") return raw;
    run.__bbUpgradeBalance = "v1-slower-fragment-upgrades";
    run.upgrades = run.upgrades && typeof run.upgrades === "object" ? run.upgrades : { damage: 1, speed: 0, xp: 0 };

    for (const key of ["damage", "speed", "xp", "balls", "multishot", "crit"] ) {
      if (typeof run.upgrades[key] === "number") {
        run.upgrades[key] = Math.min(run.upgrades[key], MAX_REFUND_LEVEL);
      }
    }

    return JSON.stringify(run);
  }

  Storage.prototype.getItem = function (key) {
    const value = originalGetItem.call(this, key);
    return key === RUN_KEY ? patchRun(value) : value;
  };

  Storage.prototype.setItem = function (key, value) {
    return originalSetItem.call(this, key, key === RUN_KEY ? patchRun(value) : value);
  };

  function rewriteUpgradeCards() {
    const box = document.getElementById("upgrades");
    if (!box) return;
    const buttons = box.querySelectorAll("button");
    buttons.forEach((button) => {
      const text = button.textContent || "";
      const price = Number((text.match(/\d+/g) || []).pop() || 0);
      if (!price || button.dataset.bbBalancedPrice === "1") return;
      const scaled = Math.ceil(price * 2.75 + Math.pow(price, 0.72) * 18);
      button.dataset.bbBalancedPrice = "1";
      button.dataset.bbOriginalText = text;
      button.textContent = text.replace(String(price), String(scaled));
      button.addEventListener("click", (event) => {
        const frags = Number((document.getElementById("frags")?.textContent || "0").replace(/[^0-9]/g, "")) || 0;
        if (frags < scaled) {
          event.preventDefault();
          event.stopPropagation();
        }
      }, true);
    });
  }

  setInterval(rewriteUpgradeCards, 600);
  window.__brickBlockUpgradeBalance = { rewriteUpgradeCards };
})();
