import { useState } from 'react';

import type { DashboardChatMessage, DashboardTask } from '../lib/storage';

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
  mode?: 'focus' | 'short' | 'long';
  minutes?: number;
};

type ChatAction = ChatTaskAction | ChatDeleteTaskAction | ChatUpdateTaskAction | ChatTimerAction;

type CurrentDateContext = {
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

type UseDashboardChatParams = {
  defaultMessages: DashboardChatMessage[];
  tasks: DashboardTask[];
  sessionsByDay: Record<string, number>;
  sessionsCompletedToday: number;
  timerContext: {
    mode: 'focus' | 'short' | 'long';
    minutes: number;
    timeLeft: number;
    isRunning: boolean;
  };
  currentDateContext: CurrentDateContext;
  taskColors: string[];
  formatDate: (date: Date) => string;
  isValidTaskDate: (value?: string) => boolean;
  isValidTaskTime: (value?: string) => boolean;
  findMatchingTaskIndex: (
    tasks: DashboardTask[],
    targetName?: string,
    targetDate?: string,
    targetTime?: string
  ) => number;
  parseTimerActionFromMessage: (message: string) => ChatTimerAction | null;
  applyChatTimerAction: (action: ChatTimerAction) => void;
  setTasks: React.Dispatch<React.SetStateAction<DashboardTask[]>>;
};

export function useDashboardChat({
  defaultMessages,
  tasks,
  sessionsByDay,
  sessionsCompletedToday,
  timerContext,
  currentDateContext,
  taskColors,
  formatDate,
  isValidTaskDate,
  isValidTaskTime,
  findMatchingTaskIndex,
  parseTimerActionFromMessage,
  applyChatTimerAction,
  setTasks,
}: UseDashboardChatParams) {
  const [messages, setMessages] = useState<DashboardChatMessage[]>(defaultMessages);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  const getFriendlyChatError = (status: number, payloadError?: string, rawText?: string) => {
    if (status === 429 || status === 503 || status === 529) {
      return "Le coach IA est temporairement surcharge. Reessaie dans quelques secondes.";
    }

    if (payloadError?.trim()) return payloadError;
    if (rawText?.trim()) return rawText;

    return `La fonction de chat a renvoye le statut ${status}.`;
  };

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
            timer: timerContext,
            currentDate: currentDateContext,
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
        const errorMessage = getFriendlyChatError(response.status, payload?.error, responseText);
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
        const newTasks: DashboardTask[] = taskActions.map((action, index) => ({
          id: `ai-${Date.now()}-${index}`,
          name: action.name!.trim(),
          completed: false,
          color:
            typeof action.color === 'string' && taskColors.includes(action.color)
              ? action.color
              : taskColors[index % taskColors.length],
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
            if (matchIndex >= 0) nextTasks.splice(matchIndex, 1);
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
              color: typeof action.color === 'string' && taskColors.includes(action.color) ? action.color : existingTask.color,
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

  return {
    messages,
    setMessages,
    chatInput,
    setChatInput,
    isSendingChat,
    handleSendChat,
  };
}
