import { Clock3, Lock, Pause, Play, RotateCcw, Timer } from 'lucide-react';

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
  isTimerLocked: boolean;
  isUnlockingTimer: boolean;
  unlockPassword: string;
  unlockError: string | null;
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
  onUnlockPasswordChange: (value: string) => void;
  onUnlockSubmit: () => void;
  onUnlockCancel: () => void;
  variant?: 'panel' | 'seamless';
  isExpanded?: boolean;
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
  isTimerLocked,
  isUnlockingTimer,
  unlockPassword,
  unlockError,
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
  onUnlockPasswordChange,
  onUnlockSubmit,
  onUnlockCancel,
  variant = 'panel',
  isExpanded = false,
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
  const timerSizeClass = isExpanded ? 'h-80 w-80 md:h-96 md:w-96' : 'h-72 w-72 md:h-80 md:w-80';
  const innerRingInsetClass = isExpanded ? 'inset-5' : 'inset-4';
  const timeLabelClass = isExpanded ? 'text-4xl md:text-5xl' : 'text-4xl md:text-5xl';
  const lockedControlClass = isTimerLocked ? 'cursor-not-allowed opacity-45' : '';
  const isSeamless = variant === 'seamless';

  return (
    <Card
      className={`mx-auto flex w-full max-w-4xl flex-col rounded-[28px] p-0 ${
        isSeamless ? 'border-transparent bg-transparent shadow-none' : 'app-panel'
      } ${
        isExpanded ? 'app-scrollbar-hidden h-full overflow-auto' : isSeamless ? 'min-h-[540px]' : 'app-scrollbar-hidden h-[660px] overflow-y-auto'
      }`}
    >
      <div className="mx-auto mb-4 flex w-full max-w-[360px] items-center justify-center gap-8">
          {TOOL_OPTIONS.map(({ key, label, Icon }) => {
            const isActive = timerTool === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onToolSelect(key)}
                disabled={isTimerLocked}
                className={`flex min-h-[42px] min-w-0 flex-col items-center justify-center gap-0.5 border-b-2 px-1 pb-1 text-[11px] font-semibold transition ${
                  isActive
                    ? 'border-[#9F7BFF] text-white'
                    : 'border-transparent text-[#C9C3D4] hover:text-[#F5F2F7]'
                } ${lockedControlClass}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
      </div>

      <div className={`flex min-h-0 flex-col items-center gap-5 ${isExpanded ? 'flex-1 justify-center py-4' : ''}`}>
          <div className="flex min-w-0 flex-col items-center gap-3">
            <div className={isExpanded ? 'flex items-center justify-center' : 'flex h-[19rem] items-center justify-center md:h-[21rem]'}>
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

            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={onToggleRunning}
                className="h-11 min-w-[140px] rounded-xl px-5"
                title={isTimerLocked && isRunning ? 'Mot de passe requis pour mettre en pause.' : undefined}
              >
                {isRunning ? (
                  <>
                    {isTimerLocked ? <Lock className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
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
                disabled={isTimerLocked}
                className={`h-11 w-11 rounded-xl p-0 text-white/92 hover:bg-white/[0.05] hover:text-white ${lockedControlClass}`}
                aria-label="Réinitialiser le minuteur"
                title="Réinitialiser le minuteur"
              >
                <RotateCcw className="h-5 w-5 stroke-[2.75]" />
              </Button>
            </div>
          </div>

          <div className="flex min-h-[146px] w-full max-w-2xl flex-col items-center justify-center gap-4">
            {timerTool === 'timer' ? (
              <>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/42">Mode</p>
                  <div className="flex flex-wrap justify-center gap-6">
                    {MODE_OPTIONS.map(({ key, label }) => {
                      const isActive = timerMode === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => onModeSelect(key)}
                          disabled={isTimerLocked}
                          className={`border-b-2 px-1 pb-1 text-sm font-semibold transition ${
                            isActive ? 'border-[#9F7BFF] text-white' : 'border-transparent text-white/55 hover:text-white'
                          } ${lockedControlClass}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={`flex w-full flex-col items-center text-sm app-muted ${isExpanded ? 'max-w-full' : ''}`}>
                  <div className="mb-2 text-center">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/42">Durée</span>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    {presetMinutes.map((minutes) => {
                      const isActive = safeMinutes === minutes;
                      return (
                        <button
                          key={minutes}
                          type="button"
                          onClick={() => onPresetSelect(minutes)}
                          disabled={isTimerLocked}
                        className={`h-9 rounded-full px-4 text-xs font-semibold transition ${
                            isActive
                              ? 'bg-[#6d42ff] text-white'
                              : 'bg-transparent text-[#F5F2F7] hover:bg-white/[0.06]'
                          } ${lockedControlClass}`}
                        >
                          {minutes} min
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={onCustomClick}
                      disabled={isTimerLocked}
                      className={`h-9 rounded-full px-4 text-xs font-semibold transition ${
                        customIsActive
                          ? 'bg-[#6d42ff] text-white'
                          : 'bg-transparent text-[#F5F2F7] hover:bg-white/[0.06]'
                      } ${lockedControlClass}`}
                    >
                      Personnalisé
                    </button>
                  </div>

                  {isEditingTimer ? (
                  <div className="mt-3 flex w-full max-w-[260px] flex-col gap-2">
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={editingTimerValue}
                      disabled={isTimerLocked}
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
                      className="h-10 rounded-xl"
                      placeholder={`${Math.max(1, Math.round(safeMinutes))}`}
                      autoFocus
                      aria-label="Durée personnalisée en minutes"
                    />
                    <Button
                      type="button"
                      onClick={onEditingCommit}
                      variant="outline"
                      disabled={isTimerLocked}
                      className="h-10 rounded-xl"
                    >
                      Appliquer
                    </Button>
                  </div>
                  ) : null}
                </div>
              </>
            ) : (
              <Button
                type="button"
                onClick={onSaveStopwatchSession}
                disabled={stopwatchSeconds < 1 || isTimerLocked}
                variant="outline"
                className="h-10 rounded-xl border-[#9F7BFF]/28 bg-[rgba(109,66,255,0.12)] px-4 text-sm text-[#F5F2F7] hover:bg-[rgba(109,66,255,0.2)] disabled:opacity-45"
              >
                Ajouter aux stats
              </Button>
            )}
          </div>

        {isUnlockingTimer ? (
          <div className="app-panel-soft mx-auto flex w-full max-w-[360px] flex-col gap-2 rounded-2xl px-4 py-3">
            <Input
              type="password"
              value={unlockPassword}
              onChange={(event) => onUnlockPasswordChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onUnlockSubmit();
                }

                if (event.key === 'Escape') {
                  onUnlockCancel();
                }
              }}
              className="h-10 rounded-xl"
              placeholder="Mot de passe"
              aria-label="Mot de passe pour déverrouiller le minuteur"
              autoFocus
            />
            {unlockError ? <p className="text-xs text-[#FFB4B4]">{unlockError}</p> : null}
            <div className="flex gap-2">
              <Button type="button" onClick={onUnlockSubmit} className="h-9 flex-1 rounded-xl">
                Déverrouiller
              </Button>
              <Button type="button" onClick={onUnlockCancel} variant="ghost" className="h-9 flex-1 rounded-xl">
                Annuler
              </Button>
            </div>
          </div>
        ) : null}

      </div>
    </Card>
  );
}
