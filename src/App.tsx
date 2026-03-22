import './styles/globals.css';

import { useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';

import { Login } from './pages/Login';
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

function AppFrame() {
  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#ECECF3]">
      <Outlet />
    </div>
  );
}

function LoginRoute() {
  const [searchParams] = useSearchParams();

  if (searchParams.get('mode') === 'recovery') {
    return <Login />;
  }

  return <Navigate to="/" replace state={{ authMode: 'login' }} />;
}

export default function App() {
  const [userData, setUserData] = useState<UserData | null>(() => loadUserData() ?? null);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
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
          saveUserData(remoteData);
        } else {
          setUserData(defaultUserData);
        }
      } else {
        setUserData(localData);
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

  const handleSettingsSave = async (data: UserData) => {
    setUserData(data);
    if (user) {
      await saveUserDataToSupabase(user.id, data);
    }
    saveUserData(data);
  };

  return (
    <Routes>
      <Route path="/" element={<AppFrame />}>
        <Route index element={isInitialAppLoading ? null : <TableauDeBord userName={userData?.name} />} />
        <Route
          path="parametres"
          element={
            isInitialAppLoading ? null : (
              <Parametres
                onBack={() => navigate('/')}
                userData={userData ?? defaultUserData}
                onSave={handleSettingsSave}
              />
            )
          }
        />
      </Route>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/tableaudebord" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Erreur />} />
    </Routes>
  );
}
