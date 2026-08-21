import React from 'react';

export default function SummaryCard({ title, value, icon: Icon, loading, colorClass }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          {loading ? (
            <div className="h-8 w-20 bg-slate-200 animate-pulse rounded mt-2"></div>
          ) : (
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{value}</h3>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClass || 'bg-blue-50 text-blue-600'}`}>
          <Icon className="text-xl" />
        </div>
      </div>
    </div>
  );
}
