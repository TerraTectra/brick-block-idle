import { EVOLUTION_MILESTONES } from "./config";
import type { Upgrades, UpgradeKey } from "./types";

export const UPGRADE_KEYS: UpgradeKey[] = ["coreDamage", "speedDrive", "xpMatrix"];

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function xpToNext(level: number): number {
  if (level <= 1) return 10;
  const earlyRamp = level * 7;
  const midRamp = Math.pow(level, 1.72) * 8;
  const lateRamp = Math.pow(Math.max(0, level - 10), 2.12) * 14;
  const wall = EVOLUTION_MILESTONES.includes(level as never) ? level * 28 : 0;
  return Math.floor(10 + earlyRamp + midRamp + lateRamp + wall);
}

export function upgradePower(level: number): number {
  if (level <= 0) return 1;
  const bonus = (Math.pow(level, 1.55) - level) * 0.45;
  return Number((1 + level + bonus).toFixed(2));
}

export function damageFor(level: number, baseDamage: number, upgrades: Upgrades, evolutionRank: number): number {
  const globalBonus = upgradePower(upgrades.coreDamage ?? 0);
  const evolutionBonus = 1 + evolutionRank * 0.24 + Math.pow(evolutionRank, 1.28) * 0.06;
  const levelPower = baseDamage + (level - 1) * 0.55 + Math.pow(level - 1, 1.2) * 0.14;
  return Number((levelPower * globalBonus * evolutionBonus).toFixed(2));
}
