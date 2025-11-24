import React from 'react';
import { Minus, Square, X } from 'lucide-react';

export const TopBar: React.FC = () => {
  return (
    <div className="h-10 w-full flex items-center justify-between px-4 select-none bg-transparent">
      <div className="text-xs font-medium text-zinc-600 tracking-widest uppercase flex items-center gap-2">
        CapThat
      </div>
      <div className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity">
        <button className="p-1.5 hover:bg-zinc-900 rounded-full text-zinc-500 transition-colors">
          <Minus className="w-3 h-3" />
        </button>
        <button className="p-1.5 hover:bg-zinc-900 rounded-full text-zinc-500 transition-colors">
          <Square className="w-3 h-3" />
        </button>
        <button className="p-1.5 hover:bg-red-900/30 rounded-full text-zinc-500 hover:text-red-400 transition-colors">
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};