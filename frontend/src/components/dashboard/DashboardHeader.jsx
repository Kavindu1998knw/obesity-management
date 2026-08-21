import React, { useState, useRef, useEffect } from 'react';
import { FaBars, FaArrowRightFromBracket, FaUser } from 'react-icons/fa6';
import { useNavigate, Link } from 'react-router-dom';

export default function DashboardHeader({ user, onOpenSidebar }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-slate-700 lg:hidden focus:outline-none"
        onClick={onOpenSidebar}
      >
        <span className="sr-only">Open sidebar</span>
        <FaBars className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-slate-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 justify-end items-center gap-x-4 sm:gap-x-6">
        
        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-x-4 pr-4 sm:pr-6 focus:outline-none"
          >
            <div className="flex flex-col text-right hidden sm:block">
              <span className="text-sm font-semibold leading-6 text-slate-900">{user?.fullName || 'User'}</span>
              <span className="text-xs font-medium text-slate-500 capitalize">{user?.role || 'Guest'}</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shadow-sm hover:ring-2 hover:ring-blue-300 transition-all">
              {getInitials(user?.fullName)}
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              {user?.role === 'patient' && (
                <Link
                  to="/patient/profile"
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                  onClick={() => setDropdownOpen(false)}
                >
                  <FaUser className="text-slate-400" /> My Profile
                </Link>
              )}
              {user?.role === 'doctor' && (
                <Link
                  to="/doctor/settings"
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                  onClick={() => setDropdownOpen(false)}
                >
                  <FaUser className="text-slate-400" /> Settings
                </Link>
              )}
            </div>
          )}
        </div>
        
        <div className="h-6 w-px bg-slate-200 hidden sm:block" aria-hidden="true" />

        <button
          onClick={handleLogout}
          className="flex items-center gap-x-2 text-sm font-medium text-rose-600 hover:text-rose-700 transition-colors focus:outline-none"
        >
          <FaArrowRightFromBracket className="h-4 w-4" />
          <span className="hidden sm:block">Log out</span>
        </button>
      </div>
    </header>
  );
}
