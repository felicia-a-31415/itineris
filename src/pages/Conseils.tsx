import { useMemo, useState } from "react";

type Tip = { id:number; text:string; tags:string[]; section:"Méthodes"|"Prise de notes"|"Organisation" };
const TIPS:Tip[] = [
  { id:1, text:"Évite la simple relecture; privilégie le rappel actif.", tags:["mémoire","science"], section:"Méthodes" },
  { id:2, text:"Planifie des blocs courts + pauses (Pomodoro).", tags:["temps","pomodoro"], section:"Organisation" },
  { id:3, text:"Cornell notes pour structurer cours et révisions.", tags:["notes"], section:"Prise de notes" },
  { id:4, text:"Teste plusieurs stratégies; ajuste si ça n’aide pas.", tags:["méta-apprentissage"], section:"Méthodes" },
];

export default function Conseils(){
  const [query,setQuery] = useState("");
  const [tag,setTag] = useState<string|"">("");

  const tags = useMemo(()=>Array.from(new Set(TIPS.flatMap(t=>t.tags))).sort(),[]);
  const visible = TIPS.filter(t =>
    (!tag || t.tags.includes(tag)) &&
    (query==="" || t.text.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <main className="container-page">
      <h1 className="text-2xl font-semibold mb-4">Conseils d’étude</h1>

      <div className="tile mb-4 flex flex-wrap gap-3 items-center">
        <input
          className="border border-border rounded-itn px-3 py-2 bg-white/70"
          placeholder="Rechercher…"
          value={query} onChange={e=>setQuery(e.target.value)}
        />
        <select className="border border-border rounded-itn px-3 py-2 bg-white/70"
                value={tag} onChange={e=>setTag(e.target.value)}>
          <option value="">Tous les tags</option>
          {tags.map(t=> <option key={t} value={t}>{t}</option>)}
        </select>
        <button className="btn-ghost" onClick={()=>{ setQuery(""); setTag(""); }}>Réinitialiser</button>
      </div>

      <div className="grid gap-3">
        {visible.map(t=>(
          <div key={t.id} className="tile">
            <div className="text-sm text-muted mb-1">{t.section}</div>
            <div className="font-medium">{t.text}</div>
            <div className="mt-2 flex gap-2 flex-wrap">
              {t.tags.map(g=> <span key={g} className="text-xs px-2 py-1 border border-border rounded-full bg-card">{g}</span>)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <button className="btn-ghost">Voir plus</button>
      </div>
    </main>
  );
}
