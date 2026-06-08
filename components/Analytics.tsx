import React from 'react';
import { Transaction, BudgetGoal, Currency } from '../types';
import { Language } from '../translations';
import Charts from './Charts';
import { TrendingUp, PieChart, BarChart3, LineChart } from 'lucide-react';

interface AnalyticsProps {
  transactions: Transaction[];
  goals: BudgetGoal[];
  currency: Currency;
  lang: Language;
  t: any;
}

const Analytics: React.FC<AnalyticsProps> = ({ transactions, goals, currency, lang, t }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
               <PieChart size={20} />
             </div>
             <h3 className="text-xl font-bold text-slate-800">{t.mood_analysis}</h3>
          </div>
          <Charts 
            transactions={transactions} 
            goals={goals} 
            currency={currency} 
            lang={lang} 
            t={t} 
            view="analytics-mood"
          />
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
               <LineChart size={20} />
             </div>
             <h3 className="text-xl font-bold text-slate-800">{t.six_month_trend}</h3>
          </div>
          <Charts 
            transactions={transactions} 
            goals={goals} 
            currency={currency} 
            lang={lang} 
            t={t} 
            view="analytics-trend"
          />
        </div>

        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
               <BarChart3 size={20} />
             </div>
             <h3 className="text-xl font-bold text-slate-800">{t.category_comparison}</h3>
          </div>
          <Charts 
            transactions={transactions} 
            goals={goals} 
            currency={currency} 
            lang={lang} 
            t={t} 
            view="analytics-categories"
          />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
