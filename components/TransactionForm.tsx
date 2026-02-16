import React, { useState, useMemo, useEffect } from 'react';
import { CATEGORIES, MOODS } from '../constants';
import { Transaction, Category, Mood, Account } from '../types';
import { PlusCircle, X, ArrowDownRight, RefreshCw } from 'lucide-react';
import { Language, translations } from '../translations';

interface Props {
  accounts: Account[];
  initialData?: Transaction | null;
  // Fixed: simplified onAdd parameter since properties are now in Transaction interface
  onAdd: (t: Omit<Transaction, 'userId'>) => void;
  onUpdate?: (id: string, t: Partial<Transaction>) => void;
  onClose: () => void;
  lang: Language;
}

const TransactionForm: React.FC<Props> = ({ accounts, initialData, onAdd, onUpdate, onClose, lang }) => {
  const t = translations[lang];
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [category, setCategory] = useState<Category>(initialData?.category || CATEGORIES[0]);
  const [description, setDescription] = useState(initialData?.description || '');
  const [mood, setMood] = useState<Mood>(initialData?.mood || 'Neutral');
  const [accountId, setAccountId] = useState(initialData?.accountId || accounts[0]?.id || '');
  // Fixed: access targetAccountId and isSettlement properties on Transaction
  const [targetAccountId, setTargetAccountId] = useState(initialData?.targetAccountId || '');
  const [isSettlement, setIsSettlement] = useState(initialData?.isSettlement || false);
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(initialData?.time || new Date().toTimeString().slice(0, 5));

  const creditCardAccounts = useMemo(() => accounts.filter(a => a.type === 'Credit Card'), [accounts]);
  const fundingAccounts = useMemo(() => accounts.filter(a => a.type !== 'Credit Card'), [accounts]);

  const isEditing = !!initialData;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    if (isSettlement && !targetAccountId) return;

    const transactionData: any = {
      amount: Number(amount),
      category: isSettlement ? 'Settlement' : category,
      description: isSettlement ? (description.startsWith(t.is_settlement) ? description : `${t.is_settlement}: ${description}`) : description,
      mood,
      date,
      time,
      accountId,
      isSettlement,
      targetAccountId: isSettlement ? targetAccountId : null,
    };

    if (isEditing && onUpdate && initialData?.id) {
      onUpdate(initialData.id, transactionData);
    } else {
      onAdd({
        ...transactionData,
        id: Math.random().toString(36).substr(2, 9),
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditing ? (lang === 'ar' ? 'تعديل المعاملة' : 'Edit Transaction') : t.log_transaction}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100 mb-2">
            <div className="flex items-center gap-3">
               <ArrowDownRight className="w-5 h-5 text-blue-600" />
               <span className="text-sm font-bold text-blue-900">{t.is_settlement}</span>
            </div>
            <button 
              type="button"
              onClick={() => {
                const nextState = !isSettlement;
                setIsSettlement(nextState);
                if (nextState) {
                  const firstFund = fundingAccounts[0]?.id;
                  if (firstFund) setAccountId(firstFund);
                  const firstCC = creditCardAccounts[0]?.id;
                  if (firstCC) setTargetAccountId(firstCC);
                }
              }}
              className={`w-12 h-6 rounded-full transition-all relative ${isSettlement ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${lang === 'ar' ? (isSettlement ? 'right-7' : 'right-1') : (isSettlement ? 'left-7' : 'left-1')}`} />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t.amount}</label>
            <input
              required
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-4 text-2xl font-bold border border-gray-100 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t.source_account}</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none font-bold text-gray-700"
            >
              {(isSettlement ? fundingAccounts : accounts).map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} ({acc.balance.toLocaleString()})</option>
              ))}
            </select>
          </div>

          {isSettlement && (
            <div className="animate-in slide-in-from-top-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t.target_credit_card}</label>
              <select
                required
                value={targetAccountId}
                onChange={(e) => setTargetAccountId(e.target.value)}
                className="w-full px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm outline-none font-bold text-emerald-700"
              >
                <option value="" disabled>Select Credit Card</option>
                {creditCardAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (Available: {acc.balance.toLocaleString()})</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm" />
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm" />
          </div>

          {!isSettlement && (
            <select value={category} onChange={e => setCategory(e.target.value as Category)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm">
              {CATEGORIES.filter(c => c !== 'Settlement').map(c => <option key={c} value={c}>{(t.categories as any)[c]}</option>)}
            </select>
          )}

          <div className="flex flex-wrap gap-2">
            {MOODS.map(m => (
              <button key={m} type="button" onClick={() => setMood(m)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${mood === m ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{(t.moods as any)[m]}</button>
            ))}
          </div>

          <input 
            type="text" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20" 
            placeholder={t.description} 
          />

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center justify-center gap-2">
            {isEditing ? <RefreshCw className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
            {isEditing ? (lang === 'ar' ? 'تحديث' : 'Update') : (lang === 'ar' ? 'إضافة' : 'Add')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;