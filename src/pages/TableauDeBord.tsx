import { Link } from 'react-router-dom';
import Tile from '../components/Tile';

export default function TableauDeBord() {
  return (
    <main>
      <header className="db-header">
        <div>
          <h1>Bonsoir, Felicia 👋</h1>
          <p className="muted">Prêt à continuer ton voyage d’apprentissage ?</p>
        </div>
        <Link to="/parametres" aria-label="Paramètres" className="settings-btn">⚙︎</Link>
      </header>

      <section className="tiles-grid">
        <Tile
          to="/todo"
          icon={<span className="emoji">☑️</span>}
          title="Tâches"
          subtitle="Gérez vos tâches"
          meta="5 éléments"
        />
        <Tile
          to="/minuteur"
          icon={<span className="emoji">🕒</span>}
          title="Minuteur"
          subtitle="Sessions Pomodoro"
        />
        <Tile
          to="/stats"
          icon={<span className="emoji">📊</span>}
          title="Statistiques"
          subtitle="Suivez vos progrès"
        />
        <Tile
          to="/conseils"
          icon={<span className="emoji">📝</span>}
          title="Conseils"
          subtitle="Astuces d’étude"
        />
        <Tile
          to="/notes"
          icon={<span className="emoji">🗒️</span>}
          title="Notes rapides"
          subtitle="Idées et rappels"
        />
        <Tile
          to="/assistant"
          icon={<span className="emoji">💬</span>}
          title="Assistant IA"
          subtitle="Bientôt disponible"
        />
      </section>
    </main>
  );
}
