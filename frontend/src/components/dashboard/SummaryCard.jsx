import React from 'react';

export default function SummaryCard({ title, value, icon: Icon, loading, colorClass, subtext, trend }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">{title}</p>
          {loading ? (
            <div className="h-9 w-20 bg-slate-100 animate-pulse rounded-lg mt-1" />
          ) : (
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{value ?? 0}</h3>
              {trend && (
                <span className="inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {trend}
                </span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl transition-transform duration-200 group-hover:scale-105 ${colorClass || 'bg-teal-50 text-teal-600'}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {subtext && (
        <div className="mt-3 pt-3 border-t border-slate-50 text-xs text-slate-400 font-medium">
          {subtext}
        </div>
      )}
    </div>
  );
}
