import { Link } from 'react-router-dom';
import { Button } from '../ui/button';

export default function Erreur() {
  return (
    <div className="app-shell min-h-screen flex items-center p-6 text-[#F5F2F7] md:p-10">
      <div className="max-w-3xl mx-auto w-full">
        <div className="app-panel rounded-[34px] p-8 text-center space-y-6 md:p-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#ef6b63]/15 border border-[#ef6b63]/40 text-[#ef6b63] text-2xl font-bold">
            404
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">Page non trouvée</h1>
            <p className="app-muted text-sm md:text-base">
              Oups ! Cette page n&apos;existe pas ou a été déplacée.
            </p>
          </div>
          <div className="flex justify-center">
            <Button
              asChild
              className="rounded-2xl px-6 py-3"
            >
              <Link to="/">Retour au tableau de bord</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
