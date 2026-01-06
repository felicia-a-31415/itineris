import { Compass } from 'lucide-react';
import { Button } from '../ui/button';

interface BienvenueProps {
  onGetStarted: () => void;
}

export function Bienvenue({ onGetStarted }: BienvenueProps) {
  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#ECECF3] p-6 md:p-10 flex items-center">
      <div className="max-w-3xl mx-auto w-full">
        <div className="bg-[#161924] border border-[#1F2230] rounded-3xl p-8 md:p-12 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.06)] flex flex-col items-center text-center space-y-8">
          {/* Logo - Compass */}
          <div className="w-32 h-32 rounded-full bg-[#4169E1] shadow-lg flex items-center justify-center">
            <Compass className="w-16 h-16 text-white" strokeWidth={2} />
          </div>

          {/* App Name */}
          <div className="space-y-2">
            <h1 className="text-5xl text-[#ECECF3] tracking-tight">Itineris</h1>
            <p className="text-[#A9ACBA] text-lg">Votre chemin vers la réussite</p>
          </div>

          {/* Get Started Button */}
          <Button
            onClick={onGetStarted}
            className="bg-[#4169E1] hover:bg-[#3557C1] text-white px-8 py-6 rounded-2xl shadow-md transition-all"
          >
            Commencer le voyage
          </Button>

          {/* Decorative Elements */}
          <div className="flex gap-2 mt-12">
            <div className="w-2 h-2 rounded-full bg-[#6B9AC4] opacity-40"></div>
            <div className="w-2 h-2 rounded-full bg-[#8B8680] opacity-40"></div>
            <div className="w-2 h-2 rounded-full bg-[#6B9AC4] opacity-40"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
