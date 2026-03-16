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

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinelLike>;
  };
};

export default function App() {
  const [userData, setUserData] = useState<UserData | null>(() => loadUserData() ?? null);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [hasOnboardingData, setHasOnboardingData] = useState(Boolean(loadUserData()));
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  const [hasFinishedInitialLoad, setHasFinishedInitialLoad] = useState(false);
  const isInitialAppLoading = !hasFinishedInitialLoad && (loading || isUserDataLoading);

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
          saveUserData(remoteData);
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
        setHasFinishedInitialLoad(true);
      }
    };

    syncUserData();

    return () => {
      isMounted = false;
    };
  }, [user, loading]);

  useEffect(() => {
    const wakeLockNavigator = navigator as WakeLockNavigator;
    if (!wakeLockNavigator.wakeLock?.request) return;

    let wakeLock: WakeLockSentinelLike | null = null;
    let cancelled = false;

    const requestWakeLock = async () => {
      if (cancelled || document.visibilityState !== 'visible') return;

      try {
        wakeLock = await wakeLockNavigator.wakeLock.request('screen');
      } catch (error) {
        console.error('Unable to acquire screen wake lock.', error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !wakeLock?.released) return;
      void requestWakeLock();
    };

    void requestWakeLock();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock && !wakeLock.released) {
        void wakeLock.release();
      }
    };
  }, []);

  // 2) Quand l’onboarding est terminé: sauver + rediriger
  const handleOnboardingComplete = async (data: UserData) => {
    setUserData(data);
    setHasOnboardingData(true);
    if (user) {
      await saveUserDataToSupabase(user.id, data);
    }
    saveUserData(data);
    navigate('/tableaudebord');
  };

  const handleSettingsSave = async (data: UserData) => {
    setUserData(data);
    if (user) {
      await saveUserDataToSupabase(user.id, data);
    }
    saveUserData(data);
  };

  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#ECECF3]">
      <Routes>
        <Route
          path="/"
          element={
            isInitialAppLoading ? null : hasOnboardingData ? (
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
            isInitialAppLoading ? null : hasOnboardingData ? <Navigate to="/tableaudebord" replace /> : <Onboarding onComplete={handleOnboardingComplete} />
          }
        />
        <Route
          path="/tableaudebord"
          element={
            isInitialAppLoading ? null : hasOnboardingData ? (
              <TableauDeBord userName={userData?.name} />
            ) : user ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/parametres"
          element={
            isInitialAppLoading ? null : hasOnboardingData ? (
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
