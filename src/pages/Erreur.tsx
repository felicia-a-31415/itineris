import { Link } from 'react-router-dom';
import { Button } from '../ui/button';

export default function Erreur() {
  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#ECECF3] p-6 md:p-10 flex items-center">
      <div className="max-w-3xl mx-auto w-full">
        <div className="bg-[#161924] border border-[#1F2230] rounded-3xl p-8 md:p-12 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.06)] text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E16941]/15 border border-[#E16941]/40 text-[#E16941] text-2xl font-bold">
            404
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">Page non trouvée</h1>
            <p className="text-[#A9ACBA] text-sm md:text-base">
              Oups ! Cette page n&apos;existe pas ou a été déplacée.
            </p>
          </div>
          <div className="flex justify-center">
            <Button
              asChild
              className="rounded-2xl bg-[#4169E1] hover:bg-[#3557C1] text-white px-6 py-3"
            >
              <Link to="/tableaudebord">Retour au tableau de bord</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
