import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';

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
  const todayKey = formatDate(new Date());
  const [manualDateKey, setManualDateKey] = useState(todayKey);
  const [manualMinutes, setManualMinutes] = useState('');
  const parsedManualMinutes = Number(manualMinutes);
  const canSubmitManualMinutes = Number.isFinite(parsedManualMinutes) && parsedManualMinutes >= 0;

  useEffect(() => {
    setManualDateKey(todayKey);
  }, [todayKey]);

  const submitManualStudyTime = (mode: 'add' | 'set') => {
    if (!canSubmitManualMinutes) return;
    if (mode === 'add' && parsedManualMinutes <= 0) return;
    onManualStudyTimeChange(manualDateKey, parsedManualMinutes, mode);
    setManualMinutes('');
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
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/8 bg-[rgba(16,14,24,0.72)] p-4">
        <div className="mb-3">
          <p className="text-sm text-[#F5F2F7]">Modifier le temps d'étude</p>
          <p className="text-xs app-muted">Ajoute des minutes ou remplace le total d'une journée.</p>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <label className="flex flex-1 flex-col gap-2 text-xs font-medium app-muted">
            Date
            <Input
              type="date"
              value={manualDateKey}
              onChange={(event) => setManualDateKey(event.target.value)}
              className="h-10 rounded-xl"
              aria-label="Date du temps d'étude"
            />
          </label>
          <label className="flex flex-1 flex-col gap-2 text-xs font-medium app-muted">
            Minutes
            <Input
              type="number"
              min={0}
              step={1}
              value={manualMinutes}
              onChange={(event) => setManualMinutes(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  submitManualStudyTime('add');
                }
              }}
              className="h-10 rounded-xl"
              placeholder="30"
              aria-label="Minutes d'étude"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => submitManualStudyTime('add')}
              disabled={!canSubmitManualMinutes || parsedManualMinutes <= 0}
              className="h-10 rounded-xl px-4"
            >
              Ajouter
            </Button>
            <Button
              type="button"
              onClick={() => submitManualStudyTime('set')}
              disabled={!canSubmitManualMinutes}
              variant="outline"
              className="h-10 rounded-xl px-4"
            >
              Remplacer
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-2 overflow-x-auto">
        <div className="w-[1104px] min-w-[1104px] grid grid-cols-7 gap-3 items-end">
          {weekDates.map((date, index) => {
            const minutes = Math.round(activeWeekMinutes[index] ?? 0);
            const showBar = minutes > 0;
            const barHeight = Math.max(8, Math.min(220, (minutes / (maxWeekMinutes || 1)) * 220));
            return (
              <div key={index} className="flex flex-col items-center gap-2">
                <div className="w-full rounded-2xl h-56 flex items-end bg-[rgba(16,14,24,0.88)] border border-white/6">
                  {showBar && (
                    <div
                      className="w-full rounded-2xl transition-all bg-[linear-gradient(180deg,#8357ff_0%,#ff5f8f_100%)]"
                      style={{ height: `${barHeight}px` }}
                    />
                  )}
                </div>
                <div className="text-xs text-[#F5F2F7] font-medium">{minutes} min</div>
                <div className="text-xs app-muted uppercase mb-1">{getDayName(date)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
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
