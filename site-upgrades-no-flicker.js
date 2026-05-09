(() => {
  const PATCH_FLAG = "__brickBlockIdleNoFlickerV1";
  if (window[PATCH_FLAG]) return;
  window[PATCH_FLAG] = true;

  const proto = Element.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, "innerHTML");
  if (!descriptor || !descriptor.get || !descriptor.set) return;

  const cache = new WeakMap();

  Object.defineProperty(proto, "innerHTML", {
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
})();
