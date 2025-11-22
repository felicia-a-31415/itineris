import { CheckSquare, Clock, BarChart3, FileText, MessageSquare, StickyNote, Settings } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface TableauDeBordScreenProps {
  onNavigate: (screen: string) => void;
  userName?: string;
}

export function TableauDeBord({ onNavigate, userName = 'étudiant' }: TableauDeBordScreenProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const cards = [
    {
      id: 'todo',
      title: 'Tâches',
      icon: CheckSquare,
      color: '#6B9AC4',
      description: 'Gérez vos tâches',
      tasks: 5,
    },
    {
      id: 'minuteur',
      title: 'Minuteur',
      icon: Clock,
      color: '#4169E1',
      description: 'Sessions Pomodoro',
      tasks: null,
    },
    {
      id: 'statistiques',
      title: 'Statistiques',
      icon: BarChart3,
      color: '#8B8680',
      description: 'Suivez vos progrès',
      tasks: null,
    },
    {
      id: 'conseils',
      title: 'Conseils',
      icon: FileText,
      color: '#6B9AC4',
      description: 'Astuces d\'étude',
      tasks: null,
    },
    {
      id: 'notesrapides',
      title: 'Notes rapides',
      icon: StickyNote,
      color: '#8B8680',
      description: 'Idées et rappels',
      tasks: null,
    },
    {
      id: 'assistant',
      title: 'Assistant IA',
      icon: MessageSquare,
      color: '#4169E1',
      description: 'Bientôt disponible',
      tasks: null,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F1E8] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:mb-12 flex justify-between items-start">
          <div>
            <h1 className="text-[#2C2C2C] mb-2">{getGreeting()}, {userName} 👋</h1>
            <p className="text-[#8B8680]">Prêt(e) à continuer ton voyage d'apprentissage ?</p>
          </div>
          <Button
            onClick={() => onNavigate('parametres')}
            variant="ghost"
            className="text-[#8B8680] hover:text-[#2C2C2C] hover:bg-white rounded-xl"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.id}
                onClick={() => onNavigate(card.id)}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer border-0 group"
              >
                <div className="flex flex-col h-full">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${card.color}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: card.color }} strokeWidth={2} />
                  </div>
                  <h3 className="text-[#2C2C2C] mb-1">{card.title}</h3>
                  <p className="text-[#8B8680] text-sm mb-4">{card.description}</p>
                  {card.tasks !== null && (
                    <div className="mt-auto">
                      <span className="text-xs text-[#8B8680]">
                        {card.tasks} {card.tasks === 1 ? 'élément' : 'éléments'}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 md:mt-12 bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-[#2C2C2C] mb-4">Aperçu d'aujourd'hui</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl text-[#4169E1] mb-1">45</div>
              <div className="text-xs text-[#8B8680]">Minutes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-[#6B9AC4] mb-1">3</div>
              <div className="text-xs text-[#8B8680]">Tâches faites</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-[#8B8680] mb-1">2</div>
              <div className="text-xs text-[#8B8680]">Sessions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
