import { DEFAULT_UPGRADES, HEIGHT, WIDTH } from "./config";
import { createBall } from "./balls";
import { generateBricks } from "./bricks";
import type { GameState } from "./types";

export function createGameState(): GameState {
  return {
    level: 1,
    fragments: 0,
    totalBlocks: 0,
    upgrades: { ...DEFAULT_UPGRADES },
    bricks: generateBricks(1),
    balls: [createBall(1, 0), createBall(2, 1)],
    paused: false,
    transitionTimer: 0,
    lastSave: 0,
    log: ["Автозачистка запущена."],
  };
}

export function pushLog(game: GameState, message: string): void {
  game.log = [message, ...game.log].slice(0, 6);
}

export function startNextLevel(game: GameState): void {
  game.level += 1;
  game.bricks = generateBricks(game.level);
  game.transitionTimer = 0;

  for (let index = 0; index < game.balls.length; index += 1) {
    const ball = game.balls[index];
    ball.x = WIDTH / 2 + index * 24;
    ball.y = HEIGHT - 84 - index * 10;
    ball.vx = (2.15 + index * 0.17 + game.level * 0.01) * (index % 2 === 0 ? 1 : -1);
    ball.vy = -(2.55 + index * 0.12 + game.level * 0.008);
  }

  pushLog(game, `Открыт этап ${game.level}. HP блоков: ${game.level}.`);
}
