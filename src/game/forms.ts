import type { BallFormDef } from "./types";

export const BASIC_FORM: BallFormDef = {
  key: "basic",
  name: "Стартовый шар",
  short: "базовый",
  color: "#4cc9f0",
  description: "Базовая форма шара.",
};

export const BALL_FORMS: BallFormDef[] = [
  { key: "plasma", name: "Плазменный шар", short: "область", color: "#ff4d6d", description: "Форма с уроном по области." },
  { key: "storm", name: "Грозовой шар", short: "цепь", color: "#f9f871", description: "Форма с цепным уроном." },
  { key: "drill", name: "Буровой шар", short: "пробой", color: "#ff9f1c", description: "Форма против сопротивлений." },
  { key: "crit", name: "Критический шар", short: "крит", color: "#b517ff", description: "Форма с критами." },
  { key: "comet", name: "Кометный шар", short: "скорость", color: "#2ec4b6", description: "Форма от скорости." },
  { key: "collector", name: "Сборщик", short: "награды", color: "#60a5fa", description: "Форма для наград." }
];

export function getBallForm(key: string): BallFormDef {
  return BALL_FORMS.find((form) => form.key === key) ?? BASIC_FORM;
}
