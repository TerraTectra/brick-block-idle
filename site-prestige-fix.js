(() => {
  "use strict";

  const RUN_KEY = "brick_block_idle_run_v9";
  const META_KEY = "brick_block_idle_meta_v4";

  function readJson(key, fallback) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key));
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function numberOrZero(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function parseReward(button) {
    const text = button?.textContent || "";
    const match = text.match(/\+(\d+)/);
    return match ? Number(match[1]) : 0;
  }

  function normalizeMeta(meta) {
    meta.cores = numberOrZero(meta.cores);
    meta.spent = numberOrZero(meta.spent);
    meta.bankedFragments = numberOrZero(meta.bankedFragments);
    meta.nodes = meta.nodes && typeof meta.nodes === "object" ? meta.nodes : {};
    return meta;
  }

  function prestige(button) {
    if (!button || button.disabled) return false;

    const reward = parseReward(button);
    if (!Number.isFinite(reward) || reward <= 0) return false;

    const meta = normalizeMeta(readJson(META_KEY, { cores: 0, spent: 0, nodes: {}, bankedFragments: 0 }));
    const run = readJson(RUN_KEY, null);

    if (meta.nodes.coreBank > 0 && run && Number.isFinite(Number(run.fragments))) {
      meta.bankedFragments = Math.floor(Number(run.fragments) * 0.1);
    }

    meta.cores += reward;
    writeJson(META_KEY, meta);
    localStorage.removeItem(RUN_KEY);

    location.reload();
    return true;
  }

  document.addEventListener(
    "pointerdown",
    (event) => {
      const button = event.target.closest("[data-prestige]");
      if (!button) return;

      if (prestige(button)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    },
    true,
  );
})();
