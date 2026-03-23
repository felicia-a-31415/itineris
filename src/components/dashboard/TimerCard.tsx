import { Pause, Play, RotateCcw } from 'lucide-react';

import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';

type TimerModeKey = 'focus' | 'short' | 'long';

type TimerCardProps = {
  timerMode: TimerModeKey;
  timerMinutes: number;
  timeLeft: number;
  progress: number;
  ringColor: string;
  isRunning: boolean;
  isInitialTime: boolean;
  safeMinutes: number;
  isEditingTimer: boolean;
  editingTimerValue: string;
  presetMinutes: readonly number[];
  formatTime: (value: number) => string;
  onModeSelect: (mode: TimerModeKey) => void;
  onToggleRunning: () => void;
  onReset: () => void;
  onPresetSelect: (minutes: number) => void;
  onCustomClick: () => void;
  onEditingValueChange: (value: string) => void;
  onEditingFocus: () => void;
  onEditingBlur: () => void;
  onEditingCancel: () => void;
  onEditingCommit: () => void;
};

const MODE_OPTIONS: Array<{ key: TimerModeKey; label: string; color: string }> = [
  { key: 'focus', label: 'Focus', color: '#3B82F6' },
  { key: 'short', label: 'Courte pause', color: '#22C55E' },
  { key: 'long', label: 'Longue pause', color: '#8B5CF6' },
];

export function TimerCard({
  timerMode,
  timerMinutes,
  timeLeft,
  progress,
  ringColor,
  isRunning,
  isInitialTime,
  safeMinutes,
  isEditingTimer,
  editingTimerValue,
  presetMinutes,
  formatTime,
  onModeSelect,
  onToggleRunning,
  onReset,
  onPresetSelect,
  onCustomClick,
  onEditingValueChange,
  onEditingFocus,
  onEditingBlur,
  onEditingCancel,
  onEditingCommit,
}: TimerCardProps) {
  const customIsActive = isEditingTimer || !presetMinutes.includes(safeMinutes);
  const progressDegrees = progress * 3.6;
  const timerRingGradient = `conic-gradient(
    from 180deg,
    #9f7bff 0deg,
    #6f46ff ${Math.max(18, progressDegrees * 0.2)}deg,
    #ff4f9b ${Math.max(42, progressDegrees * 0.68)}deg,
    #ffc083 ${progressDegrees}deg,
    rgba(28,22,42,0.92) ${progressDegrees}deg 360deg
  )`;

  return (
    <Card className="app-panel rounded-3xl p-6 h-full">
      <div className="mb-2">
        <p className="app-muted text-sm">Minuteur</p>
      </div>
      <div className="flex flex-col items-center justify-start gap-7 pt-2">
          <div className="flex flex-wrap justify-center gap-3.5">
            {MODE_OPTIONS.map(({ key, label, color }) => {
              const isActive = timerMode === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onModeSelect(key)}
                  className="px-3 py-2 rounded-xl text-sm font-semibold transition shadow-sm border"
                  style={
                    isActive
                      ? {
                          background: 'linear-gradient(90deg,#6d42ff 0%,#8c4fff 100%)',
                          color: '#ffffff',
                          borderColor: color,
                          boxShadow: '0 0 18px rgba(109,66,255,0.34)',
                        }
                      : {
                          backgroundColor: 'rgba(24,20,35,0.9)',
                          color: '#F5F2F7',
                          borderColor: 'rgba(124,98,154,0.28)',
                        }
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div
            className="relative w-48 h-48 rounded-full flex items-center justify-center"
            style={{
              background: timerRingGradient,
              boxShadow:
                '0 0 22px rgba(159,123,255,0.72), 0 0 54px rgba(255,79,155,0.48), 0 0 118px rgba(255,192,131,0.3)',
            }}
          >
            <div className="absolute inset-3 rounded-full shadow-inner flex flex-col items-center justify-center bg-[linear-gradient(180deg,rgba(11,12,20,0.95),rgba(21,17,32,0.92))]">
              <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_52%)]" />
              <span className="text-3xl font-semibold text-[#F5F2F7]">{formatTime(timeLeft)}</span>
              <span className="mt-1 text-xs app-muted">{timerMinutes} min</span>
            </div>
          </div>

          <div className="app-panel-soft rounded-2xl px-4 py-4 text-sm app-muted">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-sm app-muted">Durée du minuteur</span>
              <span className="text-xs text-white/40">Entre 5 et 120 min</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {presetMinutes.map((minutes) => {
                const isActive = safeMinutes === minutes;
                return (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => onPresetSelect(minutes)}
                    className={`h-9 rounded-xl border px-3 text-xs font-medium transition ${
                      isActive
                        ? 'border-[#6d42ff] bg-[#6d42ff] text-white'
                        : 'border-white/10 bg-[rgba(20,17,30,0.82)] text-[#F5F2F7] hover:bg-[rgba(40,28,60,0.92)]'
                    }`}
                  >
                    {minutes} min
                  </button>
                );
              })}
              <button
                type="button"
                onClick={onCustomClick}
                className={`h-9 rounded-xl border px-3 text-xs font-medium transition ${
                  customIsActive
                    ? 'border-[#6d42ff] bg-[#6d42ff] text-white'
                    : 'border-white/10 bg-[rgba(20,17,30,0.82)] text-[#F5F2F7] hover:bg-[rgba(40,28,60,0.92)]'
                }`}
              >
                Custom
              </button>
            </div>

            {isEditingTimer ? (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Input
                  type="number"
                  min={5}
                  max={120}
                  step={5}
                  value={editingTimerValue}
                  onFocus={onEditingFocus}
                  onChange={(e) => onEditingValueChange(e.target.value)}
                  onBlur={onEditingBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onEditingCommit();
                    }
                    if (e.key === 'Escape') {
                      onEditingCancel();
                    }
                  }}
                  className="h-10 rounded-xl sm:max-w-[150px]"
                  placeholder={`${timerMinutes}`}
                  autoFocus
                />
                <Button
                  type="button"
                  onClick={onEditingCommit}
                  variant="outline"
                  className="h-10 rounded-xl"
                >
                  Appliquer
                </Button>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={onToggleRunning}
              className="h-10 min-w-[124px] rounded-xl px-4"
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  {isInitialTime ? 'Lancer' : 'Relancer'}
                </>
              )}
            </Button>
            <Button
              onClick={onReset}
              type="button"
              variant="ghost"
              className="h-10 w-10 rounded-xl p-0 text-white/92 hover:bg-transparent hover:text-white"
              aria-label="Réinitialiser le minuteur"
              title="Réinitialiser le minuteur"
            >
              <RotateCcw className="h-6 w-6 stroke-[2.75]" />
            </Button>
          </div>
      </div>
    </Card>
  );
}
