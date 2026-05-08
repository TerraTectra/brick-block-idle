(() => {
  const PATCHED = Symbol.for("brick_block_idle_upgrades_innerhtml_stable_v1");
  if (Element.prototype[PATCHED]) return;

  const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
  if (!descriptor || !descriptor.get || !descriptor.set) return;

  const cache = new WeakMap();

  Object.defineProperty(Element.prototype, "innerHTML", {
    get() {
      return descriptor.get.call(this);
    },
    set(value) {
      if (this && this.id === "upgrades") {
        const previous = cache.get(this);
        if (previous === value) return;
        cache.set(this, value);
      }

      descriptor.set.call(this, value);
    },
    configurable: true,
    enumerable: descriptor.enumerable,
  });

  Object.defineProperty(Element.prototype, PATCHED, {
    value: true,
    configurable: true,
  });
})();
