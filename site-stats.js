(() => {
  "use strict";
  const RUN_KEY = "brick_block_idle_run_v10";
  const META_KEY = "brick_block_idle_meta_v4";
  const started = Date.now();
  const base = { level: 1, fragments: 0, total: 0, peak: 1 };

  function num(id) {
    const node = document.getElementById(id);
    const raw = node ? node.textContent || "0" : "0";
    const value = Number(raw.replace(/[^0-9.,-]/g, "").replace(",", "."));
    return Number.isFinite(value) ? value : 0;
  }

  function json(key) {
    try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
  }

  function fmt(value, digits = 0) {
    if (!Number.isFinite(value)) return "0";
    if (value >= 1000000) return (value / 1000000).toFixed(2) + "M";
    if (value >= 1000) return (value / 1000).toFixed(1) + "K";
    return value.toFixed(digits);
  }

  function coresFor(level) {
    if (level < 10) return 0;
    return Math.max(1, Math.floor(Math.pow(level - 8, 1.18) / 2.7));
  }

  function render() {
    const box = document.getElementById("stats");
    if (!box) return;
    const level = num("level") || 1;
    const hp = num("hp") || 1;
    const blocks = num("count");
    const fragments = num("frags");
    const run = json(RUN_KEY);
    const meta = json(META_KEY);
    if (base.level === 1 && level > 1) base.level = level;
    if (base.fragments === 0 && fragments > 0) base.fragments = fragments;
    base.peak = Math.max(base.peak, level);
    const minutes = Math.max(0.05, (Date.now() - started) / 60000);
    const stagesPerMin = Math.max(0, level - base.level) / minutes;
    const fragsPerMin = Math.max(0, fragments - base.fragments) / minutes;
    const total = Number(run.total || 0);
    const nextCores = coresFor(level);

    box.innerHTML = `
      <div class="stats-wrap">
        <div class="stat-section"><h3>Темп</h3><div class="stat-list">
          <div class="stat-line stat-good"><small>Этапов / мин</small><b>${fmt(stagesPerMin, 2)}</b></div>
          <div class="stat-line stat-good"><small>Осколков / мин</small><b>${fmt(fragsPerMin, 1)}</b></div>
          <div class="stat-line"><small>Всего осколков</small><b>${fmt(total)}</b></div>
          <div class="stat-line"><small>Лучший этап</small><b>${fmt(base.peak)}</b></div>
        </div></div>
        <div class="stat-section"><h3>Поле</h3><div class="stat-list">
          <div class="stat-line"><small>HP блока</small><b>${fmt(hp)}</b></div>
          <div class="stat-line"><small>Блоков осталось</small><b>${fmt(blocks)}</b></div>
          <div class="stat-line stat-warn"><small>Ядер сейчас</small><b>${fmt(nextCores)}</b></div>
          <div class="stat-line"><small>Мета-ядер</small><b>${fmt(Number(meta.cores || 0))}</b></div>
        </div><div class="stat-hint">Если этапы/мин падают почти в ноль — это стена под сингулярность и мету.</div></div>
      </div>`;
  }

  window.addEventListener("DOMContentLoaded", () => {
    setInterval(render, 1000);
    render();
  });
})();
