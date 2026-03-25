import type { DashboardTask } from './storage';

export type DashboardAiAddTaskAction = {
  tool?: 'add_task';
  name?: string;
  date?: string;
  time?: string;
  urgent?: boolean;
  color?: string;
};

export function extractAddTaskActions(actions: unknown): DashboardAiAddTaskAction[] {
  if (!Array.isArray(actions)) return [];

  return actions.filter(
    (action): action is DashboardAiAddTaskAction =>
      (typeof action === 'object' && action !== null && ((action as DashboardAiAddTaskAction).tool === 'add_task' ||
        (action as DashboardAiAddTaskAction).tool === undefined) &&
        typeof (action as DashboardAiAddTaskAction).name === 'string' &&
        (action as DashboardAiAddTaskAction).name!.trim().length > 0)
  );
}

export function buildTasksFromAiActions({
  actions,
  taskColors,
  formatDate,
  isValidTaskDate,
  isValidTaskTime,
}: {
  actions: DashboardAiAddTaskAction[];
  taskColors: string[];
  formatDate: (date: Date) => string;
  isValidTaskDate: (value?: string) => boolean;
  isValidTaskTime: (value?: string) => boolean;
}): DashboardTask[] {
  const now = Date.now();

  return actions.map((action, index) => ({
    id: `ai-${now}-${index}`,
    name: action.name!.trim(),
    completed: false,
    color:
      typeof action.color === 'string' && taskColors.includes(action.color)
        ? action.color
        : taskColors[index % taskColors.length],
    urgent: !!action.urgent,
    date: isValidTaskDate(action.date) ? action.date : formatDate(new Date()),
    time: isValidTaskTime(action.time) ? action.time : undefined,
  }));
}
