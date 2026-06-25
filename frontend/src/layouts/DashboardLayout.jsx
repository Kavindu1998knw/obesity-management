import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaUser, 
  FaUserDoctor, 
  FaShieldHalved,
  FaArrowRightFromBracket,
  FaBars,
  FaXmark,
  FaBell,
  FaMagnifyingGlass,
  FaSun,
  FaMoon
} from 'react-icons/fa6';

export default function DashboardLayout({ children, role, menuItems }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState({ fullName: 'User', email: '', role: 'patient' });
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getRoleDetails = () => {
    switch (role) {
      case 'admin':
        return { label: 'Administrator', icon: FaShieldHalved, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' };
      case 'doctor':
        return { label: 'Medical Doctor', icon: FaUserDoctor, color: 'text-teal-500 bg-teal-500/10 border-teal-500/20' };
      default:
        return { label: 'Patient Portal', icon: FaUser, color: 'text-sky-500 bg-sky-500/10 border-sky-500/20' };
    }
  };

  const roleMeta = getRoleDetails();

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-64 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 backdrop-blur-md transition-transform duration-300 lg:translate-x-0 lg:static ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full flex flex-col justify-between p-6">
          
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                  <roleMeta.icon className="text-xl" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold tracking-tight">CarePath OS</h2>
                  <span className={`text-[9px] font-mono border px-1.5 py-0.5 rounded-full ${roleMeta.color}`}>
                    {role.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 lg:hidden focus:outline-none"
              >
                <FaXmark className="text-lg" />
              </button>
            </div>

            <nav className="space-y-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 px-3">
                Workspace Menu
              </span>
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = !!item.active;
                return (
                  <button
                    key={index}
                    onClick={() => item.onClick ? item.onClick() : null}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                      isActive 
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-md shadow-slate-900/10' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-950 dark:hover:text-slate-100'
                    }`}
                  >
                    <Icon className="text-sm" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800/80 pt-6 space-y-4">
            <div className="flex items-center space-x-3 px-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-teal-400 flex items-center justify-center text-white font-bold text-sm shadow">
                {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold truncate">{user.fullName}</h4>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl border border-rose-500/20 text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 text-xs font-bold transition-all duration-200 cursor-pointer"
            >
              <FaArrowRightFromBracket className="text-sm" />
              <span>Sign Out Portal</span>
            </button>
          </div>

        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        
        <header className="sticky top-0 z-30 h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md flex items-center justify-between px-6 transition-all">
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden focus:outline-none cursor-pointer"
            >
              <FaBars />
            </button>

            <div className="hidden md:flex items-center space-x-2.5 px-3 py-1.5 w-64 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800/50">
              <FaMagnifyingGlass className="text-slate-400 text-xs" />
              <input 
                type="text" 
                placeholder="Search patient records, reports..." 
                className="bg-transparent text-[11px] placeholder-slate-400 focus:outline-none w-full"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              HIPAA SECURED
            </span>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {darkMode ? <FaSun className="text-xs" /> : <FaMoon className="text-xs" />}
            </button>

            <button className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 relative cursor-pointer">
              <FaBell className="text-xs" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
            </button>
          </div>

        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>

      </div>

    </div>
  );
}
