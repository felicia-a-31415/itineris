import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

import {
  loadDashboardDataFromLocal,
  loadDashboardDataFromSupabase,
  saveDashboardDataToLocal,
  saveDashboardDataToSupabase,
  type DashboardChatMessage,
  type DashboardData,
  type DashboardTask,
  type DashboardTimerState,
} from '../lib/storage';

type UseDashboardPersistenceParams = {
  userId?: string;
  loading: boolean;
  currentWeekStart: string;
  timerPersistenceKey: string;
  tasks: DashboardTask[];
  setTasks: Dispatch<SetStateAction<DashboardTask[]>>;
  studyData: Record<string, number[]>;
  setStudyData: Dispatch<SetStateAction<Record<string, number[]>>>;
  sessionsByDay: Record<string, number>;
  setSessionsByDay: Dispatch<SetStateAction<Record<string, number>>>;
  messages: DashboardChatMessage[];
  setMessages: Dispatch<SetStateAction<DashboardChatMessage[]>>;
  defaultMessages: DashboardChatMessage[];
  createDefaultTasks: () => DashboardTask[];
  createDefaultStudyData: (weekStart: string) => Record<string, number[]>;
  createDefaultSessionsByDay: () => Record<string, number>;
  buildTimerState: () => DashboardTimerState;
  hydrateTimerState: (persistedTimerState?: DashboardTimerState | null) => boolean;
  resetHydrationGuard: () => void;
  remoteSaveIntervalMs: number;
};

export function useDashboardPersistence({
  userId,
  loading,
  currentWeekStart,
  timerPersistenceKey,
  tasks,
  setTasks,
  studyData,
  setStudyData,
  sessionsByDay,
  setSessionsByDay,
  messages,
  setMessages,
  defaultMessages,
  createDefaultTasks,
  createDefaultStudyData,
  createDefaultSessionsByDay,
  buildTimerState,
  hydrateTimerState,
  resetHydrationGuard,
  remoteSaveIntervalMs,
}: UseDashboardPersistenceParams) {
  const [isDashboardHydrated, setIsDashboardHydrated] = useState(false);
  const pendingRemoteSaveRef = useRef<DashboardData | null>(null);
  const pendingRemoteSaveUserIdRef = useRef<string | null>(null);
  const buildTimerStateRef = useRef(buildTimerState);
  const hydrateTimerStateRef = useRef(hydrateTimerState);
  const resetHydrationGuardRef = useRef(resetHydrationGuard);
  const tasksRef = useRef(tasks);
  const studyDataRef = useRef(studyData);
  const sessionsByDayRef = useRef(sessionsByDay);
  const messagesRef = useRef(messages);

  buildTimerStateRef.current = buildTimerState;
  hydrateTimerStateRef.current = hydrateTimerState;
  resetHydrationGuardRef.current = resetHydrationGuard;
  tasksRef.current = tasks;
  studyDataRef.current = studyData;
  sessionsByDayRef.current = sessionsByDay;
  messagesRef.current = messages;

  const persistDashboardSnapshot = (timerState?: DashboardTimerState) => {
    if (loading || !isDashboardHydrated) return;

    const payload = {
      tasks: tasksRef.current,
      studyData: studyDataRef.current,
      sessionsByDay: sessionsByDayRef.current,
      chatMessages: messagesRef.current,
      timerState: timerState ?? buildTimerStateRef.current(),
    };

    saveDashboardDataToLocal(userId, payload);

    if (userId) {
      pendingRemoteSaveRef.current = payload;
      pendingRemoteSaveUserIdRef.current = userId;
    }
  };

  useEffect(() => {
    let isMounted = true;
    setIsDashboardHydrated(false);
    resetHydrationGuardRef.current();

    const hydrateDashboardData = async () => {
      if (loading) return;
      const cached = loadDashboardDataFromLocal(userId);

      if (cached && isMounted) {
        if (Array.isArray(cached.tasks)) setTasks(cached.tasks);
        if (cached.studyData && typeof cached.studyData === 'object') setStudyData(cached.studyData);
        if (cached.sessionsByDay && typeof cached.sessionsByDay === 'object') setSessionsByDay(cached.sessionsByDay);
        if (Array.isArray(cached.chatMessages) && cached.chatMessages.length > 0) setMessages(cached.chatMessages);
        hydrateTimerStateRef.current(cached.timerState);
        setIsDashboardHydrated(true);
        return;
      }

      if (!userId) {
        setTasks(createDefaultTasks());
        setStudyData(createDefaultStudyData(currentWeekStart));
        setSessionsByDay(createDefaultSessionsByDay());
        setMessages(defaultMessages);
        setIsDashboardHydrated(true);
        return;
      }

      const remoteData = await loadDashboardDataFromSupabase(userId);
      if (!isMounted) return;

      if (remoteData) {
        setTasks(Array.isArray(remoteData.tasks) ? remoteData.tasks : createDefaultTasks());
        setStudyData(
          remoteData.studyData && typeof remoteData.studyData === 'object'
            ? remoteData.studyData
            : createDefaultStudyData(currentWeekStart)
        );
        setSessionsByDay(
          remoteData.sessionsByDay && typeof remoteData.sessionsByDay === 'object'
            ? remoteData.sessionsByDay
            : createDefaultSessionsByDay()
        );
        setMessages(
          Array.isArray(remoteData.chatMessages) && remoteData.chatMessages.length > 0
            ? remoteData.chatMessages
            : defaultMessages
        );
        hydrateTimerStateRef.current(remoteData.timerState);
        saveDashboardDataToLocal(userId, remoteData);
      }

      setIsDashboardHydrated(true);
    };

    hydrateDashboardData();

    return () => {
      isMounted = false;
    };
  }, [
    userId,
    currentWeekStart,
    loading,
    setTasks,
    setStudyData,
    setSessionsByDay,
    setMessages,
    defaultMessages,
    createDefaultTasks,
    createDefaultStudyData,
    createDefaultSessionsByDay,
  ]);

  useEffect(() => {
    persistDashboardSnapshot();
  }, [userId, tasks, studyData, sessionsByDay, messages, timerPersistenceKey, isDashboardHydrated, loading]);

  useEffect(() => {
    if (loading || !isDashboardHydrated || !userId) return;

    const flushRemoteSave = () => {
      const pendingPayload = pendingRemoteSaveRef.current;
      const pendingUser = pendingRemoteSaveUserIdRef.current;
      if (!pendingPayload || !pendingUser) return;

      pendingRemoteSaveRef.current = null;
      void saveDashboardDataToSupabase(pendingUser, pendingPayload);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushRemoteSave();
      }
    };

    const intervalId = window.setInterval(flushRemoteSave, remoteSaveIntervalMs);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      flushRemoteSave();
    };
  }, [userId, isDashboardHydrated, loading, remoteSaveIntervalMs]);

  return { isDashboardHydrated, persistDashboardSnapshot };
}
