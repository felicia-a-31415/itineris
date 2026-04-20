import React from 'react';
import { Input } from '../../ui/input';

interface TaskEditorProps {
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

export function TaskEditor({
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
}: TaskEditorProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="rounded-full px-3 py-1.5 text-sm font-semibold text-white/56 transition hover:bg-white/[0.06] hover:text-white"
        >
          Annuler
        </button>
        <div className="text-sm font-semibold text-[#F5F2F7]">Nouvelle tâche</div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="rounded-full bg-[#6d42ff] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#7b55ff]"
        >
          Enregistrer
        </button>
      </div>

      <div className="max-h-[75vh] space-y-4 overflow-y-auto pt-4 app-scrollbar-hidden">
        <div className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-white/[0.035]">
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={titlePlaceholder}
            className="h-12 w-full rounded-none border-0 border-b border-white/[0.08] bg-transparent px-4 text-sm text-[#F5F2F7] placeholder:text-white/36 focus-visible:ring-0"
          />
          <div className="grid gap-3 p-4">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-white/42">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="h-10 rounded-xl border-white/[0.08] bg-[rgba(10,9,18,0.48)] px-3 text-sm text-[#F5F2F7] focus-visible:border-[#9F7BFF]/50 focus-visible:ring-[#9F7BFF]/18"
            />

            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-white/42">Heure (optionnel)</label>
            <Input
              type="time"
              value={time}
              onChange={(e) => onTimeChange(e.target.value)}
              className="h-10 rounded-xl border-white/[0.08] bg-[rgba(10,9,18,0.48)] px-3 text-sm text-[#F5F2F7] focus-visible:border-[#9F7BFF]/50 focus-visible:ring-[#9F7BFF]/18"
            />
          </div>
        </div>

        <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.035] p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/42">Couleur</div>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onColorChange(color)}
                className={`h-8 w-8 rounded-xl border border-white/10 transition ring-offset-2 ring-offset-[rgba(15,10,30,0.86)] ${
                  selectedColor === color ? 'scale-105 ring-2 ring-[#C7B7FF]' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
