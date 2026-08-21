import React from 'react';

export default function ChartPanel({ title, subtitle, action, children, className = '' }) {
  return (
    <div className={`bg-white border border-slate-100 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col h-full ${className}`}>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="flex-1 min-h-[260px] relative w-full">
        {children}
      </div>
    </div>
  );
}
