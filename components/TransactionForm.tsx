import React, { useState, useMemo, useRef } from 'react';
import { CATEGORIES, MOODS } from '../constants';
import { Transaction, Category, Mood, Account } from '../types';
import { PlusCircle, X, ArrowDownRight, RefreshCw, Camera, Loader2, Sparkles, CheckCircle2, AlertCircle, Lightbulb } from 'lucide-react';
import { Language, translations } from '../translations';
import { GoogleGenAI, Type } from "@google/genai";

interface Props {
  accounts: Account[];
  initialData?: Transaction | null;
  onAdd: (t: Omit<Transaction, 'userId'>) => void;
  onUpdate?: (id: string, t: Partial<Transaction>) => void;
  onClose: () => void;
  lang: Language;
}

const TransactionForm: React.FC<Props> = ({ accounts, initialData, onAdd, onUpdate, onClose, lang }) => {
  const tStrings = translations[lang];
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [category, setCategory] = useState<Category>(initialData?.category || CATEGORIES[0]);
  const [description, setDescription] = useState(initialData?.description || '');
  const [mood, setMood] = useState<Mood>(initialData?.mood || 'Neutral');
  const [accountId, setAccountId] = useState(initialData?.accountId || accounts[0]?.id || '');
  const [targetAccountId, setTargetAccountId] = useState(initialData?.targetAccountId || '');
  const [isSettlement, setIsSettlement] = useState(initialData?.isSettlement || false);
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(initialData?.time || new Date().toTimeString().slice(0, 5));

  // OCR States
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const creditCardAccounts = useMemo(() => accounts.filter(a => a.type === 'Credit Card'), [accounts]);
  const fundingAccounts = useMemo(() => accounts.filter(a => a.type !== 'Credit Card'), [accounts]);

  const isEditing = !!initialData;

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setScanStatus('idle');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: [
            {
              inlineData: {
                data: base64Data,
                mimeType: file.type,
              },
            },
            {
              text: `You are a financial accounting expert. Your task is to extract high-accuracy transaction data from the provided image of a receipt, invoice, or bill.
              
              Rules:
              1. **Grand Total**: Identify the final amount paid. Ignore sub-totals or tax breakdowns. Look for keywords like "Total", "Balance Due", "Net", or "Amount".
              2. **Merchant Name**: Look at the top of the image for the vendor/business name.
              3. **Date**: Extract the purchase date in YYYY-MM-DD format. If not found, use today's date (${new Date().toISOString().split('T')[0]}).
              4. **Category**: Match the merchant or items to the most logical category from this specific list: [${CATEGORIES.join(', ')}].
              5. **Mood**: Based on the purchase type (e.g., luxury=Excited, bill=Stressed, food=Happy), choose one from: [${MOODS.join(', ')}].
              
              Output your findings ONLY as a pure JSON object. No markdown, no explanations.`,
            },
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                amount: { type: Type.NUMBER, description: "The final total amount shown on the receipt" },
                date: { type: Type.STRING, description: "Date in YYYY-MM-DD format" },
                description: { type: Type.STRING, description: "Merchant or store name" },
                category: { type: Type.STRING, description: "One of the provided category names" },
                mood: { type: Type.STRING, description: "One of the provided mood types" }
              },
              required: ["amount", "description"]
            }
          }
        });

        const rawText = response.text || '{}';
        const result = JSON.parse(rawText);
        
        if (result.amount) setAmount(result.amount.toString());
        if (result.description) setDescription(result.description);
        if (result.date && /^\d{4}-\d{2}-\d{2}$/.test(result.date)) setDate(result.date);
        
        // Ensure category matches valid options
        if (result.category && CATEGORIES.includes(result.category)) {
          setCategory(result.category as Category);
        }
        
        if (result.mood && MOODS.includes(result.mood)) {
          setMood(result.mood as Mood);
        }

        setScanStatus('success');
        setTimeout(() => setScanStatus('idle'), 3000);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("OCR Scan error:", err);
      setScanStatus('error');
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    if (isSettlement && !targetAccountId) return;

    // Construct a plain object to avoid circular references
    const transactionData = {
      amount: Number(amount),
      category: isSettlement ? 'Settlement' : category,
      description: isSettlement ? (description.startsWith(tStrings.is_settlement) ? description : `${tStrings.is_settlement}: ${description}`) : description,
      mood: mood,
      date: date,
      time: time,
      accountId: accountId,
      isSettlement: isSettlement,
      targetAccountId: isSettlement ? targetAccountId : null,
    };

    if (isEditing && onUpdate && initialData?.id) {
      onUpdate(initialData.id, transactionData);
    } else {
      onAdd({
        ...transactionData,
        id: Math.random().toString(36).substr(2, 9),
      } as any);
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
          {/* AI OCR Section */}
          {!isEditing && !isSettlement && (
            <div className="space-y-3">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleScanReceipt} />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={scanning}
                className={`w-full group flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed transition-all active:scale-95 ${scanStatus === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : scanStatus === 'error' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-blue-50 border-blue-100 text-blue-600 hover:border-blue-300'}`}
              >
                {scanning ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : scanStatus === 'success' ? (
                  <CheckCircle2 className="w-8 h-8 animate-bounce" />
                ) : scanStatus === 'error' ? (
                  <AlertCircle className="w-8 h-8" />
                ) : (
                  <Camera className="w-8 h-8 group-hover:scale-110 transition-transform" />
                )}
                <div className="text-center">
                  <span className="text-sm font-black uppercase tracking-widest block">
                    {scanning ? tStrings.scanning : scanStatus === 'success' ? tStrings.scan_success : scanStatus === 'error' ? tStrings.scan_error : tStrings.scan_receipt}
                  </span>
                  {!scanning && scanStatus === 'idle' && (
                    <span className="text-[10px] opacity-60 font-bold block mt-1">
                      {lang === 'ar' ? 'صور الفاتورة لاستخراج البيانات بدقة' : 'High-precision scanning for receipts and invoices'}
                    </span>
                  )}
                </div>
              </button>

              {/* Scanning Tips */}
              {!scanning && scanStatus === 'idle' && (
                <div className="bg-blue-50/30 p-4 rounded-xl flex gap-3 border border-blue-100/50">
                   <Lightbulb className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                   <p className="text-[10px] font-bold text-gray-500 leading-relaxed">
                     {lang === 'ar' 
                        ? 'نصيحة: تأكد من أن الفاتورة مفرودة وإضاءة المكان جيدة للحصول على أفضل النتائج.' 
                        : 'Tip: Ensure the receipt is flat and well-lit for the best extraction accuracy.'}
                   </p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-3">
               <ArrowDownRight className="w-5 h-5 text-blue-600" />
               <span className="text-sm font-bold text-blue-900">{tStrings.is_settlement}</span>
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
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{tStrings.amount}</label>
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
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{tStrings.source_account}</label>
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
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{tStrings.target_credit_card}</label>
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
              {CATEGORIES.filter(c => c !== 'Settlement').map(c => <option key={c} value={c}>{(tStrings.categories as any)[c]}</option>)}
            </select>
          )}

          <div className="flex flex-wrap gap-2">
            {MOODS.map(m => (
              <button key={m} type="button" onClick={() => setMood(m)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${mood === m ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{(tStrings.moods as any)[m]}</button>
            ))}
          </div>

          <input 
            type="text" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20" 
            placeholder={tStrings.description} 
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