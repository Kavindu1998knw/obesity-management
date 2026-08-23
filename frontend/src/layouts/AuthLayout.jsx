import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity,
  Brain, 
  Utensils, 
  Users, 
  Sun, 
  Moon, 
  CheckCircle2
} from 'lucide-react';

export default function AuthLayout({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

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

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-between p-3 sm:p-6 lg:p-8 selection:bg-teal-500 selection:text-white relative overflow-x-hidden">
      
      {/* Dynamic Ambient Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -40, 30, 0],
            scale: [1, 1.15, 0.95, 1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[15%] -left-[10%] w-[350px] sm:w-[550px] h-[350px] sm:h-[550px] rounded-full bg-teal-600/20 blur-[100px] sm:blur-[130px]"
        />
        <motion.div 
          animate={{
            x: [0, -50, 30, 0],
            y: [0, 40, -40, 0],
            scale: [1, 0.9, 1.1, 1]
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[15%] -right-[10%] w-[350px] sm:w-[550px] h-[350px] sm:h-[550px] rounded-full bg-emerald-600/20 blur-[100px] sm:blur-[130px]"
        />
        <motion.div 
          animate={{ 
            x: [0, 30, -30, 0], 
            y: [0, 20, -20, 0] 
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[35%] left-[25%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] rounded-full bg-indigo-600/15 blur-[90px] sm:blur-[110px]"
        />
      </div>

      {/* Subtle Grid Overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_70%,transparent_100%)] z-0 pointer-events-none" />

      {/* Top Floating Controls */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center space-x-2 z-50">
        <button
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-amber-400 transition-all duration-200 shadow-md cursor-pointer"
          title="Toggle Dark Mode"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
        </button>
      </div>

      {/* Main Split Layout Container */}
      <div className="container relative z-10 mx-auto w-full max-w-6xl flex flex-col items-center justify-center my-auto py-4 sm:py-6">
        
        {/* Mobile Header (Shown only on small screens < lg) */}
        <div className="lg:hidden flex items-center justify-center space-x-2.5 mb-4 text-center">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 shadow-md shadow-teal-500/25 border border-teal-400/30">
            <Activity className="w-4 h-4 text-white" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
          </div>
          <div className="text-left">
            <div className="flex items-center space-x-1.5">
              <span className="text-base font-black tracking-tight text-white">SmartObesity</span>
              <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                AI CLINICAL
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Healthcare Intelligence</p>
          </div>
        </div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          
          {/* Left Branding Hero Banner (Desktop only) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center text-white space-y-4 lg:pr-4">
            
            {/* System Logo & Badge */}
            <div className="flex items-center space-x-3">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/25 border border-teal-400/30">
                <Activity className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-black tracking-tight text-white">SmartObesity</span>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    AI CLINICAL
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Next-Generation Healthcare Intelligence</p>
              </div>
            </div>

            {/* Main Headline & Tagline */}
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight text-white">
                Precision Obesity Care & <br />
                <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                  Dietary Intelligence
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed max-w-lg">
                AI-Driven Clinical Decision Support & Personalised Obesity Care.
              </p>
            </div>

            {/* 3 Key Feature Highlight Pills */}
            <div className="space-y-2.5 pt-0.5">
              <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800 shadow-md hover:border-teal-500/40 transition-colors">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-xs font-bold text-white">ML Risk Stratification</h4>
                    <span className="text-[9px] px-1.5 py-0.2 bg-teal-400/20 text-teal-300 rounded font-mono font-medium">
                      Random Forest (n=300, depth=20)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">17 clinical & lifestyle features for multi-class obesity prediction.</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800 shadow-md hover:border-emerald-500/40 transition-colors">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Personalised Sri Lankan Dietary Prescriptions</h4>
                  <p className="text-[11px] text-slate-400">Culturally adapted nutrition engine balancing micronutrients and GI.</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800 shadow-md hover:border-cyan-500/40 transition-colors">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Seamless Doctor-Patient Collaboration</h4>
                  <p className="text-[11px] text-slate-400">Live consultation records, dietary tracking, and shared telemetry.</p>
                </div>
              </div>
            </div>

            {/* AI Clinical Pipeline Metrics Box */}
            <div className="relative w-full rounded-xl bg-slate-900/50 border border-slate-800 backdrop-blur-md p-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 mb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] font-mono text-teal-300 tracking-wider font-semibold">
                    RANDOM FOREST MODEL EVALUATION
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Verified Outputs
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                  <div className="text-sm font-black text-teal-300">94.3%</div>
                  <div className="text-[9px] text-slate-400 font-medium">Model Accuracy</div>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                  <div className="text-sm font-black text-emerald-300">94.2%</div>
                  <div className="text-[9px] text-slate-400 font-medium">Macro F1-Score</div>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                  <div className="text-sm font-black text-cyan-300">17 Features</div>
                  <div className="text-[9px] text-slate-400 font-medium">Clinical & Lifestyle Inputs</div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Authentication Container (Full width on mobile, 6 cols on desktop) */}
          <div className="w-full lg:col-span-6 flex justify-center items-center relative">
            {children}
          </div>

        </div>
      </div>

      <footer className="relative z-10 w-full text-center py-3 text-[11px] sm:text-xs text-slate-400 font-mono tracking-wide">
        <p>© 2026 SmartObesity AI • Developed by <span className="text-teal-400 font-bold hover:underline cursor-default">Kavindu Weerasinghe</span></p>
      </footer>

    </div>
  );
}
