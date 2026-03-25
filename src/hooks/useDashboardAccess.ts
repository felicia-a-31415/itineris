import { useEffect, useMemo, useState } from 'react';
import type { Location } from 'react-router-dom';

import { DASHBOARD_GUEST_ACCESS_KEY } from '../lib/dashboard';

type UseDashboardAccessParams = {
  userId?: string;
  loading: boolean;
  location: Location;
};

export function useDashboardAccess({ userId, loading, location }: UseDashboardAccessParams) {
  const [hasGuestAccess, setHasGuestAccess] = useState(false);
  const [authGateDismissed, setAuthGateDismissed] = useState(false);
  const requestedAuthMode = useMemo(
    () => ((location.state as { authMode?: 'signup' | 'login' } | null)?.authMode ?? null) as 'signup' | 'login' | null,
    [location.state]
  );

  useEffect(() => {
    if (userId) {
      setHasGuestAccess(false);
      setAuthGateDismissed(false);
      window.localStorage.removeItem(DASHBOARD_GUEST_ACCESS_KEY);
      return;
    }

    setHasGuestAccess(window.localStorage.getItem(DASHBOARD_GUEST_ACCESS_KEY) === 'true');
  }, [userId]);

  useEffect(() => {
    setAuthGateDismissed(false);
  }, [requestedAuthMode, userId]);

  const shouldShowDashboardAuthGate = !loading && !userId && !authGateDismissed && (!!requestedAuthMode || !hasGuestAccess);

  const enableGuestAccess = () => {
    window.localStorage.setItem(DASHBOARD_GUEST_ACCESS_KEY, 'true');
    setHasGuestAccess(true);
    setAuthGateDismissed(true);
  };

  return {
    requestedAuthMode,
    shouldShowDashboardAuthGate,
    enableGuestAccess,
  };
}
