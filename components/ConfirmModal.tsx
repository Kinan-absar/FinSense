import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Language, translations } from '../translations';

interface Props {
  lang: Language;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
}

const ConfirmModal: React.FC<Props> = ({ 
  lang, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText 
}) => {
  const t = translations[lang];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
        <button 
          onClick={onCancel} 
          className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>

        <h2 className="text-xl lg:text-2xl font-black text-gray-900 mb-2">
          {lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?'}
        </h2>
        <p className="text-sm font-bold text-gray-500 mb-8 leading-relaxed">
          {message}
        </p>

        <div className="flex gap-4">
          <button 
            onClick={onCancel} 
            className="flex-1 py-4 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-colors uppercase tracking-widest text-[10px]"
          >
            {t.cancel}
          </button>
          <button 
            onClick={onConfirm} 
            className="flex-1 py-4 rounded-2xl font-black text-white bg-rose-500 hover:bg-rose-600 shadow-xl shadow-rose-100 transition-all active:scale-95 uppercase tracking-widest text-[10px]"
          >
            {confirmText || t.delete}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;