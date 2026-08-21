import React from 'react';

export default function LoadingDashboard() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-pulse w-full max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-7 bg-slate-200/80 rounded-lg w-48" />
        <div className="h-4 bg-slate-200/60 rounded-md w-72" />
      </div>
      
      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-28 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-3 bg-slate-200/70 rounded w-20" />
                <div className="h-6 bg-slate-200 rounded w-16" />
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-80 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col">
          <div className="h-4 bg-slate-200/70 rounded w-40 mb-6" />
          <div className="flex-1 bg-slate-100/60 rounded-xl" />
        </div>
        <div className="h-80 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col">
          <div className="h-4 bg-slate-200/70 rounded w-40 mb-6" />
          <div className="flex-1 bg-slate-100/60 rounded-xl" />
        </div>
        <div className="h-80 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col">
          <div className="h-4 bg-slate-200/70 rounded w-40 mb-6" />
          <div className="flex-1 bg-slate-100/60 rounded-xl" />
        </div>
      </div>

      {/* Bottom Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col">
          <div className="h-4 bg-slate-200/70 rounded w-44 mb-6" />
          <div className="flex-1 bg-slate-100/60 rounded-xl" />
        </div>
        <div className="h-72 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col">
          <div className="h-4 bg-slate-200/70 rounded w-44 mb-6" />
          <div className="flex-1 bg-slate-100/60 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
