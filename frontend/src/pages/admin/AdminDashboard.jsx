import React from 'react';
import { 
  FaUserDoctor, 
  FaUser, 
  FaCalendarCheck, 
  FaFileWaveform,
  FaArrowTrendUp,
  FaShieldHalved
} from 'react-icons/fa6';
import DashboardLayout from '../../layouts/DashboardLayout';

export default function AdminDashboard() {
  const menuItems = [
    { label: 'Dashboard', icon: FaShieldHalved, active: true },
    { label: 'Doctors', icon: FaUserDoctor },
    { label: 'Patients', icon: FaUser },
    { label: 'Appointments', icon: FaCalendarCheck }
  ];

  const cards = [
    { title: 'Total Doctors', count: '24', change: '+2 new this week', icon: FaUserDoctor, color: 'from-blue-500 to-indigo-500' },
    { title: 'Total Patients', count: '1,428', change: '+12% vs last month', icon: FaUser, color: 'from-sky-500 to-cyan-500' },
    { title: 'Appointments', count: '382', change: '84 scheduled today', icon: FaCalendarCheck, color: 'from-teal-500 to-emerald-500' },
    { title: 'Active Reports', count: '94', change: '24 pending approval', icon: FaFileWaveform, color: 'from-purple-500 to-pink-500' }
  ];

  return (
    <DashboardLayout role="admin" menuItems={menuItems}>
      <div className="space-y-6">
        
        {/* Header Title */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Welcome Admin 👋
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Obesity System Portal Overview • Today is {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Dashboard Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div 
                key={i} 
                className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm hover:shadow-md transition-all duration-300"
              >
                {/* Accent line top */}
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

                <div className="flex items-center space-x-1.5 mt-4 text-[10px] text-slate-500 dark:text-slate-400">
                  <FaArrowTrendUp className="text-emerald-500" />
                  <span>{card.change}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Mock Logs / Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Main User Activity Table */}
          <div className="xl:col-span-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-sm tracking-wide">Registered Doctors Status</h3>
              <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 cursor-pointer hover:underline">View All</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                    <th className="pb-3 font-semibold">Doctor Name</th>
                    <th className="pb-3 font-semibold">Specialty</th>
                    <th className="pb-3 font-semibold">Active Patients</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    { name: 'Dr. Sarah Connor', spec: 'Endocrinology', patients: 84, status: 'Online', color: 'bg-emerald-500' },
                    { name: 'Dr. John Watson', spec: 'General Nutrition', patients: 62, status: 'In Consultation', color: 'bg-amber-500' },
                    { name: 'Dr. Elizabeth Shaw', spec: 'Metabolic Science', patients: 45, status: 'Offline', color: 'bg-slate-400' }
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3.5 font-bold flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold text-[10px]">
                          {row.name.split(' ')[1][0]}
                        </div>
                        <span>{row.name}</span>
                      </td>
                      <td className="py-3.5 text-slate-500 dark:text-slate-400">{row.spec}</td>
                      <td className="py-3.5 font-mono">{row.patients}</td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center space-x-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${row.color}`} />
                          <span>{row.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick System Settings / Status */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm">
            <h3 className="font-bold text-sm tracking-wide mb-6">System Health Log</h3>
            <div className="space-y-4">
              {[
                { log: 'Database backup successfully uploaded', time: '10 mins ago', type: 'success' },
                { log: 'AI Model obesity-prediction-v3 redeployed', time: '1 hour ago', type: 'info' },
                { log: 'Server resource peak: CPU usage at 78%', time: '2 hours ago', type: 'warning' }
              ].map((log, i) => (
                <div key={i} className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/30">
                  <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                    log.type === 'success' ? 'bg-emerald-500' : log.type === 'warning' ? 'bg-rose-500' : 'bg-sky-500'
                  }`} />
                  <div>
                    <p className="text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-300">{log.log}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{log.time}</span>
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
