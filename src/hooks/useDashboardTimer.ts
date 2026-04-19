import { useEffect, useRef, useState } from 'react';

import type { DashboardTimerState } from '../lib/storage';

const MIN_TIMER_MINUTES = 1;

type TimerToolKey = 'timer' | 'stopwatch';
type TimerModeKey = 'focus' | 'pause';

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
  mode?: TimerModeKey | 'short' | 'long';
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

const normalizeTimerMode = (mode?: DashboardTimerState['mode'] | TimerAction['mode']): TimerModeKey | null => {
  if (mode === 'focus') return 'focus';
  if (mode === 'pause' || mode === 'short' || mode === 'long') return 'pause';
  return null;
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
  const [timerTool, setTimerTool] = useState<TimerToolKey>('timer');
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isTimerLocked, setIsTimerLocked] = useState(false);
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [editingTimerValue, setEditingTimerValue] = useState('');
  const lastTickRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const timerStateHydratedRef = useRef(false);

  const safeMinutes = Math.max(MIN_TIMER_MINUTES, timerMinutes || MIN_TIMER_MINUTES);
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
    if (isTimerLocked) return;
    const clamped = Math.max(MIN_TIMER_MINUTES, Math.round(nextMinutes));
    const durationSeconds = Math.max(1, Math.round(clamped * 60));
    setIsRunning(false);
    lastTickRef.current = null;
    setIsEditingTimer(false);
    setTimerMinutes(clamped);
    setTimeLeft(durationSeconds);
    setEditingTimerValue(clamped.toString());
  };

  const commitTimerEdit = () => {
    if (isTimerLocked) {
      setIsEditingTimer(false);
      return;
    }
    const parsed = Number(editingTimerValue);
    if (Number.isFinite(parsed)) {
      setCustomTimerMinutes(parsed);
    }
    setIsEditingTimer(false);
  };

  const applyTimerSettings = (nextMode: TimerModeKey, nextMinutes: number) => {
    if (isTimerLocked) return;
    setTimerMode(nextMode);
    setCustomTimerMinutes(nextMinutes);
  };

  const buildTimerState = (): DashboardTimerState => ({
    tool: timerTool,
    mode: timerMode,
    minutes: safeMinutes,
    remainingSeconds: Math.max(0, timeLeft),
    stopwatchSeconds,
    isRunning,
    isLocked: isTimerLocked,
    updatedAt: Date.now(),
  });

  const hydrateTimerState = (persistedTimerState?: DashboardTimerState | null) => {
    if (timerStateHydratedRef.current || !persistedTimerState) return false;
    const persistedMode = normalizeTimerMode(persistedTimerState.mode);
    if (!persistedMode) return false;

    timerStateHydratedRef.current = true;

    const persistedTool: TimerToolKey = persistedTimerState.tool === 'stopwatch' ? 'stopwatch' : 'timer';
    const nextMinutes = Math.max(
      MIN_TIMER_MINUTES,
      Math.round(persistedTimerState.minutes || timerModes[persistedMode].minutes)
    );
    const durationSeconds = Math.max(1, Math.round(nextMinutes * 60));
    const cappedRemainingSeconds = Math.min(durationSeconds, Math.max(0, persistedTimerState.remainingSeconds || 0));

    setTimerTool(persistedTool);
    const elapsedSeconds = Math.max(0, (Date.now() - persistedTimerState.updatedAt) / 1000);

    setTimerMode(persistedMode);
    setTimerMinutes(nextMinutes);
    setIsTimerLocked(Boolean(persistedTimerState.isLocked && persistedTimerState.isRunning));
    setEditingTimerValue(nextMinutes.toString());
    setStopwatchSeconds(
      Math.max(0, (persistedTimerState.stopwatchSeconds ?? 0) + (persistedTool === 'stopwatch' && persistedTimerState.isRunning ? elapsedSeconds : 0))
    );

    if (!persistedTimerState.isRunning || persistedTool !== 'timer') {
      setIsRunning(false);
      setTimeLeft(cappedRemainingSeconds);
      return true;
    }

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
    setIsRunning(false);
    lastTickRef.current = null;
    return true;
  };

  const resetHydrationGuard = () => {
    timerStateHydratedRef.current = false;
  };

  const applyChatTimerAction = (timerAction: TimerAction) => {
    const normalizedMode = normalizeTimerMode(timerAction.mode);
    const requestedMode = normalizedMode && normalizedMode in timerModes ? normalizedMode : timerMode;
    const requestedMinutes = Number.isFinite(timerAction.minutes)
      ? Math.max(MIN_TIMER_MINUTES, Math.round(timerAction.minutes as number))
      : timerAction.mode && timerAction.mode in timerModes
        ? timerModes[timerAction.mode as TimerModeKey].minutes
        : safeMinutes;

    switch (timerAction.action) {
      case 'pause':
        if (isTimerLocked) return;
        setIsRunning(false);
        lastTickRef.current = null;
        return;
      case 'reset':
      case 'set':
        if (isTimerLocked) return;
        setIsRunning(false);
        lastTickRef.current = null;
        setTimerTool('timer');
        applyTimerSettings(requestedMode, requestedMinutes);
        return;
      case 'start':
        if (!isTimerLocked && (timerAction.mode || Number.isFinite(timerAction.minutes))) {
          setTimerTool('timer');
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
    if (!isRunning || timerTool !== 'timer') return;
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
          setIsTimerLocked(false);
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
  }, [isRunning, safeMinutes, timerMode, timerTool, setSessionsByDay, setStudyData, addElapsedStudySeconds, formatDate, getCurrentWeekDates]);

  useEffect(() => {
    if (!isRunning || timerTool !== 'stopwatch') return;
    lastTickRef.current = lastTickRef.current ?? performance.now();

    const applyStopwatchDelta = (deltaSec: number) => {
      const effectiveDelta = Math.max(0, deltaSec);
      if (effectiveDelta <= 0) return;
      setStopwatchSeconds((prev) => prev + effectiveDelta);
    };

    const tick = () => {
      const now = performance.now();
      const lastTick = lastTickRef.current ?? now;
      const deltaSec = (now - lastTick) / 1000;
      lastTickRef.current = now;
      applyStopwatchDelta(deltaSec);
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    const hiddenInterval = setInterval(() => {
      if (!document.hidden) return;
      const now = performance.now();
      const lastTick = lastTickRef.current ?? now;
      const deltaSec = (now - lastTick) / 1000;
      lastTickRef.current = now;
      applyStopwatchDelta(deltaSec);
    }, 1000);

    animationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      clearInterval(hiddenInterval);
    };
  }, [isRunning, timerTool]);

  useEffect(() => {
    if (isRunning) {
      const titleTime = timerTool === 'stopwatch' ? formatTime(stopwatchSeconds) : formatTime(timeLeft);
      document.title = `itineris | ${titleTime}`;
      if (lastTickRef.current === null) {
        lastTickRef.current = performance.now();
      }
    } else {
      document.title = 'itineris';
      lastTickRef.current = null;
    }
  }, [isRunning, stopwatchSeconds, timeLeft, timerTool]);

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
    timerTool,
    stopwatchSeconds,
    isRunning,
    isTimerLocked,
    isEditingTimer,
    editingTimerValue,
    safeMinutes,
    ringColor,
    progress,
    isInitialTime,
    formatTime,
    setTimerMode,
    setTimerTool: (nextTool: TimerToolKey) => {
      if (isTimerLocked) return;
      setIsRunning(false);
      lastTickRef.current = null;
      setIsEditingTimer(false);
      setTimerTool(nextTool);
    },
    setIsRunning,
    setIsEditingTimer,
    setEditingTimerValue,
    setTimeLeft,
    setTimerMinutes,
    setIsTimerLocked,
    toggleTimerLock: () => {
      setIsTimerLocked((prev) => {
        if (!prev) setIsEditingTimer(false);
        return !prev;
      });
    },
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
      if (isTimerLocked) return;
      setIsRunning(false);
      lastTickRef.current = null;
      if (timerTool === 'stopwatch') {
        setStopwatchSeconds(0);
        return;
      }
      setTimeLeft(safeMinutes * 60);
    },
    saveStopwatchSessionToStats: () => {
      if (isTimerLocked) return;
      const elapsedSeconds = Math.max(0, stopwatchSeconds);
      setIsRunning(false);
      lastTickRef.current = null;

      if (timerTool !== 'stopwatch' || elapsedSeconds < 1) {
        setStopwatchSeconds(0);
        return;
      }

      const endMs = Date.now();
      const startMs = endMs - elapsedSeconds * 1000;
      const todayKey = formatDate(new Date(endMs));
      setStudyData((prev) => addElapsedStudySeconds(prev, startMs, endMs));
      setSessionsByDay((prev) => ({ ...prev, [todayKey]: (prev[todayKey] ?? 0) + 1 }));
      setStopwatchSeconds(0);
    },
  };
}
