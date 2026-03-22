import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Flame,
  Info,
  LogOut,
  Settings,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Popover, PopoverAnchor, PopoverTrigger } from '../ui/popover';
import { DashboardAuthGate } from '../components/dashboard/DashboardAuthGate';
import { AgendaCard } from '../components/dashboard/AgendaCard';
import { ChatCard } from '../components/dashboard/ChatCard';
import { TaskDetailsPopoverContent } from '../components/dashboard/TaskDetailsPopoverContent';
import { StudyStatsCard } from '../components/dashboard/StudyStatsCard';
import { TaskCreationDialog } from '../components/dashboard/TaskCreationDialog';
import { TimerCard } from '../components/dashboard/TimerCard';
import alarmSound from '../assets/Gentle-little-bell-ringing-sound-effect.mp3';
import { useAuth } from '../lib/auth';
import { useDashboardChat } from '../hooks/useDashboardChat';
import { useDashboardPersistence } from '../hooks/useDashboardPersistence';
import { useDashboardTasks } from '../hooks/useDashboardTasks';
import { useDashboardTimer } from '../hooks/useDashboardTimer';
import { clearUserData, type DashboardChatMessage, type DashboardTask } from '../lib/storage';

type Task = DashboardTask;

type ChatTimerAction = {
  tool?: 'set_timer';
  action?: 'start' | 'pause' | 'reset' | 'set';
  mode?: keyof typeof TIMER_MODES;
  minutes?: number;
};

const TASK_COLORS = ['#6B9AC4', '#4169E1', '#8B8680', '#E16941', '#41E169', '#9B59B6', '#F39C12', '#E91E63'];
const REMOTE_DASHBOARD_SAVE_INTERVAL_MS = 30_000;
const DASHBOARD_GUEST_ACCESS_KEY = 'itineris.dashboard.guest-access';

const normalizeFrenchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const parseTimerActionFromMessage = (message: string): ChatTimerAction | null => {
  const normalized = normalizeFrenchText(message);
  const hasTimerContext =
    /\b(timer|minuteur|pomodoro|chrono|focus|pause)\b/.test(normalized) ||
    /\b(lance|demarre|arrete|stop|pause|reprend|relance|reinitialise|reset)\b/.test(normalized);

  if (!hasTimerContext) return null;

  const minutesMatch = normalized.match(/\b(\d{1,3})\s*(min|mins|minute|minutes)\b/);
  const parsedMinutes = minutesMatch ? Number(minutesMatch[1]) : undefined;
  const minutes = Number.isFinite(parsedMinutes) ? Math.min(120, Math.max(5, Math.round(parsedMinutes!))) : undefined;

  const mode = /\b(courte pause|pause courte|short)\b/.test(normalized)
    ? 'short'
    : /\b(longue pause|pause longue|long)\b/.test(normalized)
      ? 'long'
      : /\b(focus)\b/.test(normalized)
        ? 'focus'
        : undefined;

  if (/\b(pause|mets en pause|arrete|stop)\b/.test(normalized)) {
    return { tool: 'set_timer', action: 'pause' };
  }

  if (/\b(reinitialise|reinitialiser|remets? a zero|reset|remet le timer a zero)\b/.test(normalized)) {
    return { tool: 'set_timer', action: 'reset', mode, minutes };
  }

  if (/\b(regle|mets|configure|change|set)\b/.test(normalized) && (minutes !== undefined || mode)) {
    return { tool: 'set_timer', action: 'set', mode, minutes };
  }

  if (/\b(lance|demarre|reprend|relance|start)\b/.test(normalized) || mode || minutes !== undefined) {
    return { tool: 'set_timer', action: 'start', mode, minutes };
  }

  return null;
};

const getWeekStartKeyForDate = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  const dayOfWeek = normalized.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  normalized.setDate(normalized.getDate() + diff);
  return formatDate(normalized);
};

const getWeekdayArrayIndex = (date: Date) => {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
};

const addElapsedStudySeconds = (
  prevData: Record<string, number[]>,
  startMs: number,
  endMs: number
) => {
  if (endMs <= startMs) return prevData;

  const nextData = { ...prevData };
  let cursor = startMs;

  while (cursor < endMs) {
    const segmentStart = new Date(cursor);
    const nextMidnight = new Date(segmentStart);
    nextMidnight.setHours(24, 0, 0, 0);
    const segmentEnd = Math.min(endMs, nextMidnight.getTime());
    const weekKey = getWeekStartKeyForDate(segmentStart);
    const dayIndex = getWeekdayArrayIndex(segmentStart);
    const weekArray = [...(nextData[weekKey] ?? [0, 0, 0, 0, 0, 0, 0])];

    weekArray[dayIndex] = (weekArray[dayIndex] ?? 0) + (segmentEnd - cursor) / 60000;
    nextData[weekKey] = weekArray;
    cursor = segmentEnd;
  }

  return nextData;
};

