(() => {
  "use strict";

  const SOURCE = "./site-app-v10.js?v=10-debug-clean";
  const OLD_XP_NEED = `function xpNeed(level) { if (level <= 1) return 32; return Math.floor(32 + level * 18 + Math.pow(level, 1.52) * 10 + Math.pow(Math.max(0, level - 20), 1.82) * 8 + (EVO_LEVELS.includes(level) ? level * 70 : 0)); }`;
  const NEW_XP_NEED = `function xpNeed(level) {
    if (level <= 1) return 48;
    const early = 42 + level * 24 + Math.pow(level, 1.62) * 14;
    const mid = Math.pow(Math.max(0, level - 20), 1.9) * 16;
    const late = Math.pow(Math.max(0, level - 50), 2.08) * 22;
    const post100 = Math.pow(Math.max(0, level - 100), 2.35) * 55;
    const milestone = EVO_LEVELS.includes(level) ? level * 220 + Math.pow(level, 1.65) * 16 : 0;
    return Math.floor(early + mid + late + post100 + milestone);
  }`;

  function loadSource() {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", SOURCE, false);
    xhr.send(null);
    if (xhr.status < 200 || xhr.status >= 300) {
      throw new Error(`Не удалось загрузить ${SOURCE}: ${xhr.status}`);
    }
    return xhr.responseText;
  }

  function runPatchedSource(source) {
    const patched = source.includes(OLD_XP_NEED)
      ? source.replace(OLD_XP_NEED, NEW_XP_NEED)
      : source.replace(/function xpNeed\(level\) \{[\s\S]*?\n  function pendingMilestone\(ball\)/, `${NEW_XP_NEED}\n  function pendingMilestone(ball)`);

    const script = document.createElement("script");
    script.textContent = `${patched}\n//# sourceURL=site-app-v10-xp-scaled.js`;
    document.body.appendChild(script);
    window.__brickBlockXpCurve = {
      version: "v0.11.4",
      mode: "harder xp scaling",
      milestones: [10, 25, 50, 100, 200, 500, 1000],
    };
  }

  try {
    runPatchedSource(loadSource());
  } catch (error) {
    console.error("[BrickBlock] XP loader failed, falling back to vanilla v10", error);
    const fallback = document.createElement("script");
    fallback.src = SOURCE;
    document.body.appendChild(fallback);
  }
})();
