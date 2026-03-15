import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Flame,
  Info,
  List,
  LogOut,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Settings,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { TaskEditor } from '../components/TaskModal';
import alarmSound from '../assets/Gentle-little-bell-ringing-sound-effect.mp3';
import { useAuth } from '../lib/auth';
import {
  clearUserData,
  loadDashboardDataFromLocal,
  loadDashboardDataFromSupabase,
  saveDashboardDataToLocal,
  saveDashboardDataToSupabase,
  type DashboardTask,
} from '../lib/storage';

type Task = DashboardTask;

const TASK_COLORS = ['#6B9AC4', '#4169E1', '#8B8680', '#E16941', '#41E169', '#9B59B6', '#F39C12', '#E91E63'];

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

const createDefaultTasks = () => {
  const initialWeek = getCurrentWeekDates();
  return [
    {
      id: '1',
      name: 'Réviser les notes de mathématiques',
      completed: false,
      color: '#6B9AC4',
      urgent: false,
      date: formatDate(new Date()),
    },
    {
      id: '2',
      name: 'Terminer le devoir de chimie',
      completed: false,
      color: '#4169E1',
      urgent: false,
      date: formatDate(initialWeek[2]),
      time: '09:00',
    },
    {
      id: '3',
      name: "Réunion d'équipe",
      completed: false,
      color: '#6B9AC4',
      urgent: false,
      date: formatDate(initialWeek[3]),
      time: '14:00',
    },
  ];
};

const createDefaultStudyData = (weekStart: string) => ({
  [weekStart]: [0, 0, 0, 0, 0, 0, 0],
});

const createDefaultSessionsByDay = () => {
  const todayKey = formatDate(new Date());
  return { [todayKey]: 0 };
};

