import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title, description, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl h-full min-h-[260px]">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3.5 shadow-xs">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-slate-800 tracking-tight">{title}</h4>
      {description && (
        <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed">{description}</p>
      )}
    </div>
  );
}
