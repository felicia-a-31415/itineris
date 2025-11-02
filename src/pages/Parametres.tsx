import { useEffect, useState } from "react";

export default function Parametres(){
  const [name,setName] = useState("");
  const [theme,setTheme] = useState<"light"|"dark">("light");

  useEffect(()=>{
    const raw = localStorage.getItem("itinerisUser");
    if(raw){
      const u = JSON.parse(raw);
      setName(u.name ?? "");
    }
    document.documentElement.classList.toggle("dark", theme==="dark");
  },[theme]);

  const save = ()=>{
    const raw = localStorage.getItem("itinerisUser");
    const u = raw ? JSON.parse(raw) : {};
    u.name = name;
    localStorage.setItem("itinerisUser", JSON.stringify(u));
    alert("Enregistré.");
  };

  return (
    <main className="container-page">
      <h1 className="text-2xl font-semibold mb-4">Paramètres</h1>

      <div className="tile space-y-4">
        <label className="block">
          <span className="block mb-1">Nom affiché</span>
          <input className="w-full border border-border rounded-itn px-3 py-2 bg-white/70"
                 value={name} onChange={e=>setName(e.target.value)} />
        </label>

        <div className="flex items-center gap-3">
          <span>Thème</span>
          <button className="btn-ghost" onClick={()=>setTheme("light")}>Clair</button>
          <button className="btn-ghost" onClick={()=>setTheme("dark")}>Sombre</button>
        </div>

        <button className="btn" onClick={save}>Sauvegarder</button>
      </div>
    </main>
  );
}
