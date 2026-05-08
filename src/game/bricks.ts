import type { Brick, BrickTypeDef } from "./types";
import { activeBrickTypes } from "./brickTypes";
import { seededRandom } from "./math";
import { gridMetricsForLevel, shouldPlaceBrick } from "./levelPatterns";

function chooseBrickType(level: number, row: number, col: number, rand: () => number): BrickTypeDef {
  const available = activeBrickTypes(level);
  if (available.length === 1) return available[0];

  const salt = (row * 11 + col * 7 + level) % 9;
  const weighted = available.map((type) => ({
    type,
    weight: type.key === "normal" ? Math.max(45, type.weight - level * 0.55) : type.weight + salt * 0.18,
  }));

  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let roll = rand() * total;

  for (const item of weighted) {
    roll -= item.weight;
    if (roll <= 0) return item.type;
  }

  return available[0];
}

export function generateBricks(level: number): Brick[] {
  const rand = seededRandom(level * 9973 + 41);
  const metrics = gridMetricsForLevel(level);
  const pattern = (level - 1) % 8;
  const bricks: Brick[] = [];

  for (let row = 0; row < metrics.rows; row += 1) {
    for (let col = 0; col < metrics.cols; col += 1) {
      if (!shouldPlaceBrick(level, row, col, metrics.rows, metrics.cols)) continue;

      const type = chooseBrickType(level, row, col, rand);
      const offsetX = pattern === 6 && row % 2 === 1 ? Math.min(8, metrics.brickW * 0.12) : 0;
      const reward = Math.ceil((2 + level * 1.15) * type.reward);

      bricks.push({
        id: `${level}-${row}-${col}`,
        x: metrics.marginX + col * (metrics.brickW + metrics.gap) + offsetX,
        y: metrics.top + row * (metrics.brickH + metrics.gap),
        w: metrics.brickW - offsetX / metrics.cols,
        h: metrics.brickH,
        hp: level,
        maxHp: level,
        xp: reward,
        typeKey: type.key,
      });
    }
  }

  return bricks;
}
