import { Card } from '../../ui/card';

type StudyStatsCardProps = {
  weekDates: Date[];
  activeWeekMinutes: number[];
  maxWeekMinutes: number;
  activeWeekTotalMinutes: number;
  averageDailyMinutes: number;
  weekDeltaMinutes: number;
  getDayName: (date: Date) => string;
};

export function StudyStatsCard({
  weekDates,
  activeWeekMinutes,
  maxWeekMinutes,
  activeWeekTotalMinutes,
  averageDailyMinutes,
  weekDeltaMinutes,
  getDayName,
}: StudyStatsCardProps) {
  return (
    <Card className="bg-[#161924] border-[#1F2230] rounded-3xl p-6 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.06)] space-y-2">
      <div className="flex flex-col gap-0">
        <p className="text-sm text-[#A9ACBA]">Temps étudié</p>
        <div className="flex flex-wrap items-center justify-between gap-3"></div>
      </div>

      <div className="mt-2 overflow-x-auto">
        <div className="w-[1104px] min-w-[1104px] grid grid-cols-7 gap-3 items-end">
          {weekDates.map((date, index) => {
            const minutes = Math.round(activeWeekMinutes[index] ?? 0);
            const showBar = minutes > 0;
            const barHeight = Math.max(8, Math.min(220, (minutes / (maxWeekMinutes || 1)) * 220));
            return (
              <div key={index} className="flex flex-col items-center gap-2">
                <div className="w-full bg-[#1B2030] rounded-2xl h-56 flex items-end">
                  {showBar && (
                    <div
                      className="w-full bg-[#4169E1] rounded-2xl transition-all"
                      style={{ height: `${barHeight}px` }}
                    />
                  )}
                </div>
                <div className="text-xs text-[#ECECF3] font-medium">{minutes} min</div>
                <div className="text-xs text-[#A9ACBA] uppercase mb-1">{getDayName(date)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <div className="w-[1104px] min-w-[1104px] grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <p className="text-sm text-[#A9ACBA]">Total de cette semaine</p>
            <p className="text-2xl text-[#ECECF3]">{activeWeekTotalMinutes} min</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-[#A9ACBA]">Moyenne quotidienne</p>
            <p className="text-2xl text-[#ECECF3]">{averageDailyMinutes} min</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-[#A9ACBA]">Écart depuis la semaine passée</p>
            <p className="text-2xl text-[#ECECF3]">
              {weekDeltaMinutes >= 0 ? '+' : '-'}
              {Math.abs(weekDeltaMinutes)} min
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
