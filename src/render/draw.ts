import { HEIGHT, WIDTH } from "../game/config";
import { getBallForm } from "../game/forms";
import { getBrickType } from "../game/brickTypes";
import { levelPatternName } from "../game/levelPatterns";
import { clamp } from "../game/math";
import type { GameState } from "../game/types";

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function drawGame(ctx: CanvasRenderingContext2D, game: GameState): void {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bg.addColorStop(0, "#070b18");
  bg.addColorStop(0.55, "#0b1024");
  bg.addColorStop(1, "#111827");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "rgba(148, 163, 184, 0.08)";
  for (let x = 22; x < WIDTH; x += 42) {
    for (let y = 76; y < HEIGHT; y += 42) {
      ctx.beginPath();
      ctx.arc(x, y, 1.45, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  roundedRect(ctx, 22, 18, WIDTH - 44, 42, 16);
  ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
  ctx.fill();
  ctx.strokeStyle = "rgba(76, 201, 240, 0.28)";
  ctx.stroke();

  ctx.fillStyle = "#f8fafc";
  ctx.font = "900 18px Inter, system-ui, sans-serif";
  ctx.fillText(`Этап ${game.level}`, 42, 45);
  ctx.font = "800 13px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(`Блоков: ${game.bricks.length}`, 142, 44);
  ctx.fillText(`Осколки: ${Math.floor(game.fragments)}`, 252, 44);
  ctx.fillText(`Узор: ${levelPatternName(game.level)}`, 390, 44);

  for (const brick of game.bricks) {
    const hpRatio = clamp(brick.hp / brick.maxHp, 0, 1);
    const color = getBrickType(brick.typeKey).color;
    const gradient = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.h);
    gradient.addColorStop(0, "rgba(255,255,255,0.28)");
    gradient.addColorStop(0.18, color);
    gradient.addColorStop(1, color);

    ctx.shadowColor = color;
    ctx.shadowBlur = 9;
    roundedRect(ctx, brick.x, brick.y, brick.w, brick.h, 8);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.shadowBlur = 0;

    roundedRect(ctx, brick.x + 5, brick.y + brick.h - 8, brick.w - 10, 4, 4);
    ctx.fillStyle = "rgba(2, 6, 23, 0.35)";
    ctx.fill();
    roundedRect(ctx, brick.x + 5, brick.y + brick.h - 8, (brick.w - 10) * hpRatio, 4, 4);
    ctx.fillStyle = hpRatio > 0.35 ? "rgba(255,255,255,0.86)" : "rgba(255,77,109,0.95)";
    ctx.fill();
  }

  for (const ball of game.balls) {
    const color = getBallForm(ball.formKey).color;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r + 10, 0, Math.PI * 2);
    ctx.fillStyle = `${color}33`;
    ctx.fill();

    const gradient = ctx.createRadialGradient(ball.x - 3, ball.y - 4, 1, ball.x, ball.y, ball.r + 1);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.28, color);
    gradient.addColorStop(1, color);
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.92)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.lineWidth = 1;

    ctx.fillStyle = "rgba(2,6,23,0.92)";
    ctx.font = "900 10px Inter, system-ui, sans-serif";
    ctx.fillText(`${ball.level}`, ball.x - 4, ball.y + 4);
  }
}
