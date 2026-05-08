import { DEFAULT_UPGRADES, EVOLUTION_MILESTONES, HEIGHT, WIDTH } from "./config";
import { BALL_FORMS } from "./forms";
import { damageFor, xpToNext } from "./balance";
import { clamp } from "./math";
import type { Ball, GameState, LogFn, Upgrades } from "./types";

export function evolutionPower(ball: Ball): number {
  return ball.evolutionRank ?? 0;
}

export function ballLevelSpeed(ball: Ball): number {
  const formBonus = ball.formKey === "comet" ? evolutionPower(ball) * 0.035 : 0;
  return clamp(1 + (ball.level - 1) * 0.012 + evolutionPower(ball) * 0.055 + formBonus, 1, 4.2);
}

export function nextEvolutionMilestone(ball: Ball): number | null {
  const evolved = new Set(ball.evolvedMilestones ?? []);
  return EVOLUTION_MILESTONES.find((level) => !evolved.has(level)) ?? null;
}

export function createBall(id: number, index = 0, saved?: Partial<Ball>, upgrades: Upgrades = DEFAULT_UPGRADES): Ball {
  const level = saved?.level ?? 1;
  const evolutionRank = saved?.evolutionRank ?? 0;
  const baseDamage = saved?.baseDamage ?? 1;

  return {
    id,
    name: saved?.name ?? `Шар-${id}`,
    x: saved?.x ?? WIDTH / 2 + index * 34,
    y: saved?.y ?? HEIGHT - 82 - index * 18,
    vx: saved?.vx ?? (2.15 + index * 0.26) * (index % 2 === 0 ? 1 : -1),
    vy: saved?.vy ?? -(2.55 + index * 0.17),
    r: saved?.r ?? 9 + Math.min(8, evolutionRank * 0.85),
    level,
    xp: saved?.xp ?? 0,
    xpNeed: xpToNext(level),
    baseDamage,
    damage: damageFor(level, baseDamage, upgrades, evolutionRank),
    kills: saved?.kills ?? 0,
    hits: saved?.hits ?? 0,
    totalXp: saved?.totalXp ?? 0,
    formKey: saved?.formKey ?? "basic",
    evolutionRank,
    evolvedMilestones: saved?.evolvedMilestones ?? [],
    evolutionHistory: saved?.evolutionHistory ?? [],
  };
}

export function recalcBallDamage(game: GameState): void {
  for (const ball of game.balls) {
    ball.damage = damageFor(ball.level, ball.baseDamage, game.upgrades, evolutionPower(ball));
  }
}

export function evolveBall(ball: Ball, milestone: number, game: GameState, pushLog: LogFn): void {
  const form = BALL_FORMS[Math.floor(Math.random() * BALL_FORMS.length)];
  ball.evolutionRank = evolutionPower(ball) + 1;
  ball.formKey = form.key;
  ball.evolvedMilestones = [...ball.evolvedMilestones, milestone];
  ball.evolutionHistory = [`${milestone} ур. — ${form.name}`, ...ball.evolutionHistory].slice(0, 8);
  ball.baseDamage = Number((ball.baseDamage * (1.28 + ball.evolutionRank * 0.08)).toFixed(2));
  ball.r = 9 + Math.min(8, ball.evolutionRank * 0.85);
  ball.damage = damageFor(ball.level, ball.baseDamage, game.upgrades, ball.evolutionRank);
  pushLog(`${ball.name} эволюционировал: ${form.name}.`);
}

export function processBallGrowth(ball: Ball, game: GameState, pushLog: LogFn): void {
  const oldLevel = ball.level;

  while (ball.xp >= ball.xpNeed) {
    ball.xp -= ball.xpNeed;
    ball.level += 1;
    ball.xpNeed = xpToNext(ball.level);
  }

  if (ball.level > oldLevel) {
    ball.damage = damageFor(ball.level, ball.baseDamage, game.upgrades, evolutionPower(ball));
    pushLog(`${ball.name}: ${ball.level} ур.`);
  }

  for (const milestone of EVOLUTION_MILESTONES) {
    if (ball.level >= milestone && !ball.evolvedMilestones.includes(milestone)) {
      evolveBall(ball, milestone, game, pushLog);
    }
  }
}
