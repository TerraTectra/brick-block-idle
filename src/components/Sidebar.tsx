import { activeBrickTypes } from "../game/brickTypes";
import { getBallForm } from "../game/forms";
import { ballLevelSpeed, nextEvolutionMilestone } from "../game/balls";
import type { GameState } from "../game/types";

interface SidebarProps {
  game: GameState | null;
}

export function Sidebar({ game }: SidebarProps) {
  if (!game) {
    return <aside className="sidebar">Загрузка...</aside>;
  }

  return (
    <aside className="sidebar">
      <section className="card">
        <h2>Сектор</h2>
        <div className="stats-grid">
          <Stat label="Этап" value={game.level} />
          <Stat label="HP блока" value={game.level} />
          <Stat label="Блоков" value={game.bricks.length} />
          <Stat label="Осколки" value={Math.floor(game.fragments)} />
        </div>
      </section>

      <section className="card">
        <h2>Типы блоков</h2>
        <div className="list">
          {activeBrickTypes(game.level).map((type) => (
            <div className="list-row" key={type.key}>
              <span className="dot" style={{ background: type.color }} />
              <div>
                <b>{type.name}</b>
                <small>{type.short}</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Шары</h2>
        <div className="list">
          {game.balls.map((ball) => {
            const form = getBallForm(ball.formKey);
            return (
              <div className="ball-card" key={ball.id}>
                <div className="ball-head">
                  <span className="dot" style={{ background: form.color }} />
                  <b>{ball.name}</b>
                  <em>{ball.level} ур.</em>
                </div>
                <small>{form.name} · {form.short}</small>
                <div className="mini-grid">
                  <span>Урон: {ball.damage}</span>
                  <span>Скорость: x{ballLevelSpeed(ball).toFixed(2)}</span>
                  <span>Опыт: {Math.floor(ball.xp)} / {ball.xpNeed}</span>
                  <span>Эволюция: {nextEvolutionMilestone(ball) ?? "макс"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <h2>Журнал</h2>
        <div className="list">
          {game.log.map((line, index) => <small key={`${line}-${index}`}>{line}</small>)}
        </div>
      </section>
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="stat">
      <small>{label}</small>
      <b>{value}</b>
    </div>
  );
}
