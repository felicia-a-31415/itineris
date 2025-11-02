import { Link } from 'react-router-dom';

type TileProps = {
  to: string;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  meta?: string; // e.g., "5 éléments"
};

export default function Tile({ to, icon, title, subtitle, meta }: TileProps) {
  return (
    <Link to={to} className="tile">
      <div className="tile-icon">{icon}</div>
      <div className="tile-text">
        <div className="tile-title">{title}</div>
        {subtitle && <div className="tile-sub">{subtitle}</div>}
        {meta && <div className="tile-meta">{meta}</div>}
      </div>
    </Link>
  );
}
