import { useMemo, useRef, useState } from 'react';

import { buildTasksFromAiActions, extractAddTaskActions } from '../lib/dashboardAi';
import { prepareImageForOpenAi } from '../lib/chatAttachments';
import type { DashboardTask } from '../lib/storage';

type Task = DashboardTask;

type UseDashboardTasksParams = {
  taskColors: string[];
  formatDate: (date: Date) => string;
  createDefaultTasks: () => Task[];
  currentDateContext: {
    localDate: string;
    localTime24: string;
    localDateTime: string;
    weekdayFr: string;
    timezone: string;
    timezoneOffsetMinutes: number;
    today: string;
    tomorrow: string;
    yesterday: string;
    thisWeekMonday: string;
    nextWeekMonday: string;
    isoUtc: string;
    localeFr: string;
    unixMs: number;
  };
  isValidTaskDate: (value?: string) => boolean;
  isValidTaskTime: (value?: string) => boolean;
};

export function useDashboardTasks({
  taskColors,
  formatDate,
  createDefaultTasks,
  currentDateContext,
  isValidTaskDate,
  isValidTaskTime,
}: UseDashboardTasksParams) {
  const [tasks, setTasks] = useState<Task[]>(() => createDefaultTasks());
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [selectedColor, setSelectedColor] = useState(taskColors[0]);
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
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);

  const resetTaskForm = () => {
    setNewTaskName('');
    setSelectedColor(taskColors[0]);
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

  const createTaskForDate = (dateString: string) => {
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
  };

  const toggleTask = (id: string) => {
    const targetTask = tasks.find((task) => task.id === id);
    if (targetTask) {
      pendingTaskMotionRef.current = {
        id,
        direction: targetTask.completed ? 'up' : 'down',
      };
    }

    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)));
  };

  const deleteCompletedTasks = (ageInMonths?: number) => {
    const now = new Date();
    const cutoff = ageInMonths ? new Date(now.getFullYear(), now.getMonth() - ageInMonths, now.getDate()) : null;

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

  const handleAgendaImageUpload = async (file?: File) => {
    if (!file) return;

    setUploadNotice(`Analyse de la photo en cours : ${file.name}`);

    try {
      const preparedImage = await prepareImageForOpenAi(file);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          message:
            "Analyse cette photo, lis le texte visible et ajoute les devoirs, examens, remises et evenements scolaires detectes comme taches dans l'agenda. Si une date ou une heure est visible, utilise-la.",
          context: {
            tasks,
            history: [],
            timerSessions: {},
            timer: {},
            currentDate: currentDateContext,
            image: {
              mediaType: preparedImage.mediaType,
              data: preparedImage.data,
              fileName: file.name,
            },
          },
        }),
      });

      const responseText = await response.text();
      const payload = responseText ? JSON.parse(responseText) : null;

      if (!response.ok) {
        const errorMessage =
          typeof payload?.error === 'string' && payload.error.trim()
            ? payload.error
            : "L'analyse de la photo a échoué.";
        setUploadNotice(errorMessage);
        return;
      }

      const taskActions = extractAddTaskActions(payload?.actions);

      if (taskActions.length === 0) {
        setUploadNotice(
          typeof payload?.reply === 'string' && payload.reply.trim()
            ? payload.reply
            : "Aucune tâche n'a été détectée dans la photo."
        );
        return;
      }

      const extracted = buildTasksFromAiActions({
        actions: taskActions,
        taskColors,
        formatDate,
        isValidTaskDate,
        isValidTaskTime,
      });

      setTasks((prev) => [...prev, ...extracted]);
      setUploadNotice(
        `${extracted.length} tâche${extracted.length > 1 ? 's ont été ajoutées' : ' a été ajoutée'} depuis la photo.`
      );
    } catch (error) {
      setUploadNotice(error instanceof Error ? error.message : "L'analyse de la photo a échoué.");
    }
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

  const agendaTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      const aDate = new Date(`${a.date || formatDate(new Date())}T${a.time || '00:00'}`);
      const bDate = new Date(`${b.date || formatDate(new Date())}T${b.time || '00:00'}`);
      return aDate.getTime() - bDate.getTime();
    });
  }, [tasks, formatDate]);

  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const visibleTasks = showCompletedTasks ? agendaTasks : agendaTasks.filter((task) => !task.completed);
  const modalTask = modalTaskId ? tasks.find((task) => task.id === modalTaskId) ?? null : null;

  return {
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
    resetTaskForm,
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
  };
}
