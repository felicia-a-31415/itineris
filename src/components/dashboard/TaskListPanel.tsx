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
    <div className="space-y-4">
      {agendaTasks.length === 0 ? (
        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.025] px-5 py-8 text-center">
          <div className="text-lg font-semibold text-[#F5F2F7]">Aucune tâche pour l’instant</div>
          <p className="mt-2 text-sm text-white/42">Ajoute une tâche depuis l’agenda pour commencer.</p>
        </div>
      ) : (
        <div className="space-y-2">
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
                className={`group relative flex items-start gap-3 rounded-[22px] border border-white/[0.06] bg-white/[0.025] px-3 py-3 transition hover:border-white/[0.1] hover:bg-white/[0.04] ${
                  task.completed ? 'opacity-60' : ''
                }`}
              >
                <div className="mt-0.5">
                  <Checkbox
                    checked={task.completed}
                    onClick={(event) => event.stopPropagation()}
                    onCheckedChange={() => onToggleTask(task.id)}
                    className="h-4 w-4 rounded-[5px] border-2 border-white/28 bg-[rgba(10,9,18,0.48)] shadow-none data-[state=checked]:border-[#C7B7FF] data-[state=checked]:bg-[#6d42ff] data-[state=checked]:shadow-[0_0_0_3px_rgba(109,66,255,0.18)]"
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
                      className="h-8 rounded-xl border-white/[0.08] bg-[rgba(10,9,18,0.48)] px-3 text-sm text-[#F5F2F7] focus-visible:border-[#9F7BFF]/50 focus-visible:ring-[#9F7BFF]/18"
                    />
                  ) : (
                    <div
                      className={`break-words text-left text-sm font-semibold ${
                        task.completed ? 'line-through' : ''
                      } ${task.urgent ? 'text-[#FF8FA3]' : 'text-[#F5F2F7]'}`}
                    >
                      {task.name || 'Tâche sans titre'}
                    </div>
                  )}
                  <div className={`mt-1 text-xs text-white/42 ${task.completed ? 'line-through' : ''}`}>
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
                        className="h-7 w-7 rounded-full border border-white/[0.08] p-0 text-white/34 opacity-100 transition hover:bg-white/[0.06] hover:text-white lg:opacity-0 lg:group-hover:opacity-100"
                        aria-label="Détails de la tâche"
                      >
                        <Info className="h-3.5 w-3.5" />
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
      <div className="border-t border-white/[0.06] pt-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-white/42">
          <span>{completedTasksCount} terminées</span>
          <span className="text-white/20">•</span>
          <Button
            type="button"
            onClick={() => onShowCompletedTasksChange((prev) => !prev)}
            variant="ghost"
            className="h-8 rounded-full px-3 text-[#C7B7FF] hover:bg-[#6d42ff]/10 hover:text-white"
          >
            {showCompletedTasks ? 'Masquer' : 'Afficher'}
          </Button>
          <span className="text-white/20">•</span>
          <Popover open={deleteCompletedMenuOpen} onOpenChange={onDeleteCompletedMenuOpenChange}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-8 rounded-full px-3 text-[#FF8FA3] hover:bg-[#FF5F8F]/10 hover:text-[#FFB4C2]"
                disabled={completedTasksCount === 0}
              >
                Supprimer
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              side="top"
              sideOffset={10}
              className="w-[260px] rounded-[24px] border border-white/[0.08] bg-[rgba(15,10,30,0.88)] p-2 text-[#F5F2F7] shadow-[0_32px_80px_rgba(0,0,0,0.55)] backdrop-blur-[22px]"
              onOpenAutoFocus={(event) => event.preventDefault()}
            >
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => onDeleteCompletedTasks(1)}
                  className="flex w-full items-center rounded-2xl px-3 py-2.5 text-left text-sm text-[#F5F2F7] transition hover:bg-white/[0.06]"
                >
                  Plus vieux qu’un mois
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCompletedTasks(3)}
                  className="flex w-full items-center rounded-2xl px-3 py-2.5 text-left text-sm text-[#F5F2F7] transition hover:bg-white/[0.06]"
                >
                  Plus vieux que 3 mois
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCompletedTasks(12)}
                  className="flex w-full items-center rounded-2xl px-3 py-2.5 text-left text-sm text-[#F5F2F7] transition hover:bg-white/[0.06]"
                >
                  Plus vieux qu’un an
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCompletedTasks()}
                  className="flex w-full items-center rounded-2xl px-3 py-2.5 text-left text-sm text-[#FF8FA3] transition hover:bg-[#FF5F8F]/10"
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
