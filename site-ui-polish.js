(() => {
  const EVOLUTION_LEVELS = [10, 25, 50, 100, 200, 500, 1000];
  const STYLE_ID = "brick-block-ui-polish-style";

  function injectStableHoverCss() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #upgrades .buy,
      #upgrades .buy:hover,
      #upgrades .buy:focus,
      #upgrades .buy:active {
        transition: border-color .12s ease, background-color .12s ease, color .12s ease !important;
        transform: none !important;
        animation: none !important;
      }

      #upgrades .buy:hover {
        border-color: rgba(103, 232, 249, .68) !important;
        background: rgba(34, 211, 238, .12) !important;
      }
    `;
    document.head.appendChild(style);
  }

  function parseBallCard(card) {
    const text = card.textContent || "";
    const level = Number((text.match(/Ур\.\s*(\d+)/) || [])[1] || 1);
    const xpMatch = text.match(/XP\s+(\d+)\/(\d+)/);
    const isLocked = text.includes("XP СТОП") || text.includes("Эволюционировать");

    if (isLocked) {
      return { score: -1000000 + level, level };
    }

    const next = EVOLUTION_LEVELS.find((value) => value > level) || 1000;
    const progress = xpMatch ? Number(xpMatch[1]) / Math.max(1, Number(xpMatch[2])) : 0;
    const distance = Math.max(0, next - level - progress);

    return { score: distance, level };
  }

  function sortBallCards() {
    const root = document.getElementById("balls");
    if (!root || root.__brickSortingBalls) return;

    const cards = [...root.querySelectorAll(".ball-card")];
    if (cards.length < 2) return;

    const sorted = [...cards].sort((a, b) => {
      const aa = parseBallCard(a);
      const bb = parseBallCard(b);
      return aa.score - bb.score || bb.level - aa.level;
    });

    const changed = sorted.some((card, index) => card !== cards[index]);
    if (!changed) return;

    root.__brickSortingBalls = true;
    for (const card of sorted) root.appendChild(card);
    root.__brickSortingBalls = false;
  }

  function observeBalls() {
    const root = document.getElementById("balls");
    if (!root || root.__brickObserverAttached) return false;

    root.__brickObserverAttached = true;
    const observer = new MutationObserver(() => {
      requestAnimationFrame(sortBallCards);
    });
    observer.observe(root, { childList: true, subtree: false });
    sortBallCards();
    return true;
  }

  injectStableHoverCss();

  const boot = setInterval(() => {
    if (observeBalls()) clearInterval(boot);
  }, 250);

  window.addEventListener("load", () => {
    injectStableHoverCss();
    observeBalls();
    sortBallCards();
  });
})();
