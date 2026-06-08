import React from 'react';
import { Account } from '../types';
import { Language } from '../translations';
import { Plus, CreditCard, Trash2, Edit2, Wallet, Landmark, PiggyBank, Coins } from 'lucide-react';

interface AccountsProps {
  accounts: Account[];
  onAdd: () => void;
  onEdit: (acc: Account) => void;
  onDelete: (id: string) => void;
  lang: Language;
  formatMoney: (amount: number) => string;
  t: any;
}

const AccountIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'Cash': return <Coins className="text-amber-500" />;
    case 'Checking': return <Landmark className="text-blue-500" />;
    case 'Savings': return <PiggyBank className="text-emerald-500" />;
    case 'Credit Card': return <CreditCard className="text-rose-500" />;
    default: return <Wallet className="text-slate-500" />;
  }
};

const Accounts: React.FC<AccountsProps> = ({ accounts, onAdd, onEdit, onDelete, lang, formatMoney, t }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">{t.accounts}</h2>
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <Plus size={18} />
          {t.new_account}
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
          <CreditCard size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-bold italic">{t.no_accounts}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map(acc => (
            <div key={acc.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4 hover:border-blue-200 transition-colors group">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
                  <AccountIcon type={acc.type} />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => onEdit(acc)} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => onDelete(acc.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800">{acc.name}</h3>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-black mt-1">
                  {t.account_types[acc.type]}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-50">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {acc.type === 'Credit Card' ? t.available_credit : t.available_funds}
                </div>
                <div className="text-xl font-black font-mono text-slate-800">
                  {formatMoney(acc.balance)}
                </div>
                {acc.type === 'Credit Card' && acc.creditLimit && (() => {
                  const usedAmount = Math.max(0, acc.creditLimit - acc.balance);
                  const usedPercent = Math.min(100, Math.round((usedAmount / acc.creditLimit) * 100));
                  const ratio = usedAmount / acc.creditLimit;
                  return (
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        <span>{t.used}</span>
                        <span>{usedPercent}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            ratio > 0.9 ? 'bg-rose-500' : 
                            ratio > 0.7 ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(100, ratio * 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 mt-1">
                        {t.limit}: {formatMoney(acc.creditLimit)}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Accounts;
