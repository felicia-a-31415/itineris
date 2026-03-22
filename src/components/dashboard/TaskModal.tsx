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
          className="text-sm font-semibold text-[#9DD0FF] hover:text-[#C6E2FF]"
        >
          Annuler
        </button>
        <div className="text-sm font-semibold text-[#ECECF3]">Nouvelle tâche</div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="text-sm font-semibold text-[#9DD0FF] hover:text-[#C6E2FF]"
        >
          Enregistrer
        </button>
      </div>

      <div className="max-h-[75vh] overflow-y-auto space-y-4">
        <div className="rounded-2xl bg-[#1C2130] border border-[#2B3550]">
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={titlePlaceholder}
            className="w-full bg-transparent border-0 border-b border-[#2B3550] px-4 py-3 text-sm text-[#ECECF3] placeholder:text-[#A9ACBA] rounded-none"
          />
          <div className="grid gap-3 p-4">
            <label className="text-xs uppercase tracking-wide text-[#A9ACBA]">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="h-10 rounded-xl bg-[#0F1117] border-[#2B3550] px-3 text-sm text-[#ECECF3] focus:border-[#4169E1]"
            />

            <label className="text-xs uppercase tracking-wide text-[#A9ACBA]">Heure (optionnel)</label>
            <Input
              type="time"
              value={time}
              onChange={(e) => onTimeChange(e.target.value)}
              className="h-10 rounded-xl bg-[#0F1117] border-[#2B3550] px-3 text-sm text-[#ECECF3] focus:border-[#4169E1]"
            />
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-[#1C2130] border border-[#2B3550] p-4">
          <div className="text-xs uppercase tracking-wide text-[#A9ACBA] mb-3">Couleur</div>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onColorChange(color)}
                className={`w-8 h-8 rounded-xl transition ring-offset-2 ring-offset-[#1C2130] ${
                  selectedColor === color ? 'ring-2 ring-[#9DD0FF]' : ''
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
