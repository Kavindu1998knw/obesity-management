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
  FaCircleInfo,
  FaFileSignature,
  FaCalendar,
  FaVenusMars
} from 'react-icons/fa6';
import AuthLayout from '../layouts/AuthLayout';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [role, setRole] = useState('patient');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    setValidationError('');
    setSubmitSuccess(false);
  }, [role, password, confirmPassword, email, fullName, dob, gender]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!fullName || !email || !password || !confirmPassword || !dob || !gender) {
      setValidationError('Please fill in all fields.');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);
    setValidationError('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        fullName,
        email,
        password,
        role,
        dob,
        gender
      });

      if (response.data.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to connect to the authentication server.';
      setValidationError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <AuthLayout>
      <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 to-teal-400 rounded-3xl blur-2xl opacity-35 dark:opacity-20 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 backdrop-blur-xl bg-white/20 dark:bg-slate-900/45 border border-white/30 dark:border-slate-800/40 shadow-2xl rounded-3xl p-8 transition-all duration-300">
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Create Your Account
          </h2>
          <p className="text-sm text-slate-800/70 dark:text-slate-300/80 mt-1">
            Start your personalized healthcare journey.
          </p>
        </div>



        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label htmlFor="fullName" className="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 mb-1.5">
              Full Name
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 dark:text-slate-400 group-focus-within:text-cyan-500 dark:group-focus-within:text-cyan-400 transition-colors">
                <FaFileSignature className="text-sm" />
              </span>
              <input
                type="text"
                id="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/40 dark:bg-slate-950/40 border border-white/40 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/80 dark:focus:border-cyan-400/80 text-slate-900 dark:text-white placeholder-slate-700/60 dark:placeholder-slate-400/50 text-sm transition-all duration-300 shadow-inner"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 mb-1.5">
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
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/40 dark:bg-slate-950/40 border border-white/40 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/80 dark:focus:border-cyan-400/80 text-slate-900 dark:text-white placeholder-slate-700/60 dark:placeholder-slate-400/50 text-sm transition-all duration-300 shadow-inner"
              />
            </div>
          </div>

          <div>
            <label htmlFor="dob" className="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 mb-1.5">
              Date of Birth
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 dark:text-slate-400 group-focus-within:text-cyan-500 dark:group-focus-within:text-cyan-400 transition-colors">
                <FaCalendar className="text-sm" />
              </span>
              <input
                type="date"
                id="dob"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/40 dark:bg-slate-950/40 border border-white/40 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/80 dark:focus:border-cyan-400/80 text-slate-750 dark:text-slate-300 text-sm transition-all duration-300 shadow-inner"
              />
            </div>
          </div>

          <div>
            <label htmlFor="gender" className="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 mb-1.5">
              Gender
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 dark:text-slate-400 group-focus-within:text-cyan-500 dark:group-focus-within:text-cyan-400 transition-colors">
                <FaVenusMars className="text-sm" />
              </span>
              <select
                id="gender"
                required
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/40 dark:bg-slate-950/40 border border-white/40 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/80 dark:focus:border-cyan-400/80 text-slate-750 dark:text-slate-350 text-sm transition-all duration-300 shadow-inner min-h-[42px]"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 mb-1.5">
              Password
            </label>
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
                placeholder="Min. 8 characters"
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/40 dark:bg-slate-950/40 border border-white/40 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/80 dark:focus:border-cyan-400/80 text-slate-900 dark:text-white placeholder-slate-700/60 dark:placeholder-slate-400/50 text-sm transition-all duration-300 shadow-inner"
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

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 mb-1.5">
              Confirm Password
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 dark:text-slate-400 group-focus-within:text-cyan-500 dark:group-focus-within:text-cyan-400 transition-colors">
                <FaLock className="text-sm" />
              </span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/40 dark:bg-slate-950/40 border border-white/40 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/80 dark:focus:border-cyan-400/80 text-slate-900 dark:text-white placeholder-slate-700/60 dark:placeholder-slate-400/50 text-sm transition-all duration-300 shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors focus:outline-none"
              >
                {showConfirmPassword ? <FaEyeSlash className="text-base" /> : <FaEye className="text-base" />}
              </button>
            </div>
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
                  <span className="font-bold">Account created successfully!</span> Redirecting to login portal...
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isSubmitting || submitSuccess}
            className="w-full relative py-3 px-4 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-white font-bold text-sm tracking-wide transition-all duration-300 shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-[0.99] disabled:opacity-75 disabled:pointer-events-none"
          >
            <span className="flex items-center justify-center space-x-2">
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <FaArrowRight className="text-xs" />
                </>
              )}
            </span>
          </button>

        </form>

        <div className="mt-6 text-center border-t border-slate-900/10 dark:border-white/10 pt-4.5">
          <span className="text-xs text-slate-800/70 dark:text-slate-400">
            Already have an account? 
          </span>{' '}
          <Link 
            to="/login" 
            className="text-xs font-bold text-cyan-650 dark:text-cyan-400 hover:underline inline-flex items-center group transition-colors"
          >
            Sign In
            <FaArrowRight className="text-[10px] ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

      </div>
    </AuthLayout>
  );
}
