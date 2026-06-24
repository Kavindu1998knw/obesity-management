import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaCircleInfo,
  FaCircleCheck,
  FaHeartPulse,
} from 'react-icons/fa6';
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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      });

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setSuccess(true);

        setTimeout(() => {
          const route = ROLE_ROUTES[data.user.role] || '/login';
          navigate(route);
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 to-teal-400 rounded-3xl blur-2xl opacity-35 dark:opacity-20 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 backdrop-blur-xl bg-white/20 dark:bg-slate-900/45 border border-white/30 dark:border-slate-800/40 shadow-2xl rounded-3xl p-8 transition-all duration-300">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-500 shadow-lg shadow-sky-500/30 mb-4">
            <FaHeartPulse className="text-white text-2xl" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Welcome Back
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300/80 mt-1">
            Sign in to your healthcare workspace
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Email Address
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 group-focus-within:text-sky-500 transition-colors">
                <FaEnvelope className="text-sm" />
              </span>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@healthcare.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/40 dark:bg-slate-950/40 border border-white/40 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/80 text-slate-900 dark:text-white placeholder-slate-400/70 text-sm transition-all duration-300 shadow-inner"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Password
              </label>
              <a href="#forgot-password" className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline transition-all">
                Forgot password?
              </a>
            </div>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 group-focus-within:text-sky-500 transition-colors">
                <FaLock className="text-sm" />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/40 dark:bg-slate-950/40 border border-white/40 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/80 text-slate-900 dark:text-white placeholder-slate-400/70 text-sm transition-all duration-300 shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors focus:outline-none"
              >
                {showPassword ? <FaEyeSlash className="text-base" /> : <FaEye className="text-base" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-white/40 dark:border-slate-800 bg-white/30 dark:bg-slate-950/40 text-sky-500 focus:ring-sky-500/30 focus:ring-offset-0 focus:outline-none cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 block text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              Remember this device for 30 days
            </label>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-2xl flex items-center space-x-2 text-rose-700 dark:text-rose-300 text-xs"
              >
                <FaCircleInfo className="flex-shrink-0 text-sm" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center space-x-2.5 text-emerald-700 dark:text-emerald-300 text-xs"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] flex-shrink-0">
                  <FaCircleCheck />
                </span>
                <span><strong>Login successful!</strong> Redirecting to your dashboard...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || success}
            className="w-full relative py-3.5 px-4 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 hover:bg-slate-700 dark:hover:bg-white font-bold text-sm tracking-wide transition-all duration-300 shadow-xl shadow-slate-900/10 hover:shadow-slate-900/25 active:scale-[0.99] disabled:opacity-75 disabled:pointer-events-none"
          >
            <span className="flex items-center justify-center space-x-2">
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <FaArrowRight className="text-xs" />
                </>
              )}
            </span>
          </button>

        </form>

        {/* Footer */}
        <div className="mt-8 text-center border-t border-slate-900/10 dark:border-white/10 pt-6">
          <span className="text-xs text-slate-600/70 dark:text-slate-400">
            Don't have an account?{' '}
          </span>
          <Link
            to="/register"
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center group transition-colors"
          >
            Create Account
            <FaArrowRight className="text-[10px] ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

      </div>
    </AuthLayout>
  );
}
