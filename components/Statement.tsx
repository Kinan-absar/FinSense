import React, { useState, useMemo } from 'react';
import { Transaction, Account, Currency } from '../types';
import { Language } from '../translations';
import { FileDown, Printer, Calendar as CalendarIcon, Filter, Search } from 'lucide-react';

interface StatementProps {
  transactions: Transaction[];
  accounts: Account[];
  currency: Currency;
  lang: Language;
  formatMoney: (amount: number) => string;
  t: any;
}

const Statement: React.FC<StatementProps> = ({ transactions, accounts, currency, lang, formatMoney, t }) => {
  const [period, setPeriod] = useState<'current' | 'last' | 'custom'>('current');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filteredData = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date;

    if (period === 'current') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (period === 'last') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else {
      start = fromDate ? new Date(fromDate) : new Date(0);
      end = toDate ? new Date(toDate) : new Date();
    }

    return transactions.filter(tr => {
      const d = new Date(tr.date);
      return d >= start && d <= end;
    });
  }, [transactions, period, fromDate, toDate]);

  const summary = useMemo(() => {
    const income = filteredData.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = filteredData.filter(t => t.type === 'expense' && !t.isSettlement).reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [filteredData]);

  const exportCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Account'];
    const rows = filteredData.map(tr => [
      tr.date,
      tr.description.replace(/,/g, ' '),
      tr.category,
      tr.type,
      tr.amount.toString(),
      accounts.find(a => a.id === tr.accountId)?.name || 'Unknown'
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `FinSense_Statement_${period}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm print:hidden">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="flex-1 space-y-4">
            <h2 className="text-xl font-bold text-slate-800">{t.statement}</h2>
            <div className="flex flex-wrap gap-2">
              {(['current', 'last', 'custom'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${period === p ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                  {t[p]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
             <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50">
               <FileDown size={18} />
               {t.export_csv}
             </button>
             <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shadow-xl shadow-slate-100">
               <Printer size={18} />
               {t.print_statement}
             </button>
          </div>
        </div>

        {period === 'custom' && (
          <div className="grid grid-cols-2 gap-4 mt-6 animate-in slide-in-from-top-2">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{t.date_from}</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{t.date_to}</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl" />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[800px]">
        {/* Printable Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">FinSense</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">{t.statement} – {period === 'custom' ? `${fromDate} to ${toDate}` : t[period]}</p>
          </div>
          <div className="text-end">
            <div className="text-2xl font-black text-slate-800 font-mono">{currency.code}</div>
            <p className="text-xs text-slate-400 font-bold uppercase mt-1">{new Date().toLocaleDateString(lang)}</p>
          </div>
        </div>

        {/* Summary Boxes */}
        <div className="grid grid-cols-3 gap-8 mb-12 border-y border-slate-50 py-8">
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.total_income}</p>
              <p className="text-xl font-bold text-emerald-600">{formatMoney(summary.income)}</p>
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.total_expenses}</p>
              <p className="text-xl font-bold text-rose-600">{formatMoney(summary.expense)}</p>
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.net_balance}</p>
              <p className={`text-xl font-bold ${summary.net >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>{formatMoney(summary.net)}</p>
           </div>
        </div>

        {/* Table */}
        <div className="space-y-4">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-900">
                <th className="py-4 text-start text-[10px] font-black uppercase tracking-widest text-slate-400">{t.date}</th>
                <th className="py-4 text-start text-[10px] font-black uppercase tracking-widest text-slate-400">{t.description}</th>
                <th className="py-4 text-start text-[10px] font-black uppercase tracking-widest text-slate-400">{t.category}</th>
                <th className="py-4 text-end text-[10px] font-black uppercase tracking-widest text-slate-400">{t.amount}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map(tr => (
                <tr key={tr.id} className="text-sm">
                  <td className="py-4 font-mono font-bold text-slate-400">{tr.date}</td>
                  <td className="py-4 font-bold text-slate-800">{tr.description}</td>
                  <td className="py-4 text-slate-500 font-medium">{(t.categories as any)[tr.category]}</td>
                  <td className={`py-4 text-end font-black font-mono ${tr.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {tr.type === 'income' ? '+' : ''}{tr.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredData.length === 0 && (
            <div className="text-center py-20 text-slate-300 font-bold italic">
              {t.no_transactions}
            </div>
          )}
        </div>

        <div className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-center opacity-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span>Generated by FinSense</span>
          <span>FinSense AI Tracker – Behavioral Insights</span>
        </div>
      </div>
    </div>
  );
};

export default Statement;
