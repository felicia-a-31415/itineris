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
      className="w-96 max-w-[calc(100vw-2rem)] rounded-[24px] border border-white/10 bg-[#2B2F3A]/95 text-[#ECECF3] text-sm shadow-[0_32px_80px_rgba(0,0,0,0.7)] p-4"
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      <Button
        type="button"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-3 top-3 text-[#A9ACBA] hover:text-[#ECECF3] text-2xl leading-none h-8 w-8 p-0"
        aria-label="Fermer"
      >
        ×
      </Button>
      <div className="flex items-start gap-3 pt-2 pr-8 pl-1">
        <div className="min-w-0">
          <div className="text-sm text-[#A9ACBA]">Modifier la tâche</div>
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
              className="mt-1 h-8 px-2 text-base rounded-lg border-[#2B3550] bg-[#101524] text-[#ECECF3]"
            />
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => onStartEditingName(task)}
              className="mt-1 h-auto p-0 text-base font-semibold text-left text-[#ECECF3] break-words cursor-text hover:bg-transparent"
            >
              {task.name || 'Tâche sans titre'}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-3">
        <div className="rounded-2xl border border-[#2B3550] bg-[#161924]">
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2 border-b border-[#2B3550]">
            <div>
              <div className="text-sm text-[#ECECF3]">Date</div>
              <div className="text-xs text-[#7F869A]">Définir une date</div>
            </div>
            <Input
              type="date"
              value={task.date ?? 'yyyy-mm-dd'}
              onChange={(e) => onUpdateTask(task.id, { date: e.target.value })}
              className="h-7 w-auto bg-[#101524] text-xs text-[#ECECF3] rounded-lg border-[#2B3550] px-1.5 text-right appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:hidden"
              style={{
                width: `${Math.max(1, (task.date ?? 'yyyy-mm-dd').length) + 2}ch`,
              }}
            />
          </div>
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2 border-b border-[#2B3550]">
            <div>
              <div className="text-sm text-[#ECECF3]">Heure</div>
              <div className="text-xs text-[#7F869A]">Optionnel</div>
            </div>
            <Input
              type="time"
              value={task.time ?? '00:00'}
              onChange={(e) => onUpdateTask(task.id, { time: e.target.value })}
              className="h-7 w-auto bg-[#101524] text-xs text-[#ECECF3] rounded-lg border-[#2B3550] px-2 text-right appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:hidden"
              size={Math.max(1, (task.time ?? '00:00').length)}
            />
          </div>
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2">
            <div>
              <div className="text-sm text-[#ECECF3]">Urgent</div>
              <div className="text-xs text-[#7F869A]">Met le titre en rouge</div>
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
            className="h-auto p-0 text-red-500 hover:text-red-400"
            aria-label="Supprimer la tâche"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </PopoverContent>
  );
}
