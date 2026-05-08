function activateTab(tabName) {
  document.querySelectorAll("[data-tab-panel]").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.tabPanel !== tabName);
  });

  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });

  localStorage.setItem("brick_block_idle_active_tab", tabName);
}

function initTabs() {
  const saved = localStorage.getItem("brick_block_idle_active_tab") || "summary";
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.tab));
  });
  activateTab(saved);
}

initTabs();
