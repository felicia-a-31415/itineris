import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Pause, Play, Plus, RotateCcw, Settings, Sparkles, Upload, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import alarmSound from '../assets/Christmas-jingle-bells-notification-melody.mp3';

interface Task {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  color: string;
  priority: 1 | 2 | 3;
  date?: string;
  time?: string;
}

const TASK_COLORS = ['#6B9AC4', '#4169E1', '#8B8680', '#E16941', '#41E169', '#9B59B6', '#F39C12', '#E91E63'];

const PRIORITIES = [
  { value: 1, label: '!', name: 'Basse' },
  { value: 2, label: '!!', name: 'Moyenne' },
  { value: 3, label: '!!!', name: 'Haute' },
] as const;

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

const formatWeekRangeLabel = (dates: Date[]) => {
  if (!dates.length) return '';
  const start = dates[0];
  const end = dates[dates.length - 1];
  const months = [
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
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = months[start.getMonth()];
  const endMonth = months[end.getMonth()];
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startMonth === endMonth && startYear === endYear) {
    return `Semaine du ${startDay} au ${endDay} ${endMonth} ${endYear}`;
  }
  return `Semaine du ${startDay} ${startMonth} ${startYear} au ${endDay} ${endMonth} ${endYear}`;
};

interface TableauDeBordScreenProps {
  userName?: string;
}

const TASK_STORAGE_KEY = 'itineris_tasks';
const STUDY_MINUTES_KEY = 'itineris_study_minutes';
const STREAK_STORAGE_KEY = 'itineris_streak';
const SESSIONS_STORAGE_KEY = 'itineris_sessions_completed';

const TIMER_MODES = {
  focus: { label: 'Focus', minutes: 25, color: '#3B82F6' },
  short: { label: 'Courte pause', minutes: 5, color: '#22C55E' },
  long: { label: 'Longue pause', minutes: 15, color: '#8B5CF6' },
} as const;

