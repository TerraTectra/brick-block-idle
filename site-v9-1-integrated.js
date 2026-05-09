(() => {
  "use strict";

  const RUN_KEY = "brick_block_idle_run_v9_2";
  const META_KEY = "brick_block_idle_meta_v4";

  const FORM_INFO = {
    striker: ["Прямой DPS", "Урон x1.15, скорость x1.00. Стабильный прямой урон без условий. Усиления повышают общий урон через ранг эволюции."],
    swift: ["Скоростной DPS", "Урон x0.75, скорость x1.45. Больше касаний в секунду, но слабее один удар. Хорош для ранней зачистки."],
    heavy: ["Тяжёлый удар", "Урон x1.55, скорость x0.65, радиус x1.15. Медленный шар с высоким уроном за попадание."],
    collector: ["Фарм", "Урон x0.70, скорость x1.05. XP +8% за ранг эволюции, осколки +10% за ранг."],
    ricochet: ["Доп. попадания", "Урон x0.90, скорость x1.15. Шанс случайного дополнительного удара: 8% + 1.5% за ранг."],
    plasma: ["% урон по области", "Прямой удар добавляет 1.5% + 0.6% за ранг от max HP блока. Сплэш: 1% + 0.5% за ранг от max HP соседних блоков. Радиус: 48px + 14px за ранг."],
    storm: ["Цепная молния", "После добивания бьёт молнией по 1 + ранг случайным блокам, максимум 10. Урон цепи растёт от ранга."],
    poison: ["Яд / DoT", "Прямой удар накладывает яд на 4 + 2×ранг секунд. Яд периодически снимает часть max HP и может добивать блоки."],
    drill: ["Пробитие резистов", "Урон x1.35, скорость x0.72. Частично игнорирует броню, щиты и тяжёлые блоки. Чем выше ранг, тем сильнее пробитие."],
    crit: ["Криты", "Шанс крита: 10% + 3% за ранг, максимум 42%. Критический множитель: x1.55 + 0.12 за ранг."],
    comet: ["Урон от скорости", "Урон x0.92, скорость x1.32. Чем выше скорость шара, тем выше урон. Бонус от скорости ограничен примерно +75%."],
    frost: ["Заморозка", "Прямой удар замораживает блок на 2.5 + 0.4×ранг секунд. Замороженный блок не регенерирует и получает больше урона."],
    vampire: ["Снежный ком", "Каждое добивание даёт временный урон до конца этапа: +1.5% + 0.3% за ранг. Лимит: +120%."],
    shard: ["Осколочные удары", "При добивании выпускает 1 + ранг осколочных ударов, максимум 8. Каждый осколок бьёт случайный блок."],
    gravity: ["Урон по скоплениям", "После попадания наносит малый урон вокруг точки удара. Радиус: 42px + 9px за ранг."],
    rift: ["Линейный урон", "После попадания дополнительно повреждает блоки в той же горизонтальной линии. Количество целей растёт от ранга."],
    singularity: ["Финишер поля", "Чем меньше блоков осталось, тем выше урон. Лучше всего добивает конец этапа."],
    quantum: ["Случайные цели", "При попадании имеет шанс ударить случайный дополнительный блок: 4% + 1.5% за ранг."],
    solar: ["Вспышка", "Периодически добавляет процентный урон от max HP блока. Чем выше ранг, тем чаще и сильнее вспышка."],
    royal: ["Аура поддержки", "Сам слабее, но каждый ранг даёт остальным шарам +2.5% урона. Несколько аур суммируются."],
    sniper: ["Автонаведение от стены", "Урон x1.15, скорость x0.95, радиус x0.82. После каждого отскока от стены шар перенаправляется прямо в ближайший блок. Усиления повышают урон и общую эффективность наведения."],
    berserk: ["Бесконечный разгон этапа", "Урон x0.90, скорость x1.00. За каждое уничтожение блока получает +3.5% + 0.8% за ранг к скорости до конца этапа. Верхнего лимита нет. При переходе на новый этап бонус сбрасывается."],
    infinite: ["Случайный рост", "Каждое усиление случайно даёт +5% к одному постоянному бонусу: урон, скорость, XP или осколки."]
  };

  const FORM_NAMES = {
    striker: "Ударный", swift: "Быстрый", heavy: "Тяжёлый", collector: "Сборщик", ricochet: "Рикошет",
    plasma: "Плазма", storm: "Гроза", poison: "Ядовитый", drill: "Бур", crit: "Крит", comet: "Комета",
    frost: "Ледяной", vampire: "Вампирический", shard: "Осколочный", gravity: "Гравитационный", rift: "Разлом",
    singularity: "Сингулярный", quantum: "Квантовый", solar: "Солнечный", royal: "Королевский", sniper: "Снайпер", berserk: "Берсерк", infinite: "Бесконечный"
  };

  const BLOCK_INFO = {
    "Обычный": "Без резистов и спецэффектов.",
    "Броня": "Режет прямой урон. Бур частично игнорирует этот штраф.",
    "Нестабильный": "При уничтожении взрывается и повреждает соседние блоки.",
    "Живой": "Постепенно восстанавливает HP, если не заморожен.",
    "Щит": "Сильно режет непрямой урон: сплэш, цепи, взрывы.",
    "Тяжёлый": "Сильно режет прямой урон, но даёт повышенную награду."
  };

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

  function num(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function normalizeMeta(meta) {
    meta.cores = num(meta.cores);
    meta.spent = num(meta.spent);
    meta.bankedFragments = num(meta.bankedFragments);
    meta.nodes = meta.nodes && typeof meta.nodes === "object" ? meta.nodes : {};
    return meta;
  }

  function prestigeFromButton(button) {
    const match = (button.textContent || "").match(/\+(\d+)/);
    const reward = match ? Number(match[1]) : 0;
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

  function injectStyle() {
    if (document.getElementById("v9-1-style")) return;
    const style = document.createElement("style");
    style.id = "v9-1-style";
    style.textContent = `
      .tech-hint{display:block;margin-top:6px;color:#cbd5e1;font-size:11px;line-height:1.35;font-weight:750}
      .tech-block-info{display:grid;gap:6px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(51,65,85,.75)}
      .evo-choice small b{color:#fff}
      #upgrades .buy{text-align:left}
      #upgrades .buy .tech-hint{color:#94a3b8}
    `;
    document.head.appendChild(style);
  }

  function enhanceEvolutionModal() {
    const modal = document.querySelector(".evo-modal");
    if (!modal) return;
    modal.querySelectorAll(".evo-choice").forEach((button) => {
      const key = button.dataset.form;
      const info = FORM_INFO[key];
      const small = button.querySelector("small");
      if (!info || !small || small.dataset.tech === "1") return;
      small.dataset.tech = "1";
      small.innerHTML = `${info[1]}<br><br><b>Роль:</b> ${info[0]}. <b>Следующие эволюции:</b> усиливают эту же механику, тип шара больше не меняется.`;
      button.title = info[1];
    });
  }

  function enhanceBalls() {
    const root = document.getElementById("balls");
    if (!root) return;
    root.querySelectorAll(".ball-card").forEach((card) => {
      if (card.dataset.tech === "1") return;
      const text = card.textContent || "";
      const key = Object.entries(FORM_NAMES).find(([, name]) => text.includes(name))?.[0];
      const info = key ? FORM_INFO[key] : null;
      if (!info) return;
      const hint = document.createElement("small");
      hint.className = "tech-hint";
      hint.textContent = `Механика: ${info[0]}. ${info[1]}`;
      card.appendChild(hint);
      card.dataset.tech = "1";
    });
  }

  function enhanceUpgrades() {
    const root = document.getElementById("upgrades");
    if (!root) return;
    root.querySelectorAll("button").forEach((button) => {
      if (button.dataset.tech === "1") return;
      const key = button.dataset.upgrade || button.dataset.action;
      const text = {
        damage: "Временный апгрейд забега. Увеличивает общий множитель урона всех шаров.",
        speed: "Временный апгрейд забега. Увеличивает скорость движения всех шаров.",
        xp: "Временный апгрейд забега. Увеличивает XP за разрушенные блоки.",
        ball: "Покупает дополнительный шар. Цена растёт от количества шаров."
      }[key];
      if (!text) return;
      button.title = text;
      const hint = document.createElement("small");
      hint.className = "tech-hint";
      hint.textContent = text;
      button.appendChild(hint);
      button.dataset.tech = "1";
    });
  }

  function enhanceBlocks() {
    const root = document.getElementById("types");
    if (!root || root.dataset.tech === "1") return;
    const content = root.textContent || "";
    const lines = Object.entries(BLOCK_INFO)
      .filter(([name]) => content.includes(name))
      .map(([name, text]) => `<small class="tech-hint"><b>${name}:</b> ${text}</small>`);
    if (!lines.length) return;
    const box = document.createElement("div");
    box.className = "tech-block-info";
    box.innerHTML = lines.join("");
    root.appendChild(box);
    root.dataset.tech = "1";
  }

  function enhanceAll() {
    injectStyle();
    enhanceEvolutionModal();
    enhanceBalls();
    enhanceUpgrades();
    enhanceBlocks();
  }

  document.addEventListener("pointerdown", (event) => {
    const button = event.target.closest("[data-prestige]");
    if (!button || button.disabled) return;
    if (prestigeFromButton(button)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }, true);

  const observer = new MutationObserver(() => requestAnimationFrame(enhanceAll));
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("load", enhanceAll);
  setInterval(enhanceAll, 1200);
})();
