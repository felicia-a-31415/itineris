import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bug,
  BarChart3,
  CalendarDays,
  Check,
  CheckSquare,
  Flame,
  MessageCircle,
  Pencil,
  Settings,
  Timer as TimerIcon,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { DashboardTaskListPanel } from '../components/dashboard/TaskListPanel';
import { DashboardAuthGate } from '../components/dashboard/DashboardAuthGate';
import { AgendaCard } from '../components/dashboard/AgendaCard';
import { ChatCard } from '../components/dashboard/ChatCard';
import { TaskDetailsPopoverContent } from '../components/dashboard/TaskDetailsPopoverContent';
import { StudyStatsCard } from '../components/dashboard/StudyStatsCard';
import { TaskCreationDialog } from '../components/dashboard/TaskCreationDialog';
import { TimerCard } from '../components/dashboard/TimerCard';
import alarmSound from '../assets/Gentle-little-bell-ringing-sound-effect.mp3';
import { useAuth } from '../lib/auth';
import {
  DEFAULT_CHAT_MESSAGES,
  REMOTE_DASHBOARD_SAVE_INTERVAL_MS,
  TASK_COLORS,
  TIMER_MODES,
  TIMER_PRESET_MINUTES,
  addElapsedStudySeconds,
  buildCurrentDateContext,
  createDefaultSessionsByDay,
  createDefaultStudyData,
  createDefaultTasks,
  findMatchingTaskIndex,
  formatDate,
  getCurrentWeekDates,
  getWeekStartKeyForDate,
  getWeekdayArrayIndex,
  getDayName,
  isValidTaskDate,
  isValidTaskTime,
  parseLocalDateString,
  parseTimerActionFromMessage,
  renderFormattedMessage,
} from '../lib/dashboard';
import { useDashboardAccess } from '../hooks/useDashboardAccess';
import { useDashboardChat } from '../hooks/useDashboardChat';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useDashboardPersistence } from '../hooks/useDashboardPersistence';
import { useDashboardTasks } from '../hooks/useDashboardTasks';
import { useDashboardTimer } from '../hooks/useDashboardTimer';
import { useDashboardView } from '../hooks/useDashboardView';
import { type DashboardChatMessage, type DashboardTask } from '../lib/storage';

interface TableauDeBordScreenProps {
  userName?: string;
}

type DashboardPage = 'timer' | 'stats' | 'chat' | 'agenda' | 'tasks';
type ChatThread = {
  id: string;
  title: string;
  messages: DashboardChatMessage[];
};

const DASHBOARD_NAV_ITEMS = [
  { key: 'timer', label: 'Minuteur', Icon: TimerIcon },
  { key: 'stats', label: 'Stats', Icon: BarChart3 },
  { key: 'chat', label: 'Chat IA', Icon: MessageCircle },
  { key: 'agenda', label: 'Agenda', Icon: CalendarDays },
  { key: 'tasks', label: 'Tâches', Icon: CheckSquare },
  { key: 'settings', label: 'Paramètres', Icon: Settings },
] satisfies Array<{ key: DashboardPage | 'settings'; label: string; Icon: typeof TimerIcon }>;

const DASHBOARD_PAGE_PATHS: Record<DashboardPage, string> = {
  timer: '/minuteur',
  stats: '/stats',
  chat: '/chat-ia',
  agenda: '/agenda',
  tasks: '/taches',
};

const getDashboardPageFromPath = (pathname: string): DashboardPage => {
  if (pathname === DASHBOARD_PAGE_PATHS.chat) return 'chat';
  if (pathname === DASHBOARD_PAGE_PATHS.stats) return 'stats';
  if (pathname === DASHBOARD_PAGE_PATHS.agenda) return 'agenda';
  if (pathname === DASHBOARD_PAGE_PATHS.tasks) return 'tasks';
  return 'timer';
};

const createChatThreadId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `chat-${Date.now()}`;

const getChatThreadTitle = (messages: DashboardChatMessage[], fallback: string) => {
  const firstUserMessage = messages.find((message) => message.role === 'user' && message.content.trim().length > 0);
  if (!firstUserMessage) return fallback;
  return firstUserMessage.content.trim().slice(0, 36);
};

