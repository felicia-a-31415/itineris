import { Dialog, DialogContent } from '../../ui/dialog';
import { TaskEditor } from './TaskModal';

type TaskCreationDialogProps = {
  open: boolean;
  title: string;
  date: string;
  time: string;
  selectedColor: string;
  colors: string[];
  onOpenChange: (open: boolean) => void;
  onTitleChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export function TaskCreationDialog({
  open,
  title,
  date,
  time,
  selectedColor,
  colors,
  onOpenChange,
  onTitleChange,
  onDateChange,
  onTimeChange,
  onColorChange,
  onClose,
  onSave,
}: TaskCreationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[360px] max-w-[calc(100vw-2rem)] rounded-[24px] border border-white/[0.08] bg-[rgba(15,10,30,0.86)] p-4 text-sm text-[#F5F2F7] shadow-[0_32px_80px_rgba(0,0,0,0.62)] backdrop-blur-[22px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <TaskEditor
          title={title}
          onTitleChange={onTitleChange}
          titlePlaceholder="Ajouter un titre"
          date={date}
          onDateChange={onDateChange}
          time={time}
          onTimeChange={onTimeChange}
          selectedColor={selectedColor}
          colors={colors}
          onColorChange={onColorChange}
          onClose={onClose}
          onSave={onSave}
        />
      </DialogContent>
    </Dialog>
  );
}
