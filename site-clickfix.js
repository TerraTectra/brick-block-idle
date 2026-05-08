document.addEventListener(
  "pointerdown",
  (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const button = target.closest("#upgrades .buy");
    if (!(button instanceof HTMLButtonElement)) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    button.click();
  },
  true,
);