export function TableauDeBord({ userName = 'étudiant' }: TableauDeBordScreenProps) {
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = useMemo(() => getCurrentWeekDates(weekOffset), [weekOffset]);
  const currentWeekStart = formatDate(getCurrentWeekDates(0)[0]);

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(TASK_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (err) {
      console.error('Impossible de charger les tâches', err);
    }

    const initialWeek = getCurrentWeekDates();
    return [
      {
        id: '1',
        name: 'Réviser les notes de mathématiques',
        description: 'Chapitres 3-5',
        completed: false,
        color: '#6B9AC4',
        priority: 2,
        date: formatDate(new Date()),
      },
      {
        id: '2',
        name: 'Terminer le devoir de chimie',
        description: 'Exercices page 45-48',
        completed: false,
        color: '#4169E1',
        priority: 3,
        date: formatDate(initialWeek[2]),
        time: '09:00',
      },
      {
        id: '3',
        name: "Réunion d'équipe",
        description: 'Discuter du projet final',
        completed: false,
        color: '#6B9AC4',
        priority: 1,
        date: formatDate(initialWeek[3]),
        time: '14:00',
      },
    ];
  });

  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(timerMinutes * 60);
  const [timerMode, setTimerMode] = useState<keyof typeof TIMER_MODES>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [editingTimerValue, setEditingTimerValue] = useState('');
  const [sessionsByDay, setSessionsByDay] = useState<Record<string, number>>(() => {
    const todayKey = formatDate(new Date());
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              const obj: Record<string, any> = parsed;
              const cleaned: Record<string, number> = {};
              Object.entries(obj).forEach(([k, v]) => {
                const num = Number(v);
                if (!Number.isNaN(num) && num >= 0) cleaned[k] = num;
              });
              if (Object.keys(cleaned).length) return cleaned;
            }
          } catch {
            const parsedNumber = Number(raw);
            if (!Number.isNaN(parsedNumber) && parsedNumber >= 0) {
              return { [todayKey]: parsedNumber };
            }
          }
        }
      }
    } catch (err) {
      console.error('Impossible de charger les sessions terminées', err);
    }
    return { [todayKey]: 0 };
  });
  const [studyData, setStudyData] = useState<Record<string, number[]>>(() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(STUDY_MINUTES_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const obj = parsed as Record<string, any>;
            if ('weekStart' in obj && 'minutes' in obj && typeof obj.weekStart === 'string') {
              return { [obj.weekStart]: [Number(obj.minutes) || 0, 0, 0, 0, 0, 0, 0] };
            }
            const cleaned: Record<string, number[]> = {};
            Object.entries(obj).forEach(([k, v]) => {
              if (Array.isArray(v)) {
                cleaned[k] = v.map((n) => (typeof n === 'number' && !Number.isNaN(n) ? n : 0));
              }
            });
            return cleaned;
          }
        }
      }
    } catch (err) {
      console.error('Impossible de charger les minutes étudiées', err);
    }
    return { [currentWeekStart]: [0, 0, 0, 0, 0, 0, 0] };
  });
  const [streakDays, setStreakDays] = useState(1);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(TASK_COLORS[0]);
  const [selectedPriority, setSelectedPriority] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [selectedTime, setSelectedTime] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);

  const safeMinutes = Math.max(5, timerMinutes || 5);
  const ringColor = TIMER_MODES[timerMode].color;
  const currentWeekKey = currentWeekStart;
  const weekTotal = (studyData[currentWeekKey] || []).reduce((sum, n) => sum + n, 0);

  useEffect(() => {
    if (!isRunning) return;
    lastTickRef.current = lastTickRef.current ?? Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const lastTick = lastTickRef.current ?? now;
      const deltaSec = Math.max(1, Math.floor((now - lastTick) / 1000));

      setTimeLeft((prev) => {
        if (prev <= deltaSec) {
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
        return prev - deltaSec;
      });

      const todayDates = getCurrentWeekDates(0);
      const todayKey = formatDate(todayDates[0]);
      const todayIndex = todayDates.findIndex((d) => formatDate(d) === formatDate(new Date()));

      if (timerMode === 'focus') {
        setStudyData((prev) => {
          const next = { ...prev };
          const weekArray = [...(next[todayKey] ?? [0, 0, 0, 0, 0, 0, 0])];
          const idx = todayIndex >= 0 ? todayIndex : 0;
          weekArray[idx] = (weekArray[idx] ?? 0) + deltaSec / 60;
          next[todayKey] = weekArray;
          return next;
        });
      }
      lastTickRef.current = now;
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, safeMinutes, timerMode]);

  // Sauver les tâches à chaque modification
  useEffect(() => {
    try {
      localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      console.error('Impossible de sauvegarder les tâches', err);
    }
  }, [tasks]);

  // Sauver le temps étudié
  useEffect(() => {
    try {
      localStorage.setItem(STUDY_MINUTES_KEY, JSON.stringify(studyData));
    } catch (err) {
      console.error('Impossible de sauvegarder le temps étudié', err);
    }
  }, [studyData]);

  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessionsByDay));
    } catch (err) {
      console.error('Impossible de sauvegarder les sessions terminées', err);
    }
  }, [sessionsByDay]);

  // S'assurer qu'une entrée existe pour la semaine courante
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STUDY_MINUTES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          setStudyData({ [currentWeekStart]: [0, 0, 0, 0, 0, 0, 0] });
          return;
        }
        if (!parsed[currentWeekStart]) {
          setStudyData({ ...parsed, [currentWeekStart]: [0, 0, 0, 0, 0, 0, 0] });
        }
      } else {
        setStudyData({ [currentWeekStart]: [0, 0, 0, 0, 0, 0, 0] });
      }
    } catch {
      setStudyData({ [currentWeekStart]: [0, 0, 0, 0, 0, 0, 0] });
    }
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

  const getPriorityLabel = (priority: 1 | 2 | 3) => {
    return PRIORITIES.find((p) => p.value === priority)?.label || '!';
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

      if (minutes > 0) {
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
        lastTickRef.current = Date.now();
      }
    } else {
      document.title = 'itineris';
      lastTickRef.current = null;
    }
    return () => {
      document.title = 'itineris';
    };
  }, [isRunning, timeLeft]);

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
      try {
        localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify({ streak: nextStreak, last: formatDate(new Date()) }));
      } catch (err) {
        console.error('Impossible de sauvegarder le streak', err);
      }
    };

    updateStreak();
    const interval = setInterval(updateStreak, 60000);
    return () => clearInterval(interval);
  }, [studyData]);

  const resetTaskForm = () => {
    setNewTaskName('');
    setNewTaskDescription('');
    setSelectedColor(TASK_COLORS[0]);
    setSelectedPriority(1);
    setSelectedDate(formatDate(new Date()));
    setSelectedTime('');
    setEditingTaskId(null);
  };

  const saveTask = () => {
    if (!newTaskName.trim()) return;

    if (editingTaskId) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === editingTaskId
            ? {
                ...task,
                name: newTaskName.trim(),
                description: newTaskDescription.trim(),
                color: selectedColor,
                priority: selectedPriority,
                date: selectedDate || undefined,
                time: selectedTime || undefined,
              }
            : task
        )
      );
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        name: newTaskName.trim(),
        description: newTaskDescription.trim(),
        completed: false,
        color: selectedColor,
        priority: selectedPriority,
        date: selectedDate || undefined,
        time: selectedTime || undefined,
      };
      setTasks((prev) => [...prev, newTask]);
    }

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
        description: `IA: extrait depuis ${file.name}`,
        completed: false,
        color: '#F39C12',
        priority: 2,
        date: formatDate(weekDates[2]),
        time: '12:00',
      },
    ];
    setTasks((prev) => [...prev, ...extracted]);
    setUploadNotice(`Photo importée et analysée (mock) : ${file.name}`);
  };

  const progress = Math.min(100, Math.round(((safeMinutes * 60 - timeLeft) / (safeMinutes * 60)) * 100));
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
  const weekRangeLabel = formatWeekRangeLabel(weekDates);
  const studyGoalMinutes = 240;
  const studyProgressRatio = Math.min(1, roundedStudiedMinutes / studyGoalMinutes || 0);
  const streakSegments = 7;
  const streakFilledSegments = Math.min(streakDays, streakSegments);
  const taskProgressRatio = totalTasks > 0 ? completedTasks / totalTasks : 0;

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

  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#ECECF3] p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-xl md:text-2xl font-semibold text-[#ECECF3]">
                  {getGreeting()}, {userName} 👋
                </h1>
                <p className="text-[#A9ACBA] text-sm">Prêt(e) à continuer ton voyage d&apos;apprentissage ?</p>
              </div>
              <div className="flex items-center gap-2 text-base font-bold text-[#F97316]">
                <div className="relative flex items-center justify-center w-10 h-10 text-[#F97316]">
                  <Flame className="w-10 h-10" />
                  <span className="absolute text-xs font-extrabold text-[#0B0D10]">{streakDays}</span>
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={() => navigate('/parametres')}
            variant="ghost"
            className="text-[#A9ACBA] hover:text-[#ECECF3] hover:bg-[#1F2230] rounded-xl"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[1.1fr,1.4fr] items-start">
          {/* Pomodoro */}
          <section className="bg-[#161924] border border-[#1F2230] rounded-3xl p-6 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.06)]">
            <div className="mb-2">
              <p className="text-sm text-[#A9ACBA]">Minuteur</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1.1fr,1fr] items-center">
              <div className="flex flex-col items-center justify-center gap-9">
                <div className="flex gap-2">
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

              <div className="space-y-3 pt-9">
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setIsRunning((running) => {
                        if (running) {
                          lastTickRef.current = null;
                          return false;
                        }
                        lastTickRef.current = Date.now();
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
          </section>

          {/* Tasks */}
          <section className="bg-[#161924] border border-[#1F2230] rounded-3xl p-6 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.06)]">
            <div className="text-sm text-[#A9ACBA]">Tâches à faire</div>
            <div className="mt-2 text-[#ECECF3] text-lg">Espace réservé</div>
          </section>
        </div>

        {/* Agenda en ligne */}
        <section className="bg-[#161924] border border-[#1F2230] rounded-3xl p-6 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.06)] space-y-2">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[#A9ACBA]">Agenda en ligne</p>
            <div className="flex flex-wrap items-center gap-3 text-base font-semibold text-[#4169E1]">
              <button type="button" className="hover:underline" onClick={() => setWeekOffset((w) => w - 1)}>
                ← Semaine précédente
              </button>
              <div className="h-4 w-px bg-[#E8E3D6]" />
              <button type="button" className="hover:underline" onClick={() => setWeekOffset(0)}>
                Aujourd&apos;hui
              </button>
              <div className="h-4 w-px bg-[#E8E3D6]" />
              <button type="button" className="hover:underline" onClick={() => setWeekOffset((w) => w + 1)}>
                Semaine suivante →
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-2xl font-semibold text-[#ECECF3]">{weekRangeLabel}</div>
              <div className="flex gap-2 items-center">
                <Button
                  onClick={() => {
                    setSelectedDate(formatDate(new Date()));
                    resetTaskForm();
                    setShowAddDialog(true);
                  }}
                  className="rounded-2xl bg-[#4169E1] hover:bg-[#3557C1] text-white h-10 px-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une tâche
                </Button>
                <label
                  htmlFor="agendaUpload"
                  className="flex items-center gap-2 h-10 px-4 rounded-2xl border border-dashed border-[#1F2230] text-sm font-medium text-[#ECECF3] cursor-pointer hover:bg-[#1A1D26]"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importer une photo
                </label>
                <input
                  id="agendaUpload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAgendaImageUpload(e.target.files?.[0])}
                />
              </div>
            </div>
          </div>

          {uploadNotice && (
            <div className="mt-3 text-xs text-[#A9ACBA] bg-[#0F1117] rounded-2xl px-3 py-2 inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#4169E1]" />
              {uploadNotice}
            </div>
          )}

          <div className="mt-6">
            <div className="grid grid-cols-7 border-b border-[#1F2230]">
              {weekDates.map((date, index) => (
                <div
                  key={index}
                  className={`p-3 text-center border-r border-[#1F2230] last:border-r-0 ${
                    isToday(date) && weekOffset === 0 ? 'bg-[#4169E1]/5' : ''
                  }`}
                >
                  <div className="text-xs text-[#A9ACBA] uppercase mb-1">{getDayName(date)}</div>
                  <div
                    className={`text-lg font-semibold ${
                      isToday(date) && weekOffset === 0
                        ? 'text-white bg-[#4169E1] w-10 h-10 rounded-full flex items-center justify-center mx-auto'
                        : 'text-[#ECECF3]'
                    }`}
                  >
                    {date.getDate()}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 min-h-[380px]">
              {weekDates.map((date, index) => {
                const dateString = formatDate(date);
                const tasksForDay = getTasksForDate(dateString);

                return (
                  <div
                    key={index}
                    className={`border-r border-[#1F2230] last:border-r-0 p-3 ${
                      isToday(date) && weekOffset === 0 ? 'bg-[#4169E1]/5' : ''
                    }`}
                  >
                    <div className="space-y-3">
                      {tasksForDay.map((task) => (
                        <div
                          key={task.id}
                          className="rounded-2xl p-3 text-xs bg-[#182032] border border-[#2B3550] shadow-[0_4px_12px_rgba(65,105,225,0.06)] cursor-pointer hover:shadow-md transition"
                          style={{
                            borderLeft: `4px solid ${task.color}`,
                          }}
                          onClick={() => {
                            setEditingTaskId(task.id);
                            setNewTaskName(task.name || '');
                            setNewTaskDescription(task.description || '');
                            setSelectedColor(task.color || TASK_COLORS[0]);
                            setSelectedPriority(task.priority || 1);
                            setSelectedDate(task.date || formatDate(new Date()));
                            setSelectedTime(task.time || '');
                            setShowAddDialog(true);
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center gap-2 mt-0.5">
                              <Checkbox
                                checked={task.completed}
                                onClick={(e) => e.stopPropagation()}
                                onCheckedChange={() => toggleTask(task.id)}
                                className="rounded-sm h-4 w-4"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTasks((prev) => prev.filter((t) => t.id !== task.id));
                                }}
                                className="text-[#A9ACBA] hover:text-red-500 p-1 text-xs"
                                aria-label="Supprimer la tâche"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 mb-1">
                                {task.time && <span className="text-[11px] text-[#A9ACBA]">{task.time}</span>}
                                <span
                                  className="text-[10px] px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: `${task.color}20`, color: '#ECECF3' }}
                                >
                                  {getPriorityLabel(task.priority)}
                                </span>
                              </div>

                              <div
                                className={`text-[#ECECF3] text-sm break-words ${
                                  task.completed ? 'line-through opacity-50' : ''
                                }`}
                              >
                                {task.name}
                              </div>

                              {task.description && (
                                <div className="text-[11px] text-[#A9ACBA] mt-1 break-words">
                                  {task.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Temps étudié */}
        <section className="bg-[#161924] border border-[#1F2230] rounded-3xl p-6 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.06)] space-y-2">
          <div className="flex flex-col gap-0">
            <p className="text-sm text-[#A9ACBA]">Temps étudié</p>
            <div className="flex flex-wrap items-center justify-between gap-3"></div>
          </div>

          <div className="mt-2 grid grid-cols-7 gap-3 items-end">
            {weekDates.map((date, index) => {
              const minutes = Math.round(activeWeekMinutes[index] ?? 0);
              const barHeight = Math.max(8, Math.min(220, (minutes / (maxWeekMinutes || 1)) * 220));
              return (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div className="w-full bg-[#1B2030] rounded-2xl h-56 flex items-end">
                    <div
                      className="w-full bg-[#4169E1] rounded-2xl transition-all"
                      style={{ height: `${barHeight}px` }}
                    />
                  </div>
                  <div className="text-xs text-[#ECECF3] font-medium">{minutes} min</div>
                  <div className="text-xs text-[#A9ACBA] uppercase mb-1">{getDayName(date)}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-[#A9ACBA]">
            <span>Total : {activeWeekTotalMinutes} min</span>
          </div>
        </section>

        {/* Statistiques rapides */}
        <section className="grid gap-4 md:grid-cols-3">

          <div className="bg-[#161924] border border-[#1F2230] rounded-3xl p-4 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.06)] flex flex-col gap-1">
            <p className="text-sm text-[#A9ACBA]">Temps total étudié cette semaine</p>
            <p className="text-2xl text-[#ECECF3]">{roundedStudiedMinutes} min</p>
            <div className="h-2 bg-[#0F1117] rounded-full overflow-hidden">
              <div className="h-full bg-[#4169E1]" style={{ width: `${Math.min(100, (roundedStudiedMinutes / 240) * 100)}%` }} />
            </div>
          </div>

          <div className="bg-[#161924] border border-[#1F2230] rounded-3xl p-4 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.06)] flex flex-col gap-1">
            <p className="text-sm text-[#A9ACBA]">Streak</p>
            <p className="text-2xl text-[#ECECF3]">{streakDays} jours</p>
            <div className="flex gap-1 mt-1">
              {Array.from({ length: 7 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`flex-1 h-2 rounded-full ${
                    idx < Math.min(streakDays, 7) ? 'bg-[#E16941]' : 'bg-[#0F1117]'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="bg-[#161924] border border-[#1F2230] rounded-3xl p-4 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.06)] flex flex-col gap-1">
            <p className="text-sm text-[#A9ACBA]">Tâches terminées</p>
            <p className="text-2xl text-[#ECECF3]">
              {completedTasks}/{totalTasks}
            </p>
            <div className="h-2 bg-[#0F1117] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#41E169]"
                style={{ width: totalTasks === 0 ? '0%' : `${(completedTasks / totalTasks) * 100}%` }}
              />
            </div>
          </div>
          
        </section>

        {/* Modal ajout tâche */}
        {showAddDialog && (
          <div className="fixed inset-0 z-50 flex min-h-screen w-screen items-center justify-center bg-black/40 px-3 py-4 sm:px-4 sm:py-6">
            <div className="bg-[#161924] border border-[#1F2230] shadow-[0_18px_50px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.06)] rounded-3xl max-w-3xl w-full p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold text-[#ECECF3] mb-4">
                {editingTaskId ? 'Modifier une tâche' : 'Créer une tâche'}
              </h2>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-3 md:col-span-2">
                  <label className="text-sm text-[#ECECF3] block">Nom de la tâche</label>
                  <Input
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="Ex: Relire chapitre 4"
                    className="rounded-2xl border-[#1F2230]"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm text-[#ECECF3] block">Date</label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="rounded-2xl border-[#1F2230]"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm text-[#ECECF3] block">Heure (optionnel)</label>
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="rounded-2xl border-[#1F2230]"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm text-[#ECECF3] block">Priorité</label>
                  <div className="flex gap-2">
                    {PRIORITIES.map((priority) => (
                      <button
                        key={priority.value}
                        type="button"
                        onClick={() => setSelectedPriority(priority.value)}
                        className={`px-3 py-2 rounded-xl text-sm transition-all ${
                          selectedPriority === priority.value
                            ? 'bg-[#4169E1] text-white shadow'
                            : 'bg-[#0F1117] text-[#ECECF3]'
                        }`}
                      >
                        {priority.label} {priority.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 md:col-span-2">
                  <label className="text-sm text-[#ECECF3] block">Description</label>
                  <Textarea
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Ajoute des détails, étapes, liens..."
                    className="rounded-2xl border-[#1F2230] min-h-[90px]"
                  />
                </div>

                <div className="space-y-3 md:col-span-2">
                  <label className="text-sm text-[#ECECF3] block">Couleur</label>
                  <div className="flex gap-2 flex-wrap">
                    {TASK_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-xl transition-all ${
                          selectedColor === color ? 'ring-2 ring-offset-2 ring-[#4169E1]' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  className="rounded-2xl border-[#1F2230]"
                  onClick={() => {
                    setShowAddDialog(false);
                    resetTaskForm();
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={saveTask}
                  className="rounded-2xl bg-[#4169E1] hover:bg-[#3557C1] text-white"
                >
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
