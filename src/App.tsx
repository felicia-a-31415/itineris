import './styles/globals.css';

import { useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';

import { Bienvenue } from './pages/Bienvenue';
import { Onboarding } from './pages/Onboarding';
import { Parametres } from './pages/Parametres';
import { TableauDeBord } from './pages/TableauDeBord';
import Erreur from './pages/Erreur';

import { loadUserData, saveUserData, type UserData } from './lib/storage';

const STORAGE_KEY = 'itineris_user_data';

export default function App() {
  const [userData, setUserData] = useState<UserData | null>(() => loadUserData() ?? null);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const defaultUserData: UserData = {
    name: '',
    year: 'Secondaire 1',
    favoriteSubjects: [],
    strongSubjects: [],
    weakSubjects: [],
    lifeGoals: '',
  };

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
    setUserData(data);
    saveUserData(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    navigate('/tableaudebord');
  };

  const handleSettingsSave = (data: UserData) => {
    setUserData(data);
    saveUserData(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0D10] flex items-center justify-center">
        <div className="text-[#A9ACBA]">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#ECECF3]">
      <Routes>
        <Route path="/" element={<Bienvenue onGetStarted={() => navigate('/onboarding')} />} />
        <Route path="/onboarding" element={<Onboarding onComplete={handleOnboardingComplete} />} />
        <Route path="/tableaudebord" element={<TableauDeBord userName={userData?.name} />} />
        <Route
          path="/parametres"
          element={
            <Parametres
              onBack={() => navigate('/tableaudebord')}
              userData={userData ?? defaultUserData}
              onSave={handleSettingsSave}
            />
          }
        />
        <Route path="/*" element={<Erreur />} />
      </Routes>
    </div>
  );
}
