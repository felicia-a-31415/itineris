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
  const chartMaxMinutes = Math.max(15, Math.ceil(((maxWeekMinutes || 15) * 1.08) / 5) * 5);

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
    <Card className="mx-auto min-w-0 max-w-4xl overflow-visible rounded-[28px] border-transparent bg-transparent px-1 pt-1 shadow-none">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/42">Temps étudié</p>
            <p className="mt-1 text-sm app-muted">Tire le haut d'une barre pour ajuster les minutes.</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-10 rounded-full px-4 text-sm"
              onClick={onToday}
            >
              Aujourd&apos;hui
            </Button>
              <Button
                type="button"
                onClick={onPrevRange}
                variant="ghost"
                className="h-10 w-10 rounded-full border border-transparent bg-transparent p-0 text-[#F5F2F7] hover:bg-white/6"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                onClick={onNextRange}
                variant="ghost"
                className="h-10 w-10 rounded-full border border-transparent bg-transparent p-0 text-[#F5F2F7] hover:bg-white/6"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
          </div>
        </div>

        <div className="grid min-w-0 gap-4 border-y border-white/[0.06] py-4 sm:grid-cols-3">
          <div>
            <p className="text-xs app-muted">Semaine</p>
            <p className="mt-1 text-2xl font-semibold text-[#F5F2F7]">{activeWeekTotalMinutes} min</p>
          </div>
          <div>
            <p className="text-xs app-muted">Moyenne</p>
            <p className="mt-1 text-2xl font-semibold text-[#F5F2F7]">{averageDailyMinutes} min</p>
          </div>
          <div>
            <p className="text-xs app-muted">Progression</p>
            <p className="mt-1 text-2xl font-semibold text-[#F5F2F7]">
              {weekDeltaMinutes >= 0 ? '+' : '-'}
              {Math.abs(weekDeltaMinutes)} min
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 min-w-0 overflow-x-hidden">
        <div className="grid min-w-0 grid-cols-7 items-end gap-1.5 sm:gap-3">
          {weekDates.map((date, index) => {
            const minutes = Math.round(activeWeekMinutes[index] ?? 0);
            const showBar = minutes > 0;
            const barHeight = Math.max(showBar ? 8 : 0, Math.min(190, (minutes / chartMaxMinutes) * 190));
            const isDragging = draggingDayIndex === index;
            return (
              <div key={index} className="flex flex-col items-center gap-1.5">
                <div
                  data-study-bar="true"
                  className="relative flex h-48 w-full touch-none items-end rounded-2xl bg-white/[0.025]"
                >
                  {showBar ? (
                    <div
                      className="absolute bottom-0 left-0 w-full rounded-2xl bg-[linear-gradient(180deg,#8B61FF_0%,#FF5F8F_100%)] shadow-[0_0_22px_rgba(139,97,255,0.18)] transition-all"
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
                    style={{ bottom: `${Math.min(186, Math.max(0, barHeight - 8))}px` }}
                    aria-label={`Ajuster le temps étudié ${getDayName(date)}`}
                    title="Tire pour ajuster"
                  />
                </div>
                <div className="text-xs font-semibold text-[#F5F2F7]">{minutes}</div>
                <div className="mb-1 text-[10px] uppercase tracking-[0.08em] app-muted">{getDayName(date)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