const getCurrentWeekDates = (offsetWeeks = 0) => {
  const today = new Date();
  const currentDay = today.getDay();
  const diff = currentDay === 0 ? -6 : 1 - currentDay; // lundi comme début
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff + offsetWeeks * 7);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTime24 = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const buildCurrentDateContext = () => {
  const now = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const weekdayFr = new Intl.DateTimeFormat('fr-CA', { weekday: 'long' }).format(now);
  const localDate = formatDate(now);
  const localTime24 = formatTime24(now);

  return {
    localDate,
    localTime24,
    localDateTime: `${localDate} ${localTime24}`,
    weekdayFr,
    timezone,
    timezoneOffsetMinutes: -now.getTimezoneOffset(),
    today: localDate,
    tomorrow: formatDate(addDays(now, 1)),
    yesterday: formatDate(addDays(now, -1)),
    thisWeekMonday: formatDate(getWeekStartMonday(now)),
    nextWeekMonday: formatDate(addDays(getWeekStartMonday(now), 7)),
    isoUtc: now.toISOString(),
    localeFr: new Intl.DateTimeFormat('fr-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    }).format(now),
    unixMs: now.getTime(),
  };
};

const parseLocalDateString = (value?: string) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const normalizeTaskText = (value?: string) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const findMatchingTaskIndex = (
  tasks: Task[],
  targetName?: string,
  targetDate?: string,
  targetTime?: string
) => {
  const normalizedTargetName = normalizeTaskText(targetName);
  if (!normalizedTargetName) return -1;

  const exactMatchIndex = tasks.findIndex((task) => {
    if (normalizeTaskText(task.name) !== normalizedTargetName) return false;
    if (targetDate && task.date !== targetDate) return false;
    if (targetTime && task.time !== targetTime) return false;
    return true;
  });

  if (exactMatchIndex >= 0) return exactMatchIndex;

  return tasks.findIndex((task) => {
    const normalizedTaskName = normalizeTaskText(task.name);
    if (!normalizedTaskName.includes(normalizedTargetName) && !normalizedTargetName.includes(normalizedTaskName)) {
      return false;
    }
    if (targetDate && task.date !== targetDate) return false;
    if (targetTime && task.time !== targetTime) return false;
    return true;
  });
};

const getDayName = (date: Date) => {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  return days[date.getDay()];
};

const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

const getWeekStartMonday = (date: Date) => {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  return monday;
};

const getMonthGridDates = (anchor: Date) => {
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = getWeekStartMonday(monthStart);
  const dates: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const formatMonthRangeLabel = (start: Date, end: Date) => {
  const startMonth = MONTHS[start.getMonth()];
  const endMonth = MONTHS[end.getMonth()];
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startMonth === endMonth && startYear === endYear) {
    return `${startMonth} ${startYear}`;
  }
  if (startYear === endYear) {
    return `${startMonth} - ${endMonth} ${startYear}`;
  }
  return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
};

interface TableauDeBordScreenProps {
  userName?: string;
}

const MINIMUM_STREAK_MINUTES = 1;

const TIMER_MODES = {
  focus: { label: 'Focus', minutes: 25, color: '#3B82F6' },
  short: { label: 'Courte pause', minutes: 5, color: '#22C55E' },
  long: { label: 'Longue pause', minutes: 15, color: '#8B5CF6' },
} as const;
const TIMER_PRESET_MINUTES = [25, 30, 45, 60] as const;

const createDefaultTasks = () => {
  return [];
};

const createDefaultStudyData = (weekStart: string) => ({
  [weekStart]: [0, 0, 0, 0, 0, 0, 0],
});

const createDefaultSessionsByDay = () => {
  const todayKey = formatDate(new Date());
  return { [todayKey]: 0 };
};

const DEFAULT_CHAT_MESSAGES: DashboardChatMessage[] = [
  { role: 'assistant', content: "Salut, dis-moi ce que tu dois etudier et je t'aide a faire un plan." },
];

const isValidTaskDate = (value?: string) => !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
const isValidTaskTime = (value?: string) => !!value && /^\d{2}:\d{2}$/.test(value);

const renderInlineFormattedText = (text: string) => {
  const nodes: React.ReactNode[] = [];
  const pattern = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const token = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }

    if (token.startsWith('***') && token.endsWith('***')) {
      nodes.push(
        <strong key={`${index}-strong-em`} className="font-semibold italic">
          {token.slice(3, -3)}
        </strong>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(
        <strong key={`${index}-strong`} className="font-semibold text-[#ECECF3]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(
        <em key={`${index}-em`} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    } else {
      nodes.push(token);
    }

    lastIndex = index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : text;
};

const renderFormattedMessage = (content: string) => {
  const lines = content.split('\n');

  return lines.map((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return <div key={`line-${index}`} className="h-3" />;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      return (
        <div key={`line-${index}`} className="flex items-start gap-2">
          <span className="mt-1 text-[#7F869A]">•</span>
          <span>{renderInlineFormattedText(trimmed.replace(/^[-*]\s+/, ''))}</span>
        </div>
      );
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const marker = trimmed.match(/^\d+\./)?.[0] ?? '';
      return (
        <div key={`line-${index}`} className="flex items-start gap-2">
          <span className="min-w-6 text-[#7F869A]">{marker}</span>
          <span>{renderInlineFormattedText(trimmed.replace(/^\d+\.\s+/, ''))}</span>
        </div>
      );
    }

    return (
      <div key={`line-${index}`} className="leading-6">
        {renderInlineFormattedText(line)}
      </div>
    );
  });
};

export function TableauDeBord({ userName = 'étudiant' }: TableauDeBordScreenProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user, loading } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = useMemo(() => getCurrentWeekDates(weekOffset), [weekOffset]);
  const currentWeekStart = formatDate(getCurrentWeekDates(0)[0]);
  const [timeView, setTimeView] = useState<'week' | 'month'>('week');
  const [calendarMode, setCalendarMode] = useState<'calendar' | 'tasks'>('calendar');
  const [monthOffset, setMonthOffset] = useState(0);
  const monthAnchor = useMemo(() => {
    const base = new Date();
    base.setDate(1);
    base.setMonth(base.getMonth() + monthOffset);
    return base;
  }, [monthOffset]);
  const monthGridDates = useMemo(() => getMonthGridDates(monthAnchor), [monthAnchor]);
  const {
    tasks,
    setTasks,
    uploadNotice,
    showAddDialog,
    setShowAddDialog,
    newTaskName,
    setNewTaskName,
    selectedColor,
    setSelectedColor,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    infoTaskId,
    setInfoTaskId,
    editingNameId,
    setEditingNameId,
    editingNameValue,
    setEditingNameValue,
    modalTaskId,
    setModalTaskId,
    draftTaskId,
    setDraftTaskId,
    draftTaskIdRef,
    taskDetailsId,
    setTaskDetailsId,
    ignoreCalendarClickUntilRef,
    deleteCompletedMenuOpen,
    setDeleteCompletedMenuOpen,
    taskListItemRefs,
    taskListPositionsRef,
    pendingTaskMotionRef,
    showCompletedTasks,
    setShowCompletedTasks,
    cancelDraftTask,
    updateTask,
    startEditingName,
    cancelEditingName,
    commitEditingName,
    saveTask,
    createTaskForDate,
    toggleTask,
    deleteCompletedTasks,
    handleAgendaImageUpload,
    getTasksForDate,
    agendaTasks,
    completedTasksCount,
    visibleTasks,
    modalTask,
  } = useDashboardTasks({
    taskColors: TASK_COLORS,
    formatDate,
    weekDates,
    createDefaultTasks,
  });

  const [sessionsByDay, setSessionsByDay] = useState<Record<string, number>>(() => createDefaultSessionsByDay());
  const [studyData, setStudyData] = useState<Record<string, number[]>>(() =>
    createDefaultStudyData(currentWeekStart)
  );
  const [streakDays, setStreakDays] = useState(1);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const [streakBump, setStreakBump] = useState(false);
  const prevStreakRef = useRef<number | null>(null);
  const hasInitializedStreakRef = useRef(false);
  const hasHydratedStreakRef = useRef(false);
  const [hasGuestAccess, setHasGuestAccess] = useState(false);
  const requestedAuthMode = ((location.state as { authMode?: 'signup' | 'login' } | null)?.authMode ?? null) as
    | 'signup'
    | 'login'
    | null;
  const shouldShowDashboardAuthGate = !loading && !user && !hasGuestAccess;
  const {
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
    startTimer,
    resetTimerToCurrentDuration,
  } = useDashboardTimer({
    timerModes: TIMER_MODES,
    alarmSoundSrc: alarmSound,
    addElapsedStudySeconds,
    formatDate,
    getCurrentWeekDates,
    setStudyData,
    setSessionsByDay,
  });
  const {
    messages,
    setMessages,
    chatInput,
    setChatInput,
    isSendingChat,
    handleSendChat,
  } = useDashboardChat({
    defaultMessages: DEFAULT_CHAT_MESSAGES,
    tasks,
    sessionsByDay,
    sessionsCompletedToday: sessionsByDay[formatDate(new Date())] ?? 0,
    timerContext: {
      mode: timerMode,
      minutes: safeMinutes,
      timeLeft,
      isRunning,
    },
    currentDateContext: buildCurrentDateContext(),
    taskColors: TASK_COLORS,
    formatDate,
    isValidTaskDate,
    isValidTaskTime,
    findMatchingTaskIndex,
    parseTimerActionFromMessage,
    applyChatTimerAction,
    setTasks,
  });

  useEffect(() => {
    if (user) {
      setHasGuestAccess(false);
      window.localStorage.removeItem(DASHBOARD_GUEST_ACCESS_KEY);
      return;
    }

    setHasGuestAccess(window.localStorage.getItem(DASHBOARD_GUEST_ACCESS_KEY) === 'true');
  }, [user]);
  const currentWeekKey = currentWeekStart;
  const weekTotal = (studyData[currentWeekKey] || []).reduce((sum, n) => sum + n, 0);
  const { isDashboardHydrated } = useDashboardPersistence({
    userId: user?.id,
    loading,
    currentWeekStart,
    tasks,
    setTasks,
    studyData,
    setStudyData,
    sessionsByDay,
    setSessionsByDay,
    messages,
    setMessages,
    defaultMessages: DEFAULT_CHAT_MESSAGES,
    createDefaultTasks,
    createDefaultStudyData,
    createDefaultSessionsByDay,
    buildTimerState,
    hydrateTimerState,
    resetHydrationGuard,
    remoteSaveIntervalMs: REMOTE_DASHBOARD_SAVE_INTERVAL_MS,
  });

  useEffect(() => {
    if (!chatScrollRef.current) return;
    chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [messages, isSendingChat, isDashboardHydrated]);

  useEffect(() => {
    setStudyData((prev) => {
      if (prev[currentWeekStart]) return prev;
      return { ...prev, [currentWeekStart]: [0, 0, 0, 0, 0, 0, 0] };
    });
  }, [currentWeekStart]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const getMinutesForDate = (targetDate: Date, data: Record<string, number[]>) => {
    const normalized = new Date(targetDate);
    normalized.setHours(0, 0, 0, 0);

    const dayOfWeek = normalized.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday start
    const weekStart = new Date(normalized);
    weekStart.setDate(normalized.getDate() + diff);

    const weekKey = formatDate(weekStart);
    const weekArray = data[weekKey];
    if (!weekArray) return 0;

    const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const value = weekArray[index];
    return typeof value === 'number' && !Number.isNaN(value) ? value : 0;
  };

  const computeStreakFromStudyData = (data: Record<string, number[]>) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;

    for (let i = 0; i < 365; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const minutes = getMinutesForDate(day, data);

      if (minutes >= MINIMUM_STREAK_MINUTES) {
        streak += 1;
        continue;
      }

      // Only ignore the first empty day (today before avoir étudié); any earlier gap ends the streak.
      if (i === 0) continue;
      break;
    }
    return streak;
  };
  useEffect(() => {
    const updateStreak = () => {
      const nextStreak = computeStreakFromStudyData(studyData);
      setStreakDays(nextStreak);
    };

    updateStreak();
    const interval = setInterval(updateStreak, 60000);
    return () => clearInterval(interval);
  }, [studyData]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const roundedStudiedMinutes = Math.round(weekTotal);
  const todayKey = formatDate(new Date());
  const sessionsCompletedToday = sessionsByDay[todayKey] ?? 0;
  const activeWeekKey = formatDate(weekDates[0]);
  const activeWeekMinutesRaw = studyData[activeWeekKey] ?? [];
  const activeWeekMinutes = Array.from({ length: 7 }, (_, i) => activeWeekMinutesRaw[i] ?? 0);
  const maxWeekMinutes = Math.max(60, ...activeWeekMinutes);
  const activeWeekTotalMinutes = Math.round(activeWeekMinutes.reduce((sum, n) => sum + n, 0));
  const todayDay = new Date().getDay();
  const daysElapsedThisWeek = todayDay === 0 ? 7 : todayDay;
  const elapsedWeekTotalMinutes = Math.round(
    activeWeekMinutes.slice(0, daysElapsedThisWeek).reduce((sum, n) => sum + n, 0)
  );
  const averageDailyMinutes = Math.round(elapsedWeekTotalMinutes / Math.max(1, daysElapsedThisWeek));
  const previousWeekStart = new Date(weekDates[0]);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  const previousWeekKey = formatDate(previousWeekStart);
  const previousWeekMinutes = studyData[previousWeekKey] ?? [];
  const previousWeekTotalMinutes = Math.round(previousWeekMinutes.reduce((sum, n) => sum + (n || 0), 0));
  const weekDeltaMinutes = activeWeekTotalMinutes - previousWeekTotalMinutes;
  const monthRangeStart = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1);
  const monthRangeEnd = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 0);
  const monthRangeLabel =
    timeView === 'month'
      ? formatMonthRangeLabel(monthRangeStart, monthRangeEnd)
      : formatMonthRangeLabel(weekDates[0], weekDates[weekDates.length - 1]);
  const calendarDates = timeView === 'month' ? monthGridDates : weekDates;
  const headerDates = timeView === 'month' ? calendarDates.slice(0, 7) : weekDates;
  const studyGoalMinutes = 240;
  const studyProgressRatio = Math.min(1, roundedStudiedMinutes / studyGoalMinutes || 0);
  const streakSegments = 7;
  const streakFilledSegments = Math.min(streakDays, streakSegments);
  const taskProgressRatio = totalTasks > 0 ? completedTasks / totalTasks : 0;
  const streakColor = streakDays > 0 ? '#F97316' : '#6B7280';
  const isCurrentRangeToday = (date: Date) =>
    isToday(date) && (timeView === 'month' ? monthOffset === 0 : weekOffset === 0);
  const handlePrevRange = () => {
    if (timeView === 'month') {
      setMonthOffset((prev) => prev - 1);
      return;
    }
    setWeekOffset((prev) => prev - 1);
  };
  const handleNextRange = () => {
    if (timeView === 'month') {
      setMonthOffset((prev) => prev + 1);
      return;
    }
    setWeekOffset((prev) => prev + 1);
  };
  const handleToday = () => {
    if (timeView === 'month') {
      setMonthOffset(0);
      return;
    }
    setWeekOffset(0);
  };
  useEffect(() => {
    if (!hasInitializedStreakRef.current) {
      prevStreakRef.current = streakDays;
      hasInitializedStreakRef.current = true;
      return;
    }

    if (!hasHydratedStreakRef.current) {
      prevStreakRef.current = streakDays;
      hasHydratedStreakRef.current = true;
      return;
    }

    if (prevStreakRef.current !== null && streakDays > prevStreakRef.current) {
      setStreakBump(true);
      setTimeout(() => setStreakBump(false), 240);
    }
    prevStreakRef.current = streakDays;
  }, [streakDays]);

  useEffect(() => {
    const nextPositions: Record<string, number> = {};

    visibleTasks.forEach((task) => {
      const node = taskListItemRefs.current[task.id];
      if (!node) return;

      const nextTop = node.getBoundingClientRect().top;
      const previousTop = taskListPositionsRef.current[task.id];
      nextPositions[task.id] = nextTop;

      if (previousTop === undefined) return;

      const deltaY = previousTop - nextTop;
      if (Math.abs(deltaY) < 1) return;

      const isTargetTask = pendingTaskMotionRef.current?.id === task.id;
      const direction = pendingTaskMotionRef.current?.direction;

      node.animate(
        isTargetTask && direction === 'down'
          ? [
              { transform: `translateY(${deltaY}px)`, offset: 0 },
              { transform: 'translateY(8px)', offset: 0.84 },
              { transform: 'translateY(0)', offset: 1 },
            ]
          : isTargetTask && direction === 'up'
            ? [
                { transform: `translateY(${deltaY}px)`, offset: 0 },
                { transform: 'translateY(-6px)', offset: 0.82 },
                { transform: 'translateY(0)', offset: 1 },
              ]
            : [
                { transform: `translateY(${deltaY}px)` },
                { transform: 'translateY(0)' },
              ],
        {
          duration: isTargetTask ? 420 : 280,
          easing: isTargetTask ? 'cubic-bezier(0.18, 0.9, 0.2, 1)' : 'cubic-bezier(0.22, 1, 0.36, 1)',
        }
      );
    });

    taskListPositionsRef.current = nextPositions;
    pendingTaskMotionRef.current = null;
  }, [visibleTasks]);

  const renderTaskInfoPopoverContent = (task: Task, close: () => void) => (
    <TaskDetailsPopoverContent
      task={task}
      editingNameId={editingNameId}
      editingNameValue={editingNameValue}
      onEditingNameValueChange={setEditingNameValue}
      onCommitEditingName={commitEditingName}
      onCancelEditingName={cancelEditingName}
      onStartEditingName={startEditingName}
      onUpdateTask={updateTask}
      onDeleteTask={(taskId) => setTasks((prev) => prev.filter((candidate) => candidate.id !== taskId))}
      onClose={close}
    />
  );

  const tasksListContent = (
    <div className="space-y-0.5">
      {agendaTasks.length === 0 ? (
        <div className="mt-2 text-[#ECECF3] text-lg">Aucune tâche pour l’instant</div>
      ) : (
        <div className="mt-3 divide-y divide-[#25293A]">
          {visibleTasks.map((task) => {
            const taskDate = parseLocalDateString(task.date);
            const displayDate = taskDate
              ? taskDate.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })
              : 'Date à définir';
            return (
              <div
                key={task.id}
                ref={(node) => {
                  taskListItemRefs.current[task.id] = node;
                }}
                className={`group relative flex items-start gap-2 py-2 ${task.completed ? 'opacity-60' : ''}`}
              >
                <div className="mt-0.5">
                  <Checkbox
                    checked={task.completed}
                    onClick={(e) => e.stopPropagation()}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="rounded-sm h-4 w-4 border-2 border-[#7C8DB5] bg-[#101524] shadow-[0_0_0_1px_rgba(65,105,225,0.25)] data-[state=checked]:bg-[#4169E1] data-[state=checked]:border-[#A5C4FF] data-[state=checked]:shadow-[0_0_0_2px_rgba(65,105,225,0.35)]"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  {editingNameId === task.id ? (
                    <Input
                      value={editingNameValue}
                      onChange={(e) => setEditingNameValue(e.target.value)}
                      onBlur={() => commitEditingName(task.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          commitEditingName(task.id);
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          cancelEditingName();
                        }
                      }}
                      autoFocus
                      className="h-7 px-2 text-sm rounded-lg border-[#2B3550] bg-[#101524] text-[#ECECF3]"
                    />
                  ) : (
                    <div
                      className={`text-sm font-medium text-left break-words ${
                        task.completed ? 'line-through' : ''
                      } ${task.urgent ? 'text-red-400' : 'text-[#ECECF3]'}`}
                    >
                      {task.name || 'Tâche sans titre'}
                    </div>
                  )}
                  <div className={`mt-0.5 text-xs text-[#A9ACBA] ${task.completed ? 'line-through' : ''}`}>
                    {displayDate} {task.time ? `· ${task.time}` : ''}
                  </div>
                </div>

                <div className="ml-auto flex items-start">
                  <Popover open={infoTaskId === task.id} onOpenChange={(open) => setInfoTaskId(open ? task.id : null)}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 transition text-[#A9ACBA] hover:text-[#ECECF3] rounded-full border border-[#3B4154] h-6 w-6 p-0"
                        aria-label="Détails de la tâche"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </Button>
                    </PopoverTrigger>
                    {renderTaskInfoPopoverContent(task, () => setInfoTaskId(null))}
                  </Popover>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="pt-2">
        <div className="flex items-center gap-2 text-sm text-[#A9ACBA]">
          <span>{completedTasksCount} terminées</span>
          <span>•</span>
          <Button
            type="button"
            onClick={() => setShowCompletedTasks((prev) => !prev)}
            variant="ghost"
            className="h-auto p-0 text-[#F43F5E] hover:text-[#FF5E7A]"
          >
            {showCompletedTasks ? 'Masquer' : 'Afficher'}
          </Button>
          <span>•</span>
          <Popover open={deleteCompletedMenuOpen} onOpenChange={setDeleteCompletedMenuOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-auto p-0 text-[#E16941] hover:text-[#F18B6B]"
                disabled={completedTasksCount === 0}
              >
                Supprimer
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              side="top"
              sideOffset={10}
              className="w-[260px] rounded-[24px] border border-white/10 bg-[#2B2F3A]/92 p-2 text-[#ECECF3] backdrop-blur-xl shadow-[0_32px_80px_rgba(0,0,0,0.55)]"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => deleteCompletedTasks(1)}
                  className="flex w-full items-center rounded-2xl px-3 py-2.5 text-left text-sm text-[#ECECF3] transition hover:bg-white/[0.06]"
                >
                  Plus vieux qu’un mois
                </button>
                <button
                  type="button"
                  onClick={() => deleteCompletedTasks(3)}
                  className="flex w-full items-center rounded-2xl px-3 py-2.5 text-left text-sm text-[#ECECF3] transition hover:bg-white/[0.06]"
                >
                  Plus vieux que 3 mois
                </button>
                <button
                  type="button"
                  onClick={() => deleteCompletedTasks(12)}
                  className="flex w-full items-center rounded-2xl px-3 py-2.5 text-left text-sm text-[#ECECF3] transition hover:bg-white/[0.06]"
                >
                  Plus vieux qu’un an
                </button>
                <button
                  type="button"
                  onClick={() => deleteCompletedTasks()}
                  className="flex w-full items-center rounded-2xl px-3 py-2.5 text-left text-sm text-[#E16941] transition hover:bg-[rgba(225,105,65,0.08)]"
                >
                  Tout supprimer
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#ECECF3] p-6 md:p-10">
      <style>{`
        .streak {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .streak__icon {
          width: 1.6rem;
          height: 1.6rem;
          line-height: 1;
        }
        .streak__num {
          font-size: 0.95rem;
          font-weight: 700;
        }
        .streak--bump {
          animation: streakBump 220ms ease-out;
        }
        @keyframes streakBump {
          0% {
            transform: scale(1);
            filter: drop-shadow(0 0 0 rgba(249, 115, 22, 0));
          }
          60% {
            transform: scale(1.08);
            filter: drop-shadow(0 0 16px rgba(249, 115, 22, 0.55));
          }
          100% {
            transform: scale(1);
            filter: drop-shadow(0 0 0 rgba(249, 115, 22, 0));
          }
        }
      `}</style>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-xl md:text-2xl font-semibold text-[#ECECF3]">
                  {getGreeting()}, {userName} 👋
                </h1>
                <p className="text-[#A9ACBA] text-sm">Prêt(e) à continuer ton voyage d&apos;apprentissage ?</p>
              </div>
              <div
                className={`streak text-sm font-bold ${streakBump ? 'streak--bump' : ''}`}
                style={{ color: streakColor }}
              >
                <Flame className="streak__icon" />
                <span className="streak__num">{streakDays}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <Button
                onClick={async () => {
                  const { error } = await signOut();
                  if (error) {
                    console.error('Supabase sign out error:', error);
                    return;
                  }
                  clearUserData();
                  navigate('/');
                }}
                variant="ghost"
                className="text-[#A9ACBA] hover:text-[#ECECF3] hover:bg-[#1F2230] rounded-xl"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            ) : null}
            <Button
              onClick={() => navigate('/parametres')}
              variant="ghost"
              className="text-[#A9ACBA] hover:text-[#ECECF3] hover:bg-[#1F2230] rounded-xl"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
        {!user ? (
          <div className="bg-[#161924] border border-[#1F2230] rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
            <div>
              <p className="text-sm text-[#A9ACBA]">Mode invité</p>
              <p className="text-base text-[#ECECF3]">
                Connecte-toi pour sauvegarder et synchroniser tes progrès.
              </p>
            </div>
            <Button
              onClick={() => navigate('/login')}
              className="bg-[#4169E1] hover:bg-[#3557C1] text-white rounded-xl px-4"
            >
              Se connecter
            </Button>
          </div>
        ) : null}

        <div className="grid gap-6 items-stretch md:grid-cols-2">
          <TimerCard
            timerMode={timerMode}
            timerMinutes={timerMinutes}
            timeLeft={timeLeft}
            progress={progress}
            ringColor={ringColor}
            isRunning={isRunning}
            isInitialTime={isInitialTime}
            safeMinutes={safeMinutes}
            isEditingTimer={isEditingTimer}
            editingTimerValue={editingTimerValue}
            presetMinutes={TIMER_PRESET_MINUTES}
            formatTime={formatTime}
            onModeSelect={(mode) => {
              const next = TIMER_MODES[mode];
              setTimerMode(mode);
              setIsEditingTimer(false);
              setCustomTimerMinutes(next.minutes);
            }}
            onToggleRunning={() => {
              if (isRunning) {
                setIsRunning(false);
                return;
              }
              startTimer();
            }}
            onReset={resetTimerToCurrentDuration}
            onPresetSelect={setCustomTimerMinutes}
            onCustomClick={() => {
              setIsEditingTimer(true);
              setEditingTimerValue(timerMinutes.toString());
            }}
            onEditingValueChange={setEditingTimerValue}
            onEditingFocus={() => {
              setIsEditingTimer(true);
              if (!editingTimerValue) {
                setEditingTimerValue(timerMinutes.toString());
              }
            }}
            onEditingBlur={() => setIsEditingTimer(false)}
            onEditingCancel={() => {
              setIsEditingTimer(false);
              setEditingTimerValue(timerMinutes.toString());
            }}
            onEditingCommit={commitTimerEdit}
          />

          <ChatCard
            chatScrollRef={chatScrollRef}
            messages={messages}
            isSendingChat={isSendingChat}
            chatInput={chatInput}
            setChatInput={setChatInput}
            onSend={() => void handleSendChat()}
            renderFormattedMessage={renderFormattedMessage}
          />
        </div>

        <AgendaCard
          timeView={timeView}
          calendarMode={calendarMode}
          uploadNotice={uploadNotice}
          tasksListContent={tasksListContent}
          headerDates={headerDates}
          calendarDates={calendarDates}
          monthRangeStart={monthRangeStart}
          showAddDialog={showAddDialog}
          modalTaskId={modalTaskId}
          taskDetailsId={taskDetailsId}
          editingNameId={editingNameId}
          editingNameValue={editingNameValue}
          onTimeViewChange={setTimeView}
          onCalendarModeChange={setCalendarMode}
          onToday={handleToday}
          onPrevRange={handlePrevRange}
          onNextRange={handleNextRange}
          onAgendaImageUpload={handleAgendaImageUpload}
          isCurrentRangeToday={isCurrentRangeToday}
          getDayName={getDayName}
          formatDate={formatDate}
          getTasksForDate={getTasksForDate}
          onCreateTask={(dateString) => {
            if (Date.now() < ignoreCalendarClickUntilRef.current) return;
            const newTask: Task = {
              id: Date.now().toString(),
              name: '(Titre)',
              completed: false,
              color: selectedColor,
              urgent: false,
              date: dateString,
              time: undefined,
            };
            setTasks((prev) => [...prev, newTask]);
            setSelectedDate(dateString);
            setNewTaskName('(Titre)');
            setModalTaskId(newTask.id);
            setDraftTaskId(newTask.id);
            draftTaskIdRef.current = newTask.id;
            setEditingNameId(newTask.id);
            setEditingNameValue('(Titre)');
            setShowAddDialog(true);
          }}
          onToggleTask={toggleTask}
          onEditingNameValueChange={setEditingNameValue}
          onCommitEditingName={commitEditingName}
          onCancelEditingName={cancelEditingName}
          onTaskDetailsChange={setTaskDetailsId}
          renderTaskInfoPopoverContent={renderTaskInfoPopoverContent}
        />

        <StudyStatsCard
          weekDates={weekDates}
          activeWeekMinutes={activeWeekMinutes}
          maxWeekMinutes={maxWeekMinutes}
          activeWeekTotalMinutes={activeWeekTotalMinutes}
          averageDailyMinutes={averageDailyMinutes}
          weekDeltaMinutes={weekDeltaMinutes}
          getDayName={getDayName}
        />

        <TaskCreationDialog
          open={showAddDialog && !!modalTask}
          title={newTaskName}
          date={selectedDate}
          time={selectedTime}
          selectedColor={selectedColor}
          colors={TASK_COLORS}
          onOpenChange={(open) => {
            if (!open) {
              cancelDraftTask(draftTaskIdRef.current);
            }
          }}
          onTitleChange={(value) => {
            setNewTaskName(value);
            if (modalTaskId) {
              updateTask(modalTaskId, { name: value.trim() || '(Titre)' });
            }
          }}
          onDateChange={(value) => {
            setSelectedDate(value);
            if (modalTaskId) {
              updateTask(modalTaskId, { date: value || undefined });
            }
          }}
          onTimeChange={(value) => {
            setSelectedTime(value);
            if (modalTaskId) {
              updateTask(modalTaskId, { time: value || undefined });
            }
          }}
          onColorChange={(value) => {
            setSelectedColor(value);
            if (modalTaskId) {
              updateTask(modalTaskId, { color: value });
            }
          }}
          onClose={() => {
            cancelDraftTask(draftTaskIdRef.current);
          }}
          onSave={saveTask}
        />

        <DashboardAuthGate
          open={shouldShowDashboardAuthGate}
          initialMode={requestedAuthMode}
          onContinueWithoutAccount={() => {
            window.localStorage.setItem(DASHBOARD_GUEST_ACCESS_KEY, 'true');
            setHasGuestAccess(true);
          }}
        />
      </div>
    </div>
  );
}
