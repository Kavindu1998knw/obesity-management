import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  ArrowLeft,
  LayoutDashboard,
  LogOut,
  Lock
} from 'lucide-react';

export default function UnauthorizedPage({ attemptedPath: propAttemptedPath, allowedRoles: propAllowedRoles, userRole: propUserRole }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve state passed via navigation or props or local storage
  const stateData = location.state || {};
  const attemptedPath = propAttemptedPath || stateData.attemptedPath || location.pathname || 'Requested Page';
  const allowedRoles = propAllowedRoles || stateData.allowedRoles || [];
  
  const savedUser = localStorage.getItem('user');
  let user = null;
  if (savedUser) {
    try {
      user = JSON.parse(savedUser);
    } catch {
      user = null;
    }
  }

  const currentRole = propUserRole || stateData.currentRole || user?.role || 'Guest';

  const getDashboardPath = () => {
    if (currentRole === 'admin') return '/admin/dashboard';
    if (currentRole === 'doctor') return '/doctor/dashboard';
    if (currentRole === 'patient') return '/patient/dashboard';
    return '/login';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    navigate('/login');
  };

  const formatRoleName = (r) => {
    if (!r) return 'Authorized User';
    return r.charAt(0).toUpperCase() + r.slice(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans text-slate-100 relative overflow-hidden">
      {/* Decorative background glow circles */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-rose-600/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-rose-500/20 rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10 text-center"
      >
        {/* Top Floating Security Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>Security Intercept • HTTP 403 Forbidden</span>
        </div>

        {/* Big Warning Icon */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-3xl bg-rose-600/20 blur-xl animate-pulse" />
          <div className="relative w-full h-full rounded-3xl bg-gradient-to-tr from-rose-600 to-amber-500 p-0.5 shadow-lg">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
              <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-rose-400 stroke-[1.75]" />
            </div>
          </div>
        </div>

        {/* Heading & Subtitle */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          Unauthorized URL Navigation Blocked
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto mb-8">
          You do not have the required permissions to access this restricted URL. The navigation request was safely blocked.
        </p>

        {/* Route Details Card */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 text-left mb-8 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-slate-800/80">
            <span className="text-xs font-medium text-slate-400">Attempted URL Destination</span>
            <span className="text-xs font-mono font-semibold text-rose-300 bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-800/50 break-all">
              {attemptedPath}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-slate-800/80">
            <span className="text-xs font-medium text-slate-400">Your Current Account</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-200">
                {user?.fullName || 'Anonymous / Guest'}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-teal-300 border border-teal-500/30">
                {currentRole}
              </span>
            </div>
          </div>

          {allowedRoles.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-xs font-medium text-slate-400">Required Role Access</span>
              <div className="flex flex-wrap gap-1.5">
                {allowedRoles.map((role) => (
                  <span 
                    key={role}
                    className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-rose-950/50 text-rose-300 border border-rose-800/40"
                  >
                    {formatRoleName(role)} Only
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-all duration-150 border border-slate-700/80 cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

          <Link
            to={getDashboardPath()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-teal-900/30 transition-all duration-150 cursor-pointer active:scale-[0.98]"
          >
            <LayoutDashboard className="w-4 h-4" />
            Return to My Dashboard
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs sm:text-sm font-semibold transition-all duration-150 border border-rose-800/50 cursor-pointer active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" />
            Switch Account
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-4 border-t border-slate-800/60 text-center text-xs text-slate-500">
          SmartObesity AI Role-Based Access Control (RBAC) Protection System
        </div>
      </motion.div>
    </div>
  );
}
