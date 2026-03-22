import { useMemo, useState } from 'react';

import {
  formatDate,
  formatMonthRangeLabel,
  getCurrentWeekDates,
  getMonthGridDates,
} from '../lib/dashboard';

export function useDashboardView() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [timeView, setTimeView] = useState<'week' | 'month'>('week');
  const [calendarMode, setCalendarMode] = useState<'calendar' | 'tasks'>('calendar');
  const [monthOffset, setMonthOffset] = useState(0);

  const weekDates = useMemo(() => getCurrentWeekDates(weekOffset), [weekOffset]);
  const currentWeekStart = formatDate(getCurrentWeekDates(0)[0]);
  const monthAnchor = useMemo(() => {
    const base = new Date();
    base.setDate(1);
    base.setMonth(base.getMonth() + monthOffset);
    return base;
  }, [monthOffset]);
  const monthGridDates = useMemo(() => getMonthGridDates(monthAnchor), [monthAnchor]);
  const monthRangeStart = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1);
  const monthRangeEnd = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 0);
  const monthRangeLabel =
    timeView === 'month'
      ? formatMonthRangeLabel(monthRangeStart, monthRangeEnd)
      : formatMonthRangeLabel(weekDates[0], weekDates[weekDates.length - 1]);
  const calendarDates = timeView === 'month' ? monthGridDates : weekDates;
  const headerDates = timeView === 'month' ? calendarDates.slice(0, 7) : weekDates;

  const handlePrevRange = () => {
    if (timeView === 'month') {
      setMonthOffset((prev) => prev - 1);
      return;
    }
    setWeekOffset((prev) => prev - 1);
  };

  const handleNextRange = () => {
    if (timeView === 'month') {
      setMonthOffset((prev) => prev + 1);
      return;
    }
    setWeekOffset((prev) => prev + 1);
  };

  const handleToday = () => {
    if (timeView === 'month') {
      setMonthOffset(0);
      return;
    }
    setWeekOffset(0);
  };

  return {
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
    monthRangeLabel,
    calendarDates,
    headerDates,
    handlePrevRange,
    handleNextRange,
    handleToday,
  };
}
