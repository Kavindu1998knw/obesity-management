import React, { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  Stethoscope,
  Users,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';

export const OBESITY_SPECIALISATIONS = [
  'Clinical Nutritionist & Dietitian',
  'Bariatric Physician / Surgeon',
  'Endocrinologist & Diabetologist',
  'Metabolic Health Specialist',
  'Lifestyle Medicine Physician',
  'Obesity Medicine Specialist',
  'General Practitioner (Obesity Care)',
  'Preventive & Cardiovascular Specialist',
  'Pediatric Obesity Specialist',
  'Sports Nutrition & Exercise Specialist'
];

export default function DoctorModal({ isOpen, onClose, onSubmit, doctor, loading, isViewOnly = false }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    specialisation: '',
    qualification: '',
    status: 'active'
  });
  
  const [isCustomSpec, setIsCustomSpec] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (doctor) {
      const spec = doctor.profile?.specialisation || '';
      const isPreset = OBESITY_SPECIALISATIONS.includes(spec);
      setIsCustomSpec(!isPreset && spec !== '');
      setFormData({
        fullName: doctor.fullName || '',
        email: doctor.email || '',
        password: '',
        confirmPassword: '',
        phoneNumber: doctor.profile?.phoneNumber || '',
        specialisation: spec,
        qualification: doctor.profile?.qualification || '',
        status: doctor.status || 'active'
      });
    } else {
      setIsCustomSpec(false);
      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        specialisation: '',
        qualification: '',
        status: 'active'
      });
    }
    setError('');
  }, [doctor, isOpen]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSpecialisationSelect = (val) => {
    if (val === 'CUSTOM_OTHER') {
      setIsCustomSpec(true);
      setFormData(prev => ({ ...prev, specialisation: '' }));
    } else {
      setIsCustomSpec(false);
      setFormData(prev => ({ ...prev, specialisation: val }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.specialisation.trim()) {
      setError('Name, Email, and Specialisation are required fields.');
      return;
    }

    if (!doctor && !formData.password) {
      setError('Password is required for new doctors.');
      return;
    }

    if (formData.phoneNumber) {
      const phoneRegex = /^(?:\+94|0)\d{9}$|^\+?[1-9]\d{7,14}$/;
      if (!phoneRegex.test(formData.phoneNumber.replace(/\s+/g, ''))) {
        setError('Invalid phone number format. Use 07X XXX XXXX or +94 7X XXX XXXX.');
        return;
      }
    }

    if (formData.password) {
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={!loading ? onClose : undefined}
      />
      
      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {isViewOnly ? 'Doctor Profile' : doctor ? 'Edit Doctor Account' : 'Register New Doctor'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isViewOnly ? 'Read-only clinical directory file' : 'Fill in practitioner credentials and clinical specialty'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Stat Summary for View-Only Mode */}
          {isViewOnly && doctor && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-teal-50/60 p-4 rounded-xl border border-teal-100/80 text-center">
                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-1.5">
                  <Users className="w-4 h-4" />
                </div>
                <p className="text-[11px] text-teal-700 font-semibold uppercase tracking-wider">Assigned Patients</p>
                <p className="text-2xl font-bold text-teal-950 mt-0.5">{doctor.assignedPatientsCount || 0}</p>
              </div>

              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100/80 text-center">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-1.5">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <p className="text-[11px] text-amber-700 font-semibold uppercase tracking-wider">Upcoming Appts</p>
                <p className="text-2xl font-bold text-amber-950 mt-0.5">{doctor.upcomingAppointments || 0}</p>
              </div>

              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100/80 text-center">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wider">Completed Visits</p>
                <p className="text-2xl font-bold text-emerald-950 mt-0.5">{doctor.completedAppointments || 0}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form id="doctor-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={loading || isViewOnly}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition disabled:bg-slate-50 disabled:text-slate-500"
                  required
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading || isViewOnly}
                  placeholder="doctor@smartobesity.ai"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition disabled:bg-slate-50 disabled:text-slate-500"
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  disabled={loading || isViewOnly}
                  placeholder="+94 7X XXX XXXX"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              {/* Qualification */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Qualification
                </label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  disabled={loading || isViewOnly}
                  placeholder="e.g. MBBS, MD, MSc (Nutrition)"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            </div>

            {/* Specialisation (Dual Mode: Quick-Select Badges + Dropdown / Custom Input) */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-slate-700">
                Clinical Specialisation <span className="text-rose-500">*</span>
              </label>
              
              {!isViewOnly && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">Quick-select popular specialties:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {OBESITY_SPECIALISATIONS.slice(0, 6).map((spec) => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => handleSpecialisationSelect(spec)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                          formData.specialisation === spec && !isCustomSpec
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 pt-1">
                <select
                  value={isCustomSpec ? 'CUSTOM_OTHER' : formData.specialisation}
                  onChange={(e) => handleSpecialisationSelect(e.target.value)}
                  disabled={loading || isViewOnly}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition disabled:bg-slate-50 cursor-pointer"
                  required={!isCustomSpec}
                >
                  <option value="">-- Or Select from Complete Specialty Directory --</option>
                  {OBESITY_SPECIALISATIONS.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                  <option value="CUSTOM_OTHER">✏️ Custom / Other Specialisation...</option>
                </select>

                {isCustomSpec && (
                  <div className="mt-1">
                    <input
                      type="text"
                      name="specialisation"
                      value={formData.specialisation}
                      onChange={handleChange}
                      disabled={loading || isViewOnly}
                      placeholder="Type custom medical specialisation..."
                      className="w-full px-3.5 py-2.5 bg-teal-50/40 border border-teal-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none transition"
                      required
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Account Status on Edit */}
            {doctor && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={loading || isViewOnly}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition disabled:bg-slate-50 cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}

            {/* Password Credentials */}
            {!isViewOnly && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {doctor ? 'New Password (Optional)' : 'Initial Password'} {!doctor && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Min. 8 characters"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Password {(!doctor || formData.password) && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Repeat password"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                  />
                </div>
              </div>
            )}

            {!isViewOnly && !doctor && (
              <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl text-xs text-teal-800 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  An automated welcome email with initial access details and password setup instructions will be sent to the doctor.
                </span>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isViewOnly ? 'Close' : 'Cancel'}
          </button>
          {!isViewOnly && (
            <button
              type="submit"
              form="doctor-form"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{doctor ? 'Save Changes' : 'Register Doctor'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
