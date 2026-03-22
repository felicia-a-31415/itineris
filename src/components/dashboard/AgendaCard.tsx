import type React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Info, List, Sparkles, Upload } from 'lucide-react';

import { type DashboardTask } from '../../lib/storage';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Checkbox } from '../../ui/checkbox';
import { Input } from '../../ui/input';
import { Popover, PopoverTrigger } from '../../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

type AgendaTask = DashboardTask;

type AgendaCardProps = {
  timeView: 'week' | 'month';
  calendarMode: 'calendar' | 'tasks';
  uploadNotice: string | null;
  tasksListContent: React.ReactNode;
  headerDates: Date[];
  calendarDates: Date[];
  monthRangeStart: Date;
  showAddDialog: boolean;
  modalTaskId: string | null;
  taskDetailsId: string | null;
  editingNameId: string | null;
  editingNameValue: string;
  onTimeViewChange: (value: 'week' | 'month') => void;
  onCalendarModeChange: (value: 'calendar' | 'tasks') => void;
  onToday: () => void;
  onPrevRange: () => void;
  onNextRange: () => void;
  onAgendaImageUpload: (file?: File) => void;
  isCurrentRangeToday: (date: Date) => boolean;
  getDayName: (date: Date) => string;
  formatDate: (date: Date) => string;
  getTasksForDate: (date: string) => AgendaTask[];
  onCreateTask: (dateString: string) => void;
  onToggleTask: (taskId: string) => void;
  onEditingNameValueChange: (value: string) => void;
  onCommitEditingName: (taskId: string) => void;
  onCancelEditingName: () => void;
  onTaskDetailsChange: (taskId: string | null) => void;
  renderTaskInfoPopoverContent: (task: AgendaTask, close: () => void) => React.ReactNode;
};

