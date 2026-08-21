import React from 'react';
import { FaCircleExclamation } from 'react-icons/fa6';

export default function DashboardError({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-rose-50 border border-rose-200 rounded-xl max-w-2xl mx-auto mt-10">
      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 mb-4">
        <FaCircleExclamation className="text-2xl" />
      </div>
      <h3 className="text-sm font-semibold text-rose-900">Failed to load dashboard</h3>
      <p className="text-sm text-rose-700 mt-2 max-w-sm">
        {message || 'An unexpected error occurred while loading your data.'}
      </p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="mt-6 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
