(() => {
  const watchedIds = new Set(["upgrades", "balls", "types", "log", "meta"]);
  const lastHtml = new WeakMap();
  const pendingHtml = new WeakMap();
  const pendingElements = new Set();
  const PATCHED = Symbol.for("brick_block_idle_innerhtml_cache_v2");

  function isWatched(element) {
    return element && watchedIds.has(element.id);
  }

  function isHovered(element) {
    try {
      return element.matches(":hover") || Boolean(element.querySelector(":hover"));
    } catch {
      return false;
    }
  }

  function flushPending() {
    for (const element of [...pendingElements]) {
      if (!element.isConnected) {
        pendingElements.delete(element);
        pendingHtml.delete(element);
        continue;
      }
      if (isHovered(element)) continue;

      const html = pendingHtml.get(element);
      pendingHtml.delete(element);
      pendingElements.delete(element);
      if (html === undefined || lastHtml.get(element) === html) continue;

      lastHtml.set(element, html);
      element.__brickSetInnerHTML(html);
    }
  }

  function patchPrototype(proto) {
    if (!proto || proto[PATCHED]) return;
    const descriptor = Object.getOwnPropertyDescriptor(proto, "innerHTML");
    if (!descriptor || !descriptor.get || !descriptor.set) return;

    Object.defineProperty(proto, "__brickSetInnerHTML", {
      value(value) {
        descriptor.set.call(this, value);
      },
      configurable: true,
    });

    Object.defineProperty(proto, "innerHTML", {
      get() {
        return descriptor.get.call(this);
      },
      set(value) {
        if (isWatched(this)) {
          const previous = lastHtml.get(this);
          if (previous === value) return;

          if (isHovered(this)) {
            pendingHtml.set(this, value);
            pendingElements.add(this);
            return;
          }

          lastHtml.set(this, value);
        }

        descriptor.set.call(this, value);
      },
      configurable: true,
      enumerable: descriptor.enumerable,
    });

    Object.defineProperty(proto, PATCHED, { value: true, configurable: true });
  }

  patchPrototype(Element.prototype);
  patchPrototype(HTMLElement.prototype);

  document.addEventListener("pointerleave", flushPending, true);
  document.addEventListener("pointerout", flushPending, true);
  setInterval(flushPending, 250);
})();
