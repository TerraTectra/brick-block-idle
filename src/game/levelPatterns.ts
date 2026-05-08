import { HEIGHT, LEVEL_PATTERNS, WIDTH } from "./config";
import { clamp, seededRandom } from "./math";

export function levelPatternName(level: number): string {
  return LEVEL_PATTERNS[(level - 1) % LEVEL_PATTERNS.length];
}

export function gridMetricsForLevel(level: number) {
  const cols = clamp(18 + Math.floor(level / 10), 18, 24);
  const gap = 5;
  const marginX = 18;
  const top = 70;
  const bottom = HEIGHT - 24;
  const brickH = 22;
  const rows = Math.floor((bottom - top + gap) / (brickH + gap));
  const brickW = (WIDTH - marginX * 2 - gap * (cols - 1)) / cols;
  return { cols, rows, gap, marginX, top, brickH, brickW };
}

export function gridCellCountForLevel(level: number): number {
  const { cols, rows } = gridMetricsForLevel(level);
  return cols * rows;
}

export function shouldPlaceBrick(level: number, row: number, col: number, rows: number, cols: number): boolean {
  if (level === 1) return true;
  if (row === 0 || row === rows - 1) return true;

  const pattern = (level - 1) % LEVEL_PATTERNS.length;
  const rand = seededRandom(level * 9973 + row * 131 + col * 17);
  const centerCol = (cols - 1) / 2;
  const centerRow = (rows - 1) / 2;
  const dx = col - centerCol;
  const dy = row - centerRow;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  if (pattern === 0) return !((col + level) % 5 === 0 && row % 4 !== 0);
  if (pattern === 1) return (row + col + level) % 6 !== 0 && (row * 2 + col + level) % 11 !== 0;
  if (pattern === 2) return Math.abs((distance + level * 0.35) % 4) > 0.85;
  if (pattern === 3) return Math.hypot(col - cols * 0.32, row - rows * 0.48) > 2.4 && Math.hypot(col - cols * 0.68, row - rows * 0.48) > 2.4;
  if (pattern === 4) return row % 4 !== 2 || (col + level) % 4 !== 0;
  if (pattern === 5) return Math.abs(Math.sin(angle * 2.4 + distance * 0.68 + level * 0.25)) > 0.26;
  if (pattern === 6) return (row + col * 2 + level) % 7 !== 0;
  return rand() > 0.14;
}
