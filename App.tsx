
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, BehavioralInsight, BudgetGoal, Currency, Account, Category, AccountType } from './types';
import { INITIAL_GOALS, CATEGORY_ICONS, CURRENCIES, CATEGORIES } from './constants';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Charts from './components/Charts';
import AIInsights from './components/AIInsights';
import { getBehavioralInsights } from './services/geminiService';
import { Language, translations } from './translations';
import { 
  Wallet, Plus, LayoutDashboard, History, Target, ArrowUpRight, ArrowDownRight, 
  CreditCard, Search, TrendingUp, X, Trash2, PiggyBank, Globe, Settings, Languages
} from 'lucide-react';

type ViewType = 'dashboard' | 'history' | 'budgets' | 'accounts';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('fin_lang');
    return (saved as Language) || 'en';
  });
  
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('fin_currency');
    return saved ? JSON.parse(saved) : CURRENCIES[0];
  });
  
  const [showForm, setShowForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);

  // Persistence logic
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('fin_transactions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [goals, setGoals] = useState<BudgetGoal[]>(() => {
    const saved = localStorage.getItem('fin_goals');
    return saved ? JSON.parse(saved) : INITIAL_GOALS;
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('fin_accounts');
    return saved ? JSON.parse(saved) : [
      { id: 'acc1', name: 'Main Wallet', type: 'Checking', balance: 5000 },
      { id: 'acc2', name: 'Emergency Fund', type: 'Savings', balance: 12000 }
    ];
  });

  const [insights, setInsights] = useState<BehavioralInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    localStorage.setItem('fin_transactions', JSON.stringify(transactions));
    localStorage.setItem('fin_goals', JSON.stringify(goals));
    localStorage.setItem('fin_accounts', JSON.stringify(accounts));
    localStorage.setItem('fin_currency', JSON.stringify(currency));
    localStorage.setItem('fin_lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [transactions, goals, accounts, currency, lang]);

  const refreshInsights = useCallback(async () => {
    if (transactions.length < 3) return;
    setLoadingInsights(true);
    try {
      const newInsights = await getBehavioralInsights(transactions, goals, lang);
      setInsights(newInsights);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInsights(false);
    }
  }, [transactions, goals, lang]);

  useEffect(() => {
    refreshInsights();
  }, [refreshInsights]);

  const t = translations[lang];

  const formatMoney = (amount: number) => {
    return `${currency.symbol} ${amount.toLocaleString(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totalSpent = useMemo(() => transactions.reduce((acc, curr) => acc + curr.amount, 0), [transactions]);
  const totalBalance = useMemo(() => accounts.reduce((acc, curr) => acc + curr.balance, 0), [accounts]);

  const addTransaction = (entry: Transaction) => {
    setTransactions(prev => [entry, ...prev]);
    setAccounts(prev => prev.map(acc => {
      if (acc.id === entry.accountId) {
        return { ...acc, balance: acc.balance - entry.amount };
      }
      return acc;
    }));
  };

  const deleteTransaction = (id: string) => {
    const target = transactions.find(x => x.id === id);
    if (target) {
      setAccounts(prev => prev.map(acc => {
        if (acc.id === target.accountId) {
          return { ...acc, balance: acc.balance + target.amount };
        }
        return acc;
      }));
    }
    setTransactions(prev => prev.filter(x => x.id !== id));
  };

  // View Renders
  const renderDashboard = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title={t.total_expenses} value={formatMoney(totalSpent)} trend={t.trend_monthly} trendType="down" icon={<Wallet className="w-5 h-5" />} lang={lang} />
        <StatCard title={t.total_assets} value={formatMoney(totalBalance)} trend={t.trend_liquid} trendType="up" icon={<TrendingUp className="w-5 h-5" />} lang={lang} />
        <StatCard title={t.budget_health} value={`${goals.length}`} trend={t.trend_goals} trendType="up" icon={<Target className="w-5 h-5" />} lang={lang} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        <div className="xl:col-span-2 space-y-8">
          <Charts transactions={transactions} />
          <div className="hidden xl:block">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
               <History className="w-5 h-5 text-blue-600" /> {t.recent_activity}
            </h3>
            <TransactionList transactions={transactions.slice(0, 5)} onDelete={deleteTransaction} lang={lang} />
          </div>
        </div>
        <div className="xl:col-span-1">
          <AIInsights insights={insights} loading={loadingInsights} onRefresh={refreshInsights} lang={lang} />
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-gray-800">{t.history}</h2>
        <div className="relative">
          <Search className={`absolute ${lang === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
          <input type="text" placeholder={lang === 'ar' ? 'بحث...' : 'Search...'} className={`${lang === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 bg-white border border-gray-100 rounded-xl text-sm outline-none w-full md:w-64 focus:ring-2 focus:ring-blue-500 transition-all`} />
        </div>
      </div>
      <TransactionList transactions={transactions} onDelete={deleteTransaction} lang={lang} />
    </div>
  );

  const renderBudgets = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{t.budgets}</h2>
          <p className="text-sm text-gray-500">{lang === 'ar' ? 'إدارة حدود الفئات الخاصة بك' : 'Manage your category limits'}</p>
        </div>
        <button onClick={() => setShowBudgetForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-all shadow-lg shadow-blue-100">
          <Plus className="w-4 h-4" /> {t.new_budget}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const spent = transactions.filter(t => t.category === goal.category).reduce((sum, tr) => sum + tr.amount, 0);
          const percent = Math.min((spent / goal.limit) * 100, 100);
          return (
            <div key={goal.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">{CATEGORY_ICONS[goal.category]}</div>
                  <h3 className="font-bold text-gray-800">{(t.categories as any)[goal.category]}</h3>
                </div>
                <button onClick={() => setGoals(g => g.filter(x => x.id !== goal.id))} className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500 font-medium">{t.used}: <span className="text-gray-900">{formatMoney(spent)}</span></span>
                <span className="text-gray-500 font-medium">{t.limit}: <span className="text-gray-900">{formatMoney(goal.limit)}</span></span>
              </div>
              <div className="w-full h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                <div 
                  className={`h-full transition-all duration-1000 ${percent > 90 ? 'bg-rose-500' : percent > 70 ? 'bg-orange-400' : 'bg-blue-600'}`} 
                  style={{ width: `${percent}%` }} 
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-3 uppercase tracking-widest font-bold">
                {percent >= 100 ? t.limit_exceeded : `${(100 - percent).toFixed(0)}% ${t.remaining}`}
              </p>
            </div>
          );
        })}
        {goals.length === 0 && (
          <div className="col-span-full py-12 text-center bg-gray-50 border border-dashed border-gray-200 rounded-3xl">
            <p className="text-gray-400 font-medium">{t.no_budgets}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAccounts = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{t.accounts}</h2>
          <p className="text-sm text-gray-500">{lang === 'ar' ? 'تتبع وإدارة سيولتك النقدية' : 'Track and manage your liquidity'}</p>
        </div>
        <button onClick={() => setShowAccountForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-all shadow-lg shadow-blue-100">
          <Plus className="w-4 h-4" /> {t.new_account}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => (
          <div key={acc.id} className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
            <div className={`absolute -top-6 ${lang === 'ar' ? '-left-6' : '-right-6'} opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700`}>
               <CreditCard className="w-40 h-40" />
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <p className="text-blue-100 text-[10px] uppercase font-bold tracking-[0.2em] mb-1">{(t.account_types as any)[acc.type]}</p>
                  <h3 className="font-bold text-xl tracking-tight">{acc.name}</h3>
                </div>
                <button onClick={() => setAccounts(a => a.filter(x => x.id !== acc.id))} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-3xl font-bold mb-2 font-mono tracking-tight">{formatMoney(acc.balance)}</p>
              <div className="mt-auto pt-6 flex justify-between items-end border-t border-white/10">
                <p className="text-[10px] text-blue-200 uppercase tracking-widest font-bold">{lang === 'ar' ? 'محفظة قياسية' : 'Standard Portfolio'}</p>
                <CreditCard className="w-5 h-5 text-blue-200" />
              </div>
            </div>
          </div>
        ))}
        {accounts.length === 0 && (
          <div className="col-span-full py-12 text-center bg-gray-50 border border-dashed border-gray-200 rounded-3xl">
            <p className="text-gray-400 font-medium">{t.no_accounts}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24 lg:pb-0 bg-[#f8fafc]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Desktop Sidebar */}
      <nav className={`fixed ${lang === 'ar' ? 'right-0' : 'left-0'} top-0 h-full w-64 bg-white border-${lang === 'ar' ? 'l' : 'r'} border-gray-100 p-6 hidden lg:flex flex-col z-30`}>
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
            <Wallet className="w-6 h-6" />
          </div>
          <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700 tracking-tight">FinSense AI</span>
        </div>
        <div className="space-y-2">
          <NavLink icon={<LayoutDashboard className="w-5 h-5" />} label={t.overview} active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
          <NavLink icon={<History className="w-5 h-5" />} label={t.history} active={activeView === 'history'} onClick={() => setActiveView('history')} />
          <NavLink icon={<Target className="w-5 h-5" />} label={t.budgets} active={activeView === 'budgets'} onClick={() => setActiveView('budgets')} />
          <NavLink icon={<CreditCard className="w-5 h-5" />} label={t.accounts} active={activeView === 'accounts'} onClick={() => setActiveView('accounts')} />
        </div>
        
        <div className="mt-auto space-y-4">
           {/* Language Selector */}
           <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
             <div className="flex items-center gap-2 mb-3 text-blue-600">
                <Languages className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{t.language}</span>
             </div>
             <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm">
                <button 
                  onClick={() => setLang('en')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === 'en' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  EN
                </button>
                <button 
                  onClick={() => setLang('ar')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === 'ar' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  AR
                </button>
             </div>
           </div>

           <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
             <div className="flex items-center gap-2 mb-3 text-gray-500">
                <Globe className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{t.currency}</span>
             </div>
             <select 
               value={JSON.stringify(currency)} 
               onChange={(e) => setCurrency(JSON.parse(e.target.value))}
               className="bg-white border border-gray-100 text-xs font-bold text-gray-700 outline-none w-full p-2.5 rounded-xl shadow-sm"
             >
               {CURRENCIES.map(c => <option key={c.code} value={JSON.stringify(c)}>{c.label} ({c.symbol})</option>)}
             </select>
           </div>
           
           <div className="p-4 bg-gradient-to-br from-gray-900 to-blue-900 rounded-2xl text-white shadow-xl">
             <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">Local PWA</p>
             <p className="text-xs font-medium mb-3 opacity-80">{t.pwa_offline}</p>
             <button className="w-full bg-white/10 hover:bg-white/20 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all">Settings</button>
           </div>
        </div>
      </nav>

      <main className={`${lang === 'ar' ? 'lg:mr-64' : 'lg:ml-64'} p-4 lg:p-10 max-w-7xl mx-auto min-h-screen`}>
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black text-gray-900 capitalize tracking-tight">{(t as any)[activeView]}</h1>
            <p className="text-sm font-medium text-gray-400 mt-1">
              {t.currency}: <span className="text-blue-600 font-bold">{currency.code} ({currency.symbol})</span>
            </p>
          </div>
          <div className="flex gap-3">
             {/* Language toggle for mobile only */}
             <button 
               onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
               className="lg:hidden flex items-center justify-center p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-blue-600 font-black text-xs min-w-[3.5rem] active:scale-95 transition-transform"
             >
               {lang === 'en' ? 'AR' : 'EN'}
             </button>
             <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-blue-100 active:scale-95 transition-all text-sm">
                <Plus className="w-5 h-5" /> <span className="hidden sm:inline">{t.entry}</span>
             </button>
          </div>
        </header>

        {activeView === 'dashboard' && renderDashboard()}
        {activeView === 'history' && renderHistory()}
        {activeView === 'budgets' && renderBudgets()}
        {activeView === 'accounts' && renderAccounts()}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 px-6 py-3 flex justify-around items-center lg:hidden z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] rounded-t-[2.5rem]">
        <MobileNavLink icon={<LayoutDashboard className="w-6 h-6" />} active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
        <MobileNavLink icon={<History className="w-6 h-6" />} active={activeView === 'history'} onClick={() => setActiveView('history')} />
        <button onClick={() => setShowForm(true)} className="w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-2xl flex items-center justify-center -translate-y-6 active:scale-90 transition-transform"><Plus className="w-7 h-7" /></button>
        <MobileNavLink icon={<Target className="w-6 h-6" />} active={activeView === 'budgets'} onClick={() => setActiveView('budgets')} />
        <MobileNavLink icon={<CreditCard className="w-6 h-6" />} active={activeView === 'accounts'} onClick={() => setActiveView('accounts')} />
      </nav>

      {showForm && <TransactionForm accounts={accounts} onAdd={addTransaction} onClose={() => setShowForm(false)} lang={lang} />}
      {showBudgetForm && <BudgetForm onAdd={(b) => setGoals(prev => [...prev, b])} onClose={() => setShowBudgetForm(false)} lang={lang} />}
      {showAccountForm && <AccountForm onAdd={(a) => setAccounts(prev => [...prev, a])} onClose={() => setShowAccountForm(false)} lang={lang} />}
    </div>
  );
};

// UI Components
const NavLink = ({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all ${active ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'}`}>{icon}{label}</button>
);

const MobileNavLink = ({ icon, active, onClick }: { icon: React.ReactNode; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`p-3 rounded-2xl transition-all ${active ? 'text-blue-600 bg-blue-50 shadow-sm' : 'text-gray-400'}`}>{icon}</button>
);

const StatCard = ({ title, value, trend, trendType, icon, lang }: { title: string; value: string; trend: string; trendType: 'up' | 'down'; icon: React.ReactNode; lang: Language }) => (
  <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-gray-100 flex items-start justify-between group hover:border-blue-200 transition-colors">
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{title}</p>
      <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">{value}</h3>
      <div className={`flex items-center gap-1.5 text-xs font-bold ${trendType === 'up' ? 'text-emerald-500' : 'text-blue-500'}`}>
        <span className="bg-gray-50 px-2 py-0.5 rounded-md text-[10px] uppercase">{trend}</span>
      </div>
    </div>
    <div className="p-4 bg-gray-50 rounded-2xl text-gray-400 group-hover:text-blue-600 transition-colors">{icon}</div>
  </div>
);

// Modals
const BudgetForm = ({ onAdd, onClose, lang }: { onAdd: (b: BudgetGoal) => void; onClose: () => void; lang: Language }) => {
  const t = translations[lang];
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [limit, setLimit] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 className="text-2xl font-black mb-6 tracking-tight text-gray-900">{t.new_budget}</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t.category}</label>
            <select value={category} onChange={e => setCategory(e.target.value as Category)} className="w-full border border-gray-100 p-4 rounded-2xl bg-gray-50 outline-none font-medium">
              {CATEGORIES.map(c => <option key={c} value={c}>{(t.categories as any)[c]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t.monthly_limit}</label>
            <input type="number" value={limit} onChange={e => setLimit(e.target.value)} className="w-full border border-gray-100 p-4 rounded-2xl bg-gray-50 outline-none font-bold text-xl" placeholder="0.00" />
          </div>
          <div className="flex gap-4 pt-4">
            <button onClick={onClose} className="flex-1 bg-gray-100 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-200 transition-all">{t.cancel}</button>
            <button onClick={() => { onAdd({ id: Math.random().toString(), category, limit: Number(limit) }); onClose(); }} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all">{t.save}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AccountForm = ({ onAdd, onClose, lang }: { onAdd: (a: Account) => void; onClose: () => void; lang: Language }) => {
  const t = translations[lang];
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('Checking');
  const [balance, setBalance] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 className="text-2xl font-black mb-6 tracking-tight text-gray-900">{t.new_account}</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t.account_name}</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-100 p-4 rounded-2xl bg-gray-50 outline-none font-medium" placeholder={lang === 'ar' ? 'اسم البنك' : 'Bank Name'} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t.type}</label>
            <select value={type} onChange={e => setType(e.target.value as AccountType)} className="w-full border border-gray-100 p-4 rounded-2xl bg-gray-50 outline-none font-medium">
              {['Checking', 'Savings', 'Credit Card', 'Investment', 'Cash'].map(accType => <option key={accType} value={accType}>{(t.account_types as any)[accType]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t.initial_balance}</label>
            <input type="number" value={balance} onChange={e => setBalance(e.target.value)} className="w-full border border-gray-100 p-4 rounded-2xl bg-gray-50 outline-none font-bold text-xl" placeholder="0.00" />
          </div>
          <div className="flex gap-4 pt-4">
            <button onClick={onClose} className="flex-1 bg-gray-100 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-200 transition-all">{t.cancel}</button>
            <button onClick={() => { onAdd({ id: Math.random().toString(), name, type, balance: Number(balance) }); onClose(); }} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all">{t.create}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
