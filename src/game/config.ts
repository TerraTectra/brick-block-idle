import type { Upgrades } from "./types";

export const WIDTH = 980;
export const HEIGHT = 650;
export const STORAGE_KEY = "brick_block_idle_v1";

export const DEFAULT_UPGRADES: Upgrades = {
  coreDamage: 0,
  speedDrive: 0,
  xpMatrix: 0,
};

export const EVOLUTION_MILESTONES = [10, 25, 50, 100, 200, 500, 1000] as const;

export const LEVEL_PATTERNS = [
  "Коридоры",
  "Диагональный разлом",
  "Кольца пустоты",
  "Двойное ядро",
  "Плазменные полосы",
  "Спираль",
  "Соты",
  "Осколочный хаос",
] as const;
