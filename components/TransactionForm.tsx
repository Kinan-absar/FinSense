import React, { useState, useMemo, useRef } from 'react';
import { CATEGORIES, MOODS } from '../constants';
import { Transaction, Category, Mood, Account, TransactionType, RecurringFrequency } from '../types';
import { PlusCircle, X, ArrowDownRight, RefreshCw, Camera, CheckCircle2, AlertCircle, Calendar, Repeat } from 'lucide-react';
import { Language, translations } from '../translations';

interface Props {
  accounts: Account[];
  initialData?: Transaction | null;
  onAdd: (t: Omit<Transaction, 'id' | 'userId'>) => void;
  onUpdate?: (id: string, t: Partial<Transaction>) => void;
  onClose: () => void;
  lang: Language;
}

const TransactionForm: React.FC<Props> = ({ accounts, initialData, onAdd, onUpdate, onClose, lang }) => {
  const tStrings = translations[lang];
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [category, setCategory] = useState<Category>(initialData?.category || CATEGORIES[0]);
  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  const [description, setDescription] = useState(initialData?.description || '');
  const [mood, setMood] = useState<Mood>(initialData?.mood || 'Neutral');
  const [accountId, setAccountId] = useState(initialData?.accountId || accounts[0]?.id || '');
  const [targetAccountId, setTargetAccountId] = useState(initialData?.targetAccountId || '');
  const [isSettlement, setIsSettlement] = useState(initialData?.isSettlement || false);
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(initialData?.time || new Date().toTimeString().slice(0, 5));
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring || false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>(initialData?.recurringFrequency || 'monthly');

  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [attachments, setAttachments] = useState<string[]>(initialData?.attachments || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const creditCardAccounts = useMemo(() => accounts.filter(a => a.type === 'Credit Card'), [accounts]);
  const fundingAccounts = useMemo(() => accounts.filter(a => a.type !== 'Credit Card'), [accounts]);

  const isEditing = !!initialData;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert(lang === 'ar' ? 'حجم الملف كبير جداً (الحد الأقصى ٢ ميجابايت)' : 'File size too large (Max 2MB)');
      return;
    }

    setUploading(true);
    setUploadStatus('idle');

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments(prev => [...prev, reader.result as string]);
        setUploadStatus('success');
        setTimeout(() => setUploadStatus('idle'), 3000);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    if (isSettlement && !targetAccountId) return;

    const transactionData = {
      amount: Number(amount),
      category: isSettlement ? 'Settlement' : category,
      type: isSettlement ? 'expense' : type,
      description: isSettlement ? (description.startsWith(tStrings.is_settlement) ? description : `${tStrings.is_settlement}: ${description}`) : description,
      mood: mood,
      date: date,
      time: time,
      accountId: accountId,
      isSettlement: isSettlement,
      targetAccountId: isSettlement ? targetAccountId : null,
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
      attachments
    };

    if (isEditing && onUpdate && initialData?.id) {
      onUpdate(initialData.id, transactionData);
    } else {
      onAdd(transactionData as any);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditing ? (lang === 'ar' ? 'تعديل المعاملة' : 'Edit Transaction') : tStrings.log_transaction}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Type Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => { setType('expense'); setIsSettlement(false); }}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tStrings.expense}
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); setIsSettlement(false); setCategory('Income'); }}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tStrings.income}
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{tStrings.amount}</label>
            <input
              required
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full px-4 py-4 text-2xl font-bold border border-gray-100 bg-gray-50 rounded-2xl focus:ring-2 outline-none transition-all ${type === 'income' ? 'text-emerald-600 focus:ring-emerald-500' : 'text-rose-600 focus:ring-rose-500'}`}
              placeholder="0.00"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-3">
               <ArrowDownRight className="w-5 h-5 text-blue-600" />
               <span className="text-sm font-bold text-blue-900">{tStrings.is_settlement}</span>
            </div>
            <button 
              type="button"
              disabled={type === 'income'}
              onClick={() => {
                const nextState = !isSettlement;
                setIsSettlement(nextState);
                if (nextState) {
                  const firstFund = fundingAccounts[0]?.id;
                  if (firstFund) setAccountId(firstFund);
                  const firstCC = creditCardAccounts[0]?.id;
                  if (firstCC) setTargetAccountId(firstCC);
                  setType('expense');
                }
              }}
              className={`w-12 h-6 rounded-full transition-all relative ${isSettlement ? 'bg-blue-600' : 'bg-gray-200'} ${type === 'income' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${lang === 'ar' ? (isSettlement ? 'right-7' : 'right-1') : (isSettlement ? 'left-7' : 'left-1')}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{tStrings.source_account}</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none font-bold text-gray-700"
              >
                {(isSettlement ? fundingAccounts : accounts).map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{tStrings.category}</label>
              <select 
                disabled={isSettlement || type === 'income'}
                value={category} 
                onChange={e => setCategory(e.target.value as Category)} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none"
              >
                {CATEGORIES.filter(c => c !== 'Settlement' && (type === 'income' ? c === 'Income' : c !== 'Income')).map(c => <option key={c} value={c}>{(tStrings.categories as any)[c]}</option>)}
              </select>
            </div>
          </div>

          {isSettlement && (
            <div className="animate-in slide-in-from-top-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{tStrings.target_credit_card}</label>
              <select
                required
                value={targetAccountId}
                onChange={(e) => setTargetAccountId(e.target.value)}
                className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm outline-none font-bold text-blue-700"
              >
                <option value="" disabled>Select Credit Card</option>
                {creditCardAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm" />
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm" />
          </div>

          {/* Recurring Options */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Repeat className="w-5 h-5 text-slate-500" />
                <span className="text-sm font-bold text-slate-700">{tStrings.is_recurring}</span>
              </div>
              <button 
                type="button"
                onClick={() => setIsRecurring(!isRecurring)}
                className={`w-12 h-6 rounded-full transition-all relative ${isRecurring ? 'bg-blue-600' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${lang === 'ar' ? (isRecurring ? 'right-7' : 'right-1') : (isRecurring ? 'left-7' : 'left-1')}`} />
              </button>
            </div>
            {isRecurring && (
              <select
                value={recurringFrequency}
                onChange={(e) => setRecurringFrequency(e.target.value as RecurringFrequency)}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none"
              >
                <option value="weekly">{tStrings.weekly}</option>
                <option value="monthly">{tStrings.monthly}</option>
                <option value="yearly">{tStrings.yearly}</option>
              </select>
            )}
          </div>

          {!isSettlement && (
            <div className="flex flex-wrap gap-2">
              {MOODS.map(m => (
                <button 
                  key={m} 
                  type="button" 
                  onClick={() => setMood(m)} 
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${mood === m ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {(tStrings.moods as any)[m]}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <input 
              type="text" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20" 
              placeholder={tStrings.description} 
            />

            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <Camera size={16} />
                {tStrings.attachments || (lang === 'ar' ? 'إرفاق صورة' : 'Attach Photo')}
              </button>
              {attachments.length > 0 && (
                <div className="flex gap-2">
                  {attachments.map((at, i) => (
                    <div key={i} className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-200">
                      <img src={at} className="w-full h-full object-cover" />
                      <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center justify-center gap-2">
            {isEditing ? <RefreshCw className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
            {isEditing ? tStrings.update : tStrings.add_transaction}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
