import { useCallback, useState } from "react";
import { GameCanvas } from "./components/GameCanvas";
import { Sidebar } from "./components/Sidebar";
import type { GameState } from "./game/types";

export default function App() {
  const [snapshot, setSnapshot] = useState<GameState | null>(null);

  const handleSnapshot = useCallback((game: GameState) => {
    setSnapshot(game);
  }, []);

  return (
    <main className="app-shell">
      <section className="game-panel">
        <header className="topbar">
          <div>
            <div className="tag">BRICK BLOCK IDLE</div>
            <h1>Брик Блок Idle</h1>
            <p>Автозачистка блоков, уровни шаров, эволюции и типы блоков.</p>
          </div>
        </header>
        <GameCanvas onSnapshot={handleSnapshot} />
      </section>

      <Sidebar game={snapshot} />
    </main>
  );
}
