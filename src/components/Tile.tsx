import { Link } from "react-router-dom";

export default function Tile(
  { to, title, subtitle, icon }:{
    to:string; title:string; subtitle?:string; icon?:React.ReactNode
  }
){
  return (
    <Link to={to} className="tile flex gap-3 no-underline">
      <div className="w-12 h-12 rounded-xl bg-primary/10 grid place-items-center">{icon}</div>
      <div>
        <div className="font-semibold">{title}</div>
        {subtitle && <div className="text-muted text-sm">{subtitle}</div>}
      </div>
    </Link>
  );
}