export function TableauDeBord({ userName: _userName = 'étudiant' }: TableauDeBordScreenProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user, loading } = useAuth();
  const {
    weekOffset,
    weekDates,
    currentWeekStart,
    timeView,
    setTimeView,
    calendarMode,
    setCalendarMode,
    monthOffset,
    monthAnchor,
    monthRangeStart,
    calendarDates,
    headerDates,
    handlePrevRange,
    handleNextRange,
    handleToday,
  } = useDashboardView();
  const currentDateContext = buildCurrentDateContext();
  const {
    tasks,
    setTasks,
    uploadNotice,
    showAddDialog,
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
    editingNameValue,
    setEditingNameValue,
    modalTaskId,
    draftTaskIdRef,
    taskDetailsId,
    setTaskDetailsId,
    deleteCompletedMenuOpen,
    setDeleteCompletedMenuOpen,
    taskListItemRefs,
    taskListPositionsRef,
    pendingTaskMotionRef,
    showCompletedTasks,
    setShowCompletedTasks,
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
  } = useDashboardTasks({
    taskColors: TASK_COLORS,
    formatDate,
    createDefaultTasks,
    currentDateContext,
    isValidTaskDate,
    isValidTaskTime,
  });

  const [sessionsByDay, setSessionsByDay] = useState<Record<string, number>>(() => createDefaultSessionsByDay());
  const [studyData, setStudyData] = useState<Record<string, number[]>>(() =>
    createDefaultStudyData(currentWeekStart)
  );
  const [isUnlockingTimer, setIsUnlockingTimer] = useState(false);
  const [timerUnlockPassword, setTimerUnlockPassword] = useState('');
  const [timerUnlockError, setTimerUnlockError] = useState<string | null>(null);
  const activeDashboardPage = getDashboardPageFromPath(location.pathname);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const {
    timerMinutes,
    timeLeft,
    timerMode,
    timerTool,
    stopwatchSeconds,
    isRunning,
    isTimerLocked,
    isEditingTimer,
    editingTimerValue,
    safeMinutes,
    ringColor,
    progress,
    isInitialTime,
    formatTime,
    setTimerMode,
    setTimerTool,
    setIsTimerLocked,
    setIsEditingTimer,
    setEditingTimerValue,
    setCustomTimerMinutes,
    commitTimerEdit,
    buildTimerState,
    hydrateTimerState,
    resetHydrationGuard,
    applyChatTimerAction,
    startTimer,
    stopTimer,
    resetTimerToCurrentDuration,
    saveStopwatchSessionToStats,
  } = useDashboardTimer({
    timerModes: TIMER_MODES,
    alarmSoundSrc: alarmSound,
    addElapsedStudySeconds,
    formatDate,
    getCurrentWeekDates,
    setStudyData,
    setSessionsByDay,
  });
  const {
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
  } = useDashboardChat({
    defaultMessages: DEFAULT_CHAT_MESSAGES,
    tasks,
    sessionsByDay,
    sessionsCompletedToday: sessionsByDay[formatDate(new Date())] ?? 0,
    timerContext: {
      mode: timerMode,
      minutes: safeMinutes,
      timeLeft,
      isRunning,
    },
    currentDateContext,
    taskColors: TASK_COLORS,
    formatDate,
    isValidTaskDate,
    isValidTaskTime,
    findMatchingTaskIndex,
    parseTimerActionFromMessage,
    applyChatTimerAction,
    setTasks,
  });
  const [activeChatThreadId, setActiveChatThreadId] = useState('current');
  const [chatThreads, setChatThreads] = useState<ChatThread[]>(() => [
    {
      id: 'current',
      title: 'Conversation actuelle',
      messages: DEFAULT_CHAT_MESSAGES,
    },
  ]);
  const [editingChatThreadId, setEditingChatThreadId] = useState<string | null>(null);
  const [editingChatTitle, setEditingChatTitle] = useState('');
  const { requestedAuthMode, shouldShowDashboardAuthGate, enableGuestAccess } = useDashboardAccess({
    userId: user?.id,
    loading,
    location,
  });
  const timerPersistenceKey = `${timerTool}:${timerMode}:${safeMinutes}:${Math.round(timeLeft)}:${Math.round(stopwatchSeconds)}:${isRunning ? 1 : 0}:${isTimerLocked ? 1 : 0}`;
  const { isDashboardHydrated, persistDashboardSnapshot } = useDashboardPersistence({
    userId: user?.id,
    loading,
    currentWeekStart,
    timerPersistenceKey,
    tasks,
    setTasks,
    studyData,
    setStudyData,
    sessionsByDay,
    setSessionsByDay,
    messages,
    setMessages,
    defaultMessages: DEFAULT_CHAT_MESSAGES,
    createDefaultTasks,
    createDefaultStudyData,
    createDefaultSessionsByDay,
    buildTimerState,
    hydrateTimerState,
    resetHydrationGuard,
    remoteSaveIntervalMs: REMOTE_DASHBOARD_SAVE_INTERVAL_MS,
  });

  useEffect(() => {
    if (!chatScrollRef.current) return;
    chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [messages, isSendingChat, isDashboardHydrated, activeDashboardPage]);

  useEffect(() => {
    setStudyData((prev) => {
      if (prev[currentWeekStart]) return prev;
      return { ...prev, [currentWeekStart]: [0, 0, 0, 0, 0, 0, 0] };
    });
  }, [currentWeekStart]);
  const {
    streakDays,
    streakBump,
    streakColor,
    activeWeekMinutes,
    maxWeekMinutes,
    activeWeekTotalMinutes,
    averageDailyMinutes,
    weekDeltaMinutes,
    isCurrentRangeToday,
  } = useDashboardMetrics({
    tasks,
    studyData,
    sessionsByDay,
    currentWeekStart,
    weekDates,
    timeView,
    weekOffset,
    monthOffset,
    monthAnchor,
  });

  const handleManualStudyTimeChange = (dateKey: string, minutes: number, mode: 'add' | 'set') => {
    const targetDate = parseLocalDateString(dateKey);
    if (!targetDate || !Number.isFinite(minutes)) return;

    const normalizedMinutes = Math.max(0, Math.round(minutes));
    const weekKey = getWeekStartKeyForDate(targetDate);
    const dayIndex = getWeekdayArrayIndex(targetDate);

    setStudyData((prev) => {
      const weekArray = Array.from({ length: 7 }, (_, index) => prev[weekKey]?.[index] ?? 0);
      weekArray[dayIndex] =
        mode === 'add' ? Math.max(0, (weekArray[dayIndex] ?? 0) + normalizedMinutes) : normalizedMinutes;
      return { ...prev, [weekKey]: weekArray };
    });
  };

  const openTimerUnlockPrompt = () => {
    setIsUnlockingTimer(true);
    setTimerUnlockPassword('');
    setTimerUnlockError(null);
  };

  const handleTimerUnlockSubmit = async () => {
    const email = user?.email?.trim();
    const password = timerUnlockPassword;

    if (!email) {
      setTimerUnlockError('Connecte-toi pour déverrouiller le minuteur.');
      return;
    }

    if (password.length < 1) {
      setTimerUnlockError('Entre ton mot de passe.');
      return;
    }

    const { error } = await signIn(email, password);
    if (error) {
      setTimerUnlockError('Mot de passe incorrect.');
      return;
    }

    setIsTimerLocked(false);
    stopTimer();
    setIsUnlockingTimer(false);
    setTimerUnlockPassword('');
    setTimerUnlockError(null);
  };

  const renderTimerCard = (isExpanded = false, variant: 'panel' | 'seamless' = 'panel') => (
    <TimerCard
      timerTool={timerTool}
      timerMode={timerMode}
      timerMinutes={timerMinutes}
      timeLeft={timeLeft}
      stopwatchSeconds={stopwatchSeconds}
      progress={progress}
      ringColor={ringColor}
      isRunning={isRunning}
      isTimerLocked={isTimerLocked}
      isUnlockingTimer={isUnlockingTimer}
      unlockPassword={timerUnlockPassword}
      unlockError={timerUnlockError}
      isInitialTime={isInitialTime}
      safeMinutes={safeMinutes}
      isEditingTimer={isEditingTimer}
      editingTimerValue={editingTimerValue}
      presetMinutes={TIMER_PRESET_MINUTES}
      formatTime={formatTime}
      variant={variant}
      isExpanded={isExpanded}
      onToolSelect={(tool) => {
        if (isTimerLocked) return;
        setTimerTool(tool);
      }}
      onModeSelect={(mode) => {
        if (isTimerLocked) return;
        const next = TIMER_MODES[mode];
        setTimerMode(mode);
        setIsEditingTimer(false);
        setCustomTimerMinutes(next.minutes);
      }}
      onToggleRunning={() => {
        if (isTimerLocked && isRunning) {
          openTimerUnlockPrompt();
          return;
        }
        if (isRunning) {
          stopTimer();
          return;
        }
        startTimer();
        if (user?.email) {
          setIsTimerLocked(true);
        }
      }}
      onReset={() => {
        if (isTimerLocked) return;
        resetTimerToCurrentDuration();
        persistDashboardSnapshot({
          tool: timerTool,
          mode: timerMode,
          minutes: safeMinutes,
          remainingSeconds: Math.max(1, Math.round(safeMinutes * 60)),
          stopwatchSeconds: timerTool === 'stopwatch' ? 0 : stopwatchSeconds,
          isRunning: false,
          isLocked: isTimerLocked,
          updatedAt: Date.now(),
        });
      }}
      onPresetSelect={(minutes) => {
        if (isTimerLocked) return;
        setCustomTimerMinutes(minutes);
      }}
      onCustomClick={() => {
        if (isTimerLocked) return;
        setIsEditingTimer(true);
        setEditingTimerValue(Math.max(1, Math.round(safeMinutes)).toString());
      }}
      onEditingValueChange={setEditingTimerValue}
      onEditingFocus={() => {
        setIsEditingTimer(true);
        if (!editingTimerValue) {
          setEditingTimerValue(Math.max(1, Math.round(safeMinutes)).toString());
        }
      }}
      onEditingBlur={commitTimerEdit}
      onEditingCancel={() => {
        setIsEditingTimer(false);
        setEditingTimerValue(Math.max(1, Math.round(safeMinutes)).toString());
      }}
      onEditingCommit={commitTimerEdit}
      onSaveStopwatchSession={saveStopwatchSessionToStats}
      onUnlockPasswordChange={(value) => {
        setTimerUnlockPassword(value);
        setTimerUnlockError(null);
      }}
      onUnlockSubmit={() => void handleTimerUnlockSubmit()}
      onUnlockCancel={() => {
        setIsUnlockingTimer(false);
        setTimerUnlockPassword('');
        setTimerUnlockError(null);
      }}
    />
  );

  const renderChatCard = (isExpanded = false) => (
    <ChatCard
      chatScrollRef={chatScrollRef}
      messages={messages}
      isSendingChat={isSendingChat}
      attachments={chatAttachments}
      isPreparingAttachments={isPreparingChatAttachments}
      attachmentError={chatAttachmentError}
      chatInput={chatInput}
      setChatInput={setChatInput}
      onFilesSelected={(files) => void handleChatFileSelect(files)}
      onRemoveAttachment={removeChatAttachment}
      onSend={() => void handleSendChat()}
      renderFormattedMessage={renderFormattedMessage}
      isExpanded={isExpanded}
    />
  );

  const renderAgendaCard = (isExpanded = false, modeOverride?: 'calendar' | 'tasks', showModeSwitch = true) => (
    <AgendaCard
      timeView={timeView}
      calendarMode={modeOverride ?? calendarMode}
      uploadNotice={uploadNotice}
      tasksListContent={tasksListContent}
      headerDates={headerDates}
      calendarDates={calendarDates}
      monthRangeStart={monthRangeStart}
      showAddDialog={showAddDialog}
      modalTaskId={modalTaskId}
      taskDetailsId={taskDetailsId}
      editingNameId={editingNameId}
      editingNameValue={editingNameValue}
      onTimeViewChange={setTimeView}
      onCalendarModeChange={showModeSwitch ? setCalendarMode : () => undefined}
      onToday={handleToday}
      onPrevRange={handlePrevRange}
      onNextRange={handleNextRange}
      onAgendaImageUpload={handleAgendaImageUpload}
      isCurrentRangeToday={isCurrentRangeToday}
      getDayName={getDayName}
      formatDate={formatDate}
      getTasksForDate={getTasksForDate}
      onCreateTask={createTaskForDate}
      onToggleTask={toggleTask}
      onEditingNameValueChange={setEditingNameValue}
      onCommitEditingName={commitEditingName}
      onCancelEditingName={cancelEditingName}
      onTaskDetailsChange={setTaskDetailsId}
      renderTaskInfoPopoverContent={renderTaskInfoPopoverContent}
      showModeSwitch={showModeSwitch}
      isExpanded={isExpanded}
    />
  );

  useEffect(() => {
    const nextPositions: Record<string, number> = {};

    visibleTasks.forEach((task) => {
      const node = taskListItemRefs.current[task.id];
      if (!node) return;

      const nextTop = node.getBoundingClientRect().top;
      const previousTop = taskListPositionsRef.current[task.id];
      nextPositions[task.id] = nextTop;

      if (previousTop === undefined) return;

      const deltaY = previousTop - nextTop;
      if (Math.abs(deltaY) < 1) return;

      const isTargetTask = pendingTaskMotionRef.current?.id === task.id;
      const direction = pendingTaskMotionRef.current?.direction;

      node.animate(
        isTargetTask && direction === 'down'
          ? [
              { transform: `translateY(${deltaY}px)`, offset: 0 },
              { transform: 'translateY(8px)', offset: 0.84 },
              { transform: 'translateY(0)', offset: 1 },
            ]
          : isTargetTask && direction === 'up'
            ? [
                { transform: `translateY(${deltaY}px)`, offset: 0 },
                { transform: 'translateY(-6px)', offset: 0.82 },
                { transform: 'translateY(0)', offset: 1 },
              ]
            : [
                { transform: `translateY(${deltaY}px)` },
                { transform: 'translateY(0)' },
              ],
        {
          duration: isTargetTask ? 420 : 280,
          easing: isTargetTask ? 'cubic-bezier(0.18, 0.9, 0.2, 1)' : 'cubic-bezier(0.22, 1, 0.36, 1)',
        }
      );
    });

    taskListPositionsRef.current = nextPositions;
    pendingTaskMotionRef.current = null;
  }, [visibleTasks]);

  const renderTaskInfoPopoverContent = (task: DashboardTask, close: () => void) => (
    <TaskDetailsPopoverContent
      task={task}
      editingNameId={editingNameId}
      editingNameValue={editingNameValue}
      onEditingNameValueChange={setEditingNameValue}
      onCommitEditingName={commitEditingName}
      onCancelEditingName={cancelEditingName}
      onStartEditingName={startEditingName}
      onUpdateTask={updateTask}
      onDeleteTask={(taskId) => setTasks((prev) => prev.filter((candidate) => candidate.id !== taskId))}
      onClose={close}
    />
  );

  const tasksListContent = (
    <DashboardTaskListPanel
      agendaTasks={agendaTasks}
      visibleTasks={visibleTasks}
      editingNameId={editingNameId}
      editingNameValue={editingNameValue}
      infoTaskId={infoTaskId}
      completedTasksCount={completedTasksCount}
      showCompletedTasks={showCompletedTasks}
      deleteCompletedMenuOpen={deleteCompletedMenuOpen}
      taskListItemRefs={taskListItemRefs}
      onEditingNameValueChange={setEditingNameValue}
      onCommitEditingName={commitEditingName}
      onCancelEditingName={cancelEditingName}
      onToggleTask={toggleTask}
      onInfoTaskChange={setInfoTaskId}
      onShowCompletedTasksChange={setShowCompletedTasks}
      onDeleteCompletedMenuOpenChange={setDeleteCompletedMenuOpen}
      onDeleteCompletedTasks={deleteCompletedTasks}
      parseLocalDateString={parseLocalDateString}
      renderTaskInfoPopoverContent={renderTaskInfoPopoverContent}
    />
  );

  const renderTasksPage = () => (
    <Card className="border-transparent bg-transparent p-6 shadow-none">
      <div className="mb-4">
        <p className="app-muted text-sm">Tâches</p>
      </div>
      {tasksListContent}
    </Card>
  );

  const renderActiveDashboardPage = () => {
    switch (activeDashboardPage) {
      case 'chat':
        return <div className="h-full min-h-0 w-full min-w-0 overflow-hidden">{renderChatCard()}</div>;
      case 'agenda':
        return renderAgendaCard(false, 'calendar', false);
      case 'tasks':
        return renderTasksPage();
      case 'stats':
        return (
          <StudyStatsCard
            weekDates={weekDates}
            activeWeekMinutes={activeWeekMinutes}
            maxWeekMinutes={maxWeekMinutes}
            activeWeekTotalMinutes={activeWeekTotalMinutes}
            averageDailyMinutes={averageDailyMinutes}
            weekDeltaMinutes={weekDeltaMinutes}
            getDayName={getDayName}
            formatDate={formatDate}
            onManualStudyTimeChange={handleManualStudyTimeChange}
            onToday={handleToday}
            onPrevRange={handlePrevRange}
            onNextRange={handleNextRange}
          />
        );
      case 'timer':
      default:
        return (
          <div className="w-full min-w-0">{renderTimerCard(false, 'seamless')}</div>
        );
    }
  };

  const handleDashboardNavSelect = (key: DashboardPage | 'settings') => {
    if (key === 'settings') {
      navigate('/parametres');
      return;
    }

    navigate(DASHBOARD_PAGE_PATHS[key]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getSavedChatThreads = () =>
    chatThreads.map((thread) =>
      thread.id === activeChatThreadId
        ? {
            ...thread,
            title: getChatThreadTitle(messages, thread.title),
            messages,
          }
        : thread
    );

  const clearChatDraft = () => {
    setChatInput('');
    chatAttachments.forEach((attachment) => removeChatAttachment(attachment.id));
  };

  const handleCreateNewChat = () => {
    const nextThreadId = createChatThreadId();
    const nextThread: ChatThread = {
      id: nextThreadId,
      title: 'Nouveau chat',
      messages: DEFAULT_CHAT_MESSAGES,
    };
    setChatThreads([nextThread, ...getSavedChatThreads()]);
    setActiveChatThreadId(nextThreadId);
    setMessages(DEFAULT_CHAT_MESSAGES);
    clearChatDraft();
    requestAnimationFrame(() => {
      if (!chatScrollRef.current) return;
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    });
  };

  const handleSelectChatThread = (threadId: string) => {
    const savedThreads = getSavedChatThreads();
    const selectedThread = savedThreads.find((thread) => thread.id === threadId);
    if (!selectedThread) return;

    setChatThreads(savedThreads);
    setActiveChatThreadId(threadId);
    setMessages(selectedThread.messages);
    setEditingChatThreadId(null);
    setEditingChatTitle('');
    clearChatDraft();
  };

  const handleStartRenameChatThread = (thread: ChatThread) => {
    setEditingChatThreadId(thread.id);
    setEditingChatTitle(thread.title);
  };

  const handleCommitRenameChatThread = () => {
    if (!editingChatThreadId) return;

    const nextTitle = editingChatTitle.trim() || 'Sans titre';
    setChatThreads((currentThreads) =>
      currentThreads.map((thread) => (thread.id === editingChatThreadId ? { ...thread, title: nextTitle } : thread))
    );
    setEditingChatThreadId(null);
    setEditingChatTitle('');
  };

  const handleCancelRenameChatThread = () => {
    setEditingChatThreadId(null);
    setEditingChatTitle('');
  };

  const handleDeleteChatThread = (threadId: string) => {
    const savedThreads = getSavedChatThreads();
    const remainingThreads = savedThreads.filter((thread) => thread.id !== threadId);
    const nextThreads =
      remainingThreads.length > 0
        ? remainingThreads
        : [
            {
              id: createChatThreadId(),
              title: 'Nouveau chat',
              messages: DEFAULT_CHAT_MESSAGES,
            },
          ];

    setChatThreads(nextThreads);
    setEditingChatThreadId(null);
    setEditingChatTitle('');

    if (threadId !== activeChatThreadId) return;

    const nextActiveThread = nextThreads[0];
    setActiveChatThreadId(nextActiveThread.id);
    setMessages(nextActiveThread.messages);
    clearChatDraft();
  };

  return (
    <div
      className={`app-shell p-6 pb-28 text-[#F5F2F7] md:p-10 md:pb-32 ${
        activeDashboardPage === 'chat' ? 'h-screen overflow-hidden' : 'min-h-screen'
      }`}
    >
      <div
        className={`mx-auto max-w-6xl ${
          activeDashboardPage === 'chat' ? 'flex h-full min-h-0 flex-col gap-6' : 'space-y-8'
        }`}
      >
        <header className="flex shrink-0 items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.01em] text-[#F5F2F7] md:text-3xl">Itineris</h1>
            <p className="mt-1 text-sm app-muted md:text-base">Prêt(e) à continuer ton voyage d'apprentissage ?</p>
          </div>

          <div
            className={`inline-flex shrink-0 items-center gap-1.5 text-lg font-medium transition-transform md:text-xl ${
              streakBump ? 'scale-105' : ''
            }`}
            style={{ color: streakColor }}
            aria-label={`${streakDays} jours de suite`}
            title={`${streakDays} jours de suite`}
          >
            <Flame className="h-5 w-5 md:h-6 md:w-6" />
            <span>{streakDays}</span>
          </div>
        </header>

        {!user ? (
          <div className="rounded-2xl border border-white/8 bg-transparent p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-sm app-muted">Mode invité</p>
              <p className="text-base text-[#F5F2F7]">
                Connecte-toi pour sauvegarder et synchroniser tes progrès.
              </p>
            </div>
            <Button
              onClick={() => navigate('/', { state: { authMode: 'login' } })}
              className="rounded-xl px-4"
            >
              Se connecter
            </Button>
          </div>
        ) : null}

        <div
          className={`transition-opacity duration-200 ease-out ${
            activeDashboardPage === 'chat' ? 'min-h-0 flex-1 overflow-hidden' : ''
          }`}
        >
          {activeDashboardPage === 'chat' ? (
            <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:grid-rows-1">
              <aside className="flex min-h-0 flex-col gap-3 border-b border-white/[0.06] pb-3 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
                <div className="shrink-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/42">Chat IA</p>
                    <span className="text-xs text-white/40">Bêta</span>
                  </div>
                  <p className="mt-1 hidden text-sm app-muted lg:block">Pose une question ou joins tes notes.</p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateNewChat}
                  className="h-10 shrink-0 rounded-full bg-[#6d42ff] px-4 text-left text-sm font-semibold text-white transition hover:bg-[#7b55ff]"
                >
                  + Nouveau chat
                </button>
                <div className="min-h-0 flex-1 overflow-y-auto app-scrollbar-hidden lg:mt-1">
                  <div className="flex gap-2 lg:flex-col">
                    {chatThreads.map((thread) => {
                      const isActiveThread = thread.id === activeChatThreadId;
                      const isEditingThread = editingChatThreadId === thread.id;
                      return (
                        <div
                          key={thread.id}
                          className={`group flex min-w-[210px] items-center gap-2 rounded-2xl px-2 py-2 transition lg:min-w-0 ${
                            isActiveThread
                              ? 'bg-white/[0.055] text-[#F5F2F7]'
                              : 'bg-transparent text-white/54 hover:bg-white/[0.035] hover:text-[#F5F2F7]'
                          }`}
                        >
                          {isEditingThread ? (
                            <>
                              <input
                                value={editingChatTitle}
                                onChange={(event) => setEditingChatTitle(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    event.preventDefault();
                                    handleCommitRenameChatThread();
                                  }
                                  if (event.key === 'Escape') {
                                    handleCancelRenameChatThread();
                                  }
                                }}
                                onBlur={handleCommitRenameChatThread}
                                className="min-w-0 flex-1 rounded-lg bg-white/[0.06] px-2 py-1 text-sm text-[#F5F2F7] outline-none"
                                autoFocus
                              />
                              <button
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={handleCommitRenameChatThread}
                                className="rounded-lg p-1 text-white/58 hover:bg-white/[0.06] hover:text-white"
                                aria-label="Sauvegarder le nom"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={handleCancelRenameChatThread}
                                className="rounded-lg p-1 text-white/58 hover:bg-white/[0.06] hover:text-white"
                                aria-label="Annuler le renommage"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSelectChatThread(thread.id)}
                                className="min-w-0 flex-1 py-1 text-left text-sm"
                              >
                                <span className="block truncate">{thread.title}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartRenameChatThread(thread)}
                                className="rounded-lg p-1 text-white/34 opacity-100 hover:bg-white/[0.06] hover:text-white lg:opacity-0 lg:group-hover:opacity-100"
                                aria-label={`Renommer ${thread.title}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteChatThread(thread.id)}
                                className="rounded-lg p-1 text-white/34 opacity-100 hover:bg-white/[0.06] hover:text-[#FFB4B4] lg:opacity-0 lg:group-hover:opacity-100"
                                aria-label={`Supprimer ${thread.title}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </aside>
              <div className="min-h-0 overflow-hidden">{renderActiveDashboardPage()}</div>
            </div>
          ) : (
            renderActiveDashboardPage()
          )}
        </div>

        <TaskCreationDialog
          open={showAddDialog && !!modalTask}
          title={newTaskName}
          date={selectedDate}
          time={selectedTime}
          selectedColor={selectedColor}
          colors={TASK_COLORS}
          onOpenChange={(open) => {
            if (!open) {
              cancelDraftTask(draftTaskIdRef.current);
            }
          }}
          onTitleChange={(value) => {
            setNewTaskName(value);
            if (modalTaskId) {
              updateTask(modalTaskId, { name: value.trim() || '(Titre)' });
            }
          }}
          onDateChange={(value) => {
            setSelectedDate(value);
            if (modalTaskId) {
              updateTask(modalTaskId, { date: value || undefined });
            }
          }}
          onTimeChange={(value) => {
            setSelectedTime(value);
            if (modalTaskId) {
              updateTask(modalTaskId, { time: value || undefined });
            }
          }}
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

        <DashboardAuthGate
          open={shouldShowDashboardAuthGate}
          initialMode={requestedAuthMode}
          onContinueWithoutAccount={enableGuestAccess}
        />
      </div>

      <nav
        className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4 pb-[env(safe-area-inset-bottom)]"
        aria-label="Navigation principale"
      >
        <div className="grid h-[70px] w-full max-w-[640px] grid-cols-6 rounded-[28px] border border-white/[0.08] bg-[rgba(15,10,30,0.6)] px-2 shadow-[0_18px_52px_rgba(0,0,0,0.42)] backdrop-blur-[20px]">
          {DASHBOARD_NAV_ITEMS.map(({ key, label, Icon }) => {
            const isActive = key === 'settings' ? false : activeDashboardPage === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleDashboardNavSelect(key)}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors duration-200 ${
                  isActive ? 'text-[#9F7BFF]' : 'text-white/52 hover:text-[#F5F2F7]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-105' : ''}`} />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <a
        href="https://forms.gle/ZTWbhwHJsR2vTfPE6"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-[80] flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.08] bg-[rgba(15,10,30,0.6)] text-white shadow-[0_18px_42px_rgba(0,0,0,0.45)] backdrop-blur-[20px] transition hover:scale-105 hover:border-white/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C7B7FF]/60 md:bottom-7 md:right-7"
        aria-label="Signaler un bug"
        title="Signaler un bug"
      >
        <Bug className="h-6 w-6" />
      </a>
    </div>
  );
}
