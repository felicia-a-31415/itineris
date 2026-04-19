import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '../../ui/button';
import { Card } from '../../ui/card';

type StudyStatsCardProps = {
  weekDates: Date[];
  activeWeekMinutes: number[];
  maxWeekMinutes: number;
  activeWeekTotalMinutes: number;
  averageDailyMinutes: number;
  weekDeltaMinutes: number;
  getDayName: (date: Date) => string;
  formatDate: (date: Date) => string;
  onManualStudyTimeChange: (dateKey: string, minutes: number, mode: 'add' | 'set') => void;
  onToday: () => void;
  onPrevRange: () => void;
  onNextRange: () => void;
};

export function StudyStatsCard({
  weekDates,
  activeWeekMinutes,
  maxWeekMinutes,
  activeWeekTotalMinutes,
  averageDailyMinutes,
  weekDeltaMinutes,
  getDayName,
  formatDate,
  onManualStudyTimeChange,
  onToday,
  onPrevRange,
  onNextRange,
}: StudyStatsCardProps) {
  const [draggingDayIndex, setDraggingDayIndex] = useState<number | null>(null);
  const chartMaxMinutes = Math.max(240, Math.ceil((maxWeekMinutes || 60) / 30) * 30);

  const startDraggingStudyTime = (
    event: React.PointerEvent<HTMLButtonElement>,
    date: Date,
    dayIndex: number
  ) => {
    event.preventDefault();
    const barElement = event.currentTarget.closest('[data-study-bar="true"]');
    if (!(barElement instanceof HTMLElement)) return;

    const barRect = barElement.getBoundingClientRect();
    const dateKey = formatDate(date);
    const updateMinutesFromPointer = (clientY: number) => {
      const ratio = (barRect.bottom - clientY) / barRect.height;
      const nextMinutes = Math.max(0, Math.min(chartMaxMinutes, Math.round(ratio * chartMaxMinutes)));
      onManualStudyTimeChange(dateKey, nextMinutes, 'set');
    };

    setDraggingDayIndex(dayIndex);
    updateMinutesFromPointer(event.clientY);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      updateMinutesFromPointer(moveEvent.clientY);
    };
    const handlePointerUp = () => {
      setDraggingDayIndex(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <Card className="app-panel rounded-3xl p-6 space-y-2">
      <div className="flex flex-col gap-4">
        <p className="app-muted text-sm">Temps étudié</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="h-11 rounded-full px-5"
              onClick={onToday}
            >
              Aujourd&apos;hui
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={onPrevRange}
                variant="ghost"
                className="h-11 w-11 rounded-full border border-transparent bg-transparent text-[#F5F2F7] p-0 hover:bg-white/6"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                onClick={onNextRange}
                variant="ghost"
                className="h-11 w-11 rounded-full border border-transparent bg-transparent text-[#F5F2F7] p-0 hover:bg-white/6"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <p className="text-xs app-muted">Tire le haut d'une barre pour ajuster les minutes.</p>
        </div>
      </div>

      <div className="app-scrollbar-hidden mt-2 overflow-x-auto">
        <div className="w-[1104px] min-w-[1104px] grid grid-cols-7 gap-3 items-end">
          {weekDates.map((date, index) => {
            const minutes = Math.round(activeWeekMinutes[index] ?? 0);
            const showBar = minutes > 0;
            const barHeight = Math.max(showBar ? 8 : 0, Math.min(220, (minutes / chartMaxMinutes) * 220));
            const isDragging = draggingDayIndex === index;
            return (
              <div key={index} className="flex flex-col items-center gap-2">
                <div
                  data-study-bar="true"
                  className="relative flex h-56 w-full touch-none items-end rounded-2xl border border-white/6 bg-[rgba(16,14,24,0.88)]"
                >
                  {showBar ? (
                    <div
                      className="absolute bottom-0 left-0 w-full rounded-2xl bg-[linear-gradient(180deg,#8357ff_0%,#ff5f8f_100%)] transition-all"
                      style={{ height: `${barHeight}px` }}
                    />
                  ) : null}
                  <button
                    type="button"
                    onPointerDown={(event) => startDraggingStudyTime(event, date, index)}
                    className={`absolute left-3 right-3 z-10 h-4 cursor-ns-resize rounded-full border transition ${
                      isDragging
                        ? 'border-white/80 bg-white/70 shadow-[0_0_18px_rgba(255,255,255,0.28)]'
                        : 'border-white/20 bg-white/18 hover:border-white/48 hover:bg-white/32'
                    }`}
                    style={{ bottom: `${Math.min(216, Math.max(0, barHeight - 8))}px` }}
                    aria-label={`Ajuster le temps étudié ${getDayName(date)}`}
                    title="Tire pour ajuster"
                  />
                </div>
                <div className="text-xs text-[#F5F2F7] font-medium">{minutes} min</div>
                <div className="text-xs app-muted uppercase mb-1">{getDayName(date)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="app-scrollbar-hidden mt-6 overflow-x-auto">
        <div className="w-[1104px] min-w-[1104px] grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <p className="text-sm app-muted">Total de cette semaine</p>
            <p className="text-2xl text-[#F5F2F7]">{activeWeekTotalMinutes} min</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm app-muted">Moyenne quotidienne</p>
            <p className="text-2xl text-[#F5F2F7]">{averageDailyMinutes} min</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm app-muted">Écart depuis la semaine passée</p>
            <p className="text-2xl text-[#F5F2F7]">
              {weekDeltaMinutes >= 0 ? '+' : '-'}
              {Math.abs(weekDeltaMinutes)} min
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
