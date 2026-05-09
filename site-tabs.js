function activateTab(tabName) {
  const buttons = Array.from(document.querySelectorAll("[data-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-tab-panel]"));
  const hasTab = buttons.some((button) => button.dataset.tab === tabName);
  const safeTab = hasTab ? tabName : (buttons[0]?.dataset.tab || panels[0]?.dataset.tabPanel || "summary");

  panels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.tabPanel !== safeTab);
  });

  buttons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === safeTab);
  });

  localStorage.setItem("brick_block_idle_active_tab", safeTab);
}

function initTabs() {
  const saved = localStorage.getItem("brick_block_idle_active_tab") || "summary";
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.tab));
  });
  activateTab(saved);
}

initTabs();
