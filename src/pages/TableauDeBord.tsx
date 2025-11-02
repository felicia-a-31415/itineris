import { useEffect, useState } from "react";
import Tile from "../components/Tile";

type User = { name:string };

export default function TableauDeBord(){
  const [user,setUser] = useState<User|null>(null);
  useEffect(()=>{
    const raw = localStorage.getItem("itinerisUser");
    if(raw) setUser(JSON.parse(raw));
  },[]);

  return (
    <main className="container-page">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Bonjour{user?.name ? `, ${user.name}` : ""} 👋
          </h1>
          <p className="text-muted">Prêt à continuer ton voyage d'apprentissage ?</p>
        </div>
        <a href="/itineris/parametres" className="btn-ghost" aria-label="Paramètres">⚙︎</a>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile to="/todo" title="Tâches" subtitle="Gérez vos tâches" icon={<span>☑️</span>} />
        <Tile to="/minuteur" title="Minuteur" subtitle="Sessions Pomodoro" icon={<span>🕒</span>} />
        <Tile to="/stats" title="Statistiques" subtitle="Suivez vos progrès" icon={<span>📊</span>} />
        <Tile to="/conseils" title="Conseils" subtitle="Astuces d’étude" icon={<span>📝</span>} />
        <Tile to="/notes" title="Notes rapides" subtitle="Idées & rappels" icon={<span>🗒️</span>} />
        <Tile to="/assistant" title="Assistant IA" subtitle="Bientôt dispo" icon={<span>💬</span>} />
      </section>
    </main>
  );
}
