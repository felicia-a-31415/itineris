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

  return (
    <Card className="bg-[#161924] border-[#1F2230] rounded-3xl p-6 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.06)] h-full">
      <div className="mb-2">
        <p className="text-sm text-[#A9ACBA]">Minuteur</p>
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
                          backgroundColor: color,
                          color: '#0B0D10',
                          borderColor: color,
                          boxShadow: `0 0 12px ${color}80`,
                        }
                      : {
                          backgroundColor: '#1A1D26',
                          color: '#ECECF3',
                          borderColor: '#1F2230',
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
              background: `conic-gradient(${ringColor} ${progress * 3.6}deg, #1F2230 ${progress * 3.6}deg)`,
              boxShadow: `0 0 12px ${ringColor}b3, 0 0 32px ${ringColor}99, 0 0 64px ${ringColor}66`,
            }}
          >
            <div className="absolute inset-3 bg-[#0B0D10] rounded-full shadow-inner flex flex-col items-center justify-center">
              <span className="text-3xl font-semibold text-[#ECECF3]">{formatTime(timeLeft)}</span>
              <span className="mt-1 text-xs text-[#A9ACBA]">{timerMinutes} min</span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#1F2230] bg-[#10131B] px-4 py-4 text-sm text-[#A9ACBA]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-sm text-[#A9ACBA]">Durée du minuteur</span>
              <span className="text-xs text-[#7F869A]">Entre 5 et 120 min</span>
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
                        ? 'border-[#4169E1] bg-[#4169E1] text-white'
                        : 'border-[#2B3550] bg-[#161924] text-[#ECECF3] hover:bg-[#1A1D26]'
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
                    ? 'border-[#4169E1] bg-[#4169E1] text-white'
                    : 'border-[#2B3550] bg-[#161924] text-[#ECECF3] hover:bg-[#1A1D26]'
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
                  className="h-10 rounded-xl border-[#1F2230] bg-[#161924] text-[#ECECF3] sm:max-w-[150px]"
                  placeholder={`${timerMinutes}`}
                  autoFocus
                />
                <Button
                  type="button"
                  onClick={onEditingCommit}
                  variant="outline"
                  className="h-10 rounded-xl border-[#2B3550] bg-[#161924] text-[#ECECF3] hover:bg-[#1A1D26]"
                >
                  Appliquer
                </Button>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={onToggleRunning}
              className="h-10 min-w-[124px] rounded-xl bg-[#4169E1] px-4 text-white hover:bg-[#3557C1]"
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
              className="h-10 w-10 rounded-xl p-0 text-white hover:bg-transparent hover:text-white"
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
