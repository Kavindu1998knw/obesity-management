import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaHeartPulse, 
  FaUtensils, 
  FaChartLine, 
  FaFileWaveform,
  FaWeightScale,
  FaCheck,
  FaSun,
  FaMoon
} from 'react-icons/fa6';

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
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden transition-colors duration-500 bg-gradient-to-tr from-sky-400 via-cyan-400 to-teal-400 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -60, 40, 0],
            scale: [1, 1.15, 0.9, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-cyan-400/30 dark:bg-cyan-900/20 blur-[120px]"
        />
        <motion.div 
          animate={{
            x: [0, -50, 30, 0],
            y: [0, 50, -40, 0],
            scale: [1, 0.9, 1.1, 1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-teal-400/30 dark:bg-emerald-900/20 blur-[120px]"
        />
        <motion.div 
          animate={{ x: [0, 30, -30, 0], y: [0, 30, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-sky-400/20 dark:bg-sky-950/10 blur-[80px]"
        />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:30px_30px] dark:bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] z-0" />

      <div className="container relative z-10 mx-auto px-4 py-8 lg:py-12 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          <div className="lg:col-span-6 flex flex-col justify-center text-white space-y-6 lg:pr-6">
            
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-white/10 dark:bg-slate-800/60 backdrop-blur-md border border-white/20 dark:border-slate-700/50 shadow-lg shadow-black/5 animate-pulse">
                <FaHeartPulse className="text-2xl text-cyan-200 dark:text-cyan-400" />
              </div>
              <div>
                <span className="text-sm font-semibold tracking-wider text-cyan-100 uppercase dark:text-cyan-400/80">CarePath Diagnostics</span>
                <h3 className="text-xs text-white/70 font-mono tracking-widest uppercase">Obesity Management Portal</h3>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-100 bg-clip-text text-transparent">
                Obesity Risk Prediction & Dietary Management Portal
              </h1>
              
              <div className="flex flex-wrap gap-2 pt-1">
                {['Predict', 'Monitor', 'Improve'].map((word, i) => (
                  <span 
                    key={word} 
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/15 dark:bg-slate-800/40 backdrop-blur-sm border border-white/10 text-cyan-50 dark:text-cyan-300"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 dark:bg-cyan-400 mr-2" />
                    {word}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative w-full h-[260px] md:h-[300px] rounded-3xl bg-white/5 dark:bg-slate-900/30 border border-white/10 dark:border-slate-800/40 backdrop-blur-md overflow-hidden p-6 shadow-inner">
              
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-[scan_4s_linear_infinite]" style={{
                animationName: 'scan'
              }} />
              <style>{`
                @keyframes scan {
                  0% { top: 0%; opacity: 0; }
                  5% { opacity: 1; }
                  95% { opacity: 1; }
                  100% { top: 100%; opacity: 0; }
                }
              `}</style>

              <div className="h-full flex flex-col justify-between relative z-10">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-mono text-cyan-200 tracking-wider">REAL-TIME CLINICAL SCANNER ACTIVE</span>
                  </div>
                  <span className="text-xs font-mono text-white/50">PATIENT_ID: #88092-A</span>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-4 items-center relative py-4">
                  
                  <motion.div className="p-4 rounded-2xl bg-white/10 dark:bg-slate-800/40 border border-white/10 shadow-lg flex flex-col justify-center animate-float-slow">
                    <div className="flex justify-between items-center text-white/60 text-[10px] uppercase font-mono tracking-wider">
                      <span>Metabolic Risk</span>
                      <FaWeightScale className="text-xs text-cyan-300" />
                    </div>
                    <div className="text-2xl font-black mt-1 text-cyan-200">18.4%</div>
                    <div className="text-[10px] text-emerald-300 mt-1 flex items-center">
                      <FaCheck className="mr-1 text-[8px]" /> Normal Range
                    </div>
                    
                    <div className="w-full bg-white/20 dark:bg-slate-700/50 h-1 rounded-full mt-3 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "35%" }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                        className="bg-gradient-to-r from-cyan-400 to-teal-400 h-full rounded-full"
                      />
                    </div>
                  </motion.div>

                  <motion.div className="p-4 rounded-2xl bg-white/10 dark:bg-slate-800/40 border border-white/10 shadow-lg flex flex-col justify-center animate-float-medium">
                    <div className="flex justify-between items-center text-white/60 text-[10px] uppercase font-mono tracking-wider">
                      <span>Diet Plan</span>
                      <FaUtensils className="text-xs text-teal-300" />
                    </div>
                    <div className="text-sm font-bold mt-1 text-teal-100 truncate">Keto-Mediterranean</div>
                    <div className="text-[10px] text-teal-200 mt-1">2,100 kcal target</div>

                    <div className="flex space-x-1.5 mt-3">
                      <span className="text-[8px] bg-teal-500/30 px-1.5 py-0.5 rounded text-teal-200 border border-teal-500/20">Prot: 90g</span>
                      <span className="text-[8px] bg-sky-500/30 px-1.5 py-0.5 rounded text-sky-200 border border-sky-500/20">Carb: 50g</span>
                    </div>
                  </motion.div>

                  <motion.div className="col-span-2 p-3.5 rounded-2xl bg-white/10 dark:bg-slate-800/40 border border-white/10 shadow-lg flex items-center justify-between animate-float-fast">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-cyan-400/20 text-cyan-200">
                        <FaChartLine />
                      </div>
                      <div>
                        <div className="text-[10px] text-white/50 font-mono tracking-wider">BMI TREND OVER 6 MONTHS</div>
                        <div className="text-sm font-semibold text-white">28.4 → 24.1 <span className="text-xs text-emerald-300 font-normal">(-15.1%)</span></div>
                      </div>
                    </div>
                    <div className="flex items-end space-x-1 h-8">
                      {[15, 24, 20, 28, 22, 16, 12].map((height, i) => (
                        <div 
                          key={i} 
                          className="w-1.5 rounded-t-sm bg-cyan-300/40 hover:bg-cyan-200 transition-colors cursor-pointer" 
                          style={{ height: `${height * 1.2}px` }} 
                        />
                      ))}
                    </div>
                  </motion.div>

                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[10px] font-mono text-white/60">
                  <span className="flex items-center"><FaFileWaveform className="mr-1.5" /> Core Diagnostic Engine v2.4</span>
                  <span className="text-emerald-300">HIPAA & GDPR Secure Endpoint</span>
                </div>

              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "Obesity Risk Prediction", desc: "Generative predictive models suggest risks." },
                { title: "Personalized Meal Plans", desc: "Tailored nutritional guidelines." },
                { title: "Progress Monitoring", desc: "Interactive weight and diet trackers." },
                { title: "Appointment Management", desc: "Instantly coordinate care with dieticians." }
              ].map((feat, index) => (
                <div key={index} className="flex items-start space-x-3 p-1">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-200 text-xs">
                    <FaCheck className="text-[10px]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{feat.title}</h4>
                    <p className="text-xs text-white/70">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>

          <div className="lg:col-span-6 flex justify-center w-full relative">
            {children}
          </div>

        </div>
      </div>

      <div className="absolute top-6 right-6 flex items-center space-x-4 z-50">
        <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full text-[10px] font-mono tracking-wider bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white border border-white/20">
          HIPAA & GDPR COMPLIANT
        </span>

        <button
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          className="p-3 rounded-2xl bg-white/20 dark:bg-slate-900/50 backdrop-blur-md border border-white/30 dark:border-slate-800/40 text-slate-900 dark:text-amber-400 hover:bg-white/30 dark:hover:bg-slate-900/80 transition-all duration-300 shadow-lg cursor-pointer"
          title="Toggle Dark Mode"
        >
          {darkMode ? <FaSun className="text-base" /> : <FaMoon className="text-base text-slate-850" />}
        </button>
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-white/50 font-mono tracking-widest uppercase pointer-events-none z-10">
        © 2026 CarePath Portal • Obesity-Prediction & Diet Management
      </div>

    </div>
  );
}
