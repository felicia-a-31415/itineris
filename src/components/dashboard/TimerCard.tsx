import { Maximize2, Minimize2, Pause, Play, RotateCcw } from 'lucide-react';

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
  isExpanded?: boolean;
  onExpandToggle?: () => void;
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
  isExpanded = false,
  onExpandToggle,
}: TimerCardProps) {
  const customIsActive = isEditingTimer || !presetMinutes.includes(safeMinutes);
  const durationSeconds = Math.max(1, Math.round(safeMinutes * 60));
  const timerDurationLabel =
    durationSeconds < 60 || durationSeconds % 60 !== 0
      ? `${durationSeconds} sec`
      : `${durationSeconds / 60} min`;
  const progressDegrees = progress * 3.6;
  const timerRingGradient =
    progressDegrees <= 0
      ? 'conic-gradient(from 180deg, rgba(28,22,42,0.92) 0deg 360deg)'
      : `conic-gradient(
          from 180deg,
          #9f7bff 0deg,
          #6f46ff ${progressDegrees * 0.2}deg,
          #ff4f9b ${progressDegrees * 0.68}deg,
          #ffc083 ${progressDegrees}deg,
          rgba(28,22,42,0.92) ${progressDegrees}deg 360deg
        )`;
  const timerSizeClass = isExpanded ? 'h-72 w-72 md:h-[22rem] md:w-[22rem]' : 'h-48 w-48';
  const innerRingInsetClass = isExpanded ? 'inset-4' : 'inset-3';
  const timeLabelClass = isExpanded ? 'text-4xl md:text-5xl' : 'text-3xl';

  return (
    <Card
      className={`app-panel w-full rounded-3xl p-6 ${isExpanded ? 'flex h-full flex-col overflow-auto' : 'h-full'}`}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="app-muted text-sm">Minuteur</p>
        {onExpandToggle ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onExpandToggle}
            className="h-9 w-9 rounded-full p-0 text-white/72 hover:bg-white/6 hover:text-white"
            aria-label={isExpanded ? 'Réduire le minuteur' : 'Agrandir le minuteur'}
            title={isExpanded ? 'Réduire le minuteur' : 'Agrandir le minuteur'}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        ) : null}
      </div>
      <div className={`flex flex-1 flex-col items-center justify-center gap-7 ${isExpanded ? 'py-6' : 'py-2'}`}>
          <div className="flex flex-wrap justify-center gap-3.5">
            {MODE_OPTIONS.map(({ key, label }) => {
              const isActive = timerMode === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onModeSelect(key)}
                  className="rounded-xl border px-3 py-2 text-sm font-semibold transition shadow-sm"
                  style={
                    isActive
                      ? {
                          background: 'linear-gradient(90deg,#6d42ff 0%,#8c4fff 100%)',
                          color: '#ffffff',
                          borderColor: 'rgba(255,255,255,0.08)',
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
            className={`relative flex items-center justify-center rounded-full ${timerSizeClass}`}
            style={{
              background: timerRingGradient,
              boxShadow:
                '0 0 22px rgba(159,123,255,0.72), 0 0 54px rgba(255,79,155,0.48), 0 0 118px rgba(255,192,131,0.3)',
            }}
          >
            <div
              className={`absolute ${innerRingInsetClass} rounded-full shadow-inner flex flex-col items-center justify-center bg-[linear-gradient(180deg,rgba(11,12,20,0.95),rgba(21,17,32,0.92))]`}
            >
              <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_52%)]" />
              <span className={`font-semibold text-[#F5F2F7] ${timeLabelClass}`}>{formatTime(timeLeft)}</span>
              <span className={`mt-1 app-muted ${isExpanded ? 'text-sm' : 'text-xs'}`}>{timerDurationLabel}</span>
            </div>
          </div>

          <div className={`app-panel-soft rounded-2xl px-4 py-4 text-sm app-muted ${isExpanded ? 'w-full max-w-xl' : ''}`}>
            <div className="mb-3">
              <span className="text-sm app-muted">Durée du minuteur</span>
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
                Personnalisé
              </button>
            </div>

            {isEditingTimer ? (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Input
                  type="number"
                  min={1}
                  step={1}
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
                  placeholder={`${Math.max(1, Math.round(safeMinutes))}`}
                  autoFocus
                  aria-label="Durée personnalisée en minutes"
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
