import './styles/globals.css'

import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom'

import { Bienvenue } from './pages/Bienvenue'
import { Onboarding } from './pages/Onboarding'
import { TableauDeBord } from './pages/TableauDeBord'
import { Parametres } from './pages/Parametres'
import Todo from './pages/Todo'
import Minuteur from './pages/Minuteur'
import Statistiques from './pages/Statistiques'
import Conseils from './pages/Conseils'
import NotesRapides from './pages/NotesRapides'
import Assistant from './pages/Assistant'
import Erreur from './pages/Erreur'

import { loadUserData, saveUserData, type UserData } from './lib/storage'

const STORAGE_KEY = 'itineris_user_data';

export default function App() {
  const [userData, setUserData] = useState<UserData | null>(() => loadUserData() ?? null);
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true);

  const defaultUserData: UserData = {
    name: '',
    year: 'Secondaire 1',
    favoriteSubjects: [],
    strongSubjects: [],
    weakSubjects: [],
    lifeGoals: '',
  }

  // 1) Au démarrage: charger les données + rediriger si nécessaire
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setUserData(parsedData);
        navigate('/tableaudebord');
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    }
    setIsLoading(false);
  }, []);

  // 2) Quand l’onboarding est terminé: sauver + rediriger
  const handleOnboardingComplete = (data: UserData) => {
    setUserData(data)
    saveUserData(data)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    navigate('/tableaudebord')
  }

  const handleSettingsSave = (data: UserData) => {
    setUserData(data)
    saveUserData(data)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
        <div className="text-[#8B8680]">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#2C2C2C]">
      <Routes>
        <Route
          path="/"
          element={<Bienvenue onGetStarted={() => navigate('/onboarding')} />}
        />
        <Route
          path="/onboarding"
          element={<Onboarding onComplete={handleOnboardingComplete} />}
        />
        <Route
          path="/tableaudebord"
          element={
            <TableauDeBord
              onNavigate={(screen) => navigate(`/${screen}`)}
              userName={userData?.name}
            />
          }
        />
        <Route 
          path="/parametres" 
          element={
            <Parametres
              onBack={() => navigate('/tableaudebord')}
              userData={userData ?? defaultUserData}
              onSave={handleSettingsSave}
           />} />
        <Route path="/todo" element={<Todo />} />
        <Route path="/minuteur" element={<Minuteur />} />
        <Route path="/statistiques" element={<Statistiques />} />
        <Route path="/conseils" element={<Conseils />} />
        <Route path="/notesrapides" element={<NotesRapides />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/*" element={<Erreur />} />
      </Routes>
    </div>
  )
}