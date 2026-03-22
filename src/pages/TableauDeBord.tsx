import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Flame,
  Info,
  LogOut,
  Pencil,
  Settings,
  Trash2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Switch } from '../ui/switch';
import { DashboardAuthGate } from '../components/DashboardAuthGate';
import { AgendaCard } from '../components/dashboard/AgendaCard';
import { ChatCard } from '../components/dashboard/ChatCard';
import { StudyStatsCard } from '../components/dashboard/StudyStatsCard';
import { TaskCreationDialog } from '../components/dashboard/TaskCreationDialog';
import { TimerCard } from '../components/dashboard/TimerCard';
import alarmSound from '../assets/Gentle-little-bell-ringing-sound-effect.mp3';
import { useAuth } from '../lib/auth';
import {
  clearUserData,
  type DashboardData,
  type DashboardChatMessage,
  type DashboardTimerState,
  loadDashboardDataFromLocal,
  loadDashboardDataFromSupabase,
  saveDashboardDataToLocal,
  saveDashboardDataToSupabase,
  type DashboardTask,
} from '../lib/storage';

type Task = DashboardTask;
type ChatTaskAction = {
  tool?: 'add_task';
  name?: string;
  date?: string;
  time?: string;
  urgent?: boolean;
  color?: string;
};

type ChatDeleteTaskAction = {
  tool?: 'delete_task';
  target_name?: string;
  target_date?: string;
  target_time?: string;
};

type ChatUpdateTaskAction = {
  tool?: 'update_task';
  target_name?: string;
  target_date?: string;
  target_time?: string;
  new_name?: string;
  date?: string;
  time?: string;
  urgent?: boolean;
  color?: string;
  completed?: boolean;
};

type ChatTimerAction = {
  tool?: 'set_timer';
  action?: 'start' | 'pause' | 'reset' | 'set';
  mode?: keyof typeof TIMER_MODES;
  minutes?: number;
};

