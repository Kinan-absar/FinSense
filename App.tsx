import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { dataService } from './services/dataService';
import { Transaction, BudgetGoal, Currency, Account, Category, AccountType, UserSettings, UserProfile, ViewType } from './types';
import { INITIAL_GOALS, CURRENCIES } from './constants';
import TransactionForm from './components/TransactionForm';
import AuthScreen from './components/AuthScreen';
import ConfirmModal from './components/ConfirmModal';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Analytics from './components/Analytics';
import Budgets from './components/Budgets';
import Accounts from './components/Accounts';
import Profile from './components/Profile';
import Statement from './components/Statement';
import MobileMenu from './components/MobileMenu';
import { translations, Language } from './translations';
import { Loader2, Trash2 } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [lang, setLang] = useState<Language>('en');
  const [currency, setCurrency] = useState<Currency>(CURRENCIES[0]);
  
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingBudget, setEditingBudget] = useState<BudgetGoal | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>('Checking');
  const [budgetItems, setBudgetItems] = useState<{ id: string; name: string; cost: number; completed?: boolean }[]>([]);
  const [limitInputVal, setLimitInputVal] = useState('');
  const [newSubItemName, setNewSubItemName] = useState('');
  const [newSubItemCost, setNewSubItemCost] = useState('');

  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    type: 'transaction' | 'budget' | 'account';
    message: string;
  } | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<BudgetGoal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

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
        // Only initial load
      } else {
        setGoals(data);
      }
    });

    const unsubA = dataService.subscribe(user.uid, 'accounts', (data: Account[]) => {
       setAccounts(data);
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

  const formatMoney = useCallback((amount: number) => {
    return `${currency.symbol} ${Math.abs(amount).toLocaleString(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [currency, lang]);

  const handleAddTransaction = async (tData: any) => {
    if (!user) return;
    
    // Update account balance
    const sourceAcc = accounts.find(a => a.id === tData.accountId);
    if (sourceAcc) {
      const balanceChange = tData.type === 'income' ? tData.amount : -tData.amount;
      await dataService.updateAccountBalance(user.uid, sourceAcc.id, sourceAcc.balance + balanceChange);
    }

    if (tData.isSettlement && tData.targetAccountId) {
      const targetAcc = accounts.find(a => a.id === tData.targetAccountId);
      if (targetAcc) await dataService.updateAccountBalance(user.uid, targetAcc.id, targetAcc.balance + tData.amount);
    }
    
    await dataService.addTransaction(user.uid, tData);
  };

  const handleUpdateTransaction = async (id: string, newData: any) => {
    if (!user) return;
    const oldT = transactions.find(t => t.id === id);
    if (!oldT) return;

    // 1. Reverse old impact
    const oldSource = accounts.find(a => a.id === oldT.accountId);
    if (oldSource) {
      const oldBalanceChange = oldT.type === 'income' ? -oldT.amount : oldT.amount;
      await dataService.updateAccountBalance(user.uid, oldSource.id, oldSource.balance + oldBalanceChange);
    }
    if (oldT.isSettlement && oldT.targetAccountId) {
      const oldTarget = accounts.find(a => a.id === oldT.targetAccountId);
      if (oldTarget) await dataService.updateAccountBalance(user.uid, oldTarget.id, oldTarget.balance - oldT.amount);
    }

    // Since onSnapshot is async, we re-fetch briefly or calculate based on assumed reversed state
    const currentAccounts = await dataService.getAccounts(user.uid);
    const newSource = currentAccounts.find(a => a.id === newData.accountId);
    if (newSource) {
      const newBalanceChange = newData.type === 'income' ? newData.amount : -newData.amount;
      await dataService.updateAccountBalance(user.uid, newSource.id, newSource.balance + newBalanceChange);
    }

    if (newData.isSettlement && newData.targetAccountId) {
      const newTarget = currentAccounts.find(a => a.id === newData.targetAccountId);
      if (newTarget) {
        await dataService.updateAccountBalance(user.uid, newTarget.id, newTarget.balance + newData.amount);
      }
    }

    await dataService.updateTransaction(user.uid, id, newData);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;
    const tToDelete = transactions.find(t => t.id === id);
    if (tToDelete) {
      const acc = accounts.find(a => a.id === tToDelete.accountId);
      if (acc) {
        const reversal = tToDelete.type === 'income' ? -tToDelete.amount : tToDelete.amount;
        await dataService.updateAccountBalance(user.uid, acc.id, acc.balance + reversal);
      }
      if (tToDelete.isSettlement && tToDelete.targetAccountId) {
        const target = accounts.find(a => a.id === tToDelete.targetAccountId);
        if (target) await dataService.updateAccountBalance(user.uid, target.id, target.balance - tToDelete.amount);
      }
    }
    await dataService.deleteTransaction(user.uid, id);
    setConfirmDelete(null);
  };

  const handleToggleBudgetItem = async (goalId: string, itemId: string) => {
    if (!user) return;
    const goal = goals.find(g => g.id === goalId);
    if (!goal || !goal.items) return;
    const updatedItems = goal.items.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    await dataService.saveGoal(user.uid, { ...goal, items: updatedItems });
  };

  const userName = useMemo(() => {
    if (userProfile?.name) return userProfile.name;
    const emailStr = user?.email || '';
    if (user?.displayName) return user.displayName;
    if (emailStr.includes('@')) return emailStr.split('@')[0];
    return emailStr || 'User';
  }, [user, userProfile]);

  if (authLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">FinSense Loading...</p>
      </div>
    );
  }

  if (!user) return <AuthScreen lang={lang} t={t} />;

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard 
          transactions={transactions} 
          accounts={accounts} 
          goals={goals} 
          currency={currency} 
          lang={lang} 
          t={t} 
          formatMoney={formatMoney} 
          setActiveView={setActiveView}
        />;
      case 'history':
        return <History 
          transactions={transactions} 
          onDelete={(id) => setConfirmDelete({ id, type: 'transaction', message: t.confirm_delete_desc })} 
          onEdit={(tr) => { setEditingTransaction(tr); setShowForm(true); }}
          lang={lang} 
          currencySymbol={currency.symbol}
          t={t}
        />;
      case 'analytics':
        return <Analytics 
          transactions={transactions} 
          goals={goals} 
          currency={currency} 
          lang={lang} 
          t={t} 
        />;
      case 'budgets':
        return <Budgets 
          goals={goals} 
          transactions={transactions} 
          onAdd={() => { setEditingBudget(null); setBudgetItems([]); setLimitInputVal(''); setShowBudgetForm(true); }}
          onEdit={(g) => { setEditingBudget(g); setBudgetItems(g.items || []); setLimitInputVal(g.limit.toString()); setShowBudgetForm(true); }}
          onDelete={(id) => setConfirmDelete({ id, type: 'budget', message: t.confirm_delete_desc })}
          onToggleItem={handleToggleBudgetItem}
          lang={lang}
          formatMoney={formatMoney}
          t={t}
        />;
      case 'accounts':
        return <Accounts 
          accounts={accounts} 
          onAdd={() => { setEditingAccount(null); setAccountType('Checking'); setShowAccountForm(true); }}
          onEdit={(acc) => { setEditingAccount(acc); setAccountType(acc.type); setShowAccountForm(true); }}
          onDelete={(id) => setConfirmDelete({ id, type: 'account', message: t.confirm_delete_desc })}
          lang={lang}
          formatMoney={formatMoney}
          t={t}
        />;
      case 'profile':
        return <Profile 
          profile={userProfile} 
          onUpdate={(data) => dataService.updateUserProfile(user.uid, data)}
          onSignOut={() => signOut(auth)}
          lang={lang}
          t={t}
        />;
      case 'statement':
        return <Statement 
          transactions={transactions} 
          accounts={accounts} 
          currency={currency} 
          lang={lang} 
          formatMoney={formatMoney} 
          t={t} 
        />;
      default:
        return <Dashboard 
          transactions={transactions} 
          accounts={accounts} 
          goals={goals} 
          currency={currency} 
          lang={lang} 
          t={t} 
          formatMoney={formatMoney} 
          setActiveView={setActiveView}
        />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Sidebar activeView={activeView} setActiveView={setActiveView} lang={lang} t={t} onSignOut={() => signOut(auth)} />

      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)}
        activeView={activeView}
        setActiveView={setActiveView}
        lang={lang}
        updateLanguage={updateLanguage}
        currency={currency}
        updateCurrencyByCode={updateCurrencyByCode}
        t={t}
        onSignOut={() => signOut(auth)}
        userName={userName}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar 
          lang={lang} 
          updateLanguage={updateLanguage} 
          currency={currency} 
          updateCurrencyByCode={updateCurrencyByCode}
          userName={userName}
          userPhoto={userProfile?.photoURL}
          onAddTransaction={() => { setEditingTransaction(null); setShowForm(true); }}
          t={t}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        <div className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {renderView()}
        </div>
      </main>

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

      {showBudgetForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold">{editingBudget ? t.edit_budget : t.new_budget}</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                category: formData.get('category') as Category,
                limit: Number(formData.get('limit')),
                startDate: formData.get('startDate') as string,
                endDate: formData.get('endDate') as string,
                items: budgetItems,
              };
              await dataService.saveGoal(user.uid, editingBudget ? { ...data, id: editingBudget.id } : data);
              setShowBudgetForm(false);
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">{t.category}</label>
                <select name="category" defaultValue={editingBudget?.category} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20 outline-none">
                  {Object.keys(t.categories).filter(c => c !== 'Income' && c !== 'Settlement').map(c => <option key={c} value={c}>{t.categories[c]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">{t.amount}</label>
                <input 
                  name="limit" 
                  type="number" 
                  value={limitInputVal} 
                  onChange={(e) => setLimitInputVal(e.target.value)} 
                  required 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20 outline-none" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">{t.date_from}</label>
                  <input 
                    name="startDate" 
                    type="date" 
                    defaultValue={editingBudget?.startDate || new Date().toISOString().split('T')[0]} 
                    required 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20 outline-none text-xs" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">{t.date_to}</label>
                  <input 
                    name="endDate" 
                    type="date" 
                    defaultValue={editingBudget?.endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]} 
                    required 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20 outline-none text-xs" 
                  />
                </div>
              </div>

              {/* Sub-items Checklist Section */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">{t.trip_planning_items}</label>
                
                {/* Add Sub-item Form Controls */}
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newSubItemName}
                    onChange={(e) => setNewSubItemName(e.target.value)}
                    placeholder={t.item_name}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                  <input 
                    type="number" 
                    value={newSubItemCost}
                    onChange={(e) => setNewSubItemCost(e.target.value)}
                    placeholder={t.estimated_cost}
                    className="w-16 px-2 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newSubItemName.trim()) return;
                      const val = Number(newSubItemCost) || 0;
                      const newItem = {
                        id: Date.now().toString(),
                        name: newSubItemName.trim(),
                        cost: val,
                        completed: false
                      };
                      setBudgetItems([...budgetItems, newItem]);
                      setNewSubItemName('');
                      setNewSubItemCost('');
                    }}
                    className="bg-blue-50 text-blue-600 px-3 py-1 rounded-xl text-xs font-black hover:bg-blue-100 transition-colors"
                  >
                    {t.add_item}
                  </button>
                </div>

                {/* List of current sub-items */}
                {budgetItems.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {budgetItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">{item.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({formatMoney(item.cost)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setBudgetItems(budgetItems.filter(i => i.id !== item.id));
                          }}
                          className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-1 rounded-lg"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    
                    {/* Option to apply sum to total budget */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                      <span className="font-bold text-slate-500">
                        {t.total_planned}: <span className="font-mono text-slate-700 font-black">{formatMoney(budgetItems.reduce((sum, item) => sum + item.cost, 0))}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const sum = budgetItems.reduce((acc, curr) => acc + curr.cost, 0);
                          setLimitInputVal(sum.toString());
                        }}
                        className="text-blue-600 hover:underline font-bold"
                      >
                        {t.set_limit_to_total}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic text-center py-2">{t.no_items_planned}</p>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowBudgetForm(false)} className="flex-1 py-3 font-bold text-slate-400">{t.cancel}</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">{editingBudget ? t.update : t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAccountForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl space-y-6">
            <h2 className="text-xl font-bold">{editingAccount ? t.edit_account : t.new_account}</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                name: formData.get('name') as string,
                type: formData.get('type') as AccountType,
                balance: Number(formData.get('balance')),
                creditLimit: formData.get('creditLimit') ? Number(formData.get('creditLimit')) : undefined,
              };
              await dataService.saveAccount(user.uid, editingAccount ? { ...data, id: editingAccount.id } : data);
              setShowAccountForm(false);
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">{t.account_name}</label>
                <input name="name" defaultValue={editingAccount?.name} required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">{t.type}</label>
                <select 
                  name="type" 
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as AccountType)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold"
                >
                  {Object.keys(t.account_types).map(type => <option key={type} value={type}>{t.account_types[type]}</option>)}
                </select>
              </div>

              {accountType === 'Credit Card' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">{t.credit_limit}</label>
                  <input name="creditLimit" type="number" defaultValue={editingAccount?.creditLimit} required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">
                  {accountType === 'Credit Card' ? t.available_credit : t.initial_balance}
                </label>
                <input name="balance" type="number" defaultValue={editingAccount?.balance} required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAccountForm(false)} className="flex-1 py-3 font-bold text-slate-400">{t.cancel}</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">{editingAccount ? t.update : t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal 
          lang={lang} 
          message={confirmDelete.message}
          onConfirm={async () => {
             if (confirmDelete.type === 'transaction') {
               await handleDeleteTransaction(confirmDelete.id);
             } else if (confirmDelete.type === 'budget') {
               await dataService.deleteGoal(user.uid, confirmDelete.id);
               setConfirmDelete(null);
             } else if (confirmDelete.type === 'account') {
               await dataService.deleteAccount(user.uid, confirmDelete.id);
               setConfirmDelete(null);
             }
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

export default App;
