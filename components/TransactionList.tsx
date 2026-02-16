import React from 'react';
import { Transaction } from '../types';
import { CATEGORY_ICONS } from '../constants';
import { Smile, Frown, Meh, Zap, Moon, Clock, Trash2, Edit2 } from 'lucide-react';
import { Language, translations } from '../translations';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit?: (transaction: Transaction) => void;
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

const TransactionList: React.FC<Props> = ({ transactions, onDelete, onEdit, lang }) => {
  const tStrings = translations[lang];

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
        <p className="text-gray-400 font-bold italic">{tStrings.no_transactions}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-start border-collapse">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-start">{tStrings.description}</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-start">{tStrings.category}</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-start">{tStrings.date}</th>
              <th className="hidden lg:table-cell px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-start">{tStrings.emotional_context}</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-end">{tStrings.amount}</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-8 py-5">
                  <span className="text-sm font-bold text-gray-800 line-clamp-1">{t.description || (lang === 'ar' ? 'بدون وصف' : 'No description')}</span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                      {CATEGORY_ICONS[t.category]}
                    </div>
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">{(tStrings.categories as any)[t.category]}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span className="whitespace-nowrap">{t.date}</span>
                  </div>
                </td>
                <td className="hidden lg:table-cell px-8 py-5">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full w-fit">
                    <MoodIcon mood={t.mood} />
                    <span className="text-[10px] font-black uppercase text-gray-500">{(tStrings.moods as any)[t.mood]}</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-end">
                  <span className="text-sm font-black text-gray-900">{t.amount.toFixed(2)}</span>
                </td>
                <td className="px-8 py-5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {onEdit && (
                      <button 
                        type="button"
                        onClick={() => onEdit(t)}
                        className="p-3 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all active:scale-90"
                        title={lang === 'ar' ? 'تعديل' : 'Edit'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(t.id);
                      }}
                      className="p-3 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                      title={tStrings.delete}
                      aria-label={tStrings.delete}
                    >
                      <Trash2 className="w-5 h-5" />
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