type ChatAction = ChatTaskAction | ChatDeleteTaskAction | ChatUpdateTaskAction | ChatTimerAction;

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

  const [tasks, setTasks] = useState<Task[]>(() => createDefaultTasks());

  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(timerMinutes * 60);
  const [timerMode, setTimerMode] = useState<keyof typeof TIMER_MODES>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [editingTimerValue, setEditingTimerValue] = useState('');
  const [sessionsByDay, setSessionsByDay] = useState<Record<string, number>>(() => createDefaultSessionsByDay());
  const [studyData, setStudyData] = useState<Record<string, number[]>>(() =>
    createDefaultStudyData(currentWeekStart)
  );
  const [streakDays, setStreakDays] = useState(1);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TASK_COLORS[0]);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [selectedTime, setSelectedTime] = useState('');
  const [infoTaskId, setInfoTaskId] = useState<string | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [modalTaskId, setModalTaskId] = useState<string | null>(null);
  const [draftTaskId, setDraftTaskId] = useState<string | null>(null);
  const draftTaskIdRef = useRef<string | null>(null);
  const [taskDetailsId, setTaskDetailsId] = useState<string | null>(null);
  const ignoreCalendarClickUntilRef = useRef(0);
  const [deleteCompletedMenuOpen, setDeleteCompletedMenuOpen] = useState(false);
  const taskListItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const taskListPositionsRef = useRef<Record<string, number>>({});
  const pendingTaskMotionRef = useRef<{ id: string; direction: 'down' | 'up' } | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const lastTickRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const [streakBump, setStreakBump] = useState(false);
  const prevStreakRef = useRef<number | null>(null);
  const hasInitializedStreakRef = useRef(false);
  const hasHydratedStreakRef = useRef(false);
  const [isDashboardHydrated, setIsDashboardHydrated] = useState(false);
  const [messages, setMessages] = useState<DashboardChatMessage[]>(DEFAULT_CHAT_MESSAGES);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [hasGuestAccess, setHasGuestAccess] = useState(false);
  const pendingRemoteSaveRef = useRef<DashboardData | null>(null);
  const pendingRemoteSaveUserIdRef = useRef<string | null>(null);
  const timerStateHydratedRef = useRef(false);

  const safeMinutes = Math.max(5, timerMinutes || 5);
  const ringColor = TIMER_MODES[timerMode].color;
  const requestedAuthMode = ((location.state as { authMode?: 'signup' | 'login' } | null)?.authMode ?? null) as
    | 'signup'
    | 'login'
    | null;
  const shouldShowDashboardAuthGate = !loading && !user && !hasGuestAccess;

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

    const nextMinutes = Math.min(120, Math.max(5, persistedTimerState.minutes || TIMER_MODES[persistedTimerState.mode].minutes));
    const cappedRemainingSeconds = Math.min(
      nextMinutes * 60,
      Math.max(0, persistedTimerState.remainingSeconds || 0)
    );

    setTimerMode(persistedTimerState.mode);
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

    if (persistedTimerState.mode === 'focus' && effectiveElapsedSeconds > 0) {
      const elapsedEndMs = persistedTimerState.updatedAt + effectiveElapsedSeconds * 1000;
      setStudyData((prev) => addElapsedStudySeconds(prev, persistedTimerState.updatedAt, elapsedEndMs));
    }

    if (remainingAfterResume <= 0) {
      if (persistedTimerState.mode === 'focus' && effectiveElapsedSeconds > 0) {
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

  useEffect(() => {
    let isMounted = true;
    timerStateHydratedRef.current = false;

    const hydrateDashboardData = async () => {
      if (loading) return;
      const cached = loadDashboardDataFromLocal(user?.id);
      if (cached && isMounted) {
        if (Array.isArray(cached.tasks)) setTasks(cached.tasks);
        if (cached.studyData && typeof cached.studyData === 'object') setStudyData(cached.studyData);
        if (cached.sessionsByDay && typeof cached.sessionsByDay === 'object') setSessionsByDay(cached.sessionsByDay);
        if (Array.isArray(cached.chatMessages) && cached.chatMessages.length > 0) {
          setMessages(cached.chatMessages);
        }
        hydrateTimerState(cached.timerState);
        setIsDashboardHydrated(true);
        return;
      }
      if (!user) {
        setTasks(createDefaultTasks());
        setStudyData(createDefaultStudyData(currentWeekStart));
        setSessionsByDay(createDefaultSessionsByDay());
        setMessages(DEFAULT_CHAT_MESSAGES);
        setIsDashboardHydrated(true);
        return;
      }

      const remoteData = await loadDashboardDataFromSupabase(user.id);
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
            : DEFAULT_CHAT_MESSAGES
        );
        hydrateTimerState(remoteData.timerState);
        saveDashboardDataToLocal(user.id, remoteData);
      }

      setIsDashboardHydrated(true);
    };

    hydrateDashboardData();

    return () => {
      isMounted = false;
    };
  }, [user, currentWeekStart, loading]);

  useEffect(() => {
    if (loading || !isDashboardHydrated) return;
    const payload = { tasks, studyData, sessionsByDay, chatMessages: messages, timerState: buildTimerState() };
    saveDashboardDataToLocal(user?.id, payload);
    if (user) {
      pendingRemoteSaveRef.current = payload;
      pendingRemoteSaveUserIdRef.current = user.id;
    }
  }, [user, tasks, studyData, sessionsByDay, messages, timerMode, safeMinutes, timeLeft, isRunning, isDashboardHydrated, loading]);

  useEffect(() => {
    if (loading || !isDashboardHydrated || !user) return;

    const flushRemoteSave = () => {
      const pendingPayload = pendingRemoteSaveRef.current;
      const pendingUserId = pendingRemoteSaveUserIdRef.current;
      if (!pendingPayload || !pendingUserId) return;

      pendingRemoteSaveRef.current = null;
      void saveDashboardDataToSupabase(pendingUserId, pendingPayload);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushRemoteSave();
      }
    };

    const intervalId = window.setInterval(flushRemoteSave, REMOTE_DASHBOARD_SAVE_INTERVAL_MS);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      flushRemoteSave();
    };
  }, [user, isDashboardHydrated, loading]);

  useEffect(() => {
    if (!chatScrollRef.current) return;
    chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [messages, isSendingChat, isDashboardHydrated]);

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
  }, [isRunning, safeMinutes, timerMode]);

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

  const formatTime = (value: number) => {
    const minutes = Math.floor(value / 60)
      .toString()
      .padStart(2, '0');
    const seconds = Math.floor(value % 60)
      .toString()
      .padStart(2, '0');
    return `${minutes}:${seconds}`;
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

  const commitTimerEdit = () => {
    const parsed = Number(editingTimerValue);
    if (Number.isFinite(parsed)) {
      const clamped = Math.min(120, Math.max(5, parsed));
      setCustomTimerMinutes(clamped);
    }
    setIsEditingTimer(false);
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

  const applyTimerSettings = (nextMode: keyof typeof TIMER_MODES, nextMinutes: number) => {
    setTimerMode(nextMode);
    setCustomTimerMinutes(nextMinutes);
  };

  const applyChatTimerAction = (timerAction: ChatTimerAction) => {
    const requestedMode =
      timerAction.mode && timerAction.mode in TIMER_MODES ? (timerAction.mode as keyof typeof TIMER_MODES) : timerMode;
    const requestedMinutes = Number.isFinite(timerAction.minutes)
      ? Math.min(120, Math.max(5, Math.round(timerAction.minutes as number)))
      : timerAction.mode && timerAction.mode in TIMER_MODES
        ? TIMER_MODES[timerAction.mode as keyof typeof TIMER_MODES].minutes
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

  const getTasksForDate = (date: string) => {
    return tasks
      .filter((task) => task.date === date)
      .sort((a, b) => {
        if (a.time && b.time) return a.time.localeCompare(b.time);
        if (a.time) return -1;
        if (b.time) return 1;
        return 0;
      });
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

  const resetTaskForm = () => {
    setNewTaskName('');
    setSelectedColor(TASK_COLORS[0]);
    setSelectedDate(formatDate(new Date()));
    setSelectedTime('');
    setModalTaskId(null);
    setDraftTaskId(null);
    draftTaskIdRef.current = null;
  };

  const cancelDraftTask = (id?: string | null) => {
    ignoreCalendarClickUntilRef.current = Date.now() + 250;
    const targetId = id ?? draftTaskIdRef.current ?? draftTaskId;
    if (targetId) {
      setTasks((prev) => prev.filter((t) => t.id !== targetId));
    }
    setShowAddDialog(false);
    resetTaskForm();
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...updates } : task)));
  };

  const startEditingName = (task: Task) => {
    setEditingNameId(task.id);
    setEditingNameValue(task.name || '');
  };

  const cancelEditingName = () => {
    setEditingNameId(null);
    setEditingNameValue('');
  };

  const commitEditingName = (id: string) => {
    const nextName = editingNameValue.trim();
    if (nextName) {
      updateTask(id, { name: nextName });
    }
    cancelEditingName();
  };

  const saveTask = () => {
    ignoreCalendarClickUntilRef.current = Date.now() + 250;
    const effectiveId = modalTaskId ?? draftTaskIdRef.current ?? draftTaskId;
    if (effectiveId) {
      updateTask(effectiveId, {
        name: newTaskName.trim() || '(Titre)',
        date: selectedDate || undefined,
        time: selectedTime || undefined,
        color: selectedColor,
      });
      setShowAddDialog(false);
      resetTaskForm();
      return;
    }
    if (!newTaskName.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      name: newTaskName.trim(),
      completed: false,
      color: selectedColor,
      urgent: false,
      date: selectedDate || undefined,
      time: selectedTime || undefined,
    };
    setTasks((prev) => [...prev, newTask]);

    setShowAddDialog(false);
    resetTaskForm();
  };

  const modalTask = modalTaskId ? tasks.find((task) => task.id === modalTaskId) ?? null : null;

  const toggleTask = (id: string) => {
    const targetTask = tasks.find((task) => task.id === id);
    if (targetTask) {
      pendingTaskMotionRef.current = {
        id,
        direction: targetTask.completed ? 'up' : 'down',
      };
    }

    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    );
  };

  const deleteCompletedTasks = (ageInMonths?: number) => {
    const now = new Date();
    const cutoff = ageInMonths
      ? new Date(now.getFullYear(), now.getMonth() - ageInMonths, now.getDate())
      : null;

    setTasks((prev) =>
      prev.filter((task) => {
        if (!task.completed) return true;
        if (!cutoff) return false;
        if (!task.date) return true;

        const taskDate = new Date(`${task.date}T00:00`);
        return taskDate > cutoff;
      })
    );
    setDeleteCompletedMenuOpen(false);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleAgendaImageUpload = (file?: File) => {
    if (!file) return;
    const extracted: Task[] = [
      {
        id: `photo-${Date.now()}-1`,
        name: 'Importer le planning photo',
        completed: false,
        color: '#F39C12',
        urgent: false,
        date: formatDate(weekDates[2]),
        time: '12:00',
      },
    ];
    setTasks((prev) => [...prev, ...extracted]);
    setUploadNotice(`Photo importée et analysée (mock) : ${file.name}`);
  };

  const progress = Math.min(100, Math.max(0, ((safeMinutes * 60 - timeLeft) / (safeMinutes * 60)) * 100));
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const roundedStudiedMinutes = Math.round(weekTotal);
  const isInitialTime = Math.abs(timeLeft - safeMinutes * 60) < 0.5;
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
  const agendaTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      const aDate = new Date(`${a.date || formatDate(new Date())}T${a.time || '00:00'}`);
      const bDate = new Date(`${b.date || formatDate(new Date())}T${b.time || '00:00'}`);
      return aDate.getTime() - bDate.getTime();
    });
  }, [tasks]);
  const completedTasksCount = completedTasks;
  const visibleTasks = showCompletedTasks ? agendaTasks : agendaTasks.filter((task) => !task.completed);

  useEffect(() => {
    alarmRef.current = new Audio(alarmSound);
    alarmRef.current.load();
    return () => {
      if (alarmRef.current) {
        alarmRef.current.pause();
        alarmRef.current = null;
      }
    };
  }, []);

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
    <PopoverContent
      align="end"
      side="bottom"
      sideOffset={12}
      className="w-96 max-w-[calc(100vw-2rem)] rounded-[24px] border border-white/10 bg-[#2B2F3A]/95 text-[#ECECF3] text-sm shadow-[0_32px_80px_rgba(0,0,0,0.7)] p-4"
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      <Button
        type="button"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}
        className="absolute right-3 top-3 text-[#A9ACBA] hover:text-[#ECECF3] text-2xl leading-none h-8 w-8 p-0"
        aria-label="Fermer"
      >
        ×
      </Button>
      <div className="flex items-start gap-3 pt-2 pr-8 pl-1">
        <div className="min-w-0">
          <div className="text-sm text-[#A9ACBA]">Modifier la tâche</div>
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
              className="mt-1 h-8 px-2 text-base rounded-lg border-[#2B3550] bg-[#101524] text-[#ECECF3]"
            />
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => startEditingName(task)}
              className="mt-1 h-auto p-0 text-base font-semibold text-left text-[#ECECF3] break-words cursor-text hover:bg-transparent"
            >
              {task.name || 'Tâche sans titre'}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-3">
        <div className="rounded-2xl border border-[#2B3550] bg-[#161924]">
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2 border-b border-[#2B3550]">
            <div>
              <div className="text-sm text-[#ECECF3]">Date</div>
              <div className="text-xs text-[#7F869A]">Définir une date</div>
            </div>
            <Input
              type="date"
              value={task.date ?? 'yyyy-mm-dd'}
              onChange={(e) => updateTask(task.id, { date: e.target.value })}
              className="h-7 w-auto bg-[#101524] text-xs text-[#ECECF3] rounded-lg border-[#2B3550] px-1.5 text-right appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:hidden"
              style={{
                width: `${Math.max(1, (task.date ?? 'yyyy-mm-dd').length) + 2}ch`,
              }}
            />
          </div>
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2 border-b border-[#2B3550]">
            <div>
              <div className="text-sm text-[#ECECF3]">Heure</div>
              <div className="text-xs text-[#7F869A]">Optionnel</div>
            </div>
            <Input
              type="time"
              value={task.time ?? '00:00'}
              onChange={(e) => updateTask(task.id, { time: e.target.value })}
              className="h-7 w-auto bg-[#101524] text-xs text-[#ECECF3] rounded-lg border-[#2B3550] px-2 text-right appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:hidden"
              size={Math.max(1, (task.time ?? '00:00').length)}
            />
          </div>
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2">
            <div>
              <div className="text-sm text-[#ECECF3]">Urgent</div>
              <div className="text-xs text-[#7F869A]">Met le titre en rouge</div>
            </div>
            <Switch
              checked={!!task.urgent}
              onCheckedChange={(checked) => updateTask(task.id, { urgent: checked })}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setTasks((prev) => prev.filter((t) => t.id !== task.id));
              close();
            }}
            className="h-auto p-0 text-red-500 hover:text-red-400"
            aria-label="Supprimer la tâche"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </PopoverContent>
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

  const handleSendChat = async () => {
    const message = chatInput.trim();
    if (!message || isSendingChat) return;
    const nextMessages = [...messages, { role: 'user' as const, content: message }];

    setMessages(nextMessages);
    setChatInput('');
    setIsSendingChat(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          message,
          context: {
            tasks,
            history: nextMessages.slice(-12),
            timerSessions: {
              completedToday: sessionsCompletedToday,
              byDay: sessionsByDay,
            },
            timer: {
              mode: timerMode,
              minutes: safeMinutes,
              timeLeft,
              isRunning,
            },
            currentDate: buildCurrentDateContext(),
          },
        }),
      });

      const responseText = await response.text();
      let payload: { reply?: string; error?: string; actions?: ChatAction[] } | null = null;

      try {
        payload = responseText ? JSON.parse(responseText) : null;
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const errorMessage =
          payload?.error ??
          responseText ??
          `Edge Function returned status ${response.status}.`;

        setMessages((prev) => [...prev, { role: 'assistant', content: errorMessage }]);
        return;
      }

      if (!payload?.reply) {
        if (!Array.isArray(payload?.actions) || payload.actions.length === 0) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: 'La fonction a repondu sans message exploitable.' },
          ]);
          return;
        }
      }

      const taskActions = Array.isArray(payload?.actions)
        ? payload.actions.filter(
            (action): action is ChatTaskAction =>
              (action.tool === 'add_task' || action.tool === undefined) &&
              typeof action?.name === 'string' &&
              action.name.trim().length > 0
          )
        : [];

      const deleteTaskActions = Array.isArray(payload?.actions)
        ? payload.actions.filter(
            (action): action is ChatDeleteTaskAction =>
              action.tool === 'delete_task' &&
              typeof action.target_name === 'string' &&
              action.target_name.trim().length > 0
          )
        : [];

      const updateTaskActions = Array.isArray(payload?.actions)
        ? payload.actions.filter(
            (action): action is ChatUpdateTaskAction =>
              action.tool === 'update_task' &&
              typeof action.target_name === 'string' &&
              action.target_name.trim().length > 0
          )
        : [];

      const timerActions = Array.isArray(payload?.actions)
        ? payload.actions.filter(
            (action): action is ChatTimerAction =>
              action.tool === 'set_timer' && typeof action.action === 'string'
          )
        : [];
      const fallbackTimerAction = timerActions.length === 0 ? parseTimerActionFromMessage(message) : null;
      const effectiveTimerActions = fallbackTimerAction ? [fallbackTimerAction] : timerActions;

      if (taskActions.length > 0) {
        const newTasks: Task[] = taskActions.map((action, index) => ({
          id: `ai-${Date.now()}-${index}`,
          name: action.name!.trim(),
          completed: false,
          color:
            typeof action.color === 'string' && TASK_COLORS.includes(action.color)
              ? action.color
              : TASK_COLORS[index % TASK_COLORS.length],
          urgent: !!action.urgent,
          date: isValidTaskDate(action.date) ? action.date : formatDate(new Date()),
          time: isValidTaskTime(action.time) ? action.time : undefined,
        }));

        setTasks((prev) => [...prev, ...newTasks]);
      }

      if (deleteTaskActions.length > 0) {
        setTasks((prev) => {
          const nextTasks = [...prev];

          deleteTaskActions.forEach((action) => {
            const matchIndex = findMatchingTaskIndex(nextTasks, action.target_name, action.target_date, action.target_time);
            if (matchIndex >= 0) {
              nextTasks.splice(matchIndex, 1);
            }
          });

          return nextTasks;
        });
      }

      if (updateTaskActions.length > 0) {
        setTasks((prev) => {
          const nextTasks = [...prev];

          updateTaskActions.forEach((action) => {
            const matchIndex = findMatchingTaskIndex(nextTasks, action.target_name, action.target_date, action.target_time);
            if (matchIndex < 0) return;

            const existingTask = nextTasks[matchIndex];
            nextTasks[matchIndex] = {
              ...existingTask,
              name: typeof action.new_name === 'string' && action.new_name.trim() ? action.new_name.trim() : existingTask.name,
              date: isValidTaskDate(action.date) ? action.date : existingTask.date,
              time: isValidTaskTime(action.time) ? action.time : existingTask.time,
              urgent: typeof action.urgent === 'boolean' ? action.urgent : existingTask.urgent,
              color:
                typeof action.color === 'string' && TASK_COLORS.includes(action.color) ? action.color : existingTask.color,
              completed: typeof action.completed === 'boolean' ? action.completed : existingTask.completed,
            };
          });

          return nextTasks;
        });
      }

      if (effectiveTimerActions.length > 0) {
        effectiveTimerActions.forEach((action) => applyChatTimerAction(action));
      }

      const assistantReply =
        payload?.reply && payload.reply.trim()
          ? payload.reply
          : taskActions.length > 0
            ? `${taskActions.length} tache${taskActions.length > 1 ? 's ont ete ajoutees' : ' a ete ajoutee'} au calendrier.`
            : deleteTaskActions.length > 0
              ? 'La tache demandee a ete retiree du calendrier.'
              : updateTaskActions.length > 0
                ? 'La tache demandee a ete modifiee.'
            : effectiveTimerActions.length > 0
              ? 'Le minuteur a ete mis a jour.'
            : 'Aucune reponse.';

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantReply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: error instanceof Error ? error.message : 'Erreur inconnue.' },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

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
              setIsRunning(false);
              setIsEditingTimer(false);
              setTimerMinutes(next.minutes);
              setTimeLeft(next.minutes * 60);
              setEditingTimerValue(next.minutes.toString());
            }}
            onToggleRunning={() => {
              setIsRunning((running) => {
                if (running) {
                  lastTickRef.current = null;
                  return false;
                }
                lastTickRef.current = performance.now();
                return true;
              });
            }}
            onReset={() => {
              setIsRunning(false);
              lastTickRef.current = null;
              setTimeLeft(safeMinutes * 60);
            }}
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
