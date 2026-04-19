import { useState } from 'react';

import { buildTasksFromAiActions, extractAddTaskActions } from '../lib/dashboardAi';
import { prepareChatAttachment, type ChatAttachment } from '../lib/chatAttachments';
import type { DashboardChatMessage, DashboardTask } from '../lib/storage';

type ChatTaskAction = Parameters<typeof buildTasksFromAiActions>[0]['actions'][number];

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
  mode?: 'focus' | 'pause' | 'short' | 'long';
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
    mode: 'focus' | 'pause';
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
  const [chatAttachments, setChatAttachments] = useState<ChatAttachment[]>([]);
  const [isPreparingChatAttachments, setIsPreparingChatAttachments] = useState(false);
  const [chatAttachmentError, setChatAttachmentError] = useState<string | null>(null);

  const getFriendlyChatError = (status: number, payloadError?: string, rawText?: string) => {
    if (status === 429 || status === 503 || status === 529) {
      return "Le coach IA est temporairement surcharge. Reessaie dans quelques secondes.";
    }

    if (payloadError?.trim()) return payloadError;
    if (rawText?.trim()) return rawText;

    return `La fonction de chat a renvoye le statut ${status}.`;
  };

  const handleChatFileSelect = async (files?: FileList | File[] | null) => {
    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.length === 0) return;

    setIsPreparingChatAttachments(true);
    setChatAttachmentError(null);

    try {
      const availableSlots = Math.max(0, 4 - chatAttachments.length);
      if (availableSlots === 0) {
        setChatAttachmentError('Maximum 4 fichiers par message.');
        return;
      }

      const preparedAttachments = await Promise.all(selectedFiles.slice(0, availableSlots).map(prepareChatAttachment));
      setChatAttachments((prev) => [...prev, ...preparedAttachments]);

      if (selectedFiles.length > availableSlots) {
        setChatAttachmentError('Maximum 4 fichiers par message. Les fichiers en trop ont ete ignores.');
      }
    } catch (error) {
      setChatAttachmentError(error instanceof Error ? error.message : 'Impossible de joindre ce fichier.');
    } finally {
      setIsPreparingChatAttachments(false);
    }
  };

  const removeChatAttachment = (id: string) => {
    setChatAttachments((prev) => prev.filter((attachment) => attachment.id !== id));
    setChatAttachmentError(null);
  };

  const handleSendChat = async () => {
    const message = chatInput.trim();
    if ((!message && chatAttachments.length === 0) || isSendingChat || isPreparingChatAttachments) return;

    const attachmentsForRequest = chatAttachments;
    const attachmentNames = attachmentsForRequest.map((attachment) => attachment.name);
    const effectiveMessage = message || 'Analyse les fichiers joints et aide-moi a les comprendre.';
    const displayMessage =
      attachmentNames.length > 0
        ? `${message || 'Fichiers joints'}\n\nPieces jointes: ${attachmentNames.join(', ')}`
        : effectiveMessage;
    const nextMessages = [...messages, { role: 'user' as const, content: displayMessage }];

    setMessages(nextMessages);
    setChatInput('');
    setChatAttachments([]);
    setChatAttachmentError(null);
    setIsSendingChat(true);

    try {
      if (attachmentsForRequest.length > 0) {
        console.info(
          'Sending chat attachments',
          attachmentsForRequest.map((attachment) => ({
            name: attachment.name,
            kind: attachment.kind,
            mediaType: attachment.mediaType,
            size: attachment.size,
            dataLength: attachment.data?.length ?? 0,
            textLength: attachment.text?.length ?? 0,
          }))
        );
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          message: effectiveMessage,
          context: {
            tasks,
            history: nextMessages.slice(-12),
            attachments: attachmentsForRequest.map(({ id: _id, ...attachment }) => attachment),
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
        setChatAttachments(attachmentsForRequest);
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

      const taskActions = extractAddTaskActions(payload?.actions) as ChatTaskAction[];

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

      const fallbackTimerAction = timerActions.length === 0 ? parseTimerActionFromMessage(effectiveMessage) : null;
      const effectiveTimerActions = fallbackTimerAction ? [fallbackTimerAction] : timerActions;

      if (taskActions.length > 0) {
        const newTasks: DashboardTask[] = buildTasksFromAiActions({
          actions: taskActions,
          taskColors,
          formatDate,
          isValidTaskDate,
          isValidTaskTime,
        });

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
      setChatAttachments(attachmentsForRequest);
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
    chatAttachments,
    isPreparingChatAttachments,
    chatAttachmentError,
    handleChatFileSelect,
    removeChatAttachment,
    handleSendChat,
  };
}