export function TableauDeBord({ userName = 'étudiant' }: TableauDeBordScreenProps) {
  const navigate = useNavigate();
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
  const [taskPopoverSide, setTaskPopoverSide] = useState<'left' | 'right'>('right');
  const taskPopoverAnchorRef = useRef<HTMLDivElement | null>(null);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const lastTickRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const [streakBump, setStreakBump] = useState(false);
  const prevStreakRef = useRef<number | null>(null);
  const hasInitializedStreakRef = useRef(false);
  const hasHydratedStreakRef = useRef(false);
  const [isDashboardHydrated, setIsDashboardHydrated] = useState(false);

  const safeMinutes = Math.max(5, timerMinutes || 5);
  const ringColor = TIMER_MODES[timerMode].color;
  const currentWeekKey = currentWeekStart;
  const weekTotal = (studyData[currentWeekKey] || []).reduce((sum, n) => sum + n, 0);

  useEffect(() => {
    let isMounted = true;

    const hydrateDashboardData = async () => {
      if (loading) return;
      const cached = loadDashboardDataFromLocal(user?.id);
      if (cached && isMounted) {
        if (Array.isArray(cached.tasks)) setTasks(cached.tasks);
        if (cached.studyData && typeof cached.studyData === 'object') setStudyData(cached.studyData);
        if (cached.sessionsByDay && typeof cached.sessionsByDay === 'object') setSessionsByDay(cached.sessionsByDay);
        setIsDashboardHydrated(true);
      }
      if (!user) {
        setTasks(createDefaultTasks());
        setStudyData(createDefaultStudyData(currentWeekStart));
        setSessionsByDay(createDefaultSessionsByDay());
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
    if (loading || !user || !isDashboardHydrated) return;
    const payload = { tasks, studyData, sessionsByDay };
    saveDashboardDataToSupabase(user.id, payload);
    saveDashboardDataToLocal(user.id, payload);
  }, [user, tasks, studyData, sessionsByDay, isDashboardHydrated, loading]);

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
      setTimerMinutes(clamped);
      setTimeLeft(clamped * 60);
    }
    setIsEditingTimer(false);
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

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    );
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

  useLayoutEffect(() => {
    if (!showAddDialog || !modalTaskId || !taskPopoverAnchorRef.current) return;
    const rect = taskPopoverAnchorRef.current.getBoundingClientRect();
    const estimatedPopoverWidth = 380;
    const spaceRight = window.innerWidth - rect.right;
    setTaskPopoverSide(spaceRight < estimatedPopoverWidth ? 'left' : 'right');
  }, [showAddDialog, modalTaskId, timeView, calendarMode]);

  const tasksListContent = (
    <div className="space-y-0.5">
      <div>
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
          <Button
            type="button"
            onClick={() => setTasks((prev) => prev.filter((task) => !task.completed))}
            variant="ghost"
            className="h-auto p-0 text-[#E16941] hover:text-[#F18B6B]"
            disabled={completedTasksCount === 0}
          >
            Supprimer
          </Button>
        </div>
      </div>
      {agendaTasks.length === 0 ? (
        <div className="mt-2 text-[#ECECF3] text-lg">Aucune tâche pour l’instant</div>
      ) : (
        <div className="mt-3 divide-y divide-[#25293A]">
          {visibleTasks.map((task) => {
            const taskDate = task.date ? new Date(task.date) : null;
            const displayDate = taskDate
              ? taskDate.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })
              : 'Date à définir';
            return (
              <div
                key={task.id}
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
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => startEditingName(task)}
                      className={`h-auto p-0 text-sm font-medium text-left break-words ${
                        task.completed ? 'line-through' : ''
                      } ${task.urgent ? 'text-red-400' : 'text-[#ECECF3]'} hover:bg-transparent`}
                    >
                      {task.name || 'Tâche sans titre'}
                    </Button>
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
                          setInfoTaskId(null);
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
                              setInfoTaskId(null);
                            }}
                            className="h-auto p-0 text-red-500 hover:text-red-400"
                            aria-label="Supprimer la tâche"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            );
          })}
        </div>
      )}
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
          {/* Pomodoro */}
          <Card className="bg-[#161924] border-[#1F2230] rounded-3xl p-6 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.06)] h-full">
            <div className="mb-2">
              <p className="text-sm text-[#A9ACBA]">Minuteur</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1.1fr,1fr] items-start">
              <div className="flex flex-col items-center justify-start gap-5 pt-1">
                <div className="flex gap-3">
                  {(
                    [
                      { key: 'focus', label: 'Focus' },
                      { key: 'short', label: 'Courte pause' },
                      { key: 'long', label: 'Longue pause' },
                    ] as const
                  ).map(({ key, label }) => {
                    const isActive = timerMode === key;
                    const color = TIMER_MODES[key].color;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          const next = TIMER_MODES[key];
                          setTimerMode(key);
                          setIsRunning(false);
                          setIsEditingTimer(false);
                          setTimerMinutes(next.minutes);
                          setTimeLeft(next.minutes * 60);
                          setEditingTimerValue(next.minutes.toString());
                        }}
                        className="px-3 py-2 rounded-xl text-sm font-semibold transition shadow-sm border"
                        style={
                          isActive
                            ? {
                                backgroundColor: color,
                                color: '#0B0D10',
                                borderColor: color,
                                boxShadow: `0 0 12px ${color}80`,
                              }
                            : {
                                backgroundColor: '#1A1D26',
                                color: '#ECECF3',
                                borderColor: '#1F2230',
                              }
                        }
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div
                  className="relative w-48 h-48 rounded-full flex items-center justify-center"
                  style={{
                    background: `conic-gradient(${ringColor} ${progress * 3.6}deg, #1F2230 ${progress * 3.6}deg)`,
                    boxShadow: `0 0 12px ${ringColor}b3, 0 0 32px ${ringColor}99, 0 0 64px ${ringColor}66`,
                  }}
                >
                  <div className="absolute inset-3 bg-[#0B0D10] rounded-full shadow-inner flex flex-col items-center justify-center">
                    {isEditingTimer ? (
                      <Input
                        type="number"
                        min={5}
                        max={120}
                        value={editingTimerValue}
                        onChange={(e) => setEditingTimerValue(e.target.value)}
                        onBlur={commitTimerEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            commitTimerEdit();
                          }
                          if (e.key === 'Escape') {
                            setIsEditingTimer(false);
                            setEditingTimerValue(timerMinutes.toString());
                          }
                        }}
                        className="w-24 text-center rounded-xl border-[#1F2230]"
                        autoFocus
                      />
                    ) : (
                      <>
                        <button
                          type="button"
                          className="text-3xl font-semibold text-[#ECECF3]"
                          onClick={() => {
                            setIsRunning(false);
                            setIsEditingTimer(true);
                            setEditingTimerValue(timerMinutes.toString());
                          }}
                        >
                          {formatTime(timeLeft)}
                        </button>
                        <span className="text-xs text-[#A9ACBA]">{timerMinutes} min</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setIsRunning((running) => {
                        if (running) {
                          lastTickRef.current = null;
                          return false;
                        }
                        lastTickRef.current = performance.now();
                        return true;
                      });
                    }}
                    className="flex-1 bg-[#4169E1] hover:bg-[#3557C1] text-white rounded-2xl"
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        {isInitialTime ? 'Lancer' : 'Relancer'}
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsRunning(false);
                      setTimeLeft(safeMinutes * 60);
                    }}
                    variant="outline"
                    className="flex-1 rounded-2xl border-[#1F2230]"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Réinitialiser
                  </Button>
                </div>

                <div className="flex items-center justify-between text-sm text-[#A9ACBA]">
                  <span className="text-sm text-[#A9ACBA]">
                    {sessionsCompletedToday} sessions terminées aujourd&apos;hui
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Chat IA */}
          <Card className="bg-[#161924] border-[#1F2230] rounded-3xl p-6 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.06)] h-full flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-[#A9ACBA]">Chat IA</p>
              <span className="text-xs text-[#7F869A]">Bêta</span>
            </div>
            <div className="flex-1 rounded-2xl border border-[#1F2230] bg-[#0F1117] p-4 text-sm text-[#A9ACBA]">
              Commence une conversation pour obtenir de l&apos;aide sur tes tâches ou ton planning.
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Input
                placeholder="Écris ta question..."
                className="h-10 rounded-xl border-[#1F2230] bg-[#0F1117] text-[#ECECF3]"
              />
              <Button className="h-10 rounded-xl bg-[#4169E1] hover:bg-[#3557C1] text-white px-4">
                Envoyer
              </Button>
            </div>
          </Card>
        </div>

        {/* Agenda en ligne */}
        <Card className="bg-[#161924] border-[#1F2230] rounded-3xl p-6 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.06)] space-y-2">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[#A9ACBA]">Agenda en ligne</p>
            <div className="flex flex-wrap items-center justify-between gap-4">
              {calendarMode === 'calendar' ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    className="h-11 rounded-full border-[#2B3550] bg-[#0F1117] text-[#ECECF3] hover:bg-[#1A1D26] px-5"
                    onClick={handleToday}
                  >
                    Aujourd&apos;hui
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={handlePrevRange}
                      variant="ghost"
                      className="h-11 w-11 rounded-full border border-transparent bg-transparent text-[#ECECF3] p-0"
                      aria-label="Période précédente"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-[#0F1117]">
                        <ChevronLeft className="w-5 h-5" />
                      </span>
                    </Button>
                    <Button
                      type="button"
                      onClick={handleNextRange}
                      variant="ghost"
                      className="h-11 w-11 rounded-full border border-transparent bg-transparent text-[#ECECF3] p-0"
                      aria-label="Période suivante"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-[#0F1117]">
                        <ChevronRight className="w-5 h-5" />
                      </span>
                    </Button>
                  </div>
                  <div className="text-2xl font-semibold text-[#ECECF3] capitalize">{monthRangeLabel}</div>
                </div>
              ) : calendarMode === 'tasks' ? (
                <div className="text-2xl font-semibold text-[#ECECF3]">Tâches à faire</div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {calendarMode === 'calendar' ? (
                    <Select value={timeView} onValueChange={(value: 'week' | 'month') => setTimeView(value)}>
                      <SelectTrigger className="h-11 min-h-11 w-[128px] rounded-full border-[#2B3550] bg-[#0F1117] px-4 text-sm font-semibold text-[#ECECF3] hover:bg-[#1A1D26] focus-visible:border-[#2B3550] focus-visible:ring-0 data-[size=default]:h-11">
                        <SelectValue>{timeView === 'week' ? 'Semaine' : 'Mois'}</SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-[#1F2230] bg-[#161924] text-[#ECECF3] shadow-[0_22px_60px_rgba(0,0,0,0.35)]">
                        <SelectItem value="week" className="rounded-lg py-2 text-sm">
                          Semaine
                        </SelectItem>
                        <SelectItem value="month" className="rounded-lg py-2 text-sm">
                          Mois
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : null}
                  <div className="relative inline-flex items-center h-11 w-[102px] rounded-full border border-[#2B3550] bg-[#0F1117] overflow-hidden">
                    <div
                      className={`absolute top-0 bottom-0 w-1/2 bg-[#9FD0FF] ${
                        calendarMode === 'calendar'
                          ? 'left-0 rounded-l-full rounded-r-none'
                          : 'left-1/2 rounded-r-full rounded-l-none'
                      }`}
                    />
                    <Button
                      type="button"
                      onClick={() => setCalendarMode('calendar')}
                      variant="ghost"
                      className={`relative z-10 h-full w-1/2 rounded-none flex items-center justify-center transition ${
                        calendarMode === 'calendar'
                          ? 'text-[#0B0D10]'
                          : 'text-[#A9ACBA] hover:text-[#ECECF3] hover:bg-white/5'
                      }`}
                      aria-label="Vue calendrier"
                    >
                      <Calendar className="w-5 h-5" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCalendarMode('tasks')}
                      variant="ghost"
                      className={`relative z-10 h-full w-1/2 rounded-none flex items-center justify-center transition ${
                        calendarMode === 'tasks'
                          ? 'text-[#0B0D10]'
                          : 'text-[#A9ACBA] hover:text-[#ECECF3] hover:bg-white/5'
                      }`}
                      aria-label="Vue liste"
                    >
                      <List className="w-5 h-5" />
                    </Button>
                  </div>
                  <Button asChild variant="ghost" className="h-11 px-4 rounded-full border border-[#2B3550] bg-[#0F1117] text-sm font-semibold text-[#ECECF3] hover:bg-[#1A1D26]">
                    <label htmlFor="agendaUpload" className="flex items-center gap-2 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      Importer une photo
                    </label>
                  </Button>
                  <input
                    id="agendaUpload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleAgendaImageUpload(e.target.files?.[0])}
                  />
                </div>
                {calendarMode === 'tasks' ? null : null}
              </div>
            </div>

          </div>

          {uploadNotice && (
            <div className="mt-3 text-xs text-[#A9ACBA] bg-[#0F1117] rounded-2xl px-3 py-2 inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#4169E1]" />
              {uploadNotice}
            </div>
          )}

          {calendarMode === 'tasks' ? (
            <div className="mt-2">{tasksListContent}</div>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <div className="w-[1104px] min-w-[1104px] shrink-0">
                <div className="grid grid-cols-7 border-b border-[#1F2230]">
                  {headerDates.map((date, index) => (
                    <div
                      key={index}
                      className={`p-3 text-center border-r border-[#1F2230] last:border-r-0 ${
                        timeView === 'week' && isCurrentRangeToday(date) ? 'bg-[#4169E1]/5' : ''
                      }`}
                    >
                      <div className="text-[10px] text-[#A9ACBA] uppercase mb-1">{getDayName(date)}</div>
                      {timeView === 'week' ? (
                        <div
                          className={`text-base font-semibold w-8 h-8 rounded-full flex items-center justify-center mx-auto transition ${
                            isCurrentRangeToday(date)
                              ? 'text-white bg-[#4169E1]'
                              : 'text-[#ECECF3] hover:bg-[#2B2F3A]'
                          }`}
                        >
                          {date.getDate()}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className={`grid grid-cols-7 ${timeView === 'month' ? '' : 'min-h-[380px]'}`}>
                  {calendarDates.map((date, index) => {
                    const dateString = formatDate(date);
                    const tasksForDay = getTasksForDate(dateString);
                    const isOutsideMonth =
                      timeView === 'month' &&
                      (date.getMonth() !== monthRangeStart.getMonth() ||
                        date.getFullYear() !== monthRangeStart.getFullYear());

                    return (
                      <div
                        key={index}
                        onClick={() => {
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
                        className={`group border-r border-b border-[#1F2230] last:border-r-0 cursor-pointer ${
                          timeView === 'month' ? 'aspect-square p-2.5' : 'p-3'
                        } ${isCurrentRangeToday(date) ? 'bg-[#4169E1]/5' : ''} ${
                          isOutsideMonth ? 'bg-[#121520] text-[#6F7587]' : ''
                        }`}
                      >
                        {timeView === 'month' ? (
                          <div className="flex items-center justify-center mb-2">
                            <div
                              className={`text-xs font-semibold w-8 h-8 rounded-full flex items-center justify-center ${
                                isCurrentRangeToday(date) ? 'text-white bg-[#4169E1]' : 'text-[#A9ACBA]'
                              }`}
                            >
                              {date.getDate()}
                            </div>
                          </div>
                        ) : null}
                        <div className={timeView === 'month' ? 'space-y-2' : 'space-y-3'}>
                          {tasksForDay.map((task) => {
                            const shouldShowEditor = showAddDialog && modalTaskId === task.id;
                            const isMonthView = timeView === 'month';

                            const taskCard = (
                              <div
                                ref={shouldShowEditor ? taskPopoverAnchorRef : undefined}
                                className="rounded-xl px-2.5 py-1.5 text-xs bg-[#182032] border border-[#2B3550] text-[#ECECF3] shadow-[0_4px_12px_rgba(65,105,225,0.06)]"
                                style={{
                                  borderLeft: `${isMonthView ? 3 : 4}px solid ${task.color}`,
                                }}
                              >
                                <div className="flex items-center gap-2 min-h-[18px]">
                                  <div className="flex items-center justify-center">
                                    <Checkbox
                                      checked={task.completed}
                                      onClick={(e) => e.stopPropagation()}
                                      onCheckedChange={() => toggleTask(task.id)}
                                      className="rounded-sm h-4 w-4 border-2 border-[#7C8DB5] bg-[#101524] shadow-[0_0_0_1px_rgba(65,105,225,0.25)] data-[state=checked]:bg-[#4169E1] data-[state=checked]:border-[#A5C4FF] data-[state=checked]:shadow-[0_0_0_2px_rgba(65,105,225,0.35)]"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0 flex items-center">
                                    <div className="flex items-center gap-1">
                                      {task.time && (
                                        <span className="text-[10px] text-[#A9ACBA]">
                                          {task.time}
                                        </span>
                                      )}
                                    </div>

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
                                      className="h-6 px-2 text-xs md:text-xs rounded-lg border-[#2B3550] bg-[#101524] text-[#ECECF3]"
                                      />
                                    ) : (
                                      <div
                                        className={`text-left text-xs leading-none break-words ${
                                          task.completed ? 'line-through opacity-50' : ''
                                        } ${task.urgent ? 'text-red-400' : 'text-[#ECECF3]'}`}
                                      >
                                        {task.name}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );

                            const taskDateLabel = task.date
                              ? new Date(task.date).toLocaleDateString('fr-FR', {
                                  weekday: 'long',
                                  day: '2-digit',
                                  month: 'long',
                                })
                              : 'Date à définir';
                            const taskTimeLabel = task.time ? task.time : '';

                            return (
                              <div key={task.id}>
                                {shouldShowEditor ? (
                                  <Popover
                                    open={shouldShowEditor}
                                    onOpenChange={(open) => {
                                      if (!open) {
                                        cancelDraftTask(draftTaskIdRef.current);
                                      }
                                    }}
                                  >
                                    <PopoverAnchor asChild>
                                      <div onClick={(e) => e.stopPropagation()}>{taskCard}</div>
                                    </PopoverAnchor>
                                    <PopoverContent
                                      side={taskPopoverSide}
                                      align="start"
                                      sideOffset={12}
                                      collisionPadding={16}
                                      className="w-[360px] max-w-[calc(100vw-2rem)] rounded-[24px] border border-white/10 bg-[#2B2F3A]/95 text-[#ECECF3] text-sm p-4 shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
                                      onOpenAutoFocus={(e) => e.preventDefault()}
                                    >
                                      <TaskEditor
                                        title={newTaskName}
                                        onTitleChange={(value) => {
                                          setNewTaskName(value);
                                          if (modalTaskId) {
                                            updateTask(modalTaskId, { name: value.trim() || '(Titre)' });
                                          }
                                        }}
                                        titlePlaceholder="Ajouter un titre"
                                        date={selectedDate}
                                        onDateChange={(value) => {
                                          setSelectedDate(value);
                                          if (modalTaskId) {
                                            updateTask(modalTaskId, { date: value || undefined });
                                          }
                                        }}
                                        time={selectedTime}
                                        onTimeChange={(value) => {
                                          setSelectedTime(value);
                                          if (modalTaskId) {
                                            updateTask(modalTaskId, { time: value || undefined });
                                          }
                                        }}
                                        selectedColor={selectedColor}
                                        colors={TASK_COLORS}
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
                                    </PopoverContent>
                                  </Popover>
                                ) : (
                                  <Popover
                                    open={taskDetailsId === task.id}
                                    onOpenChange={(open) => setTaskDetailsId(open ? task.id : null)}
                                  >
                                    <PopoverTrigger asChild>
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setTaskDetailsId(task.id);
                                        }}
                                      >
                                        {taskCard}
                                      </div>
                                    </PopoverTrigger>
                                    <PopoverContent
                                      side="right"
                                      align="start"
                                      sideOffset={12}
                                      collisionPadding={16}
                                      className="w-[360px] max-w-[calc(100vw-2rem)] rounded-[24px] border border-white/10 bg-[#2B2F3A]/95 text-[#ECECF3] text-sm p-4 shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
                                      onOpenAutoFocus={(e) => e.preventDefault()}
                                    >
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                          <span
                                            className="h-4 w-4 rounded-[6px]"
                                            style={{ backgroundColor: task.color }}
                                          />
                                          <div className="text-lg font-semibold">
                                            {task.name || '(Titre)'}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-[#A9ACBA]">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              startEditingName(task);
                                            }}
                                            className="p-2 rounded-full hover:bg-white/5"
                                            aria-label="Modifier la tâche"
                                          >
                                            <Pencil className="w-4 h-4" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setTasks((prev) => prev.filter((t) => t.id !== task.id));
                                              setTaskDetailsId(null);
                                            }}
                                            className="p-2 rounded-full hover:bg-white/5"
                                            aria-label="Supprimer la tâche"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                      <div className="mt-3 text-sm text-[#A9ACBA]">
                                        {taskDateLabel}
                                        {taskTimeLabel ? ` • ${taskTimeLabel}` : ''}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Temps étudié */}
        <Card className="bg-[#161924] border-[#1F2230] rounded-3xl p-6 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.06)] space-y-2">
          <div className="flex flex-col gap-0">
            <p className="text-sm text-[#A9ACBA]">Temps étudié</p>
            <div className="flex flex-wrap items-center justify-between gap-3"></div>
          </div>

          <div className="mt-2 overflow-x-auto">
            <div className="w-[1104px] min-w-[1104px] grid grid-cols-7 gap-3 items-end">
              {weekDates.map((date, index) => {
                const minutes = Math.round(activeWeekMinutes[index] ?? 0);
                const showBar = minutes > 0;
                const barHeight = Math.max(8, Math.min(220, (minutes / (maxWeekMinutes || 1)) * 220));
                return (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <div className="w-full bg-[#1B2030] rounded-2xl h-56 flex items-end">
                      {showBar && (
                        <div
                          className="w-full bg-[#4169E1] rounded-2xl transition-all"
                          style={{ height: `${barHeight}px` }}
                        />
                      )}
                    </div>
                    <div className="text-xs text-[#ECECF3] font-medium">{minutes} min</div>
                    <div className="text-xs text-[#A9ACBA] uppercase mb-1">{getDayName(date)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="w-[1104px] min-w-[1104px] grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-[#A9ACBA]">Total de cette semaine</p>
                <p className="text-2xl text-[#ECECF3]">{activeWeekTotalMinutes} min</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-[#A9ACBA]">Moyenne quotidienne</p>
                <p className="text-2xl text-[#ECECF3]">{averageDailyMinutes} min</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-[#A9ACBA]">Écart depuis la semaine passée</p>
                <p className="text-2xl text-[#ECECF3]">
                  {weekDeltaMinutes >= 0 ? '+' : '-'}
                  {Math.abs(weekDeltaMinutes)} min
                </p>
              </div>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
