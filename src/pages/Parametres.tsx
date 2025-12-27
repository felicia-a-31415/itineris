import { useState } from 'react';
import { ArrowLeft, User, Palette, BookOpen, Save, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

interface UserData {
  name: string;
  year: string;
  favoriteSubjects: string[];
  strongSubjects: string[];
  weakSubjects: string[];
  lifeGoals: string;
}

interface ParametresScreenProps {
  onBack: () => void;
  userData: UserData;
  onSave: (data: UserData) => void;
}

export function Parametres({ onBack, userData, onSave }: ParametresScreenProps) {
  const [formData, setFormData] = useState<UserData>(userData);
  const [saved, setSaved] = useState(false);

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
    
    // Sec 3-4 (same as Sec 1-2 but without Géographie)
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
    
    // Sec 5 (different subjects)
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

  const handleSave = () => {
    onSave(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="p-1 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={onBack}
              variant="ghost"
              className="text-[#8B8680] hover:text-[#2C2C2C] hover:bg-[#F5F1E8] rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <p className="text-sm text-[#8B8680]">Centre de contrôle</p>
              <h1 className="text-2xl font-semibold text-[#2C2C2C]">Paramètres</h1>
              <p className="text-[#8B8680] text-sm">Personnalise ton expérience</p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            className="bg-[#4169E1] hover:bg-[#3557C1] text-white rounded-xl px-4 shadow-sm"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Sauvegardé
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="w-full max-w-2xl mx-auto flex justify-center gap-2 mb-6 bg-white rounded-3xl p-2 border border-[#E8E3D6] shadow-sm min-h-[56px]">
            <TabsTrigger value="profile" className="rounded-xl h-11 flex-1 min-w-[140px] data-[state=active]:bg-[#F5F8FF] data-[state=active]:text-[#2C2C2C]">
              <User className="w-4 h-4 mr-2" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="subjects" className="rounded-xl h-11 flex-1 min-w-[140px] data-[state=active]:bg-[#F5F8FF] data-[state=active]:text-[#2C2C2C]">
              <BookOpen className="w-4 h-4 mr-2" />
              Matières
            </TabsTrigger>
            <TabsTrigger value="theme" className="rounded-xl h-11 flex-1 min-w-[140px] data-[state=active]:bg-[#F5F8FF] data-[state=active]:text-[#2C2C2C]">
              <Palette className="w-4 h-4 mr-2" />
              Thème
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="bg-white rounded-3xl p-8 shadow-sm border border-[#E8E3D6]">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-[#2C2C2C] mb-2">
                    Comment t'appelles-tu ?
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ton prénom..."
                    className="mt-2 border-[#F5F1E8] rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="year" className="text-[#2C2C2C] mb-2">
                    Tu es en quelle année ?
                  </Label>
                  <Select 
                    value={formData.year} 
                    onValueChange={(value) => setFormData({ ...formData, year: value })}
                  >
                    <SelectTrigger className="mt-2 border-[#F5F1E8] rounded-xl">
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

                <div>
                  <Label htmlFor="goals" className="text-[#2C2C2C] mb-2">
                    Quels sont tes objectifs dans la vie ?
                  </Label>
                  <Textarea
                    id="goals"
                    value={formData.lifeGoals}
                    onChange={(e) => setFormData({ ...formData, lifeGoals: e.target.value })}
                    placeholder="Partage tes rêves et aspirations... (ex: devenir médecin, créer mon entreprise, voyager autour du monde...)"
                    className="mt-2 border-[#F5F1E8] rounded-xl min-h-[150px]"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Subjects Tab */}
          <TabsContent value="subjects">
            <Card className="bg-white rounded-3xl p-8 shadow-sm border border-[#E8E3D6]">
              <div className="space-y-6">
                <div>
                  <Label className="text-[#2C2C2C] mb-3 block">
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
                            : 'bg-white text-[#2C2C2C] border border-[#F5F1E8] hover:border-[#4169E1]'
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
                  <Label className="text-[#2C2C2C] mb-3 block">
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
                            : 'bg-white text-[#2C2C2C] border border-[#F5F1E8] hover:border-[#6B9AC4]'
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
                  <Label className="text-[#2C2C2C] mb-3 block">
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
                            : 'bg-white text-[#2C2C2C] border border-[#F5F1E8] hover:border-[#8B8680]'
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
            </Card>
          </TabsContent>

          {/* Theme Tab */}
          <TabsContent value="theme">
            <Card className="bg-gradient-to-r from-[#F5F8FF] to-[#FFF7F1] rounded-3xl p-8 shadow-sm border border-[#E8E3D6]">
              <div className="text-center py-12 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-inner border border-[#E8E3D6] mx-auto flex items-center justify-center">
                  <Palette className="w-7 h-7 text-[#4169E1]" />
                </div>
                <h3 className="text-xl text-[#2C2C2C]">Personnalisation du thème</h3>
                <p className="text-[#8B8680] max-w-2xl mx-auto">
                  Les options de thème seront bientôt disponibles ! Choisis des palettes, des modes d&apos;affichage et des textures qui s&apos;alignent avec ton tableau de bord.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
