import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  FaUser, 
  FaUserDoctor, 
  FaShieldHalved, 
  FaEnvelope, 
  FaLock, 
  FaEye, 
  FaEyeSlash, 
  FaArrowRight,
  FaCircleInfo
} from 'react-icons/fa6';
import AuthLayout from '../layouts/AuthLayout';

export default function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    setEmail('');
    setPassword('');
    setValidationError('');
    setSubmitSuccess(false);
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setValidationError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    setValidationError('');
    setSubmitSuccess(false);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setSubmitSuccess(true);

        setTimeout(() => {
          navigate(`/${response.data.user.role}/dashboard`);
        }, 1200);
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to authenticate. Check server connection.';
      setValidationError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles = [
    { id: 'patient', label: 'Patient', icon: FaUser, color: 'from-sky-500 to-cyan-500' },
    { id: 'doctor', label: 'Doctor', icon: FaUserDoctor, color: 'from-teal-500 to-emerald-500' },
    { id: 'admin', label: 'Admin', icon: FaShieldHalved, color: 'from-indigo-500 to-violet-500' }
  ];

  return (
    <AuthLayout>
      <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 to-teal-400 rounded-3xl blur-2xl opacity-35 dark:opacity-20 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 backdrop-blur-xl bg-white/20 dark:bg-slate-900/45 border border-white/30 dark:border-slate-800/40 shadow-2xl rounded-3xl p-8 transition-all duration-300">
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Welcome Back
          </h2>
          <p className="text-sm text-slate-800/70 dark:text-slate-300/80 mt-1">
            Log in to manage your health workspace.
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 mb-3">
            Select Portal Role
          </label>
          <div className="relative flex p-1.5 bg-slate-900/10 dark:bg-black/35 rounded-2xl border border-white/20 dark:border-slate-800/50">
            {roles.map((r) => {
              const Icon = r.icon;
              const isActive = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`relative flex-1 flex flex-col md:flex-row items-center justify-center space-x-0 md:space-x-2 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                    isActive 
                      ? 'text-white' 
                      : 'text-slate-800 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeRoleTab"
                      className={`absolute inset-0 rounded-xl bg-gradient-to-r ${r.color} shadow-md`}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="text-sm relative z-10 mb-1 md:mb-0" />
                  <span className="relative z-10">{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div>
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 mb-2">
              Email Address
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 dark:text-slate-400 group-focus-within:text-cyan-500 dark:group-focus-within:text-cyan-400 transition-colors">
                <FaEnvelope className="text-sm" />
              </span>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@healthcare.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/40 dark:bg-slate-950/40 border border-white/40 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/80 dark:focus:border-cyan-400/80 text-slate-900 dark:text-white placeholder-slate-700/60 dark:placeholder-slate-400/50 text-sm transition-all duration-300 shadow-inner"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300">
                Password
              </label>
              <a 
                href="#forgot-password" 
                className="text-xs font-semibold text-cyan-650 dark:text-cyan-400 hover:underline transition-all"
              >
                Forgot password?
              </a>
            </div>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 dark:text-slate-400 group-focus-within:text-cyan-500 dark:group-focus-within:text-cyan-400 transition-colors">
                <FaLock className="text-sm" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/40 dark:bg-slate-950/40 border border-white/40 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/80 dark:focus:border-cyan-400/80 text-slate-900 dark:text-white placeholder-slate-700/60 dark:placeholder-slate-400/50 text-sm transition-all duration-300 shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors focus:outline-none"
              >
                {showPassword ? <FaEyeSlash className="text-base" /> : <FaEye className="text-base" />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember-me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4.5 w-4.5 rounded border-white/40 dark:border-slate-800 bg-white/30 dark:bg-slate-950/40 text-cyan-505 focus:ring-cyan-500/30 focus:ring-offset-0 focus:outline-none cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 block text-xs font-medium text-slate-850 dark:text-slate-350 cursor-pointer select-none">
              Remember this device for 30 days
            </label>
          </div>

          <AnimatePresence>
            {validationError && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-rose-500/25 border border-rose-500/30 rounded-2xl flex items-center space-x-2 text-rose-950 dark:text-rose-300 text-xs"
              >
                <FaCircleInfo className="flex-shrink-0 text-sm" />
                <span>{validationError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {submitSuccess && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-emerald-500/25 border border-emerald-500/30 rounded-2xl flex items-center space-x-2.5 text-slate-900 dark:text-emerald-300 text-xs"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px]">✓</span>
                <div>
                  <span className="font-bold">Authentication successful!</span> Routing to {role} dashboard...
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isSubmitting || submitSuccess}
            className="w-full relative py-3.5 px-4 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-white font-bold text-sm tracking-wide transition-all duration-300 shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-[0.99] disabled:opacity-75 disabled:pointer-events-none"
          >
            <span className="flex items-center justify-center space-x-2">
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Authenticating Credentials...</span>
                </>
              ) : (
                <>
                  <span>Enter {role.charAt(0).toUpperCase() + role.slice(1)} Portal</span>
                  <FaArrowRight className="text-xs" />
                </>
              )}
            </span>
          </button>

        </form>

        <div className="mt-8 text-center border-t border-slate-900/10 dark:border-white/10 pt-6">
          <span className="text-xs text-slate-800/70 dark:text-slate-400">
            Don't have an account? 
          </span>{' '}
          <Link 
            to="/register" 
            className="text-xs font-bold text-cyan-650 dark:text-cyan-400 hover:underline inline-flex items-center group transition-colors"
          >
            Create Account
            <FaArrowRight className="text-[10px] ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

      </div>
    </AuthLayout>
  );
}
