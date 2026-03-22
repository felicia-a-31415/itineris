import { useEffect, useMemo, useRef, useState } from 'react';

import type { DashboardTask } from '../lib/storage';
import { MINIMUM_STREAK_MINUTES, formatDate } from '../lib/dashboard';

type UseDashboardMetricsParams = {
  tasks: DashboardTask[];
  studyData: Record<string, number[]>;
  sessionsByDay: Record<string, number>;
  currentWeekStart: string;
  weekDates: Date[];
  timeView: 'week' | 'month';
  weekOffset: number;
  monthOffset: number;
  monthAnchor: Date;
};

const getMinutesForDate = (targetDate: Date, data: Record<string, number[]>) => {
  const normalized = new Date(targetDate);
  normalized.setHours(0, 0, 0, 0);

  const dayOfWeek = normalized.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(normalized);
  weekStart.setDate(normalized.getDate() + diff);

  const weekKey = formatDate(weekStart);
  const weekArray = data[weekKey];
  if (!weekArray) return 0;

  const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const value = weekArray[index];
  return typeof value === 'number' && !Number.isNaN(value) ? value : 0;
};

const computeStreakFromStudyData = (data: Record<string, number[]>) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;

  for (let index = 0; index < 365; index += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - index);
    const minutes = getMinutesForDate(day, data);

    if (minutes >= MINIMUM_STREAK_MINUTES) {
      streak += 1;
      continue;
    }

    if (index === 0) continue;
    break;
  }

  return streak;
};

const isToday = (date: Date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export function useDashboardMetrics({
  tasks,
  studyData,
  sessionsByDay,
  currentWeekStart,
  weekDates,
  timeView,
  weekOffset,
  monthOffset,
  monthAnchor,
}: UseDashboardMetricsParams) {
  const [streakDays, setStreakDays] = useState(1);
  const [streakBump, setStreakBump] = useState(false);
  const prevStreakRef = useRef<number | null>(null);
  const hasInitializedStreakRef = useRef(false);
  const hasHydratedStreakRef = useRef(false);

  useEffect(() => {
    const updateStreak = () => {
      setStreakDays(computeStreakFromStudyData(studyData));
    };

    updateStreak();
    const interval = window.setInterval(updateStreak, 60_000);
    return () => window.clearInterval(interval);
  }, [studyData]);

  useEffect(() => {
    if (!hasInitializedStreakRef.current) {
      prevStreakRef.current = streakDays;
      hasInitializedStreakRef.current = true;
      return;
    }

    if (!hasHydratedStreakRef.current) {
      prevStreakRef.current = streakDays;
      hasHydratedStreakRef.current = true;
      return;
    }

    if (prevStreakRef.current !== null && streakDays > prevStreakRef.current) {
      setStreakBump(true);
      window.setTimeout(() => setStreakBump(false), 240);
    }
    prevStreakRef.current = streakDays;
  }, [streakDays]);

  return useMemo(() => {
    const currentWeekKey = currentWeekStart;
    const weekTotal = (studyData[currentWeekKey] || []).reduce((sum, value) => sum + value, 0);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.completed).length;
    const roundedStudiedMinutes = Math.round(weekTotal);
    const todayKey = formatDate(new Date());
    const sessionsCompletedToday = sessionsByDay[todayKey] ?? 0;
    const activeWeekKey = formatDate(weekDates[0]);
    const activeWeekMinutesRaw = studyData[activeWeekKey] ?? [];
    const activeWeekMinutes = Array.from({ length: 7 }, (_, index) => activeWeekMinutesRaw[index] ?? 0);
    const maxWeekMinutes = Math.max(60, ...activeWeekMinutes);
    const activeWeekTotalMinutes = Math.round(activeWeekMinutes.reduce((sum, value) => sum + value, 0));
    const todayDay = new Date().getDay();
    const daysElapsedThisWeek = todayDay === 0 ? 7 : todayDay;
    const elapsedWeekTotalMinutes = Math.round(
      activeWeekMinutes.slice(0, daysElapsedThisWeek).reduce((sum, value) => sum + value, 0)
    );
    const averageDailyMinutes = Math.round(elapsedWeekTotalMinutes / Math.max(1, daysElapsedThisWeek));
    const previousWeekStart = new Date(weekDates[0]);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    const previousWeekKey = formatDate(previousWeekStart);
    const previousWeekMinutes = studyData[previousWeekKey] ?? [];
    const previousWeekTotalMinutes = Math.round(previousWeekMinutes.reduce((sum, value) => sum + (value || 0), 0));
    const weekDeltaMinutes = activeWeekTotalMinutes - previousWeekTotalMinutes;
    const studyGoalMinutes = 240;
    const studyProgressRatio = Math.min(1, roundedStudiedMinutes / studyGoalMinutes || 0);
    const streakSegments = 7;
    const streakFilledSegments = Math.min(streakDays, streakSegments);
    const taskProgressRatio = totalTasks > 0 ? completedTasks / totalTasks : 0;
    const streakColor = streakDays > 0 ? '#F97316' : '#6B7280';
    const isCurrentRangeToday = (date: Date) =>
      isToday(date) && (timeView === 'month' ? monthOffset === 0 : weekOffset === 0);
    const greetingHour = new Date().getHours();
    const greeting = greetingHour < 12 ? 'Bonjour' : greetingHour < 18 ? 'Bon après-midi' : 'Bonsoir';
    const monthRangeEnd = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 0);

    return {
      streakDays,
      streakBump,
      streakColor,
      roundedStudiedMinutes,
      sessionsCompletedToday,
      totalTasks,
      completedTasks,
      activeWeekMinutes,
      maxWeekMinutes,
      activeWeekTotalMinutes,
      averageDailyMinutes,
      weekDeltaMinutes,
      studyGoalMinutes,
      studyProgressRatio,
      streakSegments,
      streakFilledSegments,
      taskProgressRatio,
      isCurrentRangeToday,
      greeting,
      monthRangeEnd,
    };
  }, [currentWeekStart, monthAnchor, monthOffset, sessionsByDay, streakBump, streakDays, studyData, tasks, timeView, weekDates, weekOffset]);
}
