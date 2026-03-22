import { Info } from 'lucide-react';

import type { DashboardTask } from '../../lib/storage';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { Input } from '../../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';

type DashboardTaskListPanelProps = {
  agendaTasks: DashboardTask[];
  visibleTasks: DashboardTask[];
  editingNameId: string | null;
  editingNameValue: string;
  infoTaskId: string | null;
  completedTasksCount: number;
  showCompletedTasks: boolean;
  deleteCompletedMenuOpen: boolean;
  taskListItemRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  onEditingNameValueChange: (value: string) => void;
  onCommitEditingName: (taskId: string) => void;
  onCancelEditingName: () => void;
  onToggleTask: (taskId: string) => void;
  onInfoTaskChange: (taskId: string | null) => void;
  onShowCompletedTasksChange: React.Dispatch<React.SetStateAction<boolean>>;
  onDeleteCompletedMenuOpenChange: (open: boolean) => void;
  onDeleteCompletedTasks: (ageInMonths?: number) => void;
  parseLocalDateString: (value?: string) => Date | null;
  renderTaskInfoPopoverContent: (task: DashboardTask, close: () => void) => React.ReactNode;
};

export function DashboardTaskListPanel({
  agendaTasks,
  visibleTasks,
  editingNameId,
  editingNameValue,
  infoTaskId,
  completedTasksCount,
  showCompletedTasks,
  deleteCompletedMenuOpen,
  taskListItemRefs,
  onEditingNameValueChange,
  onCommitEditingName,
  onCancelEditingName,
  onToggleTask,
  onInfoTaskChange,
  onShowCompletedTasksChange,
  onDeleteCompletedMenuOpenChange,
  onDeleteCompletedTasks,
  parseLocalDateString,
  renderTaskInfoPopoverContent,
}: DashboardTaskListPanelProps) {
  return (
    <div className="space-y-0.5">
      {agendaTasks.length === 0 ? (
        <div className="mt-2 text-[#ECECF3] text-lg">Aucune tâche pour l’instant</div>
      ) : (
        <div className="mt-3 divide-y divide-[#25293A]">
          {visibleTasks.map((task) => {
            const taskDate = parseLocalDateString(task.date);
            const displayDate = taskDate
              ? taskDate.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })
              : 'Date à définir';

            return (
              <div
                key={task.id}
                ref={(node) => {
                  taskListItemRefs.current[task.id] = node;
                }}
                className={`group relative flex items-start gap-2 py-2 ${task.completed ? 'opacity-60' : ''}`}
              >
                <div className="mt-0.5">
                  <Checkbox
                    checked={task.completed}
                    onClick={(event) => event.stopPropagation()}
                    onCheckedChange={() => onToggleTask(task.id)}
                    className="rounded-sm h-4 w-4 border-2 border-[#7C8DB5] bg-[#101524] shadow-[0_0_0_1px_rgba(65,105,225,0.25)] data-[state=checked]:bg-[#4169E1] data-[state=checked]:border-[#A5C4FF] data-[state=checked]:shadow-[0_0_0_2px_rgba(65,105,225,0.35)]"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  {editingNameId === task.id ? (
                    <Input
                      value={editingNameValue}
                      onChange={(event) => onEditingNameValueChange(event.target.value)}
                      onBlur={() => onCommitEditingName(task.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          onCommitEditingName(task.id);
                        }
                        if (event.key === 'Escape') {
                          event.preventDefault();
                          onCancelEditingName();
                        }
                      }}
                      autoFocus
                      className="h-7 px-2 text-sm rounded-lg border-[#2B3550] bg-[#101524] text-[#ECECF3]"
                    />
                  ) : (
                    <div
                      className={`text-sm font-medium text-left break-words ${
                        task.completed ? 'line-through' : ''
                      } ${task.urgent ? 'text-red-400' : 'text-[#ECECF3]'}`}
                    >
                      {task.name || 'Tâche sans titre'}
                    </div>
                  )}
                  <div className={`mt-0.5 text-xs text-[#A9ACBA] ${task.completed ? 'line-through' : ''}`}>
                    {displayDate} {task.time ? `· ${task.time}` : ''}
                  </div>
                </div>

                <div className="ml-auto flex items-start">
                  <Popover open={infoTaskId === task.id} onOpenChange={(open) => onInfoTaskChange(open ? task.id : null)}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={(event) => event.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 transition text-[#A9ACBA] hover:text-[#ECECF3] rounded-full border border-[#3B4154] h-6 w-6 p-0"
                        aria-label="Détails de la tâche"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </Button>
                    </PopoverTrigger>
                    {renderTaskInfoPopoverContent(task, () => onInfoTaskChange(null))}
                  </Popover>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="pt-2">
        <div className="flex items-center gap-2 text-sm text-[#A9ACBA]">
          <span>{completedTasksCount} terminées</span>
          <span>•</span>
          <Button
            type="button"
            onClick={() => onShowCompletedTasksChange((prev) => !prev)}
            variant="ghost"
            className="h-auto p-0 text-[#F43F5E] hover:text-[#FF5E7A]"
          >
            {showCompletedTasks ? 'Masquer' : 'Afficher'}
          </Button>
          <span>•</span>
          <Popover open={deleteCompletedMenuOpen} onOpenChange={onDeleteCompletedMenuOpenChange}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-auto p-0 text-[#E16941] hover:text-[#F18B6B]"
                disabled={completedTasksCount === 0}
              >
                Supprimer
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              side="top"
              sideOffset={10}
              className="w-[260px] rounded-[24px] border border-white/10 bg-[#2B2F3A]/92 p-2 text-[#ECECF3] backdrop-blur-xl shadow-[0_32px_80px_rgba(0,0,0,0.55)]"
              onOpenAutoFocus={(event) => event.preventDefault()}
            >
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => onDeleteCompletedTasks(1)}
                  className="flex w-full items-center rounded-2xl px-3 py-2.5 text-left text-sm text-[#ECECF3] transition hover:bg-white/[0.06]"
                >
                  Plus vieux qu’un mois
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCompletedTasks(3)}
                  className="flex w-full items-center rounded-2xl px-3 py-2.5 text-left text-sm text-[#ECECF3] transition hover:bg-white/[0.06]"
                >
                  Plus vieux que 3 mois
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCompletedTasks(12)}
                  className="flex w-full items-center rounded-2xl px-3 py-2.5 text-left text-sm text-[#ECECF3] transition hover:bg-white/[0.06]"
                >
                  Plus vieux qu’un an
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCompletedTasks()}
                  className="flex w-full items-center rounded-2xl px-3 py-2.5 text-left text-sm text-[#E16941] transition hover:bg-[rgba(225,105,65,0.08)]"
                >
                  Tout supprimer
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
