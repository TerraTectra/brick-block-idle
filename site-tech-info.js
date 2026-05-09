(() => {
  "use strict";

  const FORM_INFO = {
    striker: {
      short: "Прямой DPS",
      text: "Урон x1.15, скорость x1.00. Без сложных условий: стабильно пробивает блоки прямыми попаданиями. Каждое усиление повышает общий урон через ранг эволюции.",
      evo: "Усиление: +ранг эволюции, больше базового урона шара."
    },
    swift: {
      short: "Скоростной DPS",
      text: "Урон x0.75, скорость x1.45. Низкий урон за удар, но больше касаний в секунду. Хорош для ранней зачистки слабых блоков.",
      evo: "Усиление: скорость и общий урон растут от ранга эволюции."
    },
    heavy: {
      short: "Тяжёлый удар",
      text: "Урон x1.55, скорость x0.65, радиус x1.15. Медленный, но каждый удар намного сильнее. Хорош против блоков с высоким HP.",
      evo: "Усиление: растёт урон и размер шара."
    },
    collector: {
      short: "Фарм",
      text: "Урон x0.70, скорость x1.05. Получает больше XP и осколков: XP +8% за ранг эволюции, осколки +10% за ранг.",
      evo: "Усиление: выше бонус XP/осколков и общий урон."
    },
    ricochet: {
      short: "Доп. попадания",
      text: "Урон x0.90, скорость x1.15. Имеет шанс дополнительного случайного удара после попадания: 8% + 1.5% за ранг эволюции.",
      evo: "Усиление: выше шанс дополнительного удара и общий урон."
    },
    plasma: {
      short: "% урон по области",
      text: "Урон x0.90, скорость x0.95. Прямой удар дополнительно наносит процент от max HP блока: 1.5% + 0.6% за ранг. Сплэш наносит 1% + 0.5% за ранг от max HP соседних блоков.",
      evo: "Усиление: больше процентный урон и радиус области: 48px + 14px за ранг."
    },
    storm: {
      short: "Цепная молния",
      text: "Урон x0.80, скорость x1.18. После добивания бьёт цепной молнией по случайным блокам. Количество целей: 1 + ранг эволюции, максимум 10.",
      evo: "Усиление: больше целей цепи и выше урон молнии."
    },
    poison: {
      short: "Яд / DoT",
      text: "Урон x0.78, скорость x0.90. Прямой удар накладывает яд на 4 + 2×ранг секунд. Яд каждый тик снимает часть max HP блока и может добивать блоки.",
      evo: "Усиление: яд держится дольше, а общий урон шара растёт."
    },
    drill: {
      short: "Пробитие резистов",
      text: "Урон x1.35, скорость x0.72. Частично игнорирует штрафы брони, щитов и тяжёлых блоков. Особенно силён против защитных типов блоков.",
      evo: "Усиление: больше пробитие резистов и прямой урон."
    },
    crit: {
      short: "Криты",
      text: "Урон x1.05, скорость x1.00. Шанс крита: 10% + 3% за ранг, максимум 42%. Критический множитель: x1.55 + 0.12 за ранг.",
      evo: "Усиление: выше шанс и сила критов."
    },
    comet: {
      short: "Урон от скорости",
      text: "Урон x0.92, скорость x1.32. Чем выше скорость шара, тем выше урон. Бонус урона от скорости ограничен примерно 75%.",
      evo: "Усиление: больше скорость и конверсия скорости в урон."
    },
    frost: {
      short: "Заморозка / дебафф",
      text: "Урон x0.95, скорость x0.85. Прямой удар замораживает блок на 2.5 + 0.4×ранг секунд. Замороженные блоки не регенерируют и получают больше урона.",
      evo: "Усиление: дольше заморозка и сильнее уязвимость."
    },
    vampire: {
      short: "Снежный ком",
      text: "Урон x1.00, скорость x1.00. Каждое добивание даёт временный бонус урона до конца этапа: +1.5% + 0.3% за ранг. Лимит бонуса: +120%.",
      evo: "Усиление: быстрее набирает временный урон."
    },
    shard: {
      short: "Осколочные выстрелы",
      text: "Урон x0.85, скорость x1.05. При добивании выпускает 1 + ранг осколочных ударов, максимум 8. Каждый осколок наносит часть урона случайному блоку.",
      evo: "Усиление: больше осколков после добивания."
    },
    gravity: {
      short: "Урон по скоплениям",
      text: "Урон x0.90, скорость x0.90, радиус x1.15. После попадания наносит малый урон блокам вокруг точки удара. Радиус: 42px + 9px за ранг.",
      evo: "Усиление: шире зона гравитационного урона."
    },
    rift: {
      short: "Линейный урон",
      text: "Урон x1.10, скорость x0.80. После попадания наносит дополнительный урон блокам в той же горизонтальной линии. Количество целей растёт от ранга.",
      evo: "Усиление: больше целей линии и выше разломный урон."
    },
    singularity: {
      short: "Финишер поля",
      text: "Урон x1.05, скорость x0.85, радиус x1.20. Чем меньше блоков осталось на поле, тем выше урон. Особенно силён в конце этапа.",
      evo: "Усиление: выше бонус урона при малом числе блоков."
    },
    quantum: {
      short: "Случайные доп. цели",
      text: "Урон x1.05, скорость x1.10. При попадании имеет шанс ударить случайный дополнительный блок: 4% + 1.5% за ранг.",
      evo: "Усиление: чаще срабатывает квантовый удар."
    },
    solar: {
      short: "Периодическая вспышка",
      text: "Урон x1.20, скорость x0.75, радиус x1.25. Периодически добавляет процентный урон от max HP блока. Чем выше ранг, тем чаще вспышка.",
      evo: "Усиление: вспышка срабатывает чаще и бьёт сильнее."
    },
    royal: {
      short: "Аура поддержки",
      text: "Урон x0.65, скорость x0.95. Сам слабее, но каждый ранг даёт остальным шарам +2.5% урона. Несколько королевских шаров суммируются.",
      evo: "Усиление: сильнее аура урона для остальных шаров."
    },
    infinite: {
      short: "Случайный рост",
      text: "Урон x1.00, скорость x1.00. Каждое усиление случайно даёт +5% к одному постоянному бонусу: урон, скорость, XP или осколки.",
      evo: "Усиление: случайный постоянный бонус +5%."
    }
  };

  const BLOCK_INFO = {
    normal: "Обычный блок. Без резистов и спецэффектов.",
    armored: "Броня. Получает меньше прямого урона. Бур частично игнорирует этот штраф.",
    volatile: "Нестабильный. При уничтожении взрывается и повреждает соседние блоки.",
    regen: "Живой. Постепенно восстанавливает HP, если не заморожен.",
    shield: "Щит. Сильно режет непрямой урон: сплэш, цепи, взрывы.",
    heavy: "Тяжёлый. Сильно режет прямой урон, но даёт повышенную награду."
  };

  const UPGRADE_INFO = {
    damage: "Временный апгрейд текущего забега. Повышает множитель урона всех шаров.",
    speed: "Временный апгрейд текущего забега. Повышает скорость движения всех шаров.",
    xp: "Временный апгрейд текущего забега. Увеличивает XP, получаемый шарами за разрушение блоков.",
    ball: "Покупает дополнительный шар в текущем забеге. Цена растёт с количеством шаров."
  };

  function rarityFromText(text) {
    if (text.includes("Легендарный")) return "legendary";
    if (text.includes("Эпический")) return "epic";
    if (text.includes("Редкий")) return "rare";
    return "common";
  }

  function formatChoiceInfo(formKey, formName, rarity, currentText) {
    const info = FORM_INFO[formKey];
    if (!info) return currentText;
    return `${info.text}<br><br><b>Технически:</b> ${info.evo}`;
  }

  function enhanceEvolutionModal() {
    const modal = document.querySelector(".evo-modal");
    if (!modal || modal.__techEnhanced) return;
    modal.__techEnhanced = true;

    modal.querySelectorAll(".evo-choice").forEach((button) => {
      const formKey = button.dataset.form;
      const small = button.querySelector("small");
      if (!formKey || !small || small.__techEnhanced) return;
      small.__techEnhanced = true;
      const info = FORM_INFO[formKey];
      if (!info) return;
      small.innerHTML = `${info.text}<br><br><b>Усиление:</b> ${info.evo}`;
      button.title = info.text.replace(/<br>/g, " ");
    });
  }

  function enhanceBalls() {
    const root = document.getElementById("balls");
    if (!root) return;
    root.querySelectorAll(".ball-card").forEach((card) => {
      if (card.__techEnhanced) return;
      const text = card.textContent || "";
      const formEntry = Object.entries(FORM_INFO).find(([, info]) => text.includes(info.short) || false);
      const known = Object.entries(FORM_INFO).find(([key, info]) => text.includes(info.short) || text.includes(info.text) || text.includes(key));
      const byName = Object.entries(FORM_INFO).find(([key]) => {
        const data = {
          striker: "Ударный", swift: "Быстрый", heavy: "Тяжёлый", collector: "Сборщик", ricochet: "Рикошет", plasma: "Плазма", storm: "Гроза", poison: "Ядовитый", drill: "Бур", crit: "Крит", comet: "Комета", frost: "Ледяной", vampire: "Вампирический", shard: "Осколочный", gravity: "Гравитационный", rift: "Разлом", singularity: "Сингулярный", quantum: "Квантовый", solar: "Солнечный", royal: "Королевский", infinite: "Бесконечный"
        };
        return text.includes(data[key]);
      });
      const found = byName || known || formEntry;
      if (!found) return;
      const info = found[1];
      const hint = document.createElement("small");
      hint.className = "tech-hint";
      hint.innerHTML = `<b>Механика:</b> ${info.short}. ${info.evo}`;
      card.appendChild(hint);
      card.__techEnhanced = true;
    });
  }

  function enhanceUpgrades() {
    const root = document.getElementById("upgrades");
    if (!root) return;
    root.querySelectorAll("button").forEach((button) => {
      if (button.__techEnhanced) return;
      const key = button.dataset.upgrade || button.dataset.action;
      const info = UPGRADE_INFO[key];
      if (!info) return;
      button.title = info;
      const span = document.createElement("small");
      span.className = "tech-hint upgrade-tech";
      span.textContent = info;
      button.appendChild(span);
      button.__techEnhanced = true;
    });
  }

  function enhanceBlocks() {
    const root = document.getElementById("types");
    if (!root || root.__techEnhanced) return;
    const text = root.textContent || "";
    const lines = Object.entries(BLOCK_INFO)
      .filter(([key, info]) => {
        const names = { normal: "Обычный", armored: "Броня", volatile: "Нестабильный", regen: "Живой", shield: "Щит", heavy: "Тяжёлый" };
        return text.includes(names[key]);
      })
      .map(([, info]) => `<small class="tech-hint">${info}</small>`);
    if (!lines.length) return;
    const box = document.createElement("div");
    box.className = "tech-block-info";
    box.innerHTML = lines.join("");
    root.appendChild(box);
    root.__techEnhanced = true;
  }

  function injectStyle() {
    if (document.getElementById("tech-info-style")) return;
    const style = document.createElement("style");
    style.id = "tech-info-style";
    style.textContent = `
      .tech-hint {
        display:block;
        margin-top:6px;
        color:#cbd5e1;
        font-size:11px;
        line-height:1.35;
        font-weight:750;
      }
      .upgrade-tech {
        color:#94a3b8;
        font-weight:750;
      }
      #upgrades .buy {
        text-align:left;
      }
      .tech-block-info {
        display:grid;
        gap:6px;
        margin-top:8px;
        padding-top:8px;
        border-top:1px solid rgba(51,65,85,.75);
      }
      .evo-choice small b {
        color:#fff;
      }
    `;
    document.head.appendChild(style);
  }

  function enhanceAll() {
    injectStyle();
    enhanceEvolutionModal();
    enhanceBalls();
    enhanceUpgrades();
    enhanceBlocks();
  }

  const observer = new MutationObserver(() => requestAnimationFrame(enhanceAll));
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("load", enhanceAll);
  setInterval(enhanceAll, 1000);
})();
