import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../services/apiClient';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Activity,
  ShieldCheck
} from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout';

const ROLE_ROUTES = {
  admin: '/admin/dashboard',
  doctor: '/doctor/dashboard',
  patient: '/patient/dashboard',
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('expired')) {
      setError('Your session has expired. Please log in again.');
    }
    if (params.get('inactive')) {
      setError(params.get('message') || 'Your account is deactivated. Please contact your administrator.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { data } = await apiClient.post('/auth/login', {
        email,
        password,
      });

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (rememberMe) {
          localStorage.setItem('remembered_email', email);
        } else {
          localStorage.removeItem('remembered_email');
        }
        
        setSuccess(true);

        setTimeout(() => {
          const route = ROLE_ROUTES[data.user.role] || '/login';
          navigate(route);
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Subtle Accent Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/25 to-emerald-500/25 rounded-[2.2rem] blur-lg opacity-60 pointer-events-none" />

        {/* Crisp Glassmorphism White Card */}
        <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-100 dark:border-slate-800 shadow-2xl rounded-3xl p-5 sm:p-6 lg:p-7 transition-all duration-300">
          
          {/* Card Header */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-md shadow-teal-600/25 mb-2.5 border border-teal-400/30">
              <Activity className="w-5 h-5 text-white animate-pulse" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Welcome Back
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
              Sign in to access your clinical dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* Email Address */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
              >
                Email Address
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-teal-600 dark:group-focus-within:text-teal-400 transition-colors pointer-events-none">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm transition-all duration-150 shadow-xs"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
              >
                Password
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-teal-600 dark:group-focus-within:text-teal-400 transition-colors pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm transition-all duration-150 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-teal-600 border-slate-300 dark:border-slate-700 focus:ring-teal-500 cursor-pointer accent-teal-600"
                />
                <span>Remember this device</span>
              </label>
              <Link
                to="/reset-password"
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Error Message Banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -4 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -4 }}
                  className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-start space-x-2 text-rose-700 dark:text-rose-300 text-xs"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <span className="font-medium leading-tight">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message Banner */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -4 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -4 }}
                  className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-start space-x-2 text-emerald-800 dark:text-emerald-300 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium leading-tight">
                    <strong>Authentication successful!</strong> Opening your dashboard...
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="w-full relative py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs sm:text-sm tracking-wide transition-all duration-150 shadow-md shadow-teal-600/25 hover:shadow-teal-600/35 active:scale-[0.99] disabled:opacity-75 disabled:pointer-events-none flex items-center justify-center space-x-2 cursor-pointer mt-1"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Role Safety Hint Box */}
          <div className="mt-4 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              <strong className="text-slate-700 dark:text-slate-300">Doctor or Admin?</strong> Use your authorized credentials.
            </p>
          </div>

          {/* Footer Navigation Link */}
          <div className="mt-4 text-center border-t border-slate-100 dark:border-slate-800 pt-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Are you a new patient?{' '}
            </span>
            <Link
              to="/register"
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 inline-flex items-center group transition-colors"
            >
              Register here
              <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

        </div>
      </motion.div>
    </AuthLayout>
  );
}
