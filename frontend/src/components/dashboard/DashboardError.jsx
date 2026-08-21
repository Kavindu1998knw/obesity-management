import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function DashboardError({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-rose-50/70 border border-rose-100 rounded-2xl max-w-xl mx-auto my-12 shadow-sm">
      <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 mb-3.5 shadow-xs">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-rose-950">Failed to load dashboard data</h3>
      <p className="text-xs sm:text-sm text-rose-700 mt-1.5 max-w-md leading-relaxed">
        {message || 'An unexpected error occurred while loading your data. Please check your connection or try again.'}
      </p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors duration-150 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      )}
    </div>
  );
}
