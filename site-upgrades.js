const upgradeDescriptions = {
  damage: "Усиливает урон всех текущих и будущих шаров. Первый уровень сразу даёт x2.",
  speed: "Ускоряет движение всех шаров и повышает частоту ударов по блокам.",
  xp: "Увеличивает опыт, который шар получает за добивание блока.",
  ball: "Добавляет новый самостоятельный шар со своим уровнем, опытом и будущими эволюциями."
};

function parseFragments() {
  const text = document.getElementById("frags")?.textContent || "0";
  return Number(text.replace(/\D/g, "")) || 0;
}

function parsePrice(text) {
  const match = text.match(/—\s*(\d+)\s*оск/);
  return match ? Number(match[1]) : 0;
}

function enhanceUpgradeButton(button) {
  if (!button.classList.contains("buy")) return;

  const raw = button.textContent || "";
  const isBall = button.dataset.action === "ball";
  const key = isBall ? "ball" : button.dataset.upgrade;
  const price = parsePrice(raw);
  const fragments = parseFragments();
  const affordable = fragments >= price;

  button.classList.toggle("locked", !affordable);
  button.classList.toggle("ready", affordable);

  if (button.dataset.enhancedRaw === raw) return;
  button.dataset.enhancedRaw = raw;

  const [titlePart, pricePart] = raw.split("—");
  const description = upgradeDescriptions[key] || "Улучшение системы.";
  button.innerHTML = `
    <span class="upgrade-title">${titlePart.trim()}<span class="price">${pricePart ? pricePart.trim() : ""}</span></span>
    <span class="upgrade-meta">${description}</span>
  `;
}

function enhanceUpgrades() {
  document.querySelectorAll("#upgrades .buy").forEach(enhanceUpgradeButton);
}

setInterval(enhanceUpgrades, 300);
enhanceUpgrades();
