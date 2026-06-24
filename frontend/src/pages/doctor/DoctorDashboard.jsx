import React from 'react';
import { 
  FaUser, 
  FaWeightScale, 
  FaUtensils, 
  FaCalendarCheck, 
  FaUserDoctor,
  FaFileWaveform,
  FaPlus
} from 'react-icons/fa6';
import DashboardLayout from '../../layouts/DashboardLayout';

export default function DoctorDashboard() {
  const menuItems = [
    { label: 'Dashboard', icon: FaUserDoctor, active: true },
    { label: 'Patients', icon: FaUser },
    { label: 'Predictions', icon: FaWeightScale },
    { label: 'Meal Plans', icon: FaUtensils }
  ];

  const cards = [
    { title: 'My Patients', count: '148', change: '8 enrolled this week', icon: FaUser, color: 'from-teal-500 to-emerald-500' },
    { title: 'Predictions Run', count: '942', change: '24 scan requests pending', icon: FaWeightScale, color: 'from-cyan-500 to-blue-500' },
    { title: 'Meal Plans Active', count: '112', change: '10 updated yesterday', icon: FaUtensils, color: 'from-orange-500 to-amber-500' },
    { title: 'Appointments Today', count: '8', change: 'Next: 14:30 with John Doe', icon: FaCalendarCheck, color: 'from-indigo-500 to-purple-500' }
  ];

  return (
    <DashboardLayout role="doctor" menuItems={menuItems}>
      <div className="space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Welcome Doctor 🩺
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Clinical Workspace for Obesity & Metabolic Care • Secure Workspace
            </p>
          </div>
          <button className="self-start sm:self-auto inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs shadow-lg hover:opacity-90 transition-opacity cursor-pointer">
            <FaPlus className="text-[10px]" />
            <span>Create New Meal Plan</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div 
                key={i} 
                className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color}`} />
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                      {card.title}
                    </span>
                    <h3 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">
                      {card.count}
                    </h3>
                  </div>
                  <div className={`p-3 rounded-2xl bg-gradient-to-tr ${card.color} text-white shadow-lg`}>
                    <Icon className="text-lg" />
                  </div>
                </div>

                <div className="mt-4 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {card.change}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          <div className="xl:col-span-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-sm tracking-wide">Recent Patient Obesity Risks</h3>
              <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 cursor-pointer hover:underline">All Records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                    <th className="pb-3 font-semibold">Patient Name</th>
                    <th className="pb-3 font-semibold">Risk Level</th>
                    <th className="pb-3 font-semibold">Predicted BMI</th>
                    <th className="pb-3 font-semibold">Assigned Meal Plan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    { name: 'Bruce Wayne', risk: 'Obese (Type 1)', bmi: '31.2', plan: 'Keto-LowCarb', color: 'text-rose-500 bg-rose-500/10' },
                    { name: 'Diana Prince', risk: 'Normal', bmi: '22.4', plan: 'Mediterranean', color: 'text-emerald-500 bg-emerald-500/10' },
                    { name: 'Clark Kent', risk: 'Overweight', bmi: '27.8', plan: 'Calorie Restriction', color: 'text-amber-500 bg-amber-500/10' }
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3.5 font-bold flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-650 flex items-center justify-center font-bold text-[10px]">
                          {row.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span>{row.name}</span>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${row.color}`}>
                          {row.risk}
                        </span>
                      </td>
                      <td className="py-3.5 font-mono font-semibold">{row.bmi}</td>
                      <td className="py-3.5 text-slate-500 dark:text-slate-400 font-medium">{row.plan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm">
            <h3 className="font-bold text-sm tracking-wide mb-6">Upcoming Consultations</h3>
            <div className="space-y-4">
              {[
                { time: '14:30', name: 'Barry Allen', desc: 'Diet plan review' },
                { time: '15:15', name: 'Arthur Curry', desc: 'Weight trend assessment' },
                { time: '16:00', name: 'Hal Jordan', desc: 'Initial bloodwork assessment' }
              ].map((apt, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/30">
                  <div className="flex items-center space-x-3">
                    <div className="text-center bg-cyan-500/10 dark:bg-cyan-500/5 px-2.5 py-1.5 rounded-xl border border-cyan-500/15">
                      <span className="block text-[10px] font-black text-cyan-505 leading-none">{apt.time}</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold">{apt.name}</h4>
                      <p className="text-[10px] text-slate-400">{apt.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
