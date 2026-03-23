import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Flame, LogOut, Settings } from 'lucide-react';
import { Button } from '../ui/button';
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
import { clearUserData, type DashboardTask } from '../lib/storage';

interface TableauDeBordScreenProps {
  userName?: string;
}

export function TableauDeBord({ userName = 'étudiant' }: TableauDeBordScreenProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user, loading } = useAuth();
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
    weekDates,
    createDefaultTasks,
  });

  const [sessionsByDay, setSessionsByDay] = useState<Record<string, number>>(() => createDefaultSessionsByDay());
  const [studyData, setStudyData] = useState<Record<string, number[]>>(() =>
    createDefaultStudyData(currentWeekStart)
  );
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const {
    timerMinutes,
    timeLeft,
    timerMode,
    isRunning,
    isEditingTimer,
    editingTimerValue,
    safeMinutes,
    ringColor,
    progress,
    isInitialTime,
    formatTime,
    setTimerMode,
    setIsRunning,
    setIsEditingTimer,
    setEditingTimerValue,
    setCustomTimerMinutes,
    commitTimerEdit,
    buildTimerState,
    hydrateTimerState,
    resetHydrationGuard,
    applyChatTimerAction,
    startTimer,
    resetTimerToCurrentDuration,
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
    currentDateContext: buildCurrentDateContext(),
    taskColors: TASK_COLORS,
    formatDate,
    isValidTaskDate,
    isValidTaskTime,
    findMatchingTaskIndex,
    parseTimerActionFromMessage,
    applyChatTimerAction,
    setTasks,
  });
  const { requestedAuthMode, shouldShowDashboardAuthGate, enableGuestAccess } = useDashboardAccess({
    userId: user?.id,
    loading,
    location,
  });
  const timerPersistenceKey = `${timerMode}:${safeMinutes}:${Math.round(timeLeft)}:${isRunning ? 1 : 0}`;
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
  }, [messages, isSendingChat, isDashboardHydrated]);

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
    greeting,
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

  return (
    <div className="app-shell min-h-screen p-6 text-[#F5F2F7] md:p-10">
      <style>{`
        .streak {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .streak__icon {
          width: 1.6rem;
          height: 1.6rem;
          line-height: 1;
        }
        .streak__num {
          font-size: 0.95rem;
          font-weight: 700;
        }
        .streak--bump {
          animation: streakBump 220ms ease-out;
        }
        @keyframes streakBump {
          0% {
            transform: scale(1);
            filter: drop-shadow(0 0 0 rgba(249, 115, 22, 0));
          }
          60% {
            transform: scale(1.08);
            filter: drop-shadow(0 0 16px rgba(249, 115, 22, 0.55));
          }
          100% {
            transform: scale(1);
            filter: drop-shadow(0 0 0 rgba(249, 115, 22, 0));
          }
        }
      `}</style>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-xl md:text-2xl font-semibold text-[#ECECF3]">
                  {greeting}, {userName} 👋
                </h1>
                <p className="app-muted text-sm">Prêt(e) à continuer ton voyage d&apos;apprentissage ?</p>
              </div>
              <div
                className={`streak text-sm font-bold ${streakBump ? 'streak--bump' : ''}`}
                style={{ color: streakColor }}
              >
                <Flame className="streak__icon" />
                <span className="streak__num">{streakDays}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <Button
                onClick={async () => {
                  const { error } = await signOut();
                  if (error) {
                    console.error('Supabase sign out error:', error);
                    return;
                  }
                  clearUserData();
                  navigate('/');
                }}
                variant="ghost"
                className="text-white/72 hover:text-white hover:bg-white/6 rounded-xl"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            ) : null}
            <Button
              onClick={() => navigate('/parametres')}
              variant="ghost"
              className="text-white/72 hover:text-white hover:bg-white/6 rounded-xl"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
        {!user ? (
          <div className="app-panel rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
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

        <div className="grid gap-6 items-stretch md:grid-cols-2">
          <TimerCard
            timerMode={timerMode}
            timerMinutes={timerMinutes}
            timeLeft={timeLeft}
            progress={progress}
            ringColor={ringColor}
            isRunning={isRunning}
            isInitialTime={isInitialTime}
            safeMinutes={safeMinutes}
            isEditingTimer={isEditingTimer}
            editingTimerValue={editingTimerValue}
            presetMinutes={TIMER_PRESET_MINUTES}
            formatTime={formatTime}
            onModeSelect={(mode) => {
              const next = TIMER_MODES[mode];
              setTimerMode(mode);
              setIsEditingTimer(false);
              setCustomTimerMinutes(next.minutes);
            }}
            onToggleRunning={() => {
              if (isRunning) {
                setIsRunning(false);
                return;
              }
              startTimer();
            }}
            onReset={() => {
              resetTimerToCurrentDuration();
              persistDashboardSnapshot({
                mode: timerMode,
                minutes: safeMinutes,
                remainingSeconds: Math.max(1, Math.round(safeMinutes * 60)),
                isRunning: false,
                updatedAt: Date.now(),
              });
            }}
            onPresetSelect={setCustomTimerMinutes}
            onCustomClick={() => {
              setIsEditingTimer(true);
              setEditingTimerValue(Math.max(1, Math.round(safeMinutes * 60)).toString());
            }}
            onEditingValueChange={setEditingTimerValue}
            onEditingFocus={() => {
              setIsEditingTimer(true);
              if (!editingTimerValue) {
                setEditingTimerValue(Math.max(1, Math.round(safeMinutes * 60)).toString());
              }
            }}
            onEditingBlur={() => setIsEditingTimer(false)}
            onEditingCancel={() => {
              setIsEditingTimer(false);
              setEditingTimerValue(Math.max(1, Math.round(safeMinutes * 60)).toString());
            }}
            onEditingCommit={commitTimerEdit}
          />

          <ChatCard
            chatScrollRef={chatScrollRef}
            messages={messages}
            isSendingChat={isSendingChat}
            chatInput={chatInput}
            setChatInput={setChatInput}
            onSend={() => void handleSendChat()}
            renderFormattedMessage={renderFormattedMessage}
          />
        </div>

        <AgendaCard
          timeView={timeView}
          calendarMode={calendarMode}
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
          onCalendarModeChange={setCalendarMode}
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
        />

        <StudyStatsCard
          weekDates={weekDates}
          activeWeekMinutes={activeWeekMinutes}
          maxWeekMinutes={maxWeekMinutes}
          activeWeekTotalMinutes={activeWeekTotalMinutes}
          averageDailyMinutes={averageDailyMinutes}
          weekDeltaMinutes={weekDeltaMinutes}
          getDayName={getDayName}
          onToday={handleToday}
          onPrevRange={handlePrevRange}
          onNextRange={handleNextRange}
        />

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
    </div>
  );
}
