import './styles/globals.css';

import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import { Bienvenue } from './pages/Bienvenue';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import { Parametres } from './pages/Parametres';
import { TableauDeBord } from './pages/TableauDeBord';
import Erreur from './pages/Erreur';

import {
  loadUserData,
  loadUserDataFromSupabase,
  saveUserData,
  saveUserDataToSupabase,
  type UserData,
} from './lib/storage';
import { useAuth } from './lib/auth';

export default function App() {
  const [userData, setUserData] = useState<UserData | null>(() => loadUserData() ?? null);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [hasOnboardingData, setHasOnboardingData] = useState(Boolean(loadUserData()));
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);

  const defaultUserData: UserData = {
    name: '',
    year: 'Secondaire 1',
    favoriteSubjects: [],
    strongSubjects: [],
    weakSubjects: [],
    lifeGoals: '',
  };

  useEffect(() => {
    if (loading) return;
    let isMounted = true;

    const syncUserData = async () => {
      setIsUserDataLoading(true);
      const localData = loadUserData();

      if (user) {
        const remoteData = await loadUserDataFromSupabase(user.id);
        if (!isMounted) return;
        if (remoteData) {
          setUserData(remoteData);
          setHasOnboardingData(true);
        } else if (localData) {
          await saveUserDataToSupabase(user.id, localData);
          if (!isMounted) return;
          setUserData(localData);
          setHasOnboardingData(true);
        } else {
          setUserData(null);
          setHasOnboardingData(false);
        }
      } else {
        setUserData(localData);
        setHasOnboardingData(Boolean(localData));
      }

      if (isMounted) {
        setIsUserDataLoading(false);
      }
    };

    syncUserData();

    return () => {
      isMounted = false;
    };
  }, [user, loading]);

  // 2) Quand l’onboarding est terminé: sauver + rediriger
  const handleOnboardingComplete = async (data: UserData) => {
    setUserData(data);
    setHasOnboardingData(true);
    if (user) {
      await saveUserDataToSupabase(user.id, data);
    } else {
      saveUserData(data);
    }
    navigate('/tableaudebord');
  };

  const handleSettingsSave = async (data: UserData) => {
    setUserData(data);
    if (user) {
      await saveUserDataToSupabase(user.id, data);
    } else {
      saveUserData(data);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#ECECF3]">
      <Routes>
        <Route
          path="/"
          element={
            hasOnboardingData ? (
              <Navigate to="/tableaudebord" replace />
            ) : (
              <Bienvenue
                onGetStarted={() => navigate('/login', { state: { mode: 'signup' } })}
                onLogin={() => navigate('/login')}
                onContinueWithoutAccount={() => navigate('/onboarding')}
              />
            )
          }
        />
        <Route path="/login" element={<Login />} />
        <Route
          path="/onboarding"
          element={
            hasOnboardingData || user ? (
              <Navigate to="/tableaudebord" replace />
            ) : (
              <Onboarding onComplete={handleOnboardingComplete} />
            )
          }
        />
        <Route
          path="/tableaudebord"
          element={
            hasOnboardingData || user ? (
              <TableauDeBord userName={userData?.name ?? user?.email ?? undefined} />
            ) : (
              <Navigate to="/onboarding" replace />
            )
          }
        />
        <Route
          path="/parametres"
          element={
            hasOnboardingData ? (
              <Parametres
                onBack={() => navigate('/tableaudebord')}
                userData={userData ?? defaultUserData}
                onSave={handleSettingsSave}
              />
            ) : (
              <Navigate to="/onboarding" replace />
            )
          }
        />
        <Route path="/*" element={<Erreur />} />
      </Routes>
    </div>
  );
}