export function AgendaCard({
  timeView,
  calendarMode,
  uploadNotice,
  tasksListContent,
  headerDates,
  calendarDates,
  monthRangeStart,
  showAddDialog,
  modalTaskId,
  taskDetailsId,
  editingNameId,
  editingNameValue,
  onTimeViewChange,
  onCalendarModeChange,
  onToday,
  onPrevRange,
  onNextRange,
  onAgendaImageUpload,
  isCurrentRangeToday,
  getDayName,
  formatDate,
  getTasksForDate,
  onCreateTask,
  onToggleTask,
  onEditingNameValueChange,
  onCommitEditingName,
  onCancelEditingName,
  onTaskDetailsChange,
  renderTaskInfoPopoverContent,
}: AgendaCardProps) {
  return (
    <Card className="bg-[#161924] border-[#1F2230] rounded-3xl p-6 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.06)] space-y-2">
      <div className={`flex flex-col ${calendarMode === 'tasks' ? 'gap-2' : 'gap-4'}`}>
        <p className="text-sm text-[#A9ACBA]">Agenda en ligne</p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          {calendarMode === 'calendar' ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                className="h-11 rounded-full border-[#2B3550] bg-[#0F1117] text-[#ECECF3] hover:bg-[#1A1D26] px-5"
                onClick={onToday}
              >
                Aujourd&apos;hui
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={onPrevRange}
                  variant="ghost"
                  className="h-11 w-11 rounded-full border border-transparent bg-transparent text-[#ECECF3] p-0"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  type="button"
                  onClick={onNextRange}
                  variant="ghost"
                  className="h-11 w-11 rounded-full border border-transparent bg-transparent text-[#ECECF3] p-0"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ) : (
            <div />
          )}

          <div className="flex flex-wrap items-center gap-2">
            {calendarMode === 'calendar' ? (
              <Select value={timeView} onValueChange={onTimeViewChange}>
                <SelectTrigger className="h-11 min-h-11 w-[128px] rounded-full border-[#2B3550] bg-[#0F1117] px-4 text-sm font-semibold text-[#ECECF3] hover:bg-[#1A1D26] focus-visible:border-[#2B3550] focus-visible:ring-0 data-[size=default]:h-11">
                  <SelectValue>{timeView === 'week' ? 'Semaine' : 'Mois'}</SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-[#1F2230] bg-[#161924] text-[#ECECF3] shadow-[0_22px_60px_rgba(0,0,0,0.35)]">
                  <SelectItem value="week" className="rounded-lg py-2 text-sm">
                    Semaine
                  </SelectItem>
                  <SelectItem value="month" className="rounded-lg py-2 text-sm">
                    Mois
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : null}
            <div className="relative inline-flex items-center h-11 w-[102px] rounded-full border border-[#2B3550] bg-[#0F1117] overflow-hidden">
              <div
                className={`absolute top-0 bottom-0 w-1/2 bg-[#9FD0FF] ${
                  calendarMode === 'calendar'
                    ? 'left-0 rounded-l-full rounded-r-none'
                    : 'left-1/2 rounded-r-full rounded-l-none'
                }`}
              />
              <Button
                type="button"
                onClick={() => onCalendarModeChange('calendar')}
                variant="ghost"
                className={`relative z-10 h-full w-1/2 rounded-none flex items-center justify-center transition ${
                  calendarMode === 'calendar'
                    ? 'text-[#0B0D10]'
                    : 'text-[#A9ACBA] hover:text-[#ECECF3] hover:bg-white/5'
                }`}
                aria-label="Vue calendrier"
              >
                <Calendar className="w-5 h-5" />
              </Button>
              <Button
                type="button"
                onClick={() => onCalendarModeChange('tasks')}
                variant="ghost"
                className={`relative z-10 h-full w-1/2 rounded-none flex items-center justify-center transition ${
                  calendarMode === 'tasks'
                    ? 'text-[#0B0D10]'
                    : 'text-[#A9ACBA] hover:text-[#ECECF3] hover:bg-white/5'
                }`}
                aria-label="Vue liste"
              >
                <List className="w-5 h-5" />
              </Button>
            </div>
            <Button
              asChild
              variant="ghost"
              className="h-11 px-4 rounded-full border border-[#2B3550] bg-[#0F1117] text-sm font-semibold text-[#ECECF3] hover:bg-[#1A1D26]"
            >
              <label htmlFor="agendaUpload" className="flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                Importer une photo
              </label>
            </Button>
            <input
              id="agendaUpload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onAgendaImageUpload(e.target.files?.[0])}
            />
          </div>
        </div>
      </div>

      {uploadNotice ? (
        <div className="mt-3 text-xs text-[#A9ACBA] bg-[#0F1117] rounded-2xl px-3 py-2 inline-flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#4169E1]" />
          {uploadNotice}
        </div>
      ) : null}

      {calendarMode === 'tasks' ? (
        <div className="mt-0">{tasksListContent}</div>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <div className="w-[1104px] min-w-[1104px] shrink-0">
            <div className="grid grid-cols-7 border-b border-[#1F2230]">
              {headerDates.map((date, index) => (
                <div
                  key={index}
                  className={`p-3 text-center border-r border-[#1F2230] last:border-r-0 ${
                    timeView === 'week' && isCurrentRangeToday(date) ? 'bg-[#4169E1]/5' : ''
                  }`}
                >
                  <div className="text-[10px] text-[#A9ACBA] uppercase mb-1">{getDayName(date)}</div>
                  {timeView === 'week' ? (
                    <div
                      className={`text-base font-semibold w-8 h-8 rounded-full flex items-center justify-center mx-auto transition ${
                        isCurrentRangeToday(date) ? 'text-white bg-[#4169E1]' : 'text-[#ECECF3] hover:bg-[#2B2F3A]'
                      }`}
                    >
                      {date.getDate()}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className={`grid grid-cols-7 ${timeView === 'month' ? '' : 'min-h-[380px]'}`}>
              {calendarDates.map((date, index) => {
                const dateString = formatDate(date);
                const tasksForDay = getTasksForDate(dateString);
                const isOutsideMonth =
                  timeView === 'month' &&
                  (date.getMonth() !== monthRangeStart.getMonth() || date.getFullYear() !== monthRangeStart.getFullYear());

                return (
                  <div
                    key={index}
                    onClick={() => onCreateTask(dateString)}
                    className={`group border-r border-b border-[#1F2230] last:border-r-0 cursor-pointer ${
                      timeView === 'month' ? 'aspect-square p-2.5' : 'p-3'
                    } ${isCurrentRangeToday(date) ? 'bg-[#4169E1]/5' : ''} ${
                      isOutsideMonth ? 'bg-[#121520] text-[#6F7587]' : ''
                    }`}
                  >
                    {timeView === 'month' ? (
                      <div className="flex items-center justify-center mb-2">
                        <div
                          className={`text-xs font-semibold w-8 h-8 rounded-full flex items-center justify-center ${
                            isCurrentRangeToday(date) ? 'text-white bg-[#4169E1]' : 'text-[#A9ACBA]'
                          }`}
                        >
                          {date.getDate()}
                        </div>
                      </div>
                    ) : null}
                    <div className={timeView === 'month' ? 'space-y-2' : 'space-y-3'}>
                      {tasksForDay.map((task) => {
                        const isMonthView = timeView === 'month';

                        const taskCard = (
                          <div
                            className="rounded-xl px-2.5 py-1.5 text-xs bg-[#182032] border border-[#2B3550] text-[#ECECF3] shadow-[0_4px_12px_rgba(65,105,225,0.06)]"
                            style={{ borderLeft: `${isMonthView ? 3 : 4}px solid ${task.color}` }}
                          >
                            <div className="flex items-center gap-2 min-h-[18px]">
                              <div className="flex items-center justify-center">
                                <Checkbox
                                  checked={task.completed}
                                  onClick={(e) => e.stopPropagation()}
                                  onCheckedChange={() => onToggleTask(task.id)}
                                  className="rounded-sm h-4 w-4 border-2 border-[#7C8DB5] bg-[#101524] shadow-[0_0_0_1px_rgba(65,105,225,0.25)] data-[state=checked]:bg-[#4169E1] data-[state=checked]:border-[#A5C4FF] data-[state=checked]:shadow-[0_0_0_2px_rgba(65,105,225,0.35)]"
                                />
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col items-start gap-1">
                                <div className="flex items-center gap-1">
                                  {task.time ? <span className="text-[10px] text-[#A9ACBA]">{task.time}</span> : null}
                                </div>

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
                                    className="h-6 px-2 text-xs md:text-xs rounded-lg border-[#2B3550] bg-[#101524] text-[#ECECF3]"
                                  />
                                ) : (
                                  <div
                                    className={`text-left text-xs leading-none break-words ${
                                      task.completed ? 'line-through opacity-50' : ''
                                    } ${task.urgent ? 'text-red-400' : 'text-[#ECECF3]'}`}
                                  >
                                    {task.name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );

                        return (
                          <div key={task.id}>
                            {showAddDialog && modalTaskId === task.id ? (
                              <div onClick={(e) => e.stopPropagation()}>{taskCard}</div>
                            ) : (
                              <Popover open={taskDetailsId === task.id} onOpenChange={(open) => onTaskDetailsChange(open ? task.id : null)}>
                                <PopoverTrigger asChild>
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onTaskDetailsChange(task.id);
                                    }}
                                  >
                                    {taskCard}
                                  </div>
                                </PopoverTrigger>
                                {renderTaskInfoPopoverContent(task, () => onTaskDetailsChange(null))}
                              </Popover>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
