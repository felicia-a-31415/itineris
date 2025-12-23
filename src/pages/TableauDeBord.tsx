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

interface TableauDeBordScreenProps {
  userName?: string;
}

const TASK_STORAGE_KEY = 'itineris_tasks';

export function TableauDeBord({ userName = 'étudiant' }: TableauDeBordScreenProps) {
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = useMemo(() => getCurrentWeekDates(weekOffset), [weekOffset]);

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
  const [isRunning, setIsRunning] = useState(false);
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [editingTimerValue, setEditingTimerValue] = useState('');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [studiedMinutes, setStudiedMinutes] = useState(120);
  const [streakDays, setStreakDays] = useState(3);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(TASK_COLORS[0]);
  const [selectedPriority, setSelectedPriority] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [selectedTime, setSelectedTime] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

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

  // Sauver les tâches à chaque modification
  useEffect(() => {
    try {
      localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      console.error('Impossible de sauvegarder les tâches', err);
    }
  }, [tasks]);

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

        {/* Agenda en ligne */}
        <section className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-[#2C2C2C]">
              <button
                type="button"
                className="text-[#4169E1] hover:underline"
                onClick={() => setWeekOffset((w) => w - 1)}
              >
                ← Semaine passée
              </button>
              <div className="h-4 w-px bg-[#E8E3D6]" />
              <button
                type="button"
                className="text-[#4169E1] hover:underline"
                onClick={() => setWeekOffset(0)}
              >
                Aujourd&apos;hui
              </button>
              <div className="h-4 w-px bg-[#E8E3D6]" />
              <button
                type="button"
                className="text-[#4169E1] hover:underline"
                onClick={() => setWeekOffset((w) => w + 1)}
              >
                Semaine suivante →
              </button>
            </div>

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
                className="flex items-center gap-2 h-10 px-4 rounded-2xl border border-dashed border-[#E8E3D6] text-sm font-medium text-[#2C2C2C] cursor-pointer hover:bg-[#F5F1E8]"
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

          {uploadNotice && (
            <div className="mt-3 text-xs text-[#8B8680] bg-[#F5F1E8] rounded-2xl px-3 py-2 inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#4169E1]" />
              {uploadNotice}
            </div>
          )}

          <div className="mt-6">
            <div className="grid grid-cols-7 border-b border-[#F5F1E8]">
              {weekDates.map((date, index) => (
                <div
                  key={index}
                  className={`p-3 text-center border-r border-[#F5F1E8] last:border-r-0 ${
                    isToday(date) && weekOffset === 0 ? 'bg-[#4169E1]/5' : ''
                  }`}
                >
                  <div className="text-xs text-[#8B8680] uppercase mb-1">{getDayName(date)}</div>
                  <div
                    className={`text-lg font-semibold ${
                      isToday(date) && weekOffset === 0
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
                      isToday(date) && weekOffset === 0 ? 'bg-[#4169E1]/5' : ''
                    }`}
                  >
                    <div className="space-y-3">
                      {tasksForDay.map((task) => (
                        <div
                          key={task.id}
                          className="rounded-2xl p-3 text-xs bg-[#F5F8FF] border border-[#E3EAFD] shadow-[0_4px_12px_rgba(65,105,225,0.06)] cursor-pointer hover:shadow-md transition"
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
                                className="text-[#8B8680] hover:text-red-500 p-1 text-xs"
                                aria-label="Supprimer la tâche"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 mb-1">
                                {task.time && <span className="text-[11px] text-[#8B8680]">{task.time}</span>}
                                <span
                                  className="text-[10px] px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: `${task.color}20`, color: '#2C2C2C' }}
                                >
                                  {getPriorityLabel(task.priority)}
                                </span>
                              </div>

                              <div
                                className={`text-[#2C2C2C] text-sm break-words ${
                                  task.completed ? 'line-through opacity-50' : ''
                                }`}
                              >
                                {task.name}
                              </div>

                              {task.description && (
                                <div className="text-[11px] text-[#8B8680] mt-1 break-words">
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

        {/* Modal ajout tâche */}
        {showAddDialog && (
          <div className="fixed inset-0 z-50 flex min-h-screen w-screen items-center justify-center bg-black/40 px-3 py-4 sm:px-4 sm:py-6">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold text-[#2C2C2C] mb-4">
                {editingTaskId ? 'Modifier une tâche' : 'Créer une tâche'}
              </h2>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-3 md:col-span-2">
                  <label className="text-sm text-[#2C2C2C] block">Nom de la tâche</label>
                  <Input
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="Ex: Relire chapitre 4"
                    className="rounded-2xl border-[#E8E3D6]"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm text-[#2C2C2C] block">Date</label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="rounded-2xl border-[#E8E3D6]"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm text-[#2C2C2C] block">Heure (optionnel)</label>
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="rounded-2xl border-[#E8E3D6]"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm text-[#2C2C2C] block">Priorité</label>
                  <div className="flex gap-2">
                    {PRIORITIES.map((priority) => (
                      <button
                        key={priority.value}
                        type="button"
                        onClick={() => setSelectedPriority(priority.value)}
                        className={`px-3 py-2 rounded-xl text-sm transition-all ${
                          selectedPriority === priority.value
                            ? 'bg-[#4169E1] text-white shadow'
                            : 'bg-[#F5F1E8] text-[#2C2C2C]'
                        }`}
                      >
                        {priority.label} {priority.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 md:col-span-2">
                  <label className="text-sm text-[#2C2C2C] block">Description</label>
                  <Textarea
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Ajoute des détails, étapes, liens..."
                    className="rounded-2xl border-[#E8E3D6] min-h-[90px]"
                  />
                </div>

                <div className="space-y-3 md:col-span-2">
                  <label className="text-sm text-[#2C2C2C] block">Couleur</label>
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
                  className="rounded-2xl border-[#E8E3D6]"
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
