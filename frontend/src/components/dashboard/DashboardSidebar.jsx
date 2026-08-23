import React from 'react';
import { NavLink } from 'react-router-dom';
import { HeartPulse, X, LogOut, ShieldCheck } from 'lucide-react';

export default function DashboardSidebar({ role, menuItems, isOpen, onClose, onLogout }) {
  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return { label: 'Admin Control Panel', badge: 'SuperAdmin' };
      case 'doctor':
        return { label: 'Doctor Clinical Portal', badge: 'Clinician' };
      case 'patient':
        return { label: 'Patient Wellness Portal', badge: 'Patient' };
      default:
        return { label: 'Portal', badge: 'User' };
    }
  };

  const roleInfo = getRoleBadge();

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 select-none">
      {/* Brand Header */}
      <div className="flex h-20 shrink-0 items-center px-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-900/40">
            <HeartPulse className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-white leading-tight">
                SmartObesity<span className="text-teal-400"> AI</span>
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide leading-tight mt-0.5">
              Clinical Decision Support System
            </span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg lg:hidden transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Role Pill Indicator */}
      <div className="px-6 py-3.5 border-b border-slate-800/40">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          <span className="tracking-wide text-[11px] uppercase font-semibold text-slate-300">{roleInfo.label}</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col px-3.5 py-4 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
          Navigation
        </div>
        <ul className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-900/30 font-semibold'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    }`
                  }
                  onClick={onClose}
                >
                  {Icon && <Icon className="w-5 h-5 shrink-0 transition-colors" />}
                  <span>{item.name}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section with Logout */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/90 space-y-3">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-150 cursor-pointer"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Logout</span>
        </button>

        <div className="px-2 pt-1 text-center">
          <p className="text-[10px] text-slate-400 leading-relaxed">
            SmartObesity AI • Developed by <span className="text-teal-400 font-medium">Kavindu Weerasinghe</span>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col shadow-xl">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="relative z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1 flex-col shadow-2xl">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
