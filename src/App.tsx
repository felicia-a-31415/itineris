import './styles/globals.css';

import { useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import { Bienvenue } from './pages/Bienvenue';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import { Parametres } from './pages/Parametres';
import { TableauDeBord } from './pages/TableauDeBord';
import Erreur from './pages/Erreur';

import { loadUserData, saveUserData, type UserData } from './lib/storage';
import { RequireAuth, useAuth } from './lib/auth';

export default function App() {
  const [userData, setUserData] = useState<UserData | null>(() => loadUserData() ?? null);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const defaultUserData: UserData = {
    name: '',
    year: 'Secondaire 1',
    favoriteSubjects: [],
    strongSubjects: [],
    weakSubjects: [],
    lifeGoals: '',
  };

  // 2) Quand l’onboarding est terminé: sauver + rediriger
  const handleOnboardingComplete = (data: UserData) => {
    setUserData(data);
    saveUserData(data);
    navigate('/tableaudebord');
  };

  const handleSettingsSave = (data: UserData) => {
    setUserData(data);
    saveUserData(data);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0D10] flex items-center justify-center">
        <div className="text-[#A9ACBA]">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#ECECF3]">
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/tableaudebord" replace /> : <Bienvenue onGetStarted={() => navigate('/login')} />}
        />
        <Route path="/login" element={<Login />} />
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <Onboarding onComplete={handleOnboardingComplete} />
            </RequireAuth>
          }
        />
        <Route
          path="/tableaudebord"
          element={
            <RequireAuth>
              <TableauDeBord userName={userData?.name} />
            </RequireAuth>
          }
        />
        <Route
          path="/parametres"
          element={
            <RequireAuth>
              <Parametres
                onBack={() => navigate('/tableaudebord')}
                userData={userData ?? defaultUserData}
                onSave={handleSettingsSave}
              />
            </RequireAuth>
          }
        />
        <Route path="/*" element={<Erreur />} />
      </Routes>
    </div>
  );
}
