import React from 'react';
import { 
  FaUser, 
  FaWeightScale, 
  FaUtensils, 
  FaCalendarCheck, 
  FaHeartPulse,
  FaArrowTrendDown,
  FaAppleWhole,
  FaCalculator
} from 'react-icons/fa6';
import DashboardLayout from '../../layouts/DashboardLayout';

export default function PatientDashboard() {
  const menuItems = [
    { label: 'Dashboard', icon: FaHeartPulse, active: true },
    { label: 'Prediction', icon: FaWeightScale },
    { label: 'Meal Plan', icon: FaUtensils },
    { label: 'Progress', icon: FaCalculator }
  ];

  const cards = [
    { title: 'My Risk Profile', count: 'Normal', change: '18.4% Obesity Risk', icon: FaWeightScale, color: 'from-emerald-500 to-teal-500' },
    { title: 'Active Meal Plan', count: 'Keto-Med', change: '2,100 kcal target', icon: FaUtensils, color: 'from-sky-500 to-cyan-500' },
    { title: 'My Progress', count: '-4.3 kg', change: 'Lost over last 3 months', icon: FaHeartPulse, color: 'from-blue-500 to-indigo-500' },
    { title: 'Appointments', count: '1 Pending', change: 'Tomorrow at 14:30', icon: FaCalendarCheck, color: 'from-purple-500 to-pink-500' }
  ];

  return (
    <DashboardLayout role="patient" menuItems={menuItems}>
      <div className="space-y-6">
        
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Welcome Patient 👋
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Obesity & Diet Workspace • Track your progress and follow meal recommendations
          </p>
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
            <h3 className="font-bold text-sm tracking-wide mb-6">Today's Nutrition Breakdown</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { title: 'Breakfast', name: 'Oatmeal with Blueberries & Almonds', kcal: '380 kcal', macro: 'Carbs: 45g | Prot: 12g' },
                { title: 'Lunch', name: 'Grilled Chicken Breast with Quinoa Salad', kcal: '650 kcal', macro: 'Carbs: 35g | Prot: 48g' },
                { title: 'Dinner', name: 'Baked Salmon with Steamed Asparagus', kcal: '520 kcal', macro: 'Carbs: 8g | Prot: 42g' }
              ].map((meal, i) => (
                <div key={i} className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">{meal.title}</span>
                  <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 mt-2 truncate">{meal.name}</h4>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">{meal.kcal}</span>
                    <span className="text-[9px] text-slate-400">{meal.macro}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm tracking-wide mb-6">Assigned Medical Doctor</h3>
              <div className="flex items-center space-x-3 p-1">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold text-sm border border-teal-500/10">
                  SC
                </div>
                <div>
                  <h4 className="text-xs font-bold">Dr. Sarah Connor</h4>
                  <p className="text-[10px] text-slate-400">Consultant Endocrinologist</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>Next consultation:</span>
                <span className="font-bold text-slate-800 dark:text-white">Tomorrow</span>
              </div>
              <p className="text-[10px] text-slate-400">At 14:30 in Room 204 or via video call link</p>
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
