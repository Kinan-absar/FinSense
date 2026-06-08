import React from 'react';
import { 
  X, LayoutDashboard, History, Target, CreditCard, 
  TrendingUp, LogOut, Globe, User as UserIcon, FileText,
  DollarSign
} from 'lucide-react';
import { ViewType, Currency } from '../types';
import { Language } from '../translations';
import { CURRENCIES } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  lang: Language;
  updateLanguage: (lang: Language) => void;
  currency: Currency;
  updateCurrencyByCode: (code: string) => void;
  t: any;
  onSignOut: () => void;
  userName: string;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  activeView,
  setActiveView,
  lang,
  updateLanguage,
  currency,
  updateCurrencyByCode,
  t,
  onSignOut,
  userName
}) => {
  const isRtl = lang === 'ar';

  const menuItems: { id: ViewType; icon: React.ReactNode; label: string }[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: t.overview || 'Overview' },
    { id: 'analytics', icon: <TrendingUp size={20} />, label: t.analytics || 'Analytics' },
    { id: 'history', icon: <History size={20} />, label: t.history || 'History' },
    { id: 'budgets', icon: <Target size={20} />, label: t.budgets || 'Budgets' },
    { id: 'accounts', icon: <CreditCard size={20} />, label: t.accounts || 'Accounts' },
    { id: 'statement', icon: <FileText size={20} />, label: t.statement || 'Statement' },
    { id: 'profile', icon: <UserIcon size={20} />, label: t.profile || 'Profile' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 lg:hidden"
          />
          <motion.div
            initial={{ x: isRtl ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRtl ? '100%' : '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 bottom-0 ${isRtl ? 'right-0' : 'left-0'} w-80 bg-white z-50 lg:hidden shadow-2xl flex flex-col`}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                  <TrendingUp size={18} />
                </div>
                <span className="text-lg font-bold text-slate-800">FinSense</span>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 border-b border-slate-50">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t.welcome_back}</p>
              <p className="text-lg font-bold text-slate-800">{userName}</p>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                    activeView === item.id 
                      ? 'bg-blue-50 text-blue-600 font-bold' 
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {item.icon}
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="p-6 space-y-6 border-t border-slate-100">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Globe size={18} />
                    <span className="text-sm font-medium">{lang === 'en' ? 'Language' : 'اللغة'}</span>
                  </div>
                  <button 
                    onClick={() => updateLanguage(lang === 'en' ? 'ar' : 'en')}
                    className="text-xs font-black uppercase text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg"
                  >
                    {lang === 'en' ? 'العربية' : 'English'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500">
                    <DollarSign size={18} />
                    <span className="text-sm font-medium">{lang === 'en' ? 'Currency' : 'العملة'}</span>
                  </div>
                  <select 
                    value={currency.code}
                    onChange={(e) => updateCurrencyByCode(e.target.value)}
                    className="text-xs font-black bg-slate-50 border-none rounded-lg px-2 py-1 focus:ring-0"
                  >
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 transition-all font-bold text-sm"
              >
                <LogOut size={20} />
                {t.logout || 'Log Out'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
