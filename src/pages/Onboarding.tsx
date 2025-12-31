import { useState } from 'react';
import { Compass, ArrowRight, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';

interface OnboardingData {
  name: string;
  year: string;
  favoriteSubjects: string[];
  strongSubjects: string[];
  weakSubjects: string[];
  lifeGoals: string;
}

interface OnboardingProps {
  onComplete: (data: OnboardingData) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    name: '',
    year: '',
    favoriteSubjects: [],
    strongSubjects: [],
    weakSubjects: [],
    lifeGoals: '',
  });

  const getSubjectsForYear = (year: string): string[] => {
    // Sec 1-2
    if (year === 'Secondaire 1' || year === 'Secondaire 2') {
      return [
        'Mathématiques',
        'Anglais',
        'Français',
        'Géographie',
        'Histoire',
        'Latin',
        'Espagnol',
        'Arts plastiques',
        'Sciences',
        'CCQ',
        'Éducation physique',
        'Autre',
      ];
    }
    
    // Sec 3-4
    if (year === 'Secondaire 3' || year === 'Secondaire 4') {
      return [
        'Mathématiques',
        'Anglais',
        'Français',
        'Histoire',
        'Latin',
        'Espagnol',
        'Arts plastiques',
        'Sciences',
        'CCQ',
        'Éducation physique',
        'Autre',
      ];
    }
    
    // Sec 5
    if (year === 'Secondaire 5') {
      return [
        'Mathématiques',
        'Anglais',
        'Français',
        'Arts plastiques',
        'Chimie',
        'Physique',
        'Histoire du XXe siècle',
        'Culture et société',
        'CCQ',
        'Éducation physique',
        'Autre',
      ];
    }

    return [];
}

  const subjects = getSubjectsForYear(formData.year);

  const years = [
    'Secondaire 1',
    'Secondaire 2',
    'Secondaire 3',
    'Secondaire 4',
    'Secondaire 5',
  ];

  const toggleSubject = (category: 'favoriteSubjects' | 'strongSubjects' | 'weakSubjects', subject: string) => {
    const currentSubjects = formData[category];
    if (currentSubjects.includes(subject)) {
      setFormData({
        ...formData,
        [category]: currentSubjects.filter((s) => s !== subject),
      });
    } else {
      setFormData({
        ...formData,
        [category]: [...currentSubjects, subject],
      });
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete(formData);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      return formData.name.trim() !== '' && formData.year !== '';
    }
    if (step === 2) {
      return formData.favoriteSubjects.length > 0 && formData.strongSubjects.length > 0 && formData.weakSubjects.length > 0;
    }
    if (step === 3) {
      return formData.lifeGoals.trim() !== '';
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#ECECF3] p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#4169E1] mx-auto mb-4 flex items-center justify-center">
            <Compass className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl text-[#ECECF3] mb-2">Bienvenue sur Itineris</h1>
          <p className="text-[#A9ACBA]">Personnalisons votre expérience d'apprentissage</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? 'w-12 bg-[#4169E1]' : 'w-2 bg-[#8B8680]/30'
              }`}
            />
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-[#13151C] border border-[#1F2230] rounded-3xl p-8 md:p-12 shadow-sm">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl text-[#ECECF3] mb-2">Faisons connaissance</h2>
                <p className="text-[#A9ACBA] text-sm">Commençons par les bases</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-[#ECECF3] mb-2">
                    Comment t'appelles-tu ?
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ton prénom..."
                    className="mt-2 rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="year" className="text-[#ECECF3] mb-2">
                    Tu es en quelle année ?
                  </Label>
                  <Select value={formData.year} onValueChange={(value) => setFormData({ ...formData, year: value })}>
                    <SelectTrigger className="mt-2 rounded-xl">
                      <SelectValue placeholder="Sélectionne ton niveau..." />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl text-[#ECECF3] mb-2">Tes matières</h2>
                <p className="text-[#A9ACBA] text-sm">Sélectionne toutes celles qui s'appliquent</p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-[#ECECF3] mb-3 block">
                    Quelles sont tes matières préférées ?
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((subject) => (
                      <Badge
                        key={subject}
                        onClick={() => toggleSubject('favoriteSubjects', subject)}
                        className={`cursor-pointer rounded-lg px-3 py-2 transition-all ${
                          formData.favoriteSubjects.includes(subject)
                            ? 'bg-[#4169E1] text-white hover:bg-[#3557C1]'
                            : 'bg-[#1A1D26] text-[#ECECF3] border border-[#1F2230] hover:border-[#4169E1]'
                        }`}
                      >
                        {formData.favoriteSubjects.includes(subject) && (
                          <Check className="w-3 h-3 mr-1 inline" />
                        )}
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-[#ECECF3] mb-3 block">
                    Dans quelles matières es-tu fort(e) ?
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((subject) => (
                      <Badge
                        key={subject}
                        onClick={() => toggleSubject('strongSubjects', subject)}
                        className={`cursor-pointer rounded-lg px-3 py-2 transition-all ${
                          formData.strongSubjects.includes(subject)
                            ? 'bg-[#6B9AC4] text-white hover:bg-[#5A89B3]'
                            : 'bg-[#1A1D26] text-[#ECECF3] border border-[#1F2230] hover:border-[#6B9AC4]'
                        }`}
                      >
                        {formData.strongSubjects.includes(subject) && (
                          <Check className="w-3 h-3 mr-1 inline" />
                        )}
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-[#ECECF3] mb-3 block">
                    Quelles matières aimerais-tu améliorer ?
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((subject) => (
                      <Badge
                        key={subject}
                        onClick={() => toggleSubject('weakSubjects', subject)}
                        className={`cursor-pointer rounded-lg px-3 py-2 transition-all ${
                          formData.weakSubjects.includes(subject)
                            ? 'bg-[#8B8680] text-white hover:bg-[#7A756F]'
                            : 'bg-[#1A1D26] text-[#ECECF3] border border-[#1F2230] hover:border-[#8B8680]'
                        }`}
                      >
                        {formData.weakSubjects.includes(subject) && (
                          <Check className="w-3 h-3 mr-1 inline" />
                        )}
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl text-[#ECECF3] mb-2">Tes objectifs</h2>
                <p className="text-[#A9ACBA] text-sm">Qu'est-ce qui te motive ?</p>
              </div>

              <div>
                <Label htmlFor="goals" className="text-[#ECECF3] mb-2">
                  Quels sont tes objectifs dans la vie ?
                </Label>
                <Textarea
                  id="goals"
                  value={formData.lifeGoals}
                  onChange={(e) => setFormData({ ...formData, lifeGoals: e.target.value })}
                  placeholder="Partage tes rêves et aspirations... (ex: devenir médecin, créer mon entreprise, voyager autour du monde...)"
                  className="mt-2 rounded-xl min-h-[150px]"
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-8 border-t border-[#1F2230]">
            {step > 1 ? (
              <Button
                onClick={() => setStep(step - 1)}
                variant="outline"
                className="rounded-xl border-[#1F2230]"
              >
                Retour
              </Button>
            ) : (
              <div />
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-[#4169E1] hover:bg-[#3557C1] text-white rounded-xl disabled:opacity-50"
            >
              {step === 3 ? 'Commencer' : 'Suivant'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
