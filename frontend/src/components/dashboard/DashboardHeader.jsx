import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DashboardHeader({ user, onOpenSidebar, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const getPortalTitle = () => {
    switch (user?.role) {
      case 'admin':
        return 'Admin Control Center';
      case 'doctor':
        return 'Doctor Clinical Portal';
      case 'patient':
        return 'Patient Health Portal';
      default:
        return 'SmartObesity AI Portal';
    }
  };

  const getRoleBadgeStyle = () => {
    switch (user?.role) {
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'doctor':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'patient':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 shadow-xs">
      {/* Mobile Toggle & Portal Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl lg:hidden focus:outline-none transition-colors cursor-pointer"
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Dashboard Title & Live Status Indicator */}
        <div className="hidden sm:flex items-center gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">{getPortalTitle()}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-slate-500 font-medium">System Online & Secure</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side Header: User Identity & Direct Logout */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* User Identity Display */}
        <div className="flex items-center gap-3 p-1 sm:px-2.5 sm:py-1.5 rounded-xl text-left select-none">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-bold flex items-center justify-center shadow-xs text-sm ring-2 ring-white">
              {getInitials(user?.fullName)}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>

          {/* Name & Role Badge */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-900 leading-tight">
                {user?.fullName || 'User'}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${getRoleBadgeStyle()}`}>
                {user?.role || 'User'}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-normal leading-tight hidden md:block">
              {user?.email}
            </span>
          </div>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-slate-200" />

        {/* Clean Direct Logout Button */}
        <button
          type="button"
          onClick={onLogout || handleLogout}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50/80 hover:bg-rose-100/90 border border-rose-200/70 transition-all duration-150 cursor-pointer shadow-xs active:scale-[0.98]"
          title="Sign out of portal"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
