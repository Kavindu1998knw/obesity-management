import React from 'react';

export default function EmptyState({ title, description, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-slate-200 border-dashed rounded-xl h-full min-h-[250px]">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
          <Icon className="text-2xl" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 mt-2 max-w-sm">{description}</p>
    </div>
  );
}
