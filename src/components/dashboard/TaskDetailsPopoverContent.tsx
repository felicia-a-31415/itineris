import { Trash2 } from 'lucide-react';

import type { DashboardTask } from '../../lib/storage';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { PopoverContent } from '../../ui/popover';
import { Switch } from '../../ui/switch';

type TaskDetailsPopoverContentProps = {
  task: DashboardTask;
  editingNameId: string | null;
  editingNameValue: string;
  onEditingNameValueChange: (value: string) => void;
  onCommitEditingName: (taskId: string) => void;
  onCancelEditingName: () => void;
  onStartEditingName: (task: DashboardTask) => void;
  onUpdateTask: (taskId: string, updates: Partial<DashboardTask>) => void;
  onDeleteTask: (taskId: string) => void;
  onClose: () => void;
};

export function TaskDetailsPopoverContent({
  task,
  editingNameId,
  editingNameValue,
  onEditingNameValueChange,
  onCommitEditingName,
  onCancelEditingName,
  onStartEditingName,
  onUpdateTask,
  onDeleteTask,
  onClose,
}: TaskDetailsPopoverContentProps) {
  return (
    <PopoverContent
      align="end"
      side="bottom"
      sideOffset={12}
      className="w-96 max-w-[calc(100vw-2rem)] rounded-[24px] border border-white/[0.08] bg-[rgba(15,10,30,0.86)] p-4 text-sm text-[#F5F2F7] shadow-[0_32px_80px_rgba(0,0,0,0.62)] backdrop-blur-[22px]"
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      <Button
        type="button"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-3 top-3 h-8 w-8 rounded-full p-0 text-2xl leading-none text-white/42 hover:bg-white/[0.06] hover:text-white"
        aria-label="Fermer"
      >
        ×
      </Button>
      <div className="flex items-start gap-3 pl-1 pr-8 pt-2">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/42">Modifier la tâche</div>
          {editingNameId === task.id ? (
            <Input
              value={editingNameValue}
              onChange={(e) => onEditingNameValueChange(e.target.value)}
              onBlur={() => onCommitEditingName(task.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onCommitEditingName(task.id);
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  onCancelEditingName();
                }
              }}
              autoFocus
              className="mt-2 h-9 rounded-xl border-white/[0.08] bg-white/[0.05] px-3 text-base text-[#F5F2F7] focus-visible:border-[#9F7BFF]/50 focus-visible:ring-[#9F7BFF]/18"
            />
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => onStartEditingName(task)}
              className="mt-1 h-auto cursor-text break-words p-0 text-left text-base font-semibold text-[#F5F2F7] hover:bg-transparent hover:text-white"
            >
              {task.name || 'Tâche sans titre'}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-white/[0.035]">
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-white/[0.08] px-3 py-2.5">
            <div>
              <div className="text-sm font-semibold text-[#F5F2F7]">Date</div>
              <div className="text-xs text-white/40">Définir une date</div>
            </div>
            <Input
              type="date"
              value={task.date ?? 'yyyy-mm-dd'}
              onChange={(e) => onUpdateTask(task.id, { date: e.target.value })}
              className="h-7 w-auto appearance-none rounded-lg border-white/[0.08] bg-[rgba(10,9,18,0.48)] px-1.5 text-right text-xs text-[#F5F2F7] focus-visible:border-[#9F7BFF]/50 focus-visible:ring-[#9F7BFF]/18 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:opacity-0"
              style={{
                width: `${Math.max(1, (task.date ?? 'yyyy-mm-dd').length) + 2}ch`,
              }}
            />
          </div>
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-white/[0.08] px-3 py-2.5">
            <div>
              <div className="text-sm font-semibold text-[#F5F2F7]">Heure</div>
              <div className="text-xs text-white/40">Optionnel</div>
            </div>
            <Input
              type="time"
              value={task.time ?? '00:00'}
              onChange={(e) => onUpdateTask(task.id, { time: e.target.value })}
              className="h-7 w-auto appearance-none rounded-lg border-white/[0.08] bg-[rgba(10,9,18,0.48)] px-2 text-right text-xs text-[#F5F2F7] focus-visible:border-[#9F7BFF]/50 focus-visible:ring-[#9F7BFF]/18 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:opacity-0"
              size={Math.max(1, (task.time ?? '00:00').length)}
            />
          </div>
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2.5">
            <div>
              <div className="text-sm font-semibold text-[#F5F2F7]">Urgent</div>
              <div className="text-xs text-white/40">Met le titre en rouge</div>
            </div>
            <Switch checked={!!task.urgent} onCheckedChange={(checked) => onUpdateTask(task.id, { urgent: checked })} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTask(task.id);
              onClose();
            }}
            className="h-auto rounded-full px-2 py-1 text-[#FF8FA3] hover:bg-[#FF5F8F]/10 hover:text-[#FFB4C2]"
            aria-label="Supprimer la tâche"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </PopoverContent>
  );
}
