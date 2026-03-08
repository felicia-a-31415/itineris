import React from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Input } from '../ui/input';

interface TaskModalProps {
  isOpen: boolean;
  title: string;
  onTitleChange: (value: string) => void;
  titlePlaceholder?: string;
  date: string;
  onDateChange: (value: string) => void;
  time: string;
  onTimeChange: (value: string) => void;
  selectedColor: string;
  colors: string[];
  onColorChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function TaskModal({
  isOpen,
  title,
  onTitleChange,
  titlePlaceholder = 'Ajouter un titre',
  date,
  onDateChange,
  time,
  onTimeChange,
  selectedColor,
  colors,
  onColorChange,
  onClose,
  onSave,
}: TaskModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#2B2F3A]/95 border border-white/10 rounded-[24px] p-0 shadow-[0_32px_80px_rgba(0,0,0,0.7)]">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-[#FF2D55] hover:text-[#FF6B85]"
          >
            Annuler
          </button>
          <div className="text-sm font-semibold text-[#ECECF3]">Nouvelle tâche</div>
          <button
            type="button"
            onClick={onSave}
            className="text-sm font-semibold text-[#FF2D55] hover:text-[#FF6B85]"
          >
            Enregistrer
          </button>
        </div>

        <div className="px-4 pb-5 max-h-[75vh] overflow-y-auto">
          <div className="rounded-2xl bg-white/5 border border-white/10">
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={titlePlaceholder}
              className="w-full bg-transparent border-0 border-b border-white/10 px-4 py-3 text-sm text-[#ECECF3] placeholder:text-[#A9ACBA] rounded-none"
            />
            <div className="grid gap-3 p-4">
              <label className="text-xs uppercase tracking-wide text-[#A9ACBA]">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => onDateChange(e.target.value)}
                className="h-10 rounded-xl bg-[#1B1E2A] border-white/10 px-3 text-sm text-[#ECECF3]"
              />

              <label className="text-xs uppercase tracking-wide text-[#A9ACBA]">Heure (optionnel)</label>
              <Input
                type="time"
                value={time}
                onChange={(e) => onTimeChange(e.target.value)}
                className="h-10 rounded-xl bg-[#1B1E2A] border-white/10 px-3 text-sm text-[#ECECF3]"
              />
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="text-xs uppercase tracking-wide text-[#A9ACBA] mb-3">Couleur</div>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onColorChange(color)}
                  className={`w-8 h-8 rounded-xl transition ring-offset-2 ring-offset-[#2B2F3A] ${
                    selectedColor === color ? 'ring-2 ring-[#FF2D55]' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
