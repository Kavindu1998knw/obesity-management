import React, { useState, useEffect } from 'react';
import { FaXmark, FaSpinner } from 'react-icons/fa6';
import apiClient from '../../services/apiClient';

export default function PatientModal({ isOpen, onClose, onSubmit, patient, loading }) {
  const [doctors, setDoctors] = useState([]);
  const [fetchingDocs, setFetchingDocs] = useState(false);

  const [formData, setFormData] = useState({
    assignedDoctor: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchActiveDoctors();
    }
  }, [isOpen]);

  useEffect(() => {
    if (patient) {
      setFormData({
        assignedDoctor: patient.assignedDoctor?._id || ''
      });
    }
  }, [patient, isOpen]);

  const fetchActiveDoctors = async () => {
    try {
      setFetchingDocs(true);
      const res = await apiClient.get('/admin/doctors');
      const activeDocs = res.data.data.filter(d => d.status === 'active');
      setDoctors(activeDocs);
    } catch (err) {
      console.error('Failed to load doctors');
    } finally {
      setFetchingDocs(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.assignedDoctor) {
      alert("Please select a doctor.");
      return;
    }
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60" onClick={!loading ? onClose : undefined}></div>
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Assign Doctor</h3>
          <button onClick={onClose} disabled={loading} className="text-slate-400 hover:text-slate-600 focus:outline-none">
            <FaXmark className="text-xl" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="assign-doctor-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name</label>
              <input type="text" value={patient?.fullName || ''} disabled className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none bg-slate-100 text-slate-600 cursor-not-allowed" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Doctor *</label>
              <select name="assignedDoctor" value={formData.assignedDoctor} onChange={handleChange} disabled={loading || fetchingDocs} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white">
                <option value="">-- Select a Doctor --</option>
                {patient?.assignedDoctor && !doctors.some(d => d._id === patient.assignedDoctor._id) && (
                  <option value={patient.assignedDoctor._id} disabled>
                    Dr. {patient.assignedDoctor.fullName} (Inactive - Please Reassign)
                  </option>
                )}
                {doctors.map(doc => (
                  <option key={doc._id} value={doc._id}>Dr. {doc.fullName} ({doc.profile?.specialisation || 'General'})</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assignment Date</label>
              <input type="text" value="Assigned automatically by the server" disabled className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none bg-slate-100 text-slate-600 text-sm cursor-not-allowed italic" />
            </div>

          </form>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
          <button type="submit" form="assign-doctor-form" disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            {loading && <FaSpinner className="animate-spin" />}
            Confirm Assignment
          </button>
        </div>
      </div>
    </div>
  );
}
