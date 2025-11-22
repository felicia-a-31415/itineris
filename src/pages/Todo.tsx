import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, GripVertical, Filter, Tag } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  tags: string[];
}

interface TagColor {
  bg: string;
  text: string;
  border: string;
}

export default function Todo() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: 'Réviser les notes de mathématiques', completed: false, tags: ['étude', 'mathématiques'] },
    { id: '2', text: 'Terminer le devoir de chimie', completed: false, tags: ['étude', 'sciences'] },
    { id: '3', text: 'Pratiquer le vocabulaire anglais', completed: true, tags: ['révision', 'langues'] },
    { id: '4', text: 'Préparer les diapositives de présentation', completed: false, tags: ['étude', 'projet'] },
    { id: '5', text: "Faire 30 minutes d'exercice", completed: false, tags: ['personnel', 'santé'] },
  ]);

  const [customTags, setCustomTags] = useState<string[]>([
    'étude',
    'révision',
    'personnel',
    'mathématiques',
    'sciences',
    'langues',
    'projet',
    'santé',
  ]);

  const [newTaskText, setNewTaskText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [showNewTagDialog, setShowNewTagDialog] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const getTagColor = (tag: string): TagColor => {
    const colors = [
      { bg: '#6B9AC415', text: '#6B9AC4', border: '#6B9AC430' },
      { bg: '#4169E115', text: '#4169E1', border: '#4169E130' },
      { bg: '#8B868015', text: '#8B8680', border: '#8B868030' },
      { bg: '#E1694115', text: '#E16941', border: '#E1694130' },
      { bg: '#41E16915', text: '#41E169', border: '#41E16930' },
    ];
    const index = customTags.indexOf(tag) % colors.length;
    return colors[index];
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const addTask = () => {
    if (newTaskText.trim() && selectedTags.length > 0) {
      const newTask: Task = {
        id: Date.now().toString(),
        text: newTaskText,
        completed: false,
        tags: selectedTags,
      };
      setTasks([...tasks, newTask]);
      setNewTaskText('');
      setSelectedTags([]);
      setShowAddTask(false);
    }
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const startEditingTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingText(task.text);
  };

  const saveEditingTask = () => {
    if (editingTaskId && editingText.trim()) {
      setTasks(tasks.map(task =>
        task.id === editingTaskId ? { ...task, text: editingText.trim() } : task
      ));
    }
    setEditingTaskId(null);
    setEditingText('');
  };

  const cancelEditingTask = () => {
    setEditingTaskId(null);
    setEditingText('');
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const toggleFilterTag = (tag: string) => {
    if (filterTags.includes(tag)) {
      setFilterTags(filterTags.filter(t => t !== tag));
    } else {
      setFilterTags([...filterTags, tag]);
    }
  };

  const addCustomTag = () => {
    if (newTagName.trim() && !customTags.includes(newTagName.trim().toLowerCase())) {
      setCustomTags([...customTags, newTagName.trim().toLowerCase()]);
      setNewTagName('');
      setShowNewTagDialog(false);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.preventDefault();
    if (draggedTask === null || draggedTask === taskId) return;

    const draggedIndex = tasks.findIndex(t => t.id === draggedTask);
    const targetIndex = tasks.findIndex(t => t.id === taskId);

    const newTasks = [...tasks];
    const [draggedItem] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(targetIndex, 0, draggedItem);

    setTasks(newTasks);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const filteredTasks = filterTags.length > 0
    ? tasks.filter(task => task.tags.some(tag => filterTags.includes(tag)))
    : tasks;

  const completedCount = filteredTasks.filter(t => t.completed).length;

  return (
    <div className="min-h-screen bg-[#F5F1E8] p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
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
            <h1 className="text-[#2C2C2C]">Liste de tâches</h1>
            <p className="text-[#8B8680] text-sm">
              {completedCount} sur {filteredTasks.length} tâches terminées
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showNewTagDialog} onOpenChange={setShowNewTagDialog}>
              <DialogTrigger asChild>
                <button className="inline-flex items-center justify-center rounded-xl border border-[#8B8680]/20 bg-white px-3 py-2 hover:bg-[#F5F1E8] transition-colors">
                  <Tag className="w-5 h-5 text-[#8B8680]" />
                </button>
              </DialogTrigger>
              <DialogContent className="bg-white rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Créer un nouveau tag</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="tagName">Nom du tag</Label>
                    <Input
                      id="tagName"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Ex: urgent, examen, projet..."
                      className="mt-2 rounded-xl"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addCustomTag();
                      }}
                    />
                  </div>
                  <Button
                    onClick={addCustomTag}
                    className="w-full bg-[#4169E1] hover:bg-[#3557C1] text-white rounded-xl"
                  >
                    Créer le tag
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              onClick={() => setShowAddTask(!showAddTask)}
              className="bg-[#4169E1] hover:bg-[#3557C1] text-white rounded-xl shadow-md"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Filter Tags */}
        {customTags.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-[#8B8680]" />
              <span className="text-sm text-[#8B8680]">Filtrer par tags :</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {customTags.map((tag) => {
                const colors = getTagColor(tag);
                return (
                  <Badge
                    key={tag}
                    onClick={() => toggleFilterTag(tag)}
                    className="cursor-pointer rounded-lg px-3 py-1.5 transition-all capitalize"
                    style={{
                      backgroundColor: filterTags.includes(tag) ? colors.text : colors.bg,
                      color: filterTags.includes(tag) ? 'white' : colors.text,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {tag}
                  </Badge>
                );
              })}
            </div>
            {filterTags.length > 0 && (
              <Button
                onClick={() => setFilterTags([])}
                variant="ghost"
                size="sm"
                className="mt-2 text-[#8B8680] hover:text-[#2C2C2C]"
              >
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        )}

        {/* Add Task Form */}
        {showAddTask && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <div className="space-y-4">
              <Input
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Que devez-vous faire ?"
                className="border-[#F5F1E8] rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addTask();
                }}
              />
              <div className="flex flex-wrap gap-2">
                {customTags.map((tag) => {
                  const colors = getTagColor(tag);
                  return (
                    <Badge
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="cursor-pointer rounded-lg capitalize transition-all"
                      style={{
                        backgroundColor: selectedTags.includes(tag) ? colors.text : colors.bg,
                        color: selectedTags.includes(tag) ? 'white' : colors.text,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      {tag}
                    </Badge>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={addTask}
                  className="bg-[#4169E1] hover:bg-[#3557C1] text-white rounded-xl flex-1"
                >
                  Ajouter la tâche
                </Button>
                <Button
                  onClick={() => {
                    setShowAddTask(false);
                    setNewTaskText('');
                  }}
                  variant="outline"
                  className="rounded-xl border-[#8B8680]/20"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tasks List */}
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, task.id)}
              onDragOver={(e) => handleDragOver(e, task.id)}
              onDragEnd={handleDragEnd}
              className={`bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group cursor-move ${
                draggedTask === task.id ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <GripVertical className="w-5 h-5 text-[#8B8680]/40 flex-shrink-0" />
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTask(task.id)}
                  className="rounded-md"
                />
                <div className="flex-1 min-w-0">
                  {editingTaskId === task.id ? (
                    <Input
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      placeholder="Modifier la tâche"
                      className="border-[#F5F1E8] rounded-xl"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveEditingTask();
                        } else if (e.key === 'Escape') {
                          cancelEditingTask();
                        }
                      }}
                      onBlur={saveEditingTask}
                      autoFocus
                    />
                  ) : (
                    <p
                      className={`text-[#2C2C2C] cursor-pointer hover:text-[#4169E1] transition-colors ${
                        task.completed ? 'line-through opacity-50' : ''
                      }`}
                      onClick={() => startEditingTask(task)}
                    >
                      {task.text}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 max-w-xs">
                  {task.tags.map((tag) => {
                    const colors = getTagColor(tag);
                    return (
                      <Badge
                        key={tag}
                        className="rounded-lg capitalize text-xs"
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        {tag}
                      </Badge>
                    );
                  })}
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

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#8B8680]">
              {filterTags.length > 0
                ? 'Aucune tâche ne correspond aux filtres sélectionnés.'
                : 'Aucune tâche pour le moment. Ajoutez votre première tâche pour commencer !'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
