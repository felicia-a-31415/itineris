import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pause, Play, Plus, RotateCcw, Settings, Sparkles, Upload, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

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

const getCurrentWeekDates = () => {
  const today = new Date();
  const currentDay = today.getDay();
  const diff = currentDay === 0 ? -6 : 1 - currentDay; // lundi comme début
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
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

interface TableauDeBordScreenProps {
  userName?: string;
}

export function TableauDeBord({ userName = 'étudiant' }: TableauDeBordScreenProps) {
  const navigate = useNavigate();
  const weekDates = useMemo(getCurrentWeekDates, []);

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      name: 'Réviser les notes de mathématiques',
      description: 'Chapitres 3-5',
      completed: false,
      color: '#6B9AC4',
      priority: 2,
      date: formatDate(weekDates[1]),
    },
    {
      id: '2',
      name: 'Terminer le devoir de chimie',
      description: 'Exercices page 45-48',
      completed: false,
      color: '#4169E1',
      priority: 3,
      date: formatDate(weekDates[2]),
      time: '09:00',
    },
    {
      id: '3',
      name: "Réunion d'équipe",
      description: 'Discuter du projet final',
      completed: false,
      color: '#6B9AC4',
      priority: 1,
      date: formatDate(weekDates[3]),
      time: '14:00',
    },
  ]);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(TASK_COLORS[0]);
  const [selectedPriority, setSelectedPriority] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(timerMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [editingTimerValue, setEditingTimerValue] = useState('');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [studiedMinutes, setStudiedMinutes] = useState(120);
  const [streakDays, setStreakDays] = useState(3);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const safeMinutes = Math.max(5, timerMinutes || 5);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setSessionsCompleted((s) => s + 1);
          setStudiedMinutes((m) => m + safeMinutes);
          setStreakDays((s) => Math.max(s, 1) + 1);
          return safeMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, safeMinutes]);

  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(safeMinutes * 60);
    }
  }, [safeMinutes, isRunning]);

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
    } else {
      document.title = 'itineris';
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

  const addTask = () => {
    if (!newTaskName.trim()) return;
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
    setAiNotice(null);
    setNewTaskName('');
    setNewTaskDescription('');
    setSelectedColor(TASK_COLORS[0]);
    setSelectedPriority(1);
    setSelectedDate('');
    setSelectedTime('');
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const startEditingTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingText(task.name);
  };

  const saveEditingTask = () => {
    if (editingTaskId && editingText.trim()) {
      setTasks((prev) =>
        prev.map((task) => (task.id === editingTaskId ? { ...task, name: editingText.trim() } : task))
      );
    }
    setEditingTaskId(null);
    setEditingText('');
  };

  const cancelEditingTask = () => {
    setEditingTaskId(null);
    setEditingText('');
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const generateAiTasks = () => {
    const aiTasks: Task[] = [
      {
        id: `ai-${Date.now()}-1`,
        name: 'Synthèse des cours de la semaine',
        description: 'IA: blocs de 45 min avec pauses',
        completed: false,
        color: '#9B59B6',
        priority: 2,
        date: formatDate(weekDates[4]),
        time: '10:30',
      },
      {
        id: `ai-${Date.now()}-2`,
        name: 'Préparer la présentation de vendredi',
        description: 'IA: slides + répétition 20 min',
        completed: false,
        color: '#E16941',
        priority: 3,
        date: formatDate(weekDates[5]),
        time: '16:00',
      },
      {
        id: `ai-${Date.now()}-3`,
        name: 'Lecture rapide des notes',
        description: 'IA: survol des chapitres avant dodo',
        completed: false,
        color: '#41E169',
        priority: 1,
        date: formatDate(weekDates[1]),
        time: '21:00',
      },
    ];
    setTasks((prev) => [...prev, ...aiTasks]);
    setAiNotice('Tâches générées automatiquement à partir de votre agenda (mock).');
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

  return (
    <div className="min-h-screen bg-[#F5F1E8] p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-semibold text-[#2C2C2C]">
              {getGreeting()}, {userName} 👋
            </h1>
            <p className="text-[#8B8680] text-sm mt-1">Prêt(e) à continuer ton voyage d&apos;apprentissage ?</p>
          </div>

          <Button
            onClick={() => navigate('/parametres')}
            variant="ghost"
            className="text-[#8B8680] hover:text-[#2C2C2C] hover:bg-white rounded-xl"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[1.1fr,1.4fr] items-start">
          {/* Pomodoro */}
          <section className="bg-white rounded-3xl p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-[1.1fr,1fr] items-center">
              <div className="flex items-center justify-center">
                <div
                  className="relative w-48 h-48 rounded-full flex items-center justify-center"
                  style={{
                    background: `conic-gradient(#4169E1 ${progress * 3.6}deg, #E8E3D6 ${progress * 3.6}deg)`,
                  }}
                >
                  <div className="absolute inset-3 bg-white rounded-full shadow-inner flex flex-col items-center justify-center">
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
                        className="w-24 text-center rounded-xl border-[#E8E3D6]"
                        autoFocus
                      />
                    ) : (
                      <>
                        <button
                          type="button"
                          className="text-3xl font-semibold text-[#2C2C2C]"
                          onClick={() => {
                            setIsRunning(false);
                            setIsEditingTimer(true);
                            setEditingTimerValue(timerMinutes.toString());
                          }}
                        >
                          {formatTime(timeLeft)}
                        </button>
                        <span className="text-xs text-[#8B8680]">{timerMinutes} min</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsRunning((r) => !r)}
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
                        Lancer
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsRunning(false);
                      setTimeLeft(safeMinutes * 60);
                    }}
                    variant="outline"
                    className="flex-1 rounded-2xl border-[#E8E3D6]"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>

                <div className="flex items-center justify-between text-sm text-[#8B8680]">
                  <span>{sessionsCompleted} sessions terminées</span>
                  <span>{studiedMinutes} min étudiées</span>
                </div>
              </div>
            </div>
          </section>

          {/* Tasks */}
          <section className="bg-white rounded-3xl p-6 shadow-sm">
            <div className="text-sm text-[#8B8680]">Tâches à faire</div>
            <div className="mt-2 text-[#2C2C2C] text-lg">Espace réservé</div>
          </section>
        </div>

        {/* Agenda en ligne + import photo */}
        <section className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[#8B8680]">Agenda en ligne</p>
              <h2 className="text-xl text-[#2C2C2C]">Encode à la main ou laisse l&apos;IA lire ta photo</h2>
              <p className="text-xs text-[#8B8680] mt-1">
                Les tâches datées apparaissent directement dans cette grille hebdo.
              </p>
            </div>

            <div className="flex gap-2 items-center">
              <label
                htmlFor="agendaUpload"
                className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-dashed border-[#E8E3D6] text-[#2C2C2C] cursor-pointer hover:bg-[#F5F1E8]"
              >
                <Upload className="w-4 h-4" />
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

          {(uploadNotice || aiNotice) && (
            <div className="mt-3 text-xs text-[#8B8680] bg-[#F5F1E8] rounded-2xl px-3 py-2 inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#4169E1]" />
              {uploadNotice || aiNotice}
            </div>
          )}

          <div className="mt-6">
            <div className="grid grid-cols-7 border-b border-[#F5F1E8]">
              {weekDates.map((date, index) => (
                <div
                  key={index}
                  className={`p-3 text-center border-r border-[#F5F1E8] last:border-r-0 ${
                    isToday(date) ? 'bg-[#4169E1]/5' : ''
                  }`}
                >
                  <div className="text-xs text-[#8B8680] uppercase mb-1">{getDayName(date)}</div>
                  <div
                    className={`text-lg font-semibold ${
                      isToday(date)
                        ? 'text-white bg-[#4169E1] w-10 h-10 rounded-full flex items-center justify-center mx-auto'
                        : 'text-[#2C2C2C]'
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
                    className={`border-r border-[#F5F1E8] last:border-r-0 p-3 ${
                      isToday(date) ? 'bg-[#4169E1]/5' : ''
                    }`}
                  >
                    <div className="space-y-2">
                      {tasksForDay.map((task) => (
                        <div
                          key={task.id}
                          className="rounded-lg p-2 text-xs"
                          style={{
                            backgroundColor: `${task.color}15`,
                            borderLeft: `3px solid ${task.color}`,
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => toggleTask(task.id)}
                              className="rounded-sm mt-0.5 h-3 w-3"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 mb-1">
                                {task.time && <span className="text-[10px] text-[#8B8680]">{task.time}</span>}
                                <span
                                  className="text-[9px] px-1 rounded"
                                  style={{ backgroundColor: task.color, color: 'white' }}
                                >
                                  {getPriorityLabel(task.priority)}
                                </span>
                              </div>

                              <div
                                className={`text-[#2C2C2C] break-words ${
                                  task.completed ? 'line-through opacity-50' : ''
                                }`}
                              >
                                {task.name}
                              </div>

                              {task.description && (
                                <div className="text-[10px] text-[#8B8680] mt-1 break-words">
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

        {/* Statistiques */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="bg-white rounded-3xl p-4 shadow-sm flex flex-col gap-1">
            <p className="text-sm text-[#8B8680]">Temps total étudié</p>
            <p className="text-2xl text-[#2C2C2C]">{studiedMinutes} min</p>
            <div className="h-2 bg-[#F5F1E8] rounded-full overflow-hidden">
              <div className="h-full bg-[#4169E1]" style={{ width: `${Math.min(100, (studiedMinutes / 240) * 100)}%` }} />
            </div>
          </div>
          <div className="bg-white rounded-3xl p-4 shadow-sm flex flex-col gap-1">
            <p className="text-sm text-[#8B8680]">Streak</p>
            <p className="text-2xl text-[#2C2C2C]">{streakDays} jours</p>
            <div className="flex gap-1 mt-1">
              {Array.from({ length: 7 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`flex-1 h-2 rounded-full ${
                    idx < Math.min(streakDays, 7) ? 'bg-[#E16941]' : 'bg-[#F5F1E8]'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="bg-white rounded-3xl p-4 shadow-sm flex flex-col gap-1">
            <p className="text-sm text-[#8B8680]">Tâches terminées</p>
            <p className="text-2xl text-[#2C2C2C]">
              {completedTasks}/{totalTasks}
            </p>
            <div className="h-2 bg-[#F5F1E8] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#41E169]"
                style={{ width: totalTasks === 0 ? '0%' : `${(completedTasks / totalTasks) * 100}%` }}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
