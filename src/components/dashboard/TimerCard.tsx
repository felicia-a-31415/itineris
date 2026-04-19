import { Clock3, Maximize2, Minimize2, Pause, Play, RotateCcw, Timer } from 'lucide-react';

import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';

type TimerModeKey = 'focus' | 'pause';
type TimerToolKey = 'timer' | 'stopwatch';

type TimerCardProps = {
  timerTool: TimerToolKey;
  timerMode: TimerModeKey;
  timerMinutes: number;
  timeLeft: number;
  stopwatchSeconds: number;
  progress: number;
  ringColor: string;
  isRunning: boolean;
  isInitialTime: boolean;
  safeMinutes: number;
  isEditingTimer: boolean;
  editingTimerValue: string;
  presetMinutes: readonly number[];
  formatTime: (value: number) => string;
  onToolSelect: (tool: TimerToolKey) => void;
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
  onSaveStopwatchSession: () => void;
  isExpanded?: boolean;
  onExpandToggle?: () => void;
};

const MODE_OPTIONS: Array<{ key: TimerModeKey; label: string; color: string }> = [
  { key: 'focus', label: 'Focus', color: '#3B82F6' },
  { key: 'pause', label: 'Pause', color: '#22C55E' },
];

const TOOL_OPTIONS = [
  { key: 'timer', label: 'Minuteur', Icon: Clock3 },
  { key: 'stopwatch', label: 'Chronomètre', Icon: Timer },
] satisfies Array<{ key: TimerToolKey; label: string; Icon: typeof Clock3 }>;

