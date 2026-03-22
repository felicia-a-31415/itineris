import type React from 'react';

import type { DashboardChatMessage, DashboardTask } from './storage';

export type ChatTimerAction = {
  tool?: 'set_timer';
  action?: 'start' | 'pause' | 'reset' | 'set';
  mode?: keyof typeof TIMER_MODES;
  minutes?: number;
};

export const TASK_COLORS = ['#6B9AC4', '#4169E1', '#8B8680', '#E16941', '#41E169', '#9B59B6', '#F39C12', '#E91E63'];
export const REMOTE_DASHBOARD_SAVE_INTERVAL_MS = 30_000;
export const DASHBOARD_GUEST_ACCESS_KEY = 'itineris.dashboard.guest-access';
export const MINIMUM_STREAK_MINUTES = 1;
export const TIMER_MODES = {
  focus: { label: 'Focus', minutes: 25, color: '#3B82F6' },
  short: { label: 'Courte pause', minutes: 5, color: '#22C55E' },
  long: { label: 'Longue pause', minutes: 15, color: '#8B5CF6' },
} as const;
export const TIMER_PRESET_MINUTES = [25, 30, 45, 60] as const;
export const DEFAULT_CHAT_MESSAGES: DashboardChatMessage[] = [
  { role: 'assistant', content: "Salut, dis-moi ce que tu dois etudier et je t'aide a faire un plan." },
];

const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

export const normalizeFrenchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatTime24 = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const getWeekStartMonday = (date: Date) => {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  return monday;
};

export const getCurrentWeekDates = (offsetWeeks = 0) => {
  const today = new Date();
  const currentDay = today.getDay();
  const diff = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff + offsetWeeks * 7);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
};

export const getMonthGridDates = (anchor: Date) => {
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = getWeekStartMonday(monthStart);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
};

export const formatMonthRangeLabel = (start: Date, end: Date) => {
  const startMonth = MONTHS[start.getMonth()];
  const endMonth = MONTHS[end.getMonth()];
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startMonth === endMonth && startYear === endYear) return `${startMonth} ${startYear}`;
  if (startYear === endYear) return `${startMonth} - ${endMonth} ${startYear}`;
  return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
};

export const getWeekStartKeyForDate = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  const dayOfWeek = normalized.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  normalized.setDate(normalized.getDate() + diff);
  return formatDate(normalized);
};

export const getWeekdayArrayIndex = (date: Date) => {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
};

export const addElapsedStudySeconds = (
  prevData: Record<string, number[]>,
  startMs: number,
  endMs: number
) => {
  if (endMs <= startMs) return prevData;

  const nextData = { ...prevData };
  let cursor = startMs;

  while (cursor < endMs) {
    const segmentStart = new Date(cursor);
    const nextMidnight = new Date(segmentStart);
    nextMidnight.setHours(24, 0, 0, 0);
    const segmentEnd = Math.min(endMs, nextMidnight.getTime());
    const weekKey = getWeekStartKeyForDate(segmentStart);
    const dayIndex = getWeekdayArrayIndex(segmentStart);
    const weekArray = [...(nextData[weekKey] ?? [0, 0, 0, 0, 0, 0, 0])];

    weekArray[dayIndex] = (weekArray[dayIndex] ?? 0) + (segmentEnd - cursor) / 60000;
    nextData[weekKey] = weekArray;
    cursor = segmentEnd;
  }

  return nextData;
};

