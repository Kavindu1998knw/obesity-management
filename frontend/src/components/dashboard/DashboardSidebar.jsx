import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHeartPulse, FaXmark, FaArrowRightFromBracket } from 'react-icons/fa6';

export default function DashboardSidebar({ role, menuItems, isOpen, onClose, onLogout }) {
  const getRoleLabel = () => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'doctor': return 'Medical Doctor';
      case 'patient': return 'Patient Portal';
      default: return 'Portal';
    }
  };

  const SidebarContent = () => (
    <>
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-slate-700">
        <div className="flex items-center gap-x-3 text-white">
          <div className="bg-teal-600 p-1.5 rounded-lg">
            <FaHeartPulse className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight block leading-tight">ObesityCare</span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase block leading-none">Clinical Decision Support</span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto p-1 text-slate-400 hover:text-white lg:hidden">
            <FaXmark className="h-6 w-6" />
          </button>
        )}
      </div>

      <div className="px-6 py-4">
        <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-slate-300 ring-1 ring-inset ring-slate-700/50 uppercase tracking-wider">
          {getRoleLabel()}
        </span>
      </div>

      <nav className="flex flex-1 flex-col px-4 pb-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-2">
          {menuItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
                onClick={onClose}
              >
                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <button
            onClick={onLogout}
            className="w-full flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-rose-400 hover:bg-slate-800 hover:text-rose-300 transition-colors"
          >
            <FaArrowRightFromBracket className="h-5 w-5 shrink-0" aria-hidden="true" />
            Logout
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[10px] leading-relaxed text-slate-500">
            This prediction supports clinical assessment and must not replace professional medical diagnosis.
          </p>
        </div>
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col bg-[#0F2744]">
        <SidebarContent />
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="relative z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-slate-900/80 transition-opacity" 
            onClick={onClose}
          />
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1 flex-col bg-[#0F2744]">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