export function TimerCard({
  timerTool,
  timerMode,
  timerMinutes,
  timeLeft,
  stopwatchSeconds,
  progress,
  ringColor,
  isRunning,
  isInitialTime,
  safeMinutes,
  isEditingTimer,
  editingTimerValue,
  presetMinutes,
  formatTime,
  onToolSelect,
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
  onSaveStopwatchSession,
  isExpanded = false,
  onExpandToggle,
}: TimerCardProps) {
  const customIsActive = isEditingTimer || !presetMinutes.includes(safeMinutes);
  const durationSeconds = Math.max(1, Math.round(safeMinutes * 60));
  const timerDurationLabel =
    durationSeconds < 60 || durationSeconds % 60 !== 0
      ? `${durationSeconds} sec`
      : `${durationSeconds / 60} min`;
  const displayTime = timerTool === 'stopwatch' ? formatTime(stopwatchSeconds) : formatTime(timeLeft);
  const statusLabel = timerTool === 'stopwatch' ? 'Chronomètre' : timerDurationLabel;
  const progressDegrees = timerTool === 'timer' ? progress * 3.6 : 0;
  const activeRingColors =
    timerMode === 'pause'
      ? {
          first: '#38BDF8',
          second: '#22D3EE',
          third: '#34D399',
          fourth: '#86EFAC',
        }
      : {
          first: '#9f7bff',
          second: '#6f46ff',
          third: '#ff4f9b',
          fourth: '#ffc083',
        };
  const timerRingGradient =
    timerTool === 'stopwatch'
      ? 'conic-gradient(from 180deg, #9f7bff 0deg, #6f46ff 72deg, #ff4f9b 245deg, #ffc083 360deg)'
      : progressDegrees <= 0
        ? 'conic-gradient(from 180deg, rgba(28,22,42,0.92) 0deg 360deg)'
        : `conic-gradient(
            from 180deg,
            ${activeRingColors.first} 0deg,
            ${activeRingColors.second} ${progressDegrees * 0.2}deg,
            ${activeRingColors.third} ${progressDegrees * 0.68}deg,
            ${activeRingColors.fourth} ${progressDegrees}deg,
            rgba(28,22,42,0.92) ${progressDegrees}deg 360deg
          )`;
  const timerRingGlow =
    timerTool === 'timer' && timerMode === 'pause'
      ? '0 0 22px rgba(56,189,248,0.62), 0 0 56px rgba(34,211,238,0.42), 0 0 118px rgba(52,211,153,0.28)'
      : '0 0 22px rgba(159,123,255,0.72), 0 0 54px rgba(255,79,155,0.48), 0 0 118px rgba(255,192,131,0.3)';
  const timerSizeClass = isExpanded ? 'h-72 w-72 md:h-80 md:w-80' : 'h-60 w-60';
  const innerRingInsetClass = isExpanded ? 'inset-4' : 'inset-3';
  const timeLabelClass = isExpanded ? 'text-4xl md:text-5xl' : 'text-4xl';

  return (
    <Card
      className={`app-panel flex w-full flex-col rounded-3xl p-6 ${
        isExpanded ? 'app-scrollbar-hidden h-full overflow-auto' : 'app-scrollbar-hidden h-[720px] overflow-y-auto'
      }`}
    >
      <div className="mb-5 grid grid-cols-[1fr_auto_1fr] items-start gap-3">
        <div />
        <div className="grid w-full max-w-[300px] grid-cols-2 gap-1.5 rounded-2xl border border-[#8B61FF]/16 bg-[rgba(22,17,34,0.62)] p-1.5 shadow-[0_10px_28px_rgba(109,66,255,0.08)]">
          {TOOL_OPTIONS.map(({ key, label, Icon }) => {
            const isActive = timerTool === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onToolSelect(key)}
                className={`flex min-h-[54px] min-w-[124px] flex-col items-center justify-center gap-0.5 rounded-xl border px-3 text-[11px] font-semibold transition ${
                  isActive
                    ? 'border-[#9F7BFF]/38 bg-[linear-gradient(180deg,rgba(109,66,255,0.24),rgba(68,43,112,0.18))] text-white shadow-[0_0_18px_rgba(109,66,255,0.2)]'
                    : 'border-transparent bg-transparent text-[#C9C3D4] hover:border-[#9F7BFF]/22 hover:bg-[#8B61FF]/8 hover:text-[#F5F2F7]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex justify-end">
          {onExpandToggle ? (
            <Button
              type="button"
              variant="ghost"
              onClick={onExpandToggle}
              className="h-9 w-9 shrink-0 rounded-full p-0 text-white/72 hover:bg-white/6 hover:text-white"
              aria-label={isExpanded ? 'Réduire le minuteur' : 'Agrandir le minuteur'}
              title={isExpanded ? 'Réduire le minuteur' : 'Agrandir le minuteur'}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          ) : null}
        </div>
      </div>

      <div className={`flex flex-col items-center gap-6 ${isExpanded ? 'flex-1 justify-center py-6' : ''}`}>

        <div className="flex h-10 items-center justify-center">
          <div className={`flex flex-wrap justify-center gap-3.5 ${timerTool === 'timer' ? '' : 'invisible'}`}>
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
        </div>

          <div className={isExpanded ? 'flex items-center justify-center' : 'flex h-64 items-center justify-center'}>
            <div
              className={`relative flex items-center justify-center rounded-full ${timerSizeClass}`}
              style={{
                background: timerRingGradient,
                boxShadow: timerRingGlow,
              }}
            >
              <div
                className={`absolute ${innerRingInsetClass} rounded-full shadow-inner flex flex-col items-center justify-center bg-[linear-gradient(180deg,rgba(11,12,20,0.95),rgba(21,17,32,0.92))]`}
              >
                <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_52%)]" />
                <span className={`font-semibold text-[#F5F2F7] ${timeLabelClass}`}>{displayTime}</span>
                <span className={`mt-1 app-muted ${isExpanded ? 'text-sm' : 'text-xs'}`}>{statusLabel}</span>
              </div>
            </div>
          </div>

        {timerTool === 'timer' ? (
          <div className={`app-panel-soft rounded-2xl px-4 py-4 text-sm app-muted ${isExpanded ? 'w-fit max-w-full' : ''}`}>
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
        ) : null}

        {timerTool === 'stopwatch' ? (
          <Button
            type="button"
            onClick={onSaveStopwatchSession}
            disabled={stopwatchSeconds < 1}
            variant="outline"
            className="h-10 rounded-xl border-[#9F7BFF]/28 bg-[rgba(109,66,255,0.12)] px-4 text-sm text-[#F5F2F7] hover:bg-[rgba(109,66,255,0.2)] disabled:opacity-45"
          >
            Ajouter aux stats
          </Button>
        ) : null}

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
                  {timerTool === 'stopwatch' ? 'Lancer' : isInitialTime ? 'Lancer' : 'Relancer'}
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
