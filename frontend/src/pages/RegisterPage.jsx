import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../services/apiClient';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Check,
  Activity
} from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    setValidationError('');
    setSubmitSuccess(false);
  }, [password, confirmPassword, email, fullName, dob, gender, agreeTerms]);

  // Validation helpers
  const isPasswordLengthValid = password.length >= 8;
  const isPasswordMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!fullName || !email || !password || !confirmPassword || !dob || !gender) {
      setValidationError('Please complete all required fields.');
      return;
    }

    if (!isPasswordLengthValid) {
      setValidationError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match. Please verify.');
      return;
    }

    if (!agreeTerms) {
      setValidationError('Please agree to the Terms of Service & Privacy Policy to continue.');
      return;
    }

    setIsSubmitting(true);
    setValidationError('');
    
    try {
      const response = await apiClient.post('/auth/register', {
        fullName,
        email,
        password,
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
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Subtle Accent Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/25 to-emerald-500/25 rounded-[2.2rem] blur-lg opacity-60 pointer-events-none" />

        {/* Crisp Glassmorphism White Card */}
        <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-100 dark:border-slate-800 shadow-2xl rounded-3xl p-5 sm:p-6 lg:p-7 transition-all duration-300">
          
          {/* Card Header */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-md shadow-teal-600/25 mb-2 border border-teal-400/30">
              <Activity className="w-5 h-5 text-white animate-pulse" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Create Patient Account
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal max-w-sm mx-auto">
              Join our smart healthcare platform to track your health and receive personalised dietary plans.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            
            {/* 2-Column Responsive Grid: Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Full Name */}
              <div>
                <label 
                  htmlFor="fullName" 
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                >
                  Full Name <span className="text-teal-600">*</span>
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-teal-600 dark:group-focus-within:text-teal-400 transition-colors pointer-events-none">
                    <User className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    id="fullName"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Maya Perera"
                    className="w-full pl-8.5 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 dark:text-white placeholder-slate-400 text-xs transition-all duration-150 shadow-xs"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                >
                  Email Address <span className="text-teal-600">*</span>
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-teal-600 dark:group-focus-within:text-teal-400 transition-colors pointer-events-none">
                    <Mail className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="email"
                    id="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full pl-8.5 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 dark:text-white placeholder-slate-400 text-xs transition-all duration-150 shadow-xs"
                  />
                </div>
              </div>

            </div>

            {/* 2-Column Responsive Grid: Date of Birth & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Date of Birth */}
              <div>
                <label 
                  htmlFor="dob" 
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                >
                  Date of Birth <span className="text-teal-600">*</span>
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-teal-600 dark:group-focus-within:text-teal-400 transition-colors pointer-events-none">
                    <Calendar className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="date"
                    id="dob"
                    required
                    value={dob}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-8.5 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 dark:text-white text-xs transition-all duration-150 shadow-xs"
                  />
                </div>
              </div>

              {/* Gender Radio Pills */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Gender <span className="text-teal-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Male', label: 'Male' },
                    { id: 'Female', label: 'Female' }
                  ].map((option) => {
                    const isSelected = gender === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setGender(option.id)}
                        className={`flex items-center justify-center py-2 px-2.5 rounded-xl border text-xs font-bold transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-600 text-teal-700 dark:text-teal-300 shadow-xs ring-1 ring-teal-500'
                            : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 mr-1 text-teal-600 dark:text-teal-400" />}
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* 2-Column Responsive Grid: Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label 
                    htmlFor="password" 
                    className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                  >
                    Password <span className="text-teal-600">*</span>
                  </label>
                  {password && (
                    <span className={`text-[9px] font-semibold flex items-center gap-0.5 ${
                      isPasswordLengthValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {isPasswordLengthValid ? <Check className="w-2.5 h-2.5" /> : null}
                      {isPasswordLengthValid ? '8+ chars' : `${password.length}/8`}
                    </span>
                  )}
                </div>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-teal-600 dark:group-focus-within:text-teal-400 transition-colors pointer-events-none">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full pl-8.5 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 dark:text-white placeholder-slate-400 text-xs transition-all duration-150 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label 
                    htmlFor="confirmPassword" 
                    className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                  >
                    Confirm <span className="text-teal-600">*</span>
                  </label>
                  {confirmPassword && (
                    <span className={`text-[9px] font-semibold flex items-center gap-0.5 ${
                      isPasswordMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {isPasswordMatch ? <Check className="w-2.5 h-2.5" /> : null}
                      {isPasswordMatch ? 'Matches' : 'Mismatch'}
                    </span>
                  )}
                </div>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-teal-600 dark:group-focus-within:text-teal-400 transition-colors pointer-events-none">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-8.5 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 dark:text-white placeholder-slate-400 text-xs transition-all duration-150 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

            </div>

            {/* Mandatory Terms & Privacy Policy Checkbox */}
            <div className="pt-0.5">
              <label className="flex items-start space-x-2 cursor-pointer text-[11px] text-slate-600 dark:text-slate-400 select-none">
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-3.5 h-3.5 mt-0.5 rounded text-teal-600 border-slate-300 dark:border-slate-700 focus:ring-teal-500 cursor-pointer accent-teal-600 flex-shrink-0"
                />
                <span className="leading-tight">
                  I agree to the <span className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">Terms of Service</span> and <span className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">Clinical Privacy Policy</span>.
                </span>
              </label>
            </div>

            {/* Validation Error Alert */}
            <AnimatePresence>
              {validationError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -4 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -4 }}
                  className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-start space-x-2 text-rose-700 dark:text-rose-300 text-xs"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <span className="font-medium leading-tight">{validationError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Success Alert */}
            <AnimatePresence>
              {submitSuccess && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -4 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -4 }}
                  className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-start space-x-2 text-emerald-800 dark:text-emerald-300 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium leading-tight">
                    <strong>Account created successfully!</strong> Redirecting to login portal...
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || submitSuccess}
              className="w-full relative py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs sm:text-sm tracking-wide transition-all duration-150 shadow-md shadow-teal-600/25 hover:shadow-teal-600/35 active:scale-[0.99] disabled:opacity-75 disabled:pointer-events-none flex items-center justify-center space-x-2 cursor-pointer mt-1"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Complete Registration & Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Footer Navigation Link */}
          <div className="mt-3.5 text-center border-t border-slate-100 dark:border-slate-800 pt-2.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
            </span>
            <Link 
              to="/login" 
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 inline-flex items-center group transition-colors"
            >
              Sign In here
              <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

        </div>
      </motion.div>
    </AuthLayout>
  );
}
