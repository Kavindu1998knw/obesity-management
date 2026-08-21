import React, { useState, useEffect } from 'react';
import { FaXmark, FaSpinner } from 'react-icons/fa6';

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
        password: '', // Don't populate password on edit
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

  const handleSpecialisationSelect = (e) => {
    const val = e.target.value;
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
        className="fixed inset-0 bg-slate-900/60 transition-opacity"
        onClick={!loading ? onClose : undefined}
      ></div>
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">
            {isViewOnly ? 'View Doctor Account' : doctor ? 'Edit Doctor Account' : 'Add New Doctor'}
          </h3>
          <button 
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
          >
            <FaXmark className="text-xl" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          {isViewOnly && doctor && (
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Assigned Patients</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{doctor.assignedPatientsCount || 0}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
                <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide">Upcoming Appts</p>
                <p className="text-2xl font-bold text-amber-900 mt-1">{doctor.upcomingAppointments || 0}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Completed Appts</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">{doctor.completedAppointments || 0}</p>
              </div>
            </div>
          )}

          <form id="doctor-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            
            {/* Left Column: Doctor Personal Info & Specialisation */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={loading || isViewOnly}
                  placeholder="Dr. John Doe"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading || isViewOnly}
                  placeholder="doctor@hospital.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  disabled={loading || isViewOnly}
                  placeholder="+94 7X XXX XXXX"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Specialisation <span className="text-rose-500">*</span>
                </label>
                <select
                  value={isCustomSpec ? 'CUSTOM_OTHER' : formData.specialisation}
                  onChange={handleSpecialisationSelect}
                  disabled={loading || isViewOnly}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-slate-50 cursor-pointer"
                  required={!isCustomSpec}
                >
                  <option value="">-- Select Specialisation --</option>
                  {OBESITY_SPECIALISATIONS.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                  <option value="CUSTOM_OTHER">✏️ Other / Custom Specialisation...</option>
                </select>

                {isCustomSpec && (
                  <div className="mt-2">
                    <input
                      type="text"
                      name="specialisation"
                      value={formData.specialisation}
                      onChange={handleChange}
                      disabled={loading || isViewOnly}
                      placeholder="Type custom specialisation..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-blue-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                      required
                      autoFocus
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Type custom clinical field for this doctor.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Qualifications & Security Credentials */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Qualification
                </label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  disabled={loading || isViewOnly}
                  placeholder="e.g. MBBS, MD, MSc (Clinical Nutrition)"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-slate-50"
                />
              </div>

              {doctor && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Account Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={loading || isViewOnly}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-slate-50 cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}

              {!isViewOnly && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {doctor ? 'New Password (Optional)' : 'Initial Password'} {!doctor && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="At least 8 characters"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Confirm Password {(!doctor || formData.password) && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Repeat password"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-slate-50"
                    />
                  </div>
                </>
              )}
            </div>

            {!isViewOnly && !doctor && (
              <div className="md:col-span-2 p-3 bg-blue-50/80 border border-blue-100 rounded-lg text-xs text-blue-800 flex items-center gap-2.5">
                <span className="text-base leading-none shrink-0">📧</span>
                <span>
                  <strong>Automated Email Dispatch:</strong> An automated welcome email containing login credentials and a direct password setup link will be delivered to the doctor's email address upon creation.
                </span>
              </div>
            )}

          </form>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none transition-colors disabled:opacity-50"
          >
            {isViewOnly ? 'Close' : 'Cancel'}
          </button>
          {!isViewOnly && (
            <button
              type="submit"
              form="doctor-form"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              {loading && <FaSpinner className="animate-spin" />}
              {doctor ? 'Save Changes' : 'Create Account'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
