(() => {
  const RUN_KEY = "brick_block_idle_run_v7";
  const VERSION = 1;

  function readRun() {
    try {
      return JSON.parse(localStorage.getItem(RUN_KEY));
    } catch {
      return null;
    }
  }

  function writeRun(run) {
    localStorage.setItem(RUN_KEY, JSON.stringify(run));
  }

  function makeStarterRun() {
    return {
      level: 1,
      fragments: 360,
      total: 0,
      upgrades: { damage: 1, speed: 0, xp: 0 },
      balls: [],
      __startBalanceVersion: VERSION,
    };
  }

  const run = readRun();

  if (!run) {
    writeRun(makeStarterRun());
    return;
  }

  const isEarlyRun = (run.level || 1) <= 6 && (run.total || 0) < 2500;
  if (run.__startBalanceVersion === VERSION || !isEarlyRun) return;

  run.fragments = (run.fragments || 0) + 360;
  run.upgrades = run.upgrades || { damage: 0, speed: 0, xp: 0 };
  run.upgrades.damage = Math.max(run.upgrades.damage || 0, 1);
  run.__startBalanceVersion = VERSION;

  writeRun(run);
})();
