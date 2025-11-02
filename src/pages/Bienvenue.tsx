import { BookOpen, Compass } from 'lucide-react';
import { Button } from '../ui/button';

interface HomeScreenProps {
  onGetStarted: () => void;
}

export function HomeScreen({ onGetStarted }: HomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#F5F1E8]">
      <div className="flex flex-col items-center max-w-md text-center space-y-8">
        {/* Logo - Compass with Book */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-white shadow-lg flex items-center justify-center">
            <Compass className="w-16 h-16 text-[#6B9AC4]" strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-[#4169E1] shadow-md flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
        </div>

        {/* App Name */}
        <div className="space-y-2">
          <h1 className="text-5xl text-[#2C2C2C] tracking-tight">Itineris</h1>
          <p className="text-[#8B8680] text-lg">Votre chemin vers un apprentissage organisé</p>
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
  );
}
