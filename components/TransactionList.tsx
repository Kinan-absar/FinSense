import React from 'react';
import { Transaction } from '../types';
import { CATEGORY_ICONS } from '../constants';
import { 
  Smile, 
  Zap, 
  Moon, 
  Meh, 
  Clock, 
  Trash2, 
  Edit2, 
  Repeat, 
  Paperclip, 
  Download, 
  X, 
  Eye, 
  ExternalLink 
} from 'lucide-react';
import { Language, translations } from '../translations';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit?: (transaction: Transaction) => void;
  lang: Language;
  currencySymbol: string;
}

const MoodIcon = ({ mood }: { mood: string }) => {
  switch (mood) {
    case 'Happy': return <Smile className="w-4 h-4 text-emerald-500" />;
    case 'Stressed': return <Zap className="w-4 h-4 text-rose-500" />;
    case 'Tired': return <Moon className="w-4 h-4 text-indigo-500" />;
    case 'Bored': return <Meh className="w-4 h-4 text-slate-400" />;
    case 'Excited': return <Zap className="w-4 h-4 text-amber-500" />;
    default: return <Smile className="w-4 h-4 text-slate-300" />;
  }
};

const TransactionList: React.FC<Props> = ({ transactions, onDelete, onEdit, lang, currencySymbol }) => {
  const tStrings = translations[lang];
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
        <p className="text-slate-400 font-bold italic">{tStrings.no_transactions}</p>
      </div>
    );
  }

  // Trigger browser downloader
  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `receipt_attachment_${Date.now()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      // CORS fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  return (
    <>
      {/* List container styled for responsive sizing */}
      <div className="bg-transparent md:bg-white rounded-[2.5rem] md:shadow-sm md:border md:border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* DESKTOP VIEW: Pure table for medium and large screens */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-start border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-start">{tStrings.description}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-start">{tStrings.category}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-start">{tStrings.date}</th>
                <th className="hidden lg:table-cell px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-start print:hidden">{tStrings.emotional_context}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-start">{tStrings.attachment}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-end">{tStrings.amount}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center print:hidden"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                  {/* Title / Description */}
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800 line-clamp-1">{t.description || (lang === 'ar' ? 'بدون وصف' : 'No description')}</span>
                      {t.isRecurring && <Repeat size={14} className="text-blue-500 font-bold" title={tStrings.is_recurring} />}
                      {t.attachments && t.attachments.length > 0 && <Paperclip size={14} className="text-slate-400" />}
                    </div>
                  </td>
                  {/* Category */}
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl shrink-0 print:hidden ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'}`}>
                        {CATEGORY_ICONS[t.category]}
                      </div>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">{(tStrings.categories as any)[t.category]}</span>
                    </div>
                  </td>
                  {/* Date */}
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-blue-500 print:hidden" />
                      <span className="whitespace-nowrap font-mono">{t.date}</span>
                    </div>
                  </td>
                  {/* Mood Status */}
                  <td className="hidden lg:table-cell px-8 py-5 print:hidden">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full w-fit">
                      <MoodIcon mood={t.mood} />
                      <span className="text-[10px] font-black uppercase text-slate-500">{(tStrings.moods as any)[t.mood]}</span>
                    </div>
                  </td>
                  {/* Attachment Column */}
                  <td className="px-8 py-5">
                    {t.attachments && t.attachments.length > 0 ? (
                      <div className="flex gap-1.5">
                        {t.attachments.map((url, index) => (
                          <div 
                            key={index} 
                            className="relative group/thumb w-12 h-12 rounded-xl overflow-hidden border border-slate-100 shadow-sm transition-all duration-300 hover:scale-125 hover:z-10 bg-slate-50 cursor-pointer"
                            onClick={() => setLightboxUrl(url)}
                          >
                            <img
                              src={url}
                              alt="Receipt receipt"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white pointer-events-none">
                              <Eye size={12} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-300 font-mono">-</span>
                    )}
                  </td>
                  {/* Amount */}
                  <td className="px-8 py-5 text-end">
                    <span className={`text-sm font-black font-mono ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'income' ? '+' : '-'}{currencySymbol} {t.amount.toLocaleString(lang, { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="px-8 py-5 text-center print:hidden">
                    <div className="flex items-center justify-center gap-1">
                      {onEdit && (
                        <button 
                          type="button"
                          onClick={() => onEdit(t)}
                          className="p-3 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all active:scale-90"
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
                        className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
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

        {/* MOBILE VIEW: Gorgeous Card list for smaller screens */}
        <div className="block md:hidden space-y-4">
          {transactions.map((t) => (
            <div 
              key={t.id} 
              className="bg-white rounded-3xl p-5 border border-slate-100/80 shadow-sm transition-all hover:border-slate-200/90 flex flex-col gap-4 animate-in fade-in duration-300"
            >
              {/* Header inside the card: category & amount */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl shrink-0 ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'}`}>
                    {CATEGORY_ICONS[t.category]}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                      {(tStrings.categories as any)[t.category]}
                    </span>
                    <span className="text-sm font-bold text-slate-800 line-clamp-1 flex items-center gap-1.5">
                      {t.description || (lang === 'ar' ? 'بدون وصف' : 'No description')}
                      {t.isRecurring && <Repeat size={12} className="text-blue-500 font-black" />}
                    </span>
                  </div>
                </div>

                <div className="text-end">
                  <div className={`text-base font-black font-mono leading-none ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{currencySymbol}{t.amount.toLocaleString(lang, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 font-mono mt-1 flex items-center gap-1 justify-end">
                    <Clock size={10} className="text-blue-500" />
                    <span>{t.date}</span>
                  </div>
                </div>
              </div>

              {/* Row for mood and actions */}
              <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                {/* Mood Indicator */}
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full">
                  <MoodIcon mood={t.mood} />
                  <span className="text-[9px] font-black uppercase text-slate-500">{(tStrings.moods as any)[t.mood]}</span>
                </div>

                {/* Left controls */}
                <div className="flex items-center gap-1">
                  {onEdit && (
                    <button 
                      type="button"
                      onClick={() => onEdit(t)}
                      className="p-2.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                      title={lang === 'ar' ? 'تعديل' : 'Edit'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    type="button"
                    onClick={() => onDelete(t.id)}
                    className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    title={tStrings.delete}
                    aria-label={tStrings.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Attachment thumbnail viewer in mobile card if present */}
              {t.attachments && t.attachments.length > 0 && (
                <div className="border-t border-slate-50 pt-3">
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    {tStrings.attachment}
                  </div>
                  <div className="flex gap-2">
                    {t.attachments.map((url, i) => (
                      <div 
                        key={i} 
                        className="relative group/mThumb w-14 h-14 rounded-xl overflow-hidden border border-slate-100 shadow-sm cursor-pointer"
                        onClick={() => setLightboxUrl(url)}
                      >
                        <img
                          src={url}
                          alt="Receipt thumbnail"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white pointer-events-none">
                          <Eye size={12} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>

      {/* LIGHTBOX MODAL WITH ZOOM & DOWNLOAD CONTROLS */}
      {lightboxUrl && (
        <div 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setLightboxUrl(null)}
        >
          {/* Close trigger in right header */}
          <button 
            onClick={() => setLightboxUrl(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white/30"
            title={lang === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X size={20} />
          </button>

          <div 
            className="relative max-w-4xl max-h-[80vh] flex flex-col items-center" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Displaying Image nicely */}
            <img
              src={lightboxUrl}
              alt="Transaction attachment preview"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200"
            />
            
            {/* Toolbar under preview */}
            <div className="mt-5 flex gap-3 text-white">
              <button
                onClick={() => handleDownload(lightboxUrl)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg select-none"
              >
                <Download size={14} />
                <span>{tStrings.download}</span>
              </button>
              
              <a
                href={lightboxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center p-3 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl transition-all"
                title={lang === 'ar' ? 'فتح في علامة تبويب جديدة' : 'Open in new tab'}
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TransactionList;
