export type UpgradeKey = "coreDamage" | "speedDrive" | "xpMatrix";
export type Upgrades = Record<UpgradeKey, number>;

export type BrickTypeKey = "normal" | "armored" | "volatile" | "regenerating" | "shielded" | "heavy";
export type BallFormKey = "basic" | "plasma" | "storm" | "drill" | "crit" | "comet" | "collector";

export interface BrickTypeDef {
  key: BrickTypeKey;
  name: string;
  short: string;
  color: string;
  minLevel: number;
  weight: number;
  reward: number;
  description: string;
}

export interface BallFormDef {
  key: BallFormKey;
  name: string;
  short: string;
  color: string;
  description: string;
}

export interface Brick {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  xp: number;
  typeKey: BrickTypeKey;
}

export interface Ball {
  id: number;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  level: number;
  xp: number;
  xpNeed: number;
  baseDamage: number;
  damage: number;
  kills: number;
  hits: number;
  totalXp: number;
  formKey: BallFormKey;
  evolutionRank: number;
  evolvedMilestones: number[];
  evolutionHistory: string[];
}

export interface GameState {
  level: number;
  fragments: number;
  totalBlocks: number;
  upgrades: Upgrades;
  bricks: Brick[];
  balls: Ball[];
  paused: boolean;
  transitionTimer: number;
  lastSave: number;
  log: string[];
}

export type LogFn = (message: string) => void;
