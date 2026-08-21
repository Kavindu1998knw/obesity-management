import React from 'react';

export default function ChartPanel({ title, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col h-full">
      <h3 className="text-sm font-semibold text-slate-900 mb-6">{title}</h3>
      <div className="flex-1 min-h-[250px] relative">
        {children}
      </div>
    </div>
  );
}
