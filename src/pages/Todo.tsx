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
  description?: string;
}

interface TagColor {
  bg: string;
  text: string;
  border: string;
}

type TagDialogTarget = 'create' | 'edit' | 'global' | null;

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

  // création de tâche
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);

  // filtres / drag
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  // dialog création de tag
  const [newTagName, setNewTagName] = useState('');
  const [showNewTagDialog, setShowNewTagDialog] = useState(false);
  const [tagDialogTarget, setTagDialogTarget] = useState<TagDialogTarget>(null);

  // édition de tâche (dialog)
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);

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

  const cleanupUnusedTags = (taskList: Task[]) => {
    const used = new Set<string>();

    taskList.forEach(task => {
      task.tags.forEach(tag => used.add(tag));
    });

    // garder les tags sélectionnés en création / édition en cours
    selectedTags.forEach(tag => used.add(tag));
    editTags.forEach(tag => used.add(tag));

    setCustomTags(prev => prev.filter(tag => used.has(tag)));
    setFilterTags(prev => prev.filter(tag => used.has(tag)));
    setSelectedTags(prev => prev.filter(tag => used.has(tag)));
    setEditTags(prev => prev.filter(tag => used.has(tag)));
  };

  const toggleTask = (id: string) => {
    const newTasks = tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(newTasks);
    // pas nécessaire pour les tags, ils ne changent pas
  };

  // ------- création de tâche -------

  const addTask = () => {
    if (newTaskText.trim() && selectedTags.length > 0) {
      const newTask: Task = {
        id: Date.now().toString(),
        text: newTaskText.trim(),
        completed: false,
        tags: selectedTags,
        description: newTaskDescription.trim() || undefined,
      };
      const newTasks = [...tasks, newTask];
      setTasks(newTasks);
      setNewTaskText('');
      setNewTaskDescription('');
      setSelectedTags([]);
      setShowAddTask(false);
      cleanupUnusedTags(newTasks);
    }
  };

  const deleteTask = (id: string) => {
    const newTasks = tasks.filter(task => task.id !== id);
    setTasks(newTasks);
    cleanupUnusedTags(newTasks);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // ------- édition de tâche (dialog) -------

  const openEditDialog = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.text);
    setEditDescription(task.description ?? '');
    setEditTags(task.tags);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditingTaskId(null);
    setEditTitle('');
    setEditDescription('');
    setEditTags([]);
  };

  const toggleEditTag = (tag: string) => {
    if (editTags.includes(tag)) {
      setEditTags(editTags.filter(t => t !== tag));
    } else {
      setEditTags([...editTags, tag]);
    }
  };

  const saveTaskEdits = () => {
    if (!editingTaskId || !editTitle.trim()) {
      closeEditDialog();
      return;
    }

    const newTasks = tasks.map(task =>
      task.id === editingTaskId
        ? {
            ...task,
            text: editTitle.trim(),
            description: editDescription.trim() || undefined,
            tags: editTags.length > 0 ? editTags : [], // si 0, plus de tags
          }
        : task
    );

    setTasks(newTasks);
    cleanupUnusedTags(newTasks);
    closeEditDialog();
  };

  // ------- tags globaux / dialog de création de tag -------

  const toggleFilterTag = (tag: string) => {
    if (filterTags.includes(tag)) {
      setFilterTags(filterTags.filter(t => t !== tag));
    } else {
      setFilterTags([...filterTags, tag]);
    }
  };

  const addCustomTag = () => {
    const name = newTagName.trim().toLowerCase();
    if (!name || customTags.includes(name)) {
      setNewTagName('');
      setShowNewTagDialog(false);
      setTagDialogTarget(null);
      return;
    }

    setCustomTags(prev => [...prev, name]);

    if (tagDialogTarget === 'create') {
      setSelectedTags(prev => (prev.includes(name) ? prev : [...prev, name]));
    } else if (tagDialogTarget === 'edit') {
      setEditTags(prev => (prev.includes(name) ? prev : [...prev, name]));
    }

    setNewTagName('');
    setShowNewTagDialog(false);
    setTagDialogTarget(null);
  };

  // ------- drag & drop -------

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
            {/* bouton tags global */}
            <button
              className="inline-flex items-center justify-center rounded-xl border border-[#8B8680]/20 bg-white px-3 py-2 hover:bg-[#F5F1E8] transition-colors"
              onClick={() => {
                setTagDialogTarget('global');
                setShowNewTagDialog(true);
              }}
            >
              <Tag className="w-5 h-5 text-[#8B8680]" />
            </button>

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

              <div>
                <Label htmlFor="newTaskDescription" className="text-sm text-[#8B8680]">
                  Description (optionnelle)
                </Label>
                <textarea
                  id="newTaskDescription"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4169E1]"
                  placeholder="Ajoute des détails, étapes, liens..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#8B8680]">Tags</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-[#8B8680]/20 text-xs"
                    onClick={() => {
                      setTagDialogTarget('create');
                      setShowNewTagDialog(true);
                    }}
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    Nouveau tag
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {customTags.map((tag) => {
                    const colors = getTagColor(tag);
                    const active = selectedTags.includes(tag);
                    return (
                      <Badge
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className="cursor-pointer rounded-lg capitalize transition-all"
                        style={{
                          backgroundColor: active ? colors.text : colors.bg,
                          color: active ? 'white' : colors.text,
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        {tag}
                      </Badge>
                    );
                  })}
                </div>
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
                    setNewTaskDescription('');
                    setSelectedTags([]);
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
                  <p
                    className={`text-[#2C2C2C] cursor-pointer hover:text-[#4169E1] transition-colors ${
                      task.completed ? 'line-through opacity-50' : ''
                    }`}
                    onClick={() => openEditDialog(task)}
                  >
                    {task.text}
                  </p>
                  {task.description && (
                    <p className="mt-1 text-sm text-[#8B8680]">
                      {task.description}
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

      {/* Dialog création de tag (utilisé par header + création + édition) */}
      <Dialog
        open={showNewTagDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowNewTagDialog(false);
            setTagDialogTarget(null);
          } else {
            setShowNewTagDialog(true);
          }
        }}
      >
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

      {/* Dialog édition de tâche */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeEditDialog();
          } else {
            setEditDialogOpen(true);
          }
        }}
      >
        <DialogContent className="bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la tâche</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="editTitle">Titre</Label>
              <Input
                id="editTitle"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mt-2 rounded-xl"
                placeholder="Titre de la tâche"
              />
            </div>
            <div>
              <Label htmlFor="editDescription">Description</Label>
              <textarea
                id="editDescription"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4169E1]"
                placeholder="Ajoute des détails, étapes, liens..."
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#8B8680]">Tags</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-[#8B8680]/20 text-xs"
                  onClick={() => {
                    setTagDialogTarget('edit');
                    setShowNewTagDialog(true);
                  }}
                >
                  <Tag className="w-3 h-3 mr-1" />
                  Nouveau tag
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {customTags.map((tag) => {
                  const colors = getTagColor(tag);
                  const active = editTags.includes(tag);
                  return (
                    <Badge
                      key={tag}
                      onClick={() => toggleEditTag(tag)}
                      className="cursor-pointer rounded-lg capitalize transition-all"
                      style={{
                        backgroundColor: active ? colors.text : colors.bg,
                        color: active ? 'white' : colors.text,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      {tag}
                    </Badge>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                className="rounded-xl border-[#8B8680]/20"
                onClick={closeEditDialog}
              >
                Annuler
              </Button>
              <Button
                className="rounded-xl bg-[#4169E1] hover:bg-[#3557C1] text-white"
                onClick={saveTaskEdits}
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
