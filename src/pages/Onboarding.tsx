import { useNavigate } from "react-router-dom";
import { useState } from "react";

const MATIERES = [
  "Math", "Physique", "Chimie", "Biologie",
  "Français", "Anglais", "Histoire", "Géo",
  "Informatique", "Philo", "Éco"
];

export default function Onboarding(){
  const nav = useNavigate();
  const [name,setName] = useState("");
  const [year,setYear] = useState("");
  const [fav,setFav] = useState<string[]>([]);
  const [strong,setStrong] = useState<string[]>([]);
  const [weak,setWeak] = useState<string[]>([]);
  const [goals,setGoals] = useState("");

  const toggle = (arr:string[], set:(v:string[])=>void, item:string) =>
    set(arr.includes(item) ? arr.filter(x=>x!==item) : [...arr,item]);

  const save = (e:React.FormEvent)=>{
    e.preventDefault();
    const user = { name, year, favoriteSubjects:fav, strongSubjects:strong, weakSubjects:weak, lifeGoals:goals };
    localStorage.setItem("itinerisUser", JSON.stringify(user));
    nav("/dashboard");
  };

  const CheckList = ({label, arr, set}:{label:string, arr:string[], set:(v:string[])=>void})=>(
    <div>
      <div className="font-medium mb-2">{label}</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {MATIERES.map(m=>(
          <label key={m} className="flex items-center gap-2">
            <input type="checkbox" checked={arr.includes(m)} onChange={()=>toggle(arr,set,m)} />
            <span>{m}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <main className="container-page">
      <form onSubmit={save} className="tile space-y-5">
        <h2 className="text-xl font-semibold">Personnalisation</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block mb-1">Ton nom</span>
            <input className="w-full border border-border rounded-itn px-3 py-2 bg-white/70"
                   value={name} onChange={e=>setName(e.target.value)} required />
          </label>
          <label className="block">
            <span className="block mb-1">Année (ex. Sec 5)</span>
            <input className="w-full border border-border rounded-itn px-3 py-2 bg-white/70"
                   value={year} onChange={e=>setYear(e.target.value)} required />
          </label>
        </div>

        <CheckList label="Matières préférées" arr={fav} set={setFav}/>
        <CheckList label="Matières fortes" arr={strong} set={setStrong}/>
        <CheckList label="Matières à travailler" arr={weak} set={setWeak}/>

        <label className="block">
          <span className="block mb-1">Tes objectifs de vie</span>
          <textarea className="w-full border border-border rounded-itn px-3 py-2 bg-white/70"
                    rows={4} value={goals} onChange={e=>setGoals(e.target.value)} />
        </label>

        <div className="flex gap-3">
          <button type="submit" className="btn">Enregistrer</button>
          <button type="button" className="btn-ghost" onClick={()=>nav("/")}>Annuler</button>
        </div>
      </form>
    </main>
  );
}
