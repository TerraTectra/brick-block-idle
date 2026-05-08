import { STORAGE_KEY } from "./config";
import { createBall } from "./balls";
import { generateBricks } from "./bricks";
import type { Ball, GameState } from "./types";

interface SaveData {
  level: number;
  fragments: number;
  totalBlocks: number;
  upgrades: GameState["upgrades"];
  balls: Partial<Ball>[];
}

export function saveGame(game: GameState): void {
  const data: SaveData = {
    level: game.level,
    fragments: game.fragments,
    totalBlocks: game.totalBlocks,
    upgrades: game.upgrades,
    balls: game.balls.map((ball) => ({
      id: ball.id,
      name: ball.name,
      level: ball.level,
      xp: ball.xp,
      baseDamage: ball.baseDamage,
      kills: ball.kills,
      hits: ball.hits,
      totalXp: ball.totalXp,
      formKey: ball.formKey,
      evolutionRank: ball.evolutionRank,
      evolvedMilestones: ball.evolvedMilestones,
      evolutionHistory: ball.evolutionHistory,
    })),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;

    return {
      level: data.level,
      fragments: data.fragments,
      totalBlocks: data.totalBlocks,
      upgrades: data.upgrades,
      bricks: generateBricks(data.level),
      balls: data.balls.map((ball, index) => createBall(Number(ball.id), index, ball, data.upgrades)),
      paused: false,
      transitionTimer: 0,
      lastSave: 0,
      log: ["Сохранение загружено."],
    };
  } catch {
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(STORAGE_KEY);
}