export const buildCurrentDateContext = () => {
  const now = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const weekdayFr = new Intl.DateTimeFormat('fr-CA', { weekday: 'long' }).format(now);
  const localDate = formatDate(now);
  const localTime24 = formatTime24(now);

  return {
    localDate,
    localTime24,
    localDateTime: `${localDate} ${localTime24}`,
    weekdayFr,
    timezone,
    timezoneOffsetMinutes: -now.getTimezoneOffset(),
    today: localDate,
    tomorrow: formatDate(addDays(now, 1)),
    yesterday: formatDate(addDays(now, -1)),
    thisWeekMonday: formatDate(getWeekStartMonday(now)),
    nextWeekMonday: formatDate(addDays(getWeekStartMonday(now), 7)),
    isoUtc: now.toISOString(),
    localeFr: new Intl.DateTimeFormat('fr-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    }).format(now),
    unixMs: now.getTime(),
  };
};

export const parseLocalDateString = (value?: string) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

export const normalizeTaskText = (value?: string) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export const findMatchingTaskIndex = (
  tasks: DashboardTask[],
  targetName?: string,
  targetDate?: string,
  targetTime?: string
) => {
  const normalizedTargetName = normalizeTaskText(targetName);
  if (!normalizedTargetName) return -1;

  const exactMatchIndex = tasks.findIndex((task) => {
    if (normalizeTaskText(task.name) !== normalizedTargetName) return false;
    if (targetDate && task.date !== targetDate) return false;
    if (targetTime && task.time !== targetTime) return false;
    return true;
  });

  if (exactMatchIndex >= 0) return exactMatchIndex;

  return tasks.findIndex((task) => {
    const normalizedTaskName = normalizeTaskText(task.name);
    if (!normalizedTaskName.includes(normalizedTargetName) && !normalizedTargetName.includes(normalizedTaskName)) {
      return false;
    }
    if (targetDate && task.date !== targetDate) return false;
    if (targetTime && task.time !== targetTime) return false;
    return true;
  });
};

export const getDayName = (date: Date) => {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  return days[date.getDay()];
};

export const createDefaultTasks = () => [];

export const createDefaultStudyData = (weekStart: string) => ({
  [weekStart]: [0, 0, 0, 0, 0, 0, 0],
});

export const createDefaultSessionsByDay = () => {
  const todayKey = formatDate(new Date());
  return { [todayKey]: 0 };
};

export const isValidTaskDate = (value?: string) => !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
export const isValidTaskTime = (value?: string) => !!value && /^\d{2}:\d{2}$/.test(value);

export const parseTimerActionFromMessage = (message: string): ChatTimerAction | null => {
  const normalized = normalizeFrenchText(message);
  const hasTimerContext =
    /\b(timer|minuteur|pomodoro|chrono|focus|pause)\b/.test(normalized) ||
    /\b(lance|demarre|arrete|stop|pause|reprend|relance|reinitialise|reset)\b/.test(normalized);

  if (!hasTimerContext) return null;

  const minutesMatch = normalized.match(/\b(\d{1,3})\s*(min|mins|minute|minutes)\b/);
  const parsedMinutes = minutesMatch ? Number(minutesMatch[1]) : undefined;
  const minutes = Number.isFinite(parsedMinutes) ? Math.min(120, Math.max(5, Math.round(parsedMinutes!))) : undefined;

  const mode = /\b(courte pause|pause courte|short)\b/.test(normalized)
    ? 'short'
    : /\b(longue pause|pause longue|long)\b/.test(normalized)
      ? 'long'
      : /\b(focus)\b/.test(normalized)
        ? 'focus'
        : undefined;

  if (/\b(pause|mets en pause|arrete|stop)\b/.test(normalized)) return { tool: 'set_timer', action: 'pause' };
  if (/\b(reinitialise|reinitialiser|remets? a zero|reset|remet le timer a zero)\b/.test(normalized)) {
    return { tool: 'set_timer', action: 'reset', mode, minutes };
  }
  if (/\b(regle|mets|configure|change|set)\b/.test(normalized) && (minutes !== undefined || mode)) {
    return { tool: 'set_timer', action: 'set', mode, minutes };
  }
  if (/\b(lance|demarre|reprend|relance|start)\b/.test(normalized) || mode || minutes !== undefined) {
    return { tool: 'set_timer', action: 'start', mode, minutes };
  }

  return null;
};

export const renderInlineFormattedText = (text: string) => {
  const nodes: React.ReactNode[] = [];
  const pattern = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const token = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) nodes.push(text.slice(lastIndex, index));

    if (token.startsWith('***') && token.endsWith('***')) {
      nodes.push(
        <strong key={`${index}-strong-em`} className="font-semibold italic">
          {token.slice(3, -3)}
        </strong>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(
        <strong key={`${index}-strong`} className="font-semibold text-[#ECECF3]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(
        <em key={`${index}-em`} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    } else {
      nodes.push(token);
    }

    lastIndex = index + token.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));

  return nodes.length > 0 ? nodes : text;
};

export const renderFormattedMessage = (content: string) => {
  const lines = content.split('\n');

  return lines.map((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) return <div key={`line-${index}`} className="h-3" />;

    if (/^[-*]\s+/.test(trimmed)) {
      return (
        <div key={`line-${index}`} className="flex items-start gap-2">
          <span className="mt-1 text-[#7F869A]">•</span>
          <span>{renderInlineFormattedText(trimmed.replace(/^[-*]\s+/, ''))}</span>
        </div>
      );
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const marker = trimmed.match(/^\d+\./)?.[0] ?? '';
      return (
        <div key={`line-${index}`} className="flex items-start gap-2">
          <span className="min-w-6 text-[#7F869A]">{marker}</span>
          <span>{renderInlineFormattedText(trimmed.replace(/^\d+\.\s+/, ''))}</span>
        </div>
      );
    }

    return (
      <div key={`line-${index}`} className="leading-6">
        {renderInlineFormattedText(line)}
      </div>
    );
  });
};
