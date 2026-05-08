(() => {
  const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
  if (!descriptor || !descriptor.get || !descriptor.set) return;

  const watchedIds = new Set(["upgrades", "balls", "types", "log", "meta"]);
  const cache = new WeakMap();

  Object.defineProperty(Element.prototype, "innerHTML", {
    get() {
      return descriptor.get.call(this);
    },
    set(value) {
      if (this && watchedIds.has(this.id)) {
        const previous = cache.get(this);
        if (previous === value) return;
        cache.set(this, value);
      }
      descriptor.set.call(this, value);
    },
    configurable: true,
    enumerable: descriptor.enumerable,
  });
})();
