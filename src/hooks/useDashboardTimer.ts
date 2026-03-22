import { useEffect, useRef, useState } from 'react';

import type { DashboardTimerState } from '../lib/storage';

type TimerModeKey = 'focus' | 'short' | 'long';

type TimerModeMap = Record<
  TimerModeKey,
  {
    label: string;
    minutes: number;
    color: string;
  }
>;

type TimerAction = {
  action?: 'start' | 'pause' | 'reset' | 'set';
  mode?: TimerModeKey;
  minutes?: number;
};

type UseDashboardTimerParams = {
  timerModes: TimerModeMap;
  alarmSoundSrc: string;
  addElapsedStudySeconds: (
    prevData: Record<string, number[]>,
    startMs: number,
    endMs: number
  ) => Record<string, number[]>;
  formatDate: (date: Date) => string;
  getCurrentWeekDates: (offsetWeeks?: number) => Date[];
  setStudyData: React.Dispatch<React.SetStateAction<Record<string, number[]>>>;
  setSessionsByDay: React.Dispatch<React.SetStateAction<Record<string, number>>>;
};

export function useDashboardTimer({
  timerModes,
  alarmSoundSrc,
  addElapsedStudySeconds,
  formatDate,
  getCurrentWeekDates,
  setStudyData,
  setSessionsByDay,
}: UseDashboardTimerParams) {
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(timerMinutes * 60);
  const [timerMode, setTimerMode] = useState<TimerModeKey>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [editingTimerValue, setEditingTimerValue] = useState('');
  const lastTickRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const timerStateHydratedRef = useRef(false);

  const safeMinutes = Math.max(5, timerMinutes || 5);
  const ringColor = timerModes[timerMode].color;
  const progress = Math.min(100, Math.max(0, ((safeMinutes * 60 - timeLeft) / (safeMinutes * 60)) * 100));
  const isInitialTime = Math.abs(timeLeft - safeMinutes * 60) < 0.5;

  const formatTime = (value: number) => {
    const minutes = Math.floor(value / 60)
      .toString()
      .padStart(2, '0');
    const seconds = Math.floor(value % 60)
      .toString()
      .padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const setCustomTimerMinutes = (nextMinutes: number) => {
    const clamped = Math.min(120, Math.max(5, Math.round(nextMinutes)));
    setIsRunning(false);
    lastTickRef.current = null;
    setIsEditingTimer(false);
    setTimerMinutes(clamped);
    setTimeLeft(clamped * 60);
    setEditingTimerValue(clamped.toString());
  };

  const commitTimerEdit = () => {
    const parsed = Number(editingTimerValue);
    if (Number.isFinite(parsed)) {
      const clamped = Math.min(120, Math.max(5, parsed));
      setCustomTimerMinutes(clamped);
    }
    setIsEditingTimer(false);
  };

  const applyTimerSettings = (nextMode: TimerModeKey, nextMinutes: number) => {
    setTimerMode(nextMode);
    setCustomTimerMinutes(nextMinutes);
  };

  const buildTimerState = (): DashboardTimerState => ({
    mode: timerMode,
    minutes: safeMinutes,
    remainingSeconds: Math.max(0, timeLeft),
    isRunning,
    updatedAt: Date.now(),
  });

  const hydrateTimerState = (persistedTimerState?: DashboardTimerState | null) => {
    if (timerStateHydratedRef.current || !persistedTimerState) return false;
    if (!['focus', 'short', 'long'].includes(persistedTimerState.mode)) return false;

    timerStateHydratedRef.current = true;

    const persistedMode = persistedTimerState.mode as TimerModeKey;
    const nextMinutes = Math.min(120, Math.max(5, persistedTimerState.minutes || timerModes[persistedMode].minutes));
    const cappedRemainingSeconds = Math.min(nextMinutes * 60, Math.max(0, persistedTimerState.remainingSeconds || 0));

    setTimerMode(persistedMode);
    setTimerMinutes(nextMinutes);
    setEditingTimerValue(nextMinutes.toString());

    if (!persistedTimerState.isRunning) {
      setIsRunning(false);
      setTimeLeft(cappedRemainingSeconds);
      return true;
    }

    const elapsedSeconds = Math.max(0, (Date.now() - persistedTimerState.updatedAt) / 1000);
    const effectiveElapsedSeconds = Math.min(cappedRemainingSeconds, elapsedSeconds);
    const remainingAfterResume = Math.max(0, cappedRemainingSeconds - elapsedSeconds);

    if (persistedMode === 'focus' && effectiveElapsedSeconds > 0) {
      const elapsedEndMs = persistedTimerState.updatedAt + effectiveElapsedSeconds * 1000;
      setStudyData((prev) => addElapsedStudySeconds(prev, persistedTimerState.updatedAt, elapsedEndMs));
    }

    if (remainingAfterResume <= 0) {
      if (persistedMode === 'focus' && effectiveElapsedSeconds > 0) {
        const completionDate = formatDate(new Date(persistedTimerState.updatedAt + cappedRemainingSeconds * 1000));
        setSessionsByDay((prev) => ({ ...prev, [completionDate]: (prev[completionDate] ?? 0) + 1 }));
      }
      setIsRunning(false);
      setTimeLeft(nextMinutes * 60);
      return true;
    }

    setTimeLeft(remainingAfterResume);
    setIsRunning(true);
    return true;
  };

  const resetHydrationGuard = () => {
    timerStateHydratedRef.current = false;
  };

  const applyChatTimerAction = (timerAction: TimerAction) => {
    const requestedMode =
      timerAction.mode && timerAction.mode in timerModes ? (timerAction.mode as TimerModeKey) : timerMode;
    const requestedMinutes = Number.isFinite(timerAction.minutes)
      ? Math.min(120, Math.max(5, Math.round(timerAction.minutes as number)))
      : timerAction.mode && timerAction.mode in timerModes
        ? timerModes[timerAction.mode as TimerModeKey].minutes
        : safeMinutes;

    switch (timerAction.action) {
      case 'pause':
        setIsRunning(false);
        lastTickRef.current = null;
        return;
      case 'reset':
      case 'set':
        setIsRunning(false);
        lastTickRef.current = null;
        applyTimerSettings(requestedMode, requestedMinutes);
        return;
      case 'start':
        if (timerAction.mode || Number.isFinite(timerAction.minutes)) {
          applyTimerSettings(requestedMode, requestedMinutes);
        }
        lastTickRef.current = performance.now();
        setIsRunning(true);
        return;
      default:
        return;
    }
  };

  useEffect(() => {
    if (!isRunning) return;
    lastTickRef.current = lastTickRef.current ?? performance.now();

    const applyDelta = (deltaSec: number) => {
      setTimeLeft((prev) => {
        const remaining = prev - deltaSec;
        const effectiveDelta = Math.min(prev, deltaSec);

        const todayDates = getCurrentWeekDates(0);
        const todayKey = formatDate(todayDates[0]);
        const todayIndex = todayDates.findIndex((d) => formatDate(d) === formatDate(new Date()));

        if (timerMode === 'focus' && effectiveDelta > 0) {
          setStudyData((prevData) => {
            const next = { ...prevData };
            const weekArray = [...(next[todayKey] ?? [0, 0, 0, 0, 0, 0, 0])];
            const idx = todayIndex >= 0 ? todayIndex : 0;
            weekArray[idx] = (weekArray[idx] ?? 0) + effectiveDelta / 60;
            next[todayKey] = weekArray;
            return next;
          });
        }

        if (remaining <= 0) {
          setIsRunning(false);
          if (timerMode === 'focus') {
            setSessionsByDay((prevSessions) => {
              const todayKey = formatDate(new Date());
              return { ...prevSessions, [todayKey]: (prevSessions[todayKey] ?? 0) + 1 };
            });
          }
          if (alarmRef.current) {
            try {
              alarmRef.current.currentTime = 0;
              void alarmRef.current.play();
            } catch (err) {
              console.error('Lecture du son impossible', err);
            }
          }
          lastTickRef.current = null;
          return safeMinutes * 60;
        }
        return remaining;
      });
    };

    const tick = () => {
      const now = performance.now();
      const lastTick = lastTickRef.current ?? now;
      const deltaSec = (now - lastTick) / 1000;
      lastTickRef.current = now;

      applyDelta(deltaSec);
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    const hiddenInterval = setInterval(() => {
      if (!document.hidden) return;
      const now = performance.now();
      const lastTick = lastTickRef.current ?? now;
      const deltaSec = (now - lastTick) / 1000;
      lastTickRef.current = now;
      applyDelta(deltaSec);
    }, 1000);

    animationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      clearInterval(hiddenInterval);
    };
  }, [isRunning, safeMinutes, timerMode, setSessionsByDay, setStudyData, addElapsedStudySeconds, formatDate, getCurrentWeekDates]);

  useEffect(() => {
    if (isRunning) {
      document.title = `itineris | ${formatTime(timeLeft)}`;
      if (lastTickRef.current === null) {
        lastTickRef.current = performance.now();
      }
    } else {
      document.title = 'itineris';
      lastTickRef.current = null;
    }
  }, [isRunning, timeLeft]);

  useEffect(() => {
    return () => {
      document.title = 'itineris';
    };
  }, []);

  useEffect(() => {
    alarmRef.current = new Audio(alarmSoundSrc);
    alarmRef.current.load();

    return () => {
      if (alarmRef.current) {
        alarmRef.current.pause();
        alarmRef.current = null;
      }
    };
  }, [alarmSoundSrc]);

  return {
    timerMinutes,
    timeLeft,
    timerMode,
    isRunning,
    isEditingTimer,
    editingTimerValue,
    safeMinutes,
    ringColor,
    progress,
    isInitialTime,
    formatTime,
    setTimerMode,
    setIsRunning,
    setIsEditingTimer,
    setEditingTimerValue,
    setTimeLeft,
    setTimerMinutes,
    setCustomTimerMinutes,
    commitTimerEdit,
    buildTimerState,
    hydrateTimerState,
    resetHydrationGuard,
    applyChatTimerAction,
    startTimer: () => {
      lastTickRef.current = performance.now();
      setIsRunning(true);
    },
    stopTimer: () => {
      lastTickRef.current = null;
      setIsRunning(false);
    },
    resetTimerToCurrentDuration: () => {
      setIsRunning(false);
      lastTickRef.current = null;
      setTimeLeft(safeMinutes * 60);
    },
  };
}
