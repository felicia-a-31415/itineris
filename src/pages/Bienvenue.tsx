import { Compass } from 'lucide-react';
import { Button } from '../ui/button';

interface BienvenueProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onContinueWithoutAccount: () => void;
}

export function Bienvenue({ onGetStarted, onLogin, onContinueWithoutAccount }: BienvenueProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full p-6 bg-[#F5F1E8]">
      <div className="flex flex-col items-center max-w-md text-center space-y-8">
        <div className="w-32 h-32 rounded-full bg-[#4169E1] shadow-lg flex items-center justify-center">
          <Compass className="w-16 h-16 text-white" strokeWidth={2} />
        </div>

        <div className="space-y-2">
          <h1 className="text-5xl text-[#2C2C2C] tracking-tight">Itineris</h1>
          <p className="text-[#8B8680] text-lg">Votre chemin vers un apprentissage organisé</p>
        </div>

        <div className="w-full space-y-4">
          <Button
            onClick={onGetStarted}
            className="w-full bg-[#4169E1] hover:bg-[#3557C1] text-white px-8 py-6 rounded-2xl shadow-md transition-all"
          >
            Créer un compte
          </Button>

          <Button
            onClick={onLogin}
            variant="outline"
            className="w-full border-2 border-[#4169E1] text-[#4169E1] hover:bg-[#4169E1] hover:text-white px-8 py-6 rounded-2xl transition-all"
          >
            Se connecter
          </Button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E1D8]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#F5F1E8] text-[#8B8680]">ou</span>
            </div>
          </div>

          <Button
            onClick={onContinueWithoutAccount}
            variant="ghost"
            className="w-full text-[#8B8680] hover:text-[#2C2C2C] hover:bg-white/50 px-8 py-6 rounded-2xl transition-all"
          >
            Continuer sans compte
          </Button>
        </div>

        <div className="flex gap-2 mt-12">
          <div className="w-2 h-2 rounded-full bg-[#6B9AC4] opacity-40"></div>
          <div className="w-2 h-2 rounded-full bg-[#8B8680] opacity-40"></div>
          <div className="w-2 h-2 rounded-full bg-[#6B9AC4] opacity-40"></div>
        </div>
      </div>
    </div>
  );
}
