import { useEffect, useRef } from "react";
import { HEIGHT, WIDTH } from "../game/config";
import { createGameState, pushLog, startNextLevel } from "../game/state";
import { loadGame, saveGame } from "../game/save";
import { regenerateBricks, stepBalls } from "../game/physics";
import { drawGame } from "../render/draw";
import type { GameState } from "../game/types";

interface GameCanvasProps {
  onSnapshot: (game: GameState) => void;
}

export function GameCanvas({ onSnapshot }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<GameState | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef(performance.now());
  const uiTickRef = useRef(0);

  if (!gameRef.current) {
    gameRef.current = loadGame() ?? createGameState();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const game = gameRef.current;
    if (!canvas || !game) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function tick(now: number) {
      const currentGame = gameRef.current;
      if (!currentGame) return;

      const dt = Math.max(0.5, Math.min(1.8, (now - lastFrameRef.current) / 16.67));
      lastFrameRef.current = now;

      if (!currentGame.paused) {
        if (currentGame.transitionTimer > 0) {
          currentGame.transitionTimer -= dt;
          if (currentGame.transitionTimer <= 0) startNextLevel(currentGame);
        } else {
          regenerateBricks(currentGame, dt);
          stepBalls(currentGame, dt, (message) => pushLog(currentGame, message));

          if (currentGame.bricks.length === 0) {
            currentGame.transitionTimer = 95;
            pushLog(currentGame, `Этап ${currentGame.level} очищен.`);
          }
        }
      }

      drawGame(ctx, currentGame);

      uiTickRef.current += 1;
      if (uiTickRef.current % 12 === 0) onSnapshot({ ...currentGame, balls: [...currentGame.balls], bricks: [...currentGame.bricks], log: [...currentGame.log] });
      if (now - currentGame.lastSave > 3000) {
        currentGame.lastSave = now;
        saveGame(currentGame);
      }

      frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    onSnapshot({ ...game, balls: [...game.balls], bricks: [...game.bricks], log: [...game.log] });

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [onSnapshot]);

  return <canvas className="game-canvas" ref={canvasRef} width={WIDTH} height={HEIGHT} />;
}
