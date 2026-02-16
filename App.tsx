import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { dataService } from './services/dataService';
import { Transaction, BudgetGoal, Currency, Account, Category, AccountType, UserSettings, UserProfile, ViewType } from './types';
import { INITIAL_GOALS, CATEGORY_ICONS, CURRENCIES, CATEGORIES } from './constants';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Charts from './components/Charts';
import AuthScreen from './components/AuthScreen';
import ConfirmModal from './components/ConfirmModal';
import { Language, translations } from './translations';
import { 
  Wallet, Plus, LayoutDashboard, History, Target, CreditCard, 
  TrendingUp, TrendingDown, Languages, LogOut, Loader2, Globe, Trash2, Calendar, Clock, Edit2, User as UserIcon, FileText, Camera, ShieldAlert, Printer
} from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [lang, setLang] = useState<Language>('en');
  const [currency, setCurrency] = useState<Currency>(CURRENCIES[0]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingBudget, setEditingBudget] = useState<BudgetGoal | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    type: 'transaction' | 'budget' | 'account';
    message: string;
  } | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<BudgetGoal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        await dataService.ensureUserProfile(u.uid, u.email || '');
      }
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubProfile = dataService.subscribeToUserProfile(user.uid, (profile) => {
      setUserProfile(profile);
    });

    const unsubSettings = dataService.subscribeToSettings(user.uid, (settings) => {
      if (settings) {
        setLang(settings.language);
        setCurrency(settings.currency);
      } else {
        dataService.saveSettings(user.uid, { language: lang, currency });
      }
    });

    const unsubT = dataService.subscribe(user.uid, 'transactions', (data: Transaction[]) => {
      setTransactions(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    const unsubG = dataService.subscribe(user.uid, 'budgets', (data: BudgetGoal[]) => {
      if (data.length === 0) {
        INITIAL_GOALS.forEach(g => dataService.saveGoal(user.uid, { ...g, userId: user.uid } as any));
      } else {
        setGoals(data);
      }
    });

    const unsubA = dataService.subscribe(user.uid, 'accounts', (data: Account[]) => {
      if (data.length === 0) {
        const defaults = [
          { name: 'Cash Wallet', type: 'Cash' as AccountType, balance: 1000 },
          { name: 'Primary Bank', type: 'Checking' as AccountType, balance: 5000 }
        ];
        defaults.forEach(acc => dataService.saveAccount(user.uid, { ...acc, userId: user.uid } as any));
      } else {
        setAccounts(data);
      }
    });

    return () => {
      unsubProfile();
      unsubSettings();
      unsubT();
      unsubG();
      unsubA();
    };
  }, [user]);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const updateLanguage = (newLang: Language) => {
    setLang(newLang);
    if (user) dataService.saveSettings(user.uid, { language: newLang, currency });
  };

  const updateCurrencyByCode = (code: string) => {
    const selected = CURRENCIES.find(c => c.code === code);
    if (selected) {
      setCurrency(selected);
      if (user) dataService.saveSettings(user.uid, { language: lang, currency: selected });
    }
  };

  const t = translations[lang];

  const formatMoney = (amount: number) => {
    return `${currency.symbol} ${amount.toLocaleString(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

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

  const totalExpenses = useMemo(() => {
    const now = new Date();
    return transactions
      .filter(tr => {
        const d = new Date(tr.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && !tr.isSettlement;
      })
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [transactions]);

  const userName = useMemo(() => {
    if (userProfile?.name) return userProfile.name;
    const emailStr = user?.email || '';
    if (user?.displayName) return user.displayName;
    if (emailStr.includes('@')) return emailStr.split('@')[0];
    return emailStr || 'User';
  }, [user, userProfile]);

  const handleAddTransaction = async (tData: any) => {
    if (!user) return;
    
    if (tData.isSettlement && tData.targetAccountId) {
      const sourceAcc = accounts.find(a => a.id === tData.accountId);
      const targetAcc = accounts.find(a => a.id === tData.targetAccountId);
      if (sourceAcc && targetAcc) {
        await dataService.updateAccountBalance(user.uid, sourceAcc.id, sourceAcc.balance - tData.amount);
        await dataService.updateAccountBalance(user.uid, targetAcc.id, targetAcc.balance + tData.amount);
      }
    } else {
      const sourceAcc = accounts.find(a => a.id === tData.accountId);
      if (sourceAcc) {
         await dataService.updateAccountBalance(user.uid, sourceAcc.id, sourceAcc.balance - tData.amount);
      }
    }
    await dataService.addTransaction(user.uid, tData);
  };

  const handleUpdateTransaction = async (id: string, newData: any) => {
    if (!user) return;
    const oldT = transactions.find(t => t.id === id);
    if (!oldT) return;

    // 1. Reverse old impact
    if (oldT.isSettlement && oldT.targetAccountId) {
      const oldSource = accounts.find(a => a.id === oldT.accountId);
      const oldTarget = accounts.find(a => a.id === oldT.targetAccountId);
      if (oldSource) await dataService.updateAccountBalance(user.uid, oldSource.id, oldSource.balance + oldT.amount);
      if (oldTarget) await dataService.updateAccountBalance(user.uid, oldTarget.id, oldTarget.balance - oldT.amount);
    } else {
      const oldSource = accounts.find(a => a.id === oldT.accountId);
      if (oldSource) await dataService.updateAccountBalance(user.uid, oldSource.id, oldSource.balance + oldT.amount);
    }

    // 2. Refresh local understanding of accounts for applying new impact
    // (In a real high-perf app, you'd wait for Firestore or optimistic UI)
    // For now, we apply it immediately based on the state we know.
    
    if (newData.isSettlement && newData.targetAccountId) {
      const newSource = accounts.find(a => a.id === newData.accountId);
      const newTarget = accounts.find(a => a.id === newData.targetAccountId);
      
      if (newSource) {
        const baseBalance = newSource.balance + (oldT.accountId === newData.accountId ? oldT.amount : 0);
        await dataService.updateAccountBalance(user.uid, newSource.id, baseBalance - newData.amount);
      }
      if (newTarget) {
        const baseBalance = newTarget.balance - (oldT.targetAccountId === newData.targetAccountId ? oldT.amount : 0);
        await dataService.updateAccountBalance(user.uid, newTarget.id, baseBalance + newData.amount);
      }
    } else {
      const newSource = accounts.find(a => a.id === newData.accountId);
      if (newSource) {
         const baseBalance = newSource.balance + (oldT.accountId === newData.accountId ? oldT.amount : 0);
         await dataService.updateAccountBalance(user.uid, newSource.id, baseBalance - newData.amount);
      }
    }

    await dataService.updateTransaction(user.uid, id, newData);
  };

  const handleConfirmDelete = async () => {
    if (!user || !confirmDelete) return;

    try {
      if (confirmDelete.type === 'transaction') {
        const t = transactions.find(x => x.id === confirmDelete.id);
        if (t) {
          // REVERSE BALANCE BEFORE DELETE
          if (t.isSettlement && t.targetAccountId) {
            const s = accounts.find(a => a.id === t.accountId);
            const tr = accounts.find(a => a.id === t.targetAccountId);
            if (s) await dataService.updateAccountBalance(user.uid, s.id, s.balance + t.amount);
            if (tr) await dataService.updateAccountBalance(user.uid, tr.id, tr.balance - t.amount);
          } else {
            const s = accounts.find(a => a.id === t.accountId);
            if (s) await dataService.updateAccountBalance(user.uid, s.id, s.balance + t.amount);
          }
          await dataService.deleteTransaction(user.uid, confirmDelete.id);
        }
      } else if (confirmDelete.type === 'budget') {
        await dataService.deleteGoal(user.uid, confirmDelete.id);
      } else if (confirmDelete.type === 'account') {
        await dataService.deleteAccount(user.uid, confirmDelete.id);
      }
    } catch (err) {
      console.error("Deletion failed:", err);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setConfirmDelete({
      id,
      type: 'transaction',
      message: lang === 'ar' ? 'هل أنت متأكد من حذف هذه المعاملة؟' : 'Are you sure you want to delete this transaction?'
    });
  };

  const handleDeleteGoal = (id: string) => {
    setConfirmDelete({
      id,
      type: 'budget',
      message: lang === 'ar' ? 'هل أنت متأكد من حذف هذه الميزانية؟' : 'Are you sure you want to delete this budget goal?'
    });
  };

  const handleDeleteAccount = (id: string) => {
    setConfirmDelete({
      id,
      type: 'account',
      message: lang === 'ar' ? 'هل أنت متأكد من حذف هذا الحساب؟ سيؤدي ذلك إلى فقدان بيانات الرصيد الخاصة به.' : 'Are you sure you want to delete this account? This will permanently remove its balance tracking.'
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Verifying Identity...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen lang={lang} onLanguageToggle={() => updateLanguage(lang === 'en' ? 'ar' : 'en')} />;
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-0 bg-[#f8fafc]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <nav className={`fixed ${lang === 'ar' ? 'right-0' : 'left-0'} top-0 h-full w-64 bg-white border-${lang === 'ar' ? 'l' : 'r'} border-gray-100 p-6 hidden lg:flex flex-col z-30`}>
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
            <Wallet className="w-6 h-6" />
          </div>
          <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700 tracking-tight">FinSense</span>
        </div>
        <div className="space-y-2 overflow-y-auto max-h-[70vh] custom-scrollbar pr-2">
          <NavLink icon={<LayoutDashboard className="w-5 h-5" />} label={t.overview} active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
          <NavLink icon={<History className="w-5 h-5" />} label={t.history} active={activeView === 'history'} onClick={() => setActiveView('history')} />
          <NavLink icon={<Target className="w-5 h-5" />} label={t.budgets} active={activeView === 'budgets'} onClick={() => setActiveView('budgets')} />
          <NavLink icon={<CreditCard className="w-5 h-5" />} label={t.accounts} active={activeView === 'accounts'} onClick={() => setActiveView('accounts')} />
          <NavLink icon={<FileText className="w-5 h-5" />} label={t.statement} active={activeView === 'statement'} onClick={() => setActiveView('statement')} />
          <NavLink icon={<UserIcon className="w-5 h-5" />} label={t.profile} active={activeView === 'profile'} onClick={() => setActiveView('profile')} />
        </div>
        
        <div className="mt-auto space-y-4">
           {userProfile?.photoURL ? (
             <div className="px-5 py-2 flex items-center gap-3">
                <img src={userProfile.photoURL} alt="Profile" className="w-10 h-10 rounded-xl object-cover border border-gray-100 shadow-sm" />
                <div>
                   <p className="text-xs font-black text-gray-900 truncate max-w-[120px]">{userName}</p>
                   <p className="text-[10px] font-bold text-gray-400 truncate max-w-[120px]">{userProfile.email}</p>
                </div>
             </div>
           ) : (
              <div className="px-5 py-2 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-sm font-black border border-blue-100">
                   {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                   <p className="text-xs font-black text-gray-900 truncate max-w-[120px]">{userName}</p>
                   <p className="text-[10px] font-bold text-gray-400 truncate max-w-[120px]">{userProfile?.email || user.email}</p>
                </div>
              </div>
           )}

           <button onClick={() => signOut(auth)} className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all mb-4">
             <LogOut className="w-5 h-5" /> {lang === 'ar' ? 'خروج' : 'Logout'}
           </button>

           <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
             <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm">
                <button onClick={() => updateLanguage('en')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === 'en' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>EN</button>
                <button onClick={() => updateLanguage('ar')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === 'ar' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>AR</button>
             </div>
           </div>
        </div>
      </nav>

      <main className={`${lang === 'ar' ? 'lg:mr-64' : 'lg:ml-64'} p-4 lg:p-10 max-w-7xl mx-auto min-h-screen`}>
        <header className="flex justify-between items-center lg:items-start mb-6 lg:mb-10">
          <div>
            <h1 className="text-xl lg:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              {(t as any)[activeView] || t.overview}
            </h1>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
             <button onClick={() => { setEditingTransaction(null); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 lg:px-6 py-2.5 lg:py-3.5 rounded-xl lg:rounded-2xl font-black shadow-lg lg:shadow-xl shadow-blue-100 active:scale-95 transition-all text-[10px] lg:text-sm">
               <Plus className="w-3.5 h-3.5 lg:w-5 lg:h-5" /> <span className="uppercase tracking-widest">{t.entry}</span>
             </button>
          </div>
        </header>

        {activeView === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-8 lg:mb-10">
              <StatCard title={t.total_assets} value={formatMoney(totalAssets)} trend={t.trend_liquid} trendType="up" icon={<TrendingUp className="w-4 h-4 lg:w-5 lg:h-5" />} lang={lang} onClick={() => setActiveView('accounts')} />
              <StatCard title={t.total_expenses} value={formatMoney(totalExpenses)} trend={t.trend_monthly} trendType="down" icon={<TrendingDown className="w-4 h-4 lg:w-5 lg:h-5 text-amber-500" />} lang={lang} onClick={() => setActiveView('history')} />
              <StatCard title={t.total_debt} value={formatMoney(totalDebt)} trend={t.trend_debt} trendType="down" icon={<ShieldAlert className="w-4 h-4 lg:w-5 lg:h-5 text-rose-500" />} lang={lang} isDebt onClick={() => setActiveView('accounts')} />
              <StatCard title={t.budget_health} value={`${goals.length}`} trend={t.trend_goals} trendType="up" icon={<Target className="w-4 h-4 lg:w-5 lg:h-5" />} lang={lang} onClick={() => setActiveView('budgets')} />
            </div>
            <Charts transactions={transactions} lang={lang} />
          </div>
        )}

        {activeView === 'history' && (
          <TransactionList 
            transactions={transactions} 
            onDelete={handleDeleteTransaction} 
            onEdit={(t) => { setEditingTransaction(t); setShowForm(true); }}
            lang={lang} 
          />
        )}

        {activeView === 'budgets' && (
          <BudgetsView 
            user={user} 
            goals={goals} 
            transactions={transactions} 
            formatMoney={formatMoney} 
            lang={lang} 
            onAddClick={() => { setEditingBudget(null); setShowBudgetForm(true); }} 
            onEditClick={(goal: BudgetGoal) => { setEditingBudget(goal); setShowBudgetForm(true); }}
            onDelete={handleDeleteGoal}
          />
        )}

        {activeView === 'accounts' && (
          <AccountsView 
            user={user} 
            accounts={accounts} 
            formatMoney={formatMoney} 
            lang={lang} 
            onAddClick={() => { setEditingAccount(null); setShowAccountForm(true); }} 
            onEditClick={(acc: Account) => { setEditingAccount(acc); setShowAccountForm(true); }}
            onDelete={handleDeleteAccount}
          />
        )}

        {activeView === 'profile' && <ProfileView profile={userProfile} lang={lang} updateLanguage={updateLanguage} currency={currency} updateCurrencyByCode={updateCurrencyByCode} transactionsCount={transactions.length} accountsCount={accounts.length} />}
        {activeView === 'statement' && <StatementView accounts={accounts} transactions={transactions} currency={currency} lang={lang} onDelete={handleDeleteTransaction} />}
      </main>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-2 py-4 flex justify-around items-center lg:hidden z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] rounded-t-[2.5rem]">
        <MobileNavLink icon={<LayoutDashboard className="w-5 h-5" />} active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
        <MobileNavLink icon={<History className="w-5 h-5" />} active={activeView === 'history'} onClick={() => setActiveView('history')} />
        <MobileNavLink icon={<Target className="w-5 h-5" />} active={activeView === 'budgets'} onClick={() => setActiveView('budgets')} />
        <button onClick={() => { setEditingTransaction(null); setShowForm(true); }} className="w-12 h-12 bg-blue-600 text-white rounded-2xl shadow-2xl flex items-center justify-center -translate-y-8 active:scale-90 transition-transform"><Plus className="w-6 h-6" /></button>
        <MobileNavLink icon={<CreditCard className="w-5 h-5" />} active={activeView === 'accounts'} onClick={() => setActiveView('accounts')} />
        <MobileNavLink icon={<FileText className="w-5 h-5" />} active={activeView === 'statement'} onClick={() => setActiveView('statement')} />
        <MobileNavLink icon={<UserIcon className="w-5 h-5" />} active={activeView === 'profile'} onClick={() => setActiveView('profile')} />
      </nav>

      {/* Forms & Modals */}
      {showForm && (
        <TransactionForm 
          accounts={accounts} 
          initialData={editingTransaction}
          onAdd={handleAddTransaction} 
          onUpdate={handleUpdateTransaction}
          onClose={() => { setShowForm(false); setEditingTransaction(null); }} 
          lang={lang} 
        />
      )}
      
      {showBudgetForm && <BudgetForm initialData={editingBudget} onAdd={(b: any) => dataService.saveGoal(user!.uid, b)} onClose={() => { setShowBudgetForm(false); setEditingBudget(null); }} lang={lang} />}
      {showAccountForm && <AccountForm initialData={editingAccount} onAdd={(a: any) => dataService.saveAccount(user!.uid, a)} onClose={() => { setShowAccountForm(false); setEditingAccount(null); }} lang={lang} />}

      {confirmDelete && (
        <ConfirmModal 
          lang={lang}
          message={confirmDelete.message}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

const ProfileView = ({ profile, lang, updateLanguage, currency, updateCurrencyByCode, transactionsCount, accountsCount }: any) => {
  const t = translations[lang];
  const [name, setName] = useState(profile?.name || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || '');
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.name) setName(profile.name);
    if (profile?.photoURL) setPhotoURL(profile.photoURL);
  }, [profile]);

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 200;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(base64Str);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.4)); 
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  const handleUpdate = async () => {
    if (!profile?.uid) return;
    setLoading(true);
    try {
      await dataService.updateUserProfile(profile.uid, { name, photoURL });
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && profile?.uid) {
      setPhotoLoading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const compressed = await compressImage(base64);
        setPhotoURL(compressed);
        try {
          await dataService.updateUserProfile(profile.uid, { photoURL: compressed });
        } catch (err) {
          console.error("Auto-save photo failed:", err);
        } finally {
          setPhotoLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const initialChar = (profile?.name || profile?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl space-y-6 lg:space-y-8 pb-10">
      <div className="bg-white p-6 lg:p-8 rounded-3xl lg:rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-6 mb-10">
          <div className="relative group cursor-pointer" onClick={handleImageClick}>
            <div className="w-20 h-20 lg:w-24 lg:h-24 bg-blue-100 text-blue-600 rounded-3xl lg:rounded-[2.5rem] flex items-center justify-center text-3xl font-black overflow-hidden border-2 border-white shadow-xl shadow-blue-50 transition-transform group-hover:scale-105">
              {photoLoading ? (
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin mb-1" />
                  <span className="text-[8px] font-black uppercase tracking-tighter text-blue-400">Saving</span>
                </div>
              ) : photoURL ? (
                <img src={photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                initialChar
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-2 rounded-xl shadow-lg border-2 border-white transition-transform group-hover:scale-110 pointer-events-none">
              <Camera className="w-4 h-4" />
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-black text-gray-900">{profile?.name || 'User'}</h2>
            <p className="text-gray-400 font-bold text-xs lg:text-sm">{profile?.email}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">{t.full_name}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none font-bold text-gray-800 focus:bg-white focus:border-blue-100 transition-colors text-sm" />
          </div>
          <button onClick={handleUpdate} disabled={loading || (name === profile?.name && photoURL === profile?.photoURL)} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-4 lg:p-5 rounded-2xl font-black shadow-xl shadow-blue-100 transition-all active:scale-95 uppercase tracking-widest text-[10px] lg:text-xs">
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t.update_profile}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 lg:p-8 rounded-3xl lg:rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 lg:space-y-8">
        <div>
          <h3 className="text-base lg:text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            {lang === 'ar' ? 'التفضيلات' : 'Preferences'}
          </h3>
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-4">{t.language}</label>
              <div className="flex gap-3">
                <button onClick={() => updateLanguage('en')} className={`flex-1 py-3 lg:py-4 rounded-2xl text-xs lg:text-sm font-bold border transition-all ${lang === 'en' ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>English</button>
                <button onClick={() => updateLanguage('ar')} className={`flex-1 py-3 lg:py-4 rounded-2xl text-xs lg:text-sm font-bold border transition-all ${lang === 'ar' ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>العربية</button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-4">{t.currency}</label>
              <select value={currency.code} onChange={(e) => updateCurrencyByCode(e.target.value)} className="w-full py-4 lg:py-5 px-6 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-blue-100 transition-colors">
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label} ({c.symbol})</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-rose-50/50 p-6 rounded-3xl lg:rounded-[2.5rem] border border-rose-100">
         <button onClick={() => signOut(auth)} className="w-full flex items-center justify-center gap-3 py-4 lg:py-5 text-rose-500 font-black bg-white rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 border border-rose-100 uppercase tracking-widest text-[10px] lg:text-xs">
            <LogOut className="w-5 h-5" />
            {lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
         </button>
      </div>
    </div>
  );
};

const StatementView = ({ accounts, transactions, currency, lang, onDelete }: any) => {
  const t = translations[lang];
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [period, setPeriod] = useState<'current' | 'last' | 'custom'>('current');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredTransactions = useMemo(() => {
    if (!selectedAccountId) return [];
    let list = transactions.filter(tr => tr.accountId === selectedAccountId);
    const now = new Date();
    if (period === 'current') {
      list = list.filter(tr => {
        const d = new Date(tr.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (period === 'last') {
      list = list.filter(tr => {
        const d = new Date(tr.date);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
        return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
      });
    } else if (period === 'custom') {
      if (dateFrom) list = list.filter(tr => new Date(tr.date) >= new Date(dateFrom));
      if (dateTo) list = list.filter(tr => new Date(tr.date) <= new Date(dateTo));
    }
    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions, selectedAccountId, period, dateFrom, dateTo]);

  const acc = accounts.find(a => a.id === selectedAccountId);
  const format = (val: number) => `${currency.symbol} ${val.toLocaleString(lang, { minimumFractionDigits: 2 })}`;

  return (
    <div className="animate-in fade-in duration-500 space-y-6 lg:space-y-8">
      <div className="bg-white p-6 lg:p-8 rounded-3xl lg:rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-start mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 flex-1">
            <div>
              <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest block mb-3">{t.select_account}</label>
              <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none font-bold text-gray-800 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all">
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest block mb-3">{t.period}</label>
              <div className="flex flex-wrap gap-2">
                {(['current', 'last', 'custom'] as const).map(p => (
                  <button key={p} onClick={() => setPeriod(p)} className={`px-3 lg:px-4 py-3 rounded-xl text-[10px] lg:text-xs font-bold border transition-all ${period === p ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>{(t as any)[p] || p}</button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={() => window.print()} className="ms-4 p-4 bg-gray-50 hover:bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 transition-all active:scale-95 group" title={lang === 'ar' ? 'طباعة' : 'Print Statement'}><Printer className="w-5 h-5" /></button>
        </div>

        {period === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 p-6 bg-gray-50 rounded-3xl border border-blue-50 animate-in slide-in-from-top-2">
            <div>
              <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest block mb-2">{t.date_from}</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full bg-white border border-gray-200 p-4 rounded-xl outline-none text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">{t.date_to}</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full bg-white border border-gray-200 p-4 rounded-xl outline-none text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
           <div>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{t.summary}</p>
              <p className="text-sm font-bold text-blue-900">{acc?.name || '---'}</p>
           </div>
           <div>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{t.available_funds}</p>
              <p className="text-base lg:text-lg font-black text-blue-600">{format(acc?.balance || 0)}</p>
           </div>
        </div>
      </div>

      <TransactionList transactions={filteredTransactions} lang={lang} onDelete={onDelete} />
    </div>
  );
};

const AccountsView = ({ accounts, formatMoney, lang, onAddClick, onEditClick, onDelete }: any) => {
  const tStr = translations[lang];
  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center"><h2 className="text-xl lg:text-2xl font-black text-gray-900">{tStr.accounts}</h2><button onClick={onAddClick} className="text-blue-600 font-black text-[10px] lg:text-sm uppercase tracking-widest">+{tStr.new_account}</button></div>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-8">
        {accounts.map((acc: any) => {
           const isDebtAccount = acc.type === 'Credit Card';
           const limit = acc.creditLimit || 0;
           const isSurplus = isDebtAccount && limit > 0 && acc.balance > limit;
           const usedPercent = limit > 0 ? Math.min(100, (acc.balance / limit) * 100) : 0;
           
           return (
            <div key={acc.id} className={`p-4 lg:p-10 rounded-2xl lg:rounded-[3rem] text-white shadow-2xl relative group overflow-hidden ${isDebtAccount ? (isSurplus ? 'bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-700' : 'bg-gradient-to-br from-rose-600 via-rose-500 to-rose-700') : 'bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700'}`}>
              <div className="absolute top-0 right-0 p-4 lg:p-12 opacity-10 pointer-events-none"><Wallet className="w-20 lg:w-40 h-20 lg:h-40" /></div>
              <div className="absolute top-3 lg:top-8 right-3 lg:right-8 flex items-center gap-2 z-10">
                <button onClick={() => onEditClick(acc)} className="p-1.5 text-white/40 hover:text-white transition-colors" title={lang === 'ar' ? 'تعديل' : 'Edit'}><Edit2 className="w-3 lg:w-5 h-3 lg:h-5" /></button>
                <button onClick={() => onDelete(acc.id)} className="p-1.5 text-white/40 hover:text-rose-300 transition-colors" title={lang === 'ar' ? 'حذف' : 'Delete'}><Trash2 className="w-3 lg:w-5 h-3 lg:h-5" /></button>
              </div>
              <p className="text-[7px] lg:text-[10px] uppercase font-black tracking-[0.25em] opacity-70 mb-1 lg:mb-2">{(tStr.account_types as any)[acc.type]}</p>
              <h3 className="text-xs lg:text-xl font-bold mb-3 lg:mb-8 relative z-10 line-clamp-1">{acc.name}</h3>
              
              <div className="relative z-10 mb-3 lg:mb-6">
                <p className={`text-sm lg:text-4xl font-black ${isSurplus ? 'text-emerald-300' : 'text-white'}`}>
                  {formatMoney(acc.balance)}
                </p>
                {isSurplus && (
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded-lg border border-white/20">
                    <TrendingUp className="w-3 h-3 text-white" />
                    <span className="text-[8px] lg:text-[10px] font-black uppercase">
                      {tStr.surplus}: {formatMoney(acc.balance - limit)}
                    </span>
                  </div>
                )}
              </div>
              
              {isDebtAccount && limit > 0 && (
                <div className="space-y-2 lg:space-y-3 relative z-10">
                   <div className="flex justify-between text-[7px] lg:text-[10px] font-black uppercase opacity-70">
                      <span className="line-clamp-1">{tStr.available_funds}</span>
                   </div>
                   <div className="w-full h-1 lg:h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ${isSurplus ? 'bg-emerald-300' : 'bg-white'}`} style={{ width: `${isSurplus ? 100 : usedPercent}%` }} />
                   </div>
                   <p className="text-[6px] lg:text-[10px] font-black uppercase opacity-50 line-clamp-1">{tStr.credit_limit}: {formatMoney(limit)}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const BudgetsView = ({ goals, transactions, formatMoney, lang, onAddClick, onEditClick, onDelete }: any) => {
  const tStr = translations[lang];
  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center"><h2 className="text-xl lg:text-2xl font-black text-gray-900">{tStr.budgets}</h2><button onClick={onAddClick} className="text-blue-600 font-black text-[10px] lg:text-sm uppercase tracking-widest">+{tStr.new_budget}</button></div>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-8">
        {goals.map((goal: any) => {
          const spent = transactions.filter((tr: any) => tr.category === goal.category).reduce((s: number, tr: any) => s + tr.amount, 0);
          const percent = Math.min((spent / goal.limit) * 100, 100);
          return (
            <div key={goal.id} className="bg-white p-3 lg:p-8 rounded-2xl lg:rounded-[2.5rem] border border-gray-100 shadow-sm relative group">
              <div className="flex justify-between mb-3 lg:mb-6">
                <div className="flex items-center gap-2 lg:gap-4">
                   <div className="p-2 lg:p-3 bg-blue-50 text-blue-600 rounded-lg lg:rounded-2xl shrink-0">{CATEGORY_ICONS[goal.category as Category]}</div>
                   <h3 className="font-bold text-gray-800 text-[10px] lg:text-base line-clamp-1">{(tStr.categories as any)[goal.category]}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => onEditClick(goal)} className="p-1.5 text-gray-300 hover:text-blue-500 transition-colors"><Edit2 className="w-3 h-3" /></button>
                  <button onClick={() => onDelete(goal.id)} className="p-1.5 text-gray-300 hover:text-rose-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
              <div className="w-full h-1.5 lg:h-3 bg-gray-50 rounded-full overflow-hidden mb-2 lg:mb-3"><div className={`h-full transition-all duration-1000 ${percent > 90 ? 'bg-rose-500' : 'bg-blue-600'}`} style={{width: `${percent}%`}} /></div>
              <div className="flex justify-between text-[7px] lg:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <span className="line-clamp-1">{formatMoney(spent)}</span>
                <span className={percent > 90 ? 'text-rose-500' : 'text-blue-600'}>{percent.toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, trend, trendType, icon, isDebt, onClick }: any) => (
  <div onClick={onClick} className={`bg-white p-4 lg:p-8 rounded-3xl lg:rounded-[2.5rem] border border-gray-100 flex items-start justify-between shadow-sm hover:shadow-lg transition-all cursor-pointer group active:scale-[0.98] ${isDebt ? 'border-rose-50' : ''}`}>
    <div>
      <p className={`text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 lg:mb-3 ${isDebt ? 'text-rose-400' : 'text-gray-400'}`}>{title}</p>
      <h3 className="text-sm lg:text-2xl font-black text-gray-900 mb-0.5 lg:mb-2">{value}</h3>
      <div className={`text-[8px] lg:text-[10px] font-bold ${isDebt ? 'text-rose-500' : (trendType === 'up' ? 'text-emerald-500' : 'text-blue-500')}`}>{trend}</div>
    </div>
    <div className={`p-2 lg:p-4 rounded-xl lg:rounded-3xl ${isDebt ? 'bg-rose-50 text-rose-500' : 'bg-gray-50 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors'}`}>{icon}</div>
  </div>
);

const BudgetForm = ({ onAdd, onClose, lang, initialData }: any) => {
  const tStr = translations[lang];
  const [category, setCategory] = useState<Category>(initialData?.category || CATEGORIES[0]);
  const [limit, setLimit] = useState(initialData?.limit?.toString() || '');
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200"><div className="bg-white rounded-[2.5rem] p-8 lg:p-10 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300"><h2 className="text-xl lg:text-2xl font-black mb-8 text-gray-900">{initialData ? tStr.edit_budget : tStr.new_budget}</h2><div className="space-y-5"><select value={category} onChange={e => setCategory(e.target.value as Category)} className="w-full border border-gray-100 p-4 rounded-2xl bg-gray-50 outline-none font-bold text-sm">{CATEGORIES.map(c => <option key={c} value={c}>{(tStr.categories as any)[c]}</option>)}</select><input type="number" value={limit} onChange={e => setLimit(e.target.value)} className="w-full border border-gray-100 p-4 rounded-2xl bg-gray-50 outline-none font-black text-lg" placeholder="0.00" /><div className="flex gap-4 pt-6"><button onClick={onClose} className="flex-1 font-bold text-gray-400">Cancel</button><button onClick={() => { if(!limit) return; onAdd({ ...initialData, category, limit: Number(limit) }); onClose(); }} className="flex-1 bg-blue-600 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-xl shadow-blue-100 transition-all active:scale-95">{initialData ? tStr.update : tStr.save}</button></div></div></div></div>
  );
};

const AccountForm = ({ onAdd, onClose, lang, initialData }: any) => {
  const tStr = translations[lang];
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<AccountType>(initialData?.type || 'Checking');
  const [balance, setBalance] = useState(initialData?.balance?.toString() || '');
  const [creditLimit, setCreditLimit] = useState(initialData?.creditLimit?.toString() || '');

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300">
        <h2 className="text-xl lg:text-2xl font-black mb-8 text-gray-900">{initialData ? tStr.edit_account : tStr.new_account}</h2>
        <div className="space-y-5">
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-100 p-4 rounded-2xl bg-gray-50 outline-none font-bold text-sm" placeholder={tStr.account_name} />
          <select value={type} onChange={e => setType(e.target.value as AccountType)} className="w-full border border-gray-100 p-4 rounded-2xl bg-gray-50 outline-none font-bold text-sm">
            {['Checking', 'Savings', 'Credit Card', 'Investment', 'Cash'].map(at => <option key={at} value={at}>{(tStr.account_types as any)[at]}</option>)}
          </select>
          <input type="number" value={balance} onChange={e => setBalance(e.target.value)} className="w-full border border-gray-100 p-4 rounded-2xl bg-gray-50 outline-none font-black text-lg" placeholder={tStr.initial_balance} />
          {type === 'Credit Card' && (
            <input type="number" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} className="w-full border border-gray-100 p-4 rounded-2xl bg-gray-50 outline-none font-black text-lg" placeholder={tStr.credit_limit} />
          )}
          <div className="flex gap-4 pt-6">
            <button onClick={onClose} className="flex-1 font-bold text-gray-400">Cancel</button>
            <button onClick={() => { if(!name || !balance) return; onAdd({ ...initialData, name, type, balance: Number(balance), creditLimit: type === 'Credit Card' ? Number(creditLimit) : undefined }); onClose(); }} className="flex-1 bg-blue-600 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-xl shadow-blue-100 transition-all active:scale-95">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const NavLink = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all ${active ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' : 'text-gray-400 hover:bg-gray-50'}`}>{icon}{label}</button>
);
const MobileNavLink = ({ icon, active, onClick }: any) => (
  <button onClick={onClick} className={`p-3 rounded-2xl transition-all ${active ? 'text-blue-600 bg-blue-50 shadow-sm' : 'text-gray-400'}`}>{icon}</button>
);

export default App;