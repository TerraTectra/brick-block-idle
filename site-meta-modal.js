(() => {
  "use strict";

  const META_KEY = "brick_block_idle_meta_v4";
  const TARGET_ID = "meta";
  const MODAL_ID = "metaTreeModal";
  let mounted = false;
  let movedMeta = false;

  function readMeta() {
    try {
      const meta = JSON.parse(localStorage.getItem(META_KEY) || "{}");
      return meta && typeof meta === "object" ? meta : {};
    } catch {
      return {};
    }
  }

  function metaSummaryHtml() {
    const meta = readMeta();
    const cores = Number(meta.cores || 0);
    const spent = Number(meta.spent || 0);
    const nodes = meta.nodes && typeof meta.nodes === "object" ? meta.nodes : {};
    const bought = Object.values(nodes).reduce((sum, value) => sum + Number(value || 0), 0);
    return `<div class="meta-launch"><div class="meta-launch-card"><h3>Мета-древо</h3><p>Открывается отдельным полноэкранным экраном, чтобы узлы не превращались в узкую колонку.</p></div><div class="grid"><div class="stat"><small>Ядра</small><b>${cores}</b></div><div class="stat"><small>Потрачено</small><b>${spent}</b></div><div class="stat"><small>Узлов</small><b>${bought}</b></div><div class="stat"><small>Режим</small><b>100+</b></div></div><button class="meta-open-btn" id="openMetaTreeBtn">Открыть дерево</button></div>`;
  }

  function ensureModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = MODAL_ID;
    modal.className = "meta-modal";
    modal.innerHTML = `<div class="meta-modal-head"><div><h2>Мета-древо прокачки</h2><p>Полноэкранное дерево: ветки, развилки и долгосрочные узлы.</p></div><button class="meta-close-btn" id="closeMetaTreeBtn">Закрыть</button></div><div class="meta-modal-body"><div class="meta-modal-canvas" id="metaTreeCanvas"></div></div>`;
    document.body.appendChild(modal);
    return modal;
  }

  function moveMetaToModal() {
    const meta = document.getElementById(TARGET_ID);
    const canvas = document.getElementById("metaTreeCanvas");
    if (!meta || !canvas || movedMeta) return;
    canvas.appendChild(meta);
    movedMeta = true;
  }

  function renderLauncher() {
    let launcher = document.getElementById("metaLauncher");
    const metaPanel = document.querySelector('[data-tab-panel="meta"] .ui-block');
    if (!metaPanel) return;
    if (!launcher) {
      launcher = document.createElement("div");
      launcher.id = "metaLauncher";
      launcher.className = "log";
      metaPanel.appendChild(launcher);
    }
    launcher.innerHTML = metaSummaryHtml();
    document.getElementById("openMetaTreeBtn")?.addEventListener("click", openModal);
  }

  function openModal() {
    const modal = ensureModal();
    moveMetaToModal();
    modal.classList.add("open");
    document.body.classList.add("meta-modal-open");
  }

  function closeModal() {
    const modal = document.getElementById(MODAL_ID);
    if (!modal) return;
    modal.classList.remove("open");
    document.body.classList.remove("meta-modal-open");
  }

  function mount() {
    if (mounted) return;
    mounted = true;
    ensureModal();
    renderLauncher();
    document.getElementById("closeMetaTreeBtn")?.addEventListener("click", closeModal);
    document.getElementById(MODAL_ID)?.addEventListener("click", (event) => {
      if (event.target?.id === MODAL_ID) closeModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeModal();
    });
    setInterval(renderLauncher, 2000);
  }

  window.addEventListener("DOMContentLoaded", () => {
    setTimeout(mount, 250);
  });
})();
