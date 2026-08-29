import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileQuestion,
  ArrowLeft,
  LayoutDashboard,
  Home
} from 'lucide-react';

export default function NotFoundPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const savedUser = localStorage.getItem('user');
  let user = null;
  if (savedUser) {
    try {
      user = JSON.parse(savedUser);
    } catch {
      user = null;
    }
  }

  const getDashboardPath = () => {
    if (user?.role === 'admin') return '/admin/dashboard';
    if (user?.role === 'doctor') return '/doctor/dashboard';
    if (user?.role === 'patient') return '/patient/dashboard';
    return '/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans text-slate-100 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-lg bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10 text-center"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400">
          <FileQuestion className="w-10 h-10" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
          404
        </h1>
        <h2 className="text-xl font-bold text-slate-200 mb-3">
          Page Not Found
        </h2>
        <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
          The URL <span className="text-teal-400 font-mono text-xs">{location.pathname}</span> could not be found or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-all duration-150 border border-slate-700 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

          <Link
            to={getDashboardPath()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-lg transition-all duration-150 cursor-pointer"
          >
            {user ? (
              <>
                <LayoutDashboard className="w-4 h-4" />
                Return to Dashboard
              </>
            ) : (
              <>
                <Home className="w-4 h-4" />
                Go to Login
              </>
            )}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
