import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, GripVertical, Calendar, List } from 'lucide-react';

import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

interface Task {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  color: string;
  priority: 1 | 2 | 3; // !, !!, !!!
  date?: string; // yyyy-mm-dd (optionnel)
  time?: string; // hh:mm (optionnel)
}

const TASK_COLORS = [
  '#6B9AC4', // Bleu pâle
  '#4169E1', // Bleu royal
  '#8B8680', // Gris
  '#E16941', // Orange
  '#41E169', // Vert
  '#9B59B6', // Violet
  '#F39C12', // Jaune
  '#E91E63', // Rose
];

const PRIORITIES = [
  { value: 1, label: '!', name: 'Basse' },
  { value: 2, label: '!!', name: 'Moyenne' },
  { value: 3, label: '!!!', name: 'Haute' },
] as const;

export default function Todo() {
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<'list' | 'agenda'>('agenda');

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      name: 'Réviser les notes de mathématiques',
      description: 'Chapitres 3-5',
      completed: false,
      color: '#6B9AC4',
      priority: 2,
    },
    {
      id: '2',
      name: 'Terminer le devoir de chimie',
      description: 'Exercices page 45-48',
      completed: false,
      color: '#4169E1',
      priority: 3,
    },
    {
      id: '3',
      name: "Réunion d'équipe",
      description: 'Discuter du projet final',
      completed: false,
      color: '#6B9AC4',
      priority: 1,
      date: '2024-12-22',
      time: '10:00',
    },
    {
      id: '4',
      name: 'Étudier physique',
      description: 'Chapitre 5 - Électromagnétisme',
      completed: false,
      color: '#4169E1',
      priority: 2,
      date: '2024-12-22',
    },
  ]);

  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  // édition inline (liste)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // form “Ajouter une tâche”
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(TASK_COLORS[0]);
  const [selectedPriority, setSelectedPriority] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

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

  const weekDates = getCurrentWeekDates();

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDayName = (date: Date) => {
    const days = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
    return days[date.getDay()];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

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

    // reset form
    setNewTaskName('');
    setNewTaskDescription('');
    setSelectedColor(TASK_COLORS[0]);
    setSelectedPriority(1);
    setSelectedDate('');
    setSelectedTime('');
    setShowAddTaskDialog(false);
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

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    if (draggedTask === null || draggedTask === taskId) return;

    const draggedIndex = tasks.findIndex((t) => t.id === draggedTask);
    const targetIndex = tasks.findIndex((t) => t.id === taskId);

    const newTasks = [...tasks];
    const [draggedItem] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(targetIndex, 0, draggedItem);

    setTasks(newTasks);
  };

  const handleDragEnd = () => setDraggedTask(null);

  const getPriorityLabel = (priority: 1 | 2 | 3) => {
    return PRIORITIES.find((p) => p.value === priority)?.label || '!';
  };

  const listTasks = tasks;
  const completedCount = listTasks.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen bg-[#F5F1E8] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8 md:mb-12">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="mr-4 text-[#8B8680] hover:text-[#2C2C2C] hover:bg-white/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex-1">
            <h1 className="text-[#2C2C2C]">
              {viewMode === 'list' ? 'Liste de tâches' : 'Agenda'}
            </h1>
            <p className="text-[#8B8680] text-sm">
              {viewMode === 'list'
                ? `${completedCount} sur ${listTasks.length} tâches terminées`
                : 'Organisez vos tâches par jour'}
            </p>
          </div>

          <div className="flex gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'agenda' | 'list')}>
              <TabsList className="bg-white rounded-xl">
                <TabsTrigger
                  value="list"
                  className="rounded-lg data-[state=active]:bg-[#4169E1] data-[state=active]:text-white"
                >
                  <List className="w-4 h-4 mr-2" />
                  Liste
                </TabsTrigger>
                <TabsTrigger
                  value="agenda"
                  className="rounded-lg data-[state=active]:bg-[#4169E1] data-[state=active]:text-white"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Agenda
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              onClick={() => setShowAddTaskDialog(true)}
              className="bg-[#4169E1] hover:bg-[#3557C1] text-white rounded-xl shadow-md"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Add Task Dialog */}
        <Dialog open={showAddTaskDialog} onOpenChange={setShowAddTaskDialog}>
          <DialogContent className="bg-white rounded-2xl max-w-lg" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Ajouter une tâche</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="taskName">Nom de la tâche</Label>
                <Input
                  id="taskName"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="Ex: Réunion d'équipe"
                  className="mt-2 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="taskDescription">Description (optionnelle)</Label>
                <Textarea
                  id="taskDescription"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Ex: Discuter du projet final"
                  className="mt-2 rounded-xl min-h-[80px]"
                />
              </div>

              {viewMode === 'agenda' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="taskDate">Date</Label>
                    <Input
                      id="taskDate"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="mt-2 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="taskTime">Heure (optionnelle)</Label>
                    <Input
                      id="taskTime"
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="mt-2 rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>Couleur</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {TASK_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        selectedColor === color ? 'ring-2 ring-offset-2 ring-[#4169E1]' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label>Priorité</Label>
                <div className="flex gap-2 mt-2">
                  {PRIORITIES.map((priority) => (
                    <button
                      key={priority.value}
                      type="button"
                      onClick={() => setSelectedPriority(priority.value)}
                      className={`px-4 py-2 rounded-lg transition-all text-white ${
                        selectedPriority === priority.value
                          ? 'ring-2 ring-offset-2 ring-[#4169E1]'
                          : 'opacity-60'
                      }`}
                      style={{ backgroundColor: selectedColor }}
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={addTask}
                  className="bg-[#4169E1] hover:bg-[#3557C1] text-white rounded-xl flex-1"
                >
                  Ajouter
                </Button>

                <Button
                  onClick={() => {
                    setShowAddTaskDialog(false);
                    setNewTaskName('');
                    setNewTaskDescription('');
                    setSelectedColor(TASK_COLORS[0]);
                    setSelectedPriority(1);
                    setSelectedDate('');
                    setSelectedTime('');
                  }}
                  variant="outline"
                  className="rounded-xl border-[#8B8680]/20"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* List View */}
        {viewMode === 'list' && (
          <div className="max-w-3xl mx-auto">
            <div className="space-y-3">
              {listTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragOver={(e) => handleDragOver(e, task.id)}
                  onDragEnd={handleDragEnd}
                  className={`bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group cursor-move ${
                    draggedTask === task.id ? 'opacity-50' : ''
                  }`}
                  style={{ borderLeft: `4px solid ${task.color}` }}
                >
                  <div className="flex items-start gap-4">
                    <GripVertical className="w-5 h-5 text-[#8B8680]/40 flex-shrink-0 mt-1" />
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggleTask(task.id)}
                      className="rounded-md mt-1"
                    />

                    <div className="flex-1 min-w-0">
                      {editingTaskId === task.id ? (
                        <Input
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          placeholder="Modifier la tâche"
                          className="border-[#F5F1E8] rounded-xl"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditingTask();
                            if (e.key === 'Escape') cancelEditingTask();
                          }}
                          onBlur={saveEditingTask}
                          autoFocus
                        />
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-[#2C2C2C] cursor-pointer hover:text-[#4169E1] transition-colors ${
                                task.completed ? 'line-through opacity-50' : ''
                              }`}
                              onClick={() => startEditingTask(task)}
                            >
                              {task.name}
                            </p>

                            <span
                              className="text-xs px-2 py-0.5 rounded"
                              style={{
                                backgroundColor: `${task.color}20`,
                                color: task.color,
                              }}
                            >
                              {getPriorityLabel(task.priority)}
                            </span>
                          </div>

                          {task.description && (
                            <p className="text-sm text-[#8B8680] mt-1">{task.description}</p>
                          )}

                          {task.date && (
                            <p className="text-xs text-[#8B8680] mt-1">
                              📅 {task.date} {task.time ? `à ${task.time}` : ''}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    <Button
                      onClick={() => deleteTask(task.id)}
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[#8B8680] hover:text-red-500 hover:bg-red-50 rounded-lg p-2 h-auto flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {listTasks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[#8B8680]">
                  Aucune tâche pour le moment. Ajoutez votre première tâche pour commencer !
                </p>
              </div>
            )}
          </div>
        )}

        {/* Agenda View */}
        {viewMode === 'agenda' && (
          <div>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="grid grid-cols-7 border-b border-[#F5F1E8]">
                {weekDates.map((date, index) => (
                  <div
                    key={index}
                    className={`p-4 text-center border-r border-[#F5F1E8] last:border-r-0 ${
                      isToday(date) ? 'bg-[#4169E1]/5' : ''
                    }`}
                  >
                    <div className="text-xs text-[#8B8680] uppercase mb-1">{getDayName(date)}</div>
                    <div
                      className={`text-2xl ${
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

              <div className="grid grid-cols-7 min-h-[500px]">
                {weekDates.map((date, index) => {
                  const dateString = formatDate(date);
                  const tasksForDay = getTasksForDate(dateString);

                  return (
                    <div
                      key={index}
                      className={`border-r border-[#F5F1E8] last:border-r-0 p-2 ${
                        isToday(date) ? 'bg-[#4169E1]/5' : ''
                      }`}
                    >
                      <div className="space-y-2">
                        {tasksForDay.map((task) => (
                          <div
                            key={task.id}
                            className="rounded-lg p-2 text-xs group relative"
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
                                  {task.time && (
                                    <span className="text-[10px] text-[#8B8680]">{task.time}</span>
                                  )}
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

                              <Button
                                onClick={() => deleteTask(task.id)}
                                variant="ghost"
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto hover:bg-red-50"
                              >
                                <X className="w-3 h-3 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
