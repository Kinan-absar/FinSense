
import React from 'react';
import { Transaction } from '../types';
import { CATEGORY_ICONS } from '../constants';
import { Smile, Frown, Meh, Zap, Moon, Clock } from 'lucide-react';
import { Language, translations } from '../translations';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  lang: Language;
}

const MoodIcon = ({ mood }: { mood: string }) => {
  switch (mood) {
    case 'Happy': return <Smile className="w-4 h-4 text-green-500" />;
    case 'Stressed': return <Zap className="w-4 h-4 text-orange-500" />;
    case 'Tired': return <Moon className="w-4 h-4 text-blue-500" />;
    case 'Bored': return <Meh className="w-4 h-4 text-gray-400" />;
    case 'Excited': return <Zap className="w-4 h-4 text-yellow-500" />;
    default: return <Smile className="w-4 h-4 text-gray-300" />;
  }
};

const TransactionList: React.FC<Props> = ({ transactions, onDelete, lang }) => {
  const tStrings = translations[lang];

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
        <p className="text-gray-400">{tStrings.no_transactions}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-start">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-start">{tStrings.description}</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-start">{tStrings.category}</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-start">{tStrings.date}</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-start">{tStrings.emotional_context}</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-end">{tStrings.amount}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-gray-800">{t.description || (lang === 'ar' ? 'بدون وصف' : 'No description')}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                      {CATEGORY_ICONS[t.category]}
                    </div>
                    <span className="text-xs text-gray-600">{(tStrings.categories as any)[t.category]}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t.date} {t.time}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <MoodIcon mood={t.mood} />
                    <span className="text-xs text-gray-600">{(tStrings.moods as any)[t.mood]}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-end">
                  <div className="flex items-center justify-end gap-4">
                    <span className="text-sm font-bold text-gray-900">{t.amount.toFixed(2)}</span>
                    <button 
                      onClick={() => onDelete(t.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all text-xs font-bold"
                    >
                      {tStrings.delete}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionList;
