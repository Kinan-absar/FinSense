import React, { useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Wallet, CreditCard, 
  ArrowUpRight, ArrowDownRight, Bell, AlertTriangle
} from 'lucide-react';
import { Transaction, Account, BudgetGoal, Currency } from '../types';
import { Language } from '../translations';
import Charts from './Charts';

interface DashboardProps {
  transactions: Transaction[];
  accounts: Account[];
  goals: BudgetGoal[];
  currency: Currency;
  lang: Language;
  t: any;
  formatMoney: (amount: number) => string;
  setActiveView: (view: ViewType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, 
  accounts, 
  goals, 
  currency, 
  lang, 
  t, 
  formatMoney,
  setActiveView
}) => {
  const isRtl = lang === 'ar';

  const totalAssets = useMemo(() => 
    accounts
      .filter(acc => acc.type !== 'Credit Card')
      .reduce((acc, curr) => acc + curr.balance, 0), 
    [accounts]
  );
  
  const totalDebt = useMemo(() => 
    accounts
      .filter(acc => acc.type === 'Credit Card')
      .reduce((acc, curr) => {
        const limit = curr.creditLimit || 0;
        return acc + Math.max(0, limit - curr.balance);
      }, 0), 
    [accounts]
  );

  const monthStats = useMemo(() => {
    const now = new Date();
    const currentMonth = transactions.filter(tr => {
      const d = new Date(tr.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const income = currentMonth
      .filter(tr => tr.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const expense = currentMonth
      .filter(tr => tr.type === 'expense' && !tr.isSettlement)
      .reduce((acc, curr) => acc + curr.amount, 0);

    return { income, expense, net: income - expense };
  }, [transactions]);

  const budgetWarnings = useMemo(() => {
    const now = new Date();
    const currentMonth = transactions.filter(tr => {
      const d = new Date(tr.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && tr.type === 'expense';
    });

    return goals.map(goal => {
      const spent = currentMonth
        .filter(tr => tr.category === goal.category)
        .reduce((acc, curr) => acc + curr.amount, 0);
      const percent = (spent / goal.limit) * 100;
      return { ...goal, spent, percent };
    }).filter(g => g.percent >= 80);
  }, [transactions, goals]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Alert Notifications */}
      {budgetWarnings.length > 0 && (
        <div className="space-y-3">
          {budgetWarnings.map(warning => (
            <button 
              key={warning.id} 
              onClick={() => setActiveView('budgets')}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.99] hover:shadow-md ${warning.percent >= 100 ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}
            >
              <div className={`p-2 rounded-xl ${warning.percent >= 100 ? 'bg-rose-100' : 'bg-amber-100'}`}>
                {warning.percent >= 100 ? <AlertTriangle size={20} /> : <Bell size={20} />}
              </div>
              <div className="flex-1 text-start">
                <p className="text-sm font-bold">
                  {warning.percent >= 100 ? t.budget_warning_100 : t.budget_warning_80}
                </p>
                <p className="text-xs opacity-80">
                  {t.categories[warning.category]}: {formatMoney(warning.spent)} / {formatMoney(warning.limit)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button 
          onClick={() => setActiveView('accounts')}
          className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-blue-200 transition-all active:scale-95 text-start group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Wallet size={24} />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t.total_assets}</span>
          </div>
          <div className="text-2xl font-black text-slate-800 font-mono">{formatMoney(totalAssets)}</div>
        </button>

        <button 
          onClick={() => setActiveView('accounts')}
          className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-rose-200 transition-all active:scale-95 text-start group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <TrendingDown size={24} />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t.total_debt}</span>
          </div>
          <div className="text-2xl font-black text-slate-800 font-mono">{formatMoney(totalDebt)}</div>
        </button>

        <button 
          onClick={() => setActiveView('history')}
          className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-emerald-200 transition-all active:scale-95 text-start group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <TrendingUp size={24} />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t.total_income}</span>
          </div>
          <div className="text-2xl font-black text-slate-800 font-mono">{formatMoney(monthStats.income)}</div>
          <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">{t.current}</div>
        </button>

        <button 
          onClick={() => setActiveView('analytics')}
          className="bg-white p-6 rounded-[2.5rem] border border-slate-200 bg-slate-900 shadow-xl shadow-slate-200 hover:scale-[1.02] transition-all active:scale-95 text-start"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/10 text-white rounded-2xl">
              <CreditCard size={24} />
            </div>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t.net_balance}</span>
          </div>
          <div className={`text-2xl font-black font-mono ${monthStats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {monthStats.net >= 0 ? '+' : ''}{formatMoney(monthStats.net)}
          </div>
          <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tight">{t.current}</div>
        </button>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Charts 
            transactions={transactions} 
            goals={goals} 
            currency={currency} 
            lang={lang} 
            t={t} 
            view="dashboard"
          />
        </div>
        <button 
          onClick={() => setActiveView('budgets')}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-blue-100 transition-all text-start"
        >
          <h3 className="text-lg font-bold text-slate-800 mb-6">{t.budget_health}</h3>
          <div className="space-y-6">
            {goals.slice(0, 5).map(goal => {
              const spent = transactions
                .filter(tr => {
                  const d = new Date(tr.date);
                  const now = new Date();
                  return tr.category === goal.category && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && tr.type === 'expense';
                })
                .reduce((acc, curr) => acc + curr.amount, 0);
              
              const percent = Math.min(100, (spent / goal.limit) * 100);
              const isExceeded = spent > goal.limit;

              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-slate-500">{t.categories[goal.category]}</span>
                    <span className={isExceeded ? 'text-rose-600' : 'text-slate-800'}>{Math.round(percent)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${isExceeded ? 'bg-rose-500' : percent > 80 ? 'bg-amber-500' : 'bg-blue-600'}`} 
                      style={{ width: `${percent}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
