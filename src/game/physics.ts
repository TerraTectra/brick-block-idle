import { HEIGHT, WIDTH } from "./config";
import { speedMultiplier, xpMultiplier } from "./balance";
import { ballLevelSpeed, evolutionPower, processBallGrowth } from "./balls";
import { clamp } from "./math";
import type { Ball, Brick, GameState, LogFn } from "./types";

export function circleRectCollision(ball: Ball, brick: Brick): boolean {
  const nearestX = clamp(ball.x, brick.x, brick.x + brick.w);
  const nearestY = clamp(ball.y, brick.y, brick.y + brick.h);
  const dx = ball.x - nearestX;
  const dy = ball.y - nearestY;
  return dx * dx + dy * dy <= ball.r * ball.r;
}

function brickDamageMultiplier(brick: Brick, source: string, ball: Ball): number {
  let multiplier = 1;
  const rank = evolutionPower(ball);

  if (brick.typeKey === "armored") multiplier = source === "direct" ? 0.55 : 0.75;
  if (brick.typeKey === "regenerating") multiplier = source === "direct" ? 0.85 : 0.7;
  if (brick.typeKey === "shielded") multiplier = source === "direct" ? 0.8 : 0.35;
  if (brick.typeKey === "heavy") multiplier = source === "direct" ? 0.45 : 0.58;

  if (ball.formKey === "drill" && source === "direct" && multiplier < 1) {
    const pierce = clamp(0.35 + rank * 0.08, 0.35, 0.82);
    multiplier += (1 - multiplier) * pierce;
  }

  return multiplier;
}

function rewardBallForBrick(game: GameState, ball: Ball, brick: Brick, pushLog: LogFn): void {
  const collectorBonus = ball.formKey === "collector" ? 1 + evolutionPower(ball) * 0.16 : 1;
  const gainedXp = Math.ceil(brick.xp * xpMultiplier(game.upgrades) * collectorBonus);
  const gainedFragments = Math.ceil(brick.xp * collectorBonus);

  game.fragments += gainedFragments;
  game.totalBlocks += 1;
  ball.kills += 1;
  ball.xp += gainedXp;
  ball.totalXp += gainedXp;
  processBallGrowth(ball, game, pushLog);
}

export function applyBrickDamage(game: GameState, brickIndex: number, amount: number, ball: Ball, pushLog: LogFn, source = "direct"): boolean {
  const brick = game.bricks[brickIndex];
  if (!brick) return false;

  brick.hp -= amount * brickDamageMultiplier(brick, source, ball);
  if (brick.hp > 0) return false;

  const destroyed = game.bricks.splice(brickIndex, 1)[0];
  rewardBallForBrick(game, ball, destroyed, pushLog);
  return true;
}

function computeHitDamage(ball: Ball, brick: Brick): number {
  let amount = ball.damage;
  const rank = evolutionPower(ball);

  if (ball.formKey === "crit" && Math.random() < clamp(0.1 + rank * 0.035, 0.1, 0.48)) {
    amount *= 1.8 + rank * 0.18;
  }

  if (ball.formKey === "drill" && brick.hp / brick.maxHp > 0.5) {
    amount *= 1.25 + rank * 0.14;
  }

  if (ball.formKey === "comet") {
    amount *= 1 + Math.min(0.95, (ballLevelSpeed(ball) - 1) * 0.28);
  }

  return amount;
}

export function regenerateBricks(game: GameState, dt: number): void {
  const regenAmount = Math.max(0.01, game.level * 0.0018) * dt;
  for (const brick of game.bricks) {
    if (brick.typeKey === "regenerating" && brick.hp < brick.maxHp) {
      brick.hp = Math.min(brick.maxHp, brick.hp + regenAmount);
    }
  }
}

export function stepBalls(game: GameState, dt: number, pushLog: LogFn): void {
  for (const ball of game.balls) {
    const speed = speedMultiplier(game.upgrades) * ballLevelSpeed(ball);
    ball.x += ball.vx * dt * speed;
    ball.y += ball.vy * dt * speed;

    if (ball.x - ball.r <= 0 || ball.x + ball.r >= WIDTH) {
      ball.vx *= -1;
      ball.x = clamp(ball.x, ball.r, WIDTH - ball.r);
    }

    if (ball.y - ball.r <= 0 || ball.y + ball.r >= HEIGHT) {
      ball.vy *= -1;
      ball.y = clamp(ball.y, ball.r, HEIGHT - ball.r);
    }

    for (let i = game.bricks.length - 1; i >= 0; i -= 1) {
      const brick = game.bricks[i];
      if (!circleRectCollision(ball, brick)) continue;

      const prevX = ball.x - ball.vx * dt * speed;
      const wasSide = prevX < brick.x || prevX > brick.x + brick.w;
      if (wasSide) ball.vx *= -1;
      else ball.vy *= -1;

      ball.hits += 1;
      applyBrickDamage(game, i, computeHitDamage(ball, brick), ball, pushLog);
      break;
    }
  }
}
