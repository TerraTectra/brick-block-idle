import type { BrickTypeDef } from "./types";

export const BRICK_TYPES: BrickTypeDef[] = [
  { key: "normal", name: "Обычный блок", short: "без свойств", color: "#4cc9f0", minLevel: 1, weight: 100, reward: 1, description: "Стандартный блок." },
  { key: "armored", name: "Бронированный блок", short: "резист", color: "#94a3b8", minLevel: 5, weight: 14, reward: 1.35, description: "Снижает прямой урон." },
  { key: "volatile", name: "Взрывной блок", short: "взрыв", color: "#ff9f1c", minLevel: 10, weight: 11, reward: 1.25, description: "Дамажит соседей при смерти." },
  { key: "regenerating", name: "Живой блок", short: "реген", color: "#2ec4b6", minLevel: 18, weight: 8, reward: 1.55, description: "Восстанавливает HP." },
  { key: "shielded", name: "Щитовой блок", short: "щит", color: "#b517ff", minLevel: 25, weight: 7, reward: 1.75, description: "Снижает спецурон." },
  { key: "heavy", name: "Тяжёлый блок", short: "тяжёлый", color: "#ff4d6d", minLevel: 40, weight: 5, reward: 2.1, description: "Поздний резистный блок." }
];

export function activeBrickTypes(level: number): BrickTypeDef[] {
  return BRICK_TYPES.filter((type) => level >= type.minLevel);
}

export function getBrickType(key: string): BrickTypeDef {
  return BRICK_TYPES.find((type) => type.key === key) ?? BRICK_TYPES[0];
}
