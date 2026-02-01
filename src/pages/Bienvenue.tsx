import { Compass } from 'lucide-react';
import { Button } from '../ui/button';

interface BienvenueProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onContinueWithoutAccount: () => void;
}

export function Bienvenue({ onGetStarted, onLogin, onContinueWithoutAccount }: BienvenueProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full p-6 bg-[#0B0D10] text-[#ECECF3]">
      <div className="flex flex-col items-center max-w-md text-center space-y-8">
        <div className="w-32 h-32 rounded-full bg-[#4169E1] shadow-lg flex items-center justify-center">
          <Compass className="w-16 h-16 text-white" strokeWidth={2} />
        </div>

        <div className="space-y-2">
          <h1 className="text-5xl text-[#ECECF3] tracking-tight">Itineris</h1>
          <p className="text-[#A9ACBA] text-lg">Votre chemin vers un apprentissage organisé</p>
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
            className="w-full border-2 border-[#4169E1] text-[#ECECF3] hover:bg-[#4169E1] hover:text-white px-8 py-6 rounded-2xl transition-all"
          >
            Se connecter
          </Button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1F2230]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#0B0D10] text-[#A9ACBA]">ou</span>
            </div>
          </div>

          <Button
            onClick={onContinueWithoutAccount}
            variant="ghost"
            className="w-full text-[#A9ACBA] hover:text-[#ECECF3] hover:bg-[#161924] px-8 py-6 rounded-2xl transition-all"
          >
            Continuer sans compte
          </Button>
        </div>
      </div>
    </div>
  );
}
