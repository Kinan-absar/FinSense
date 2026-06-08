import React from 'react';
import { 
  Plus, LogOut, Globe, User as UserIcon, Menu
} from 'lucide-react';
import { Language } from '../translations';
import { Currency } from '../types';
import { CURRENCIES } from '../constants';

interface NavbarProps {
  lang: Language;
  updateLanguage: (lang: Language) => void;
  currency: Currency;
  updateCurrencyByCode: (code: string) => void;
  userName: string;
  userPhoto?: string;
  onAddTransaction: () => void;
  t: any;
  setMobileMenuOpen?: (open: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  lang, 
  updateLanguage, 
  currency, 
  updateCurrencyByCode,
  userName,
  userPhoto,
  onAddTransaction,
  t,
  setMobileMenuOpen
}) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 py-3 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 lg:hidden">
          <button 
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen?.(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
          <span className="text-xl font-bold tracking-tight text-slate-800">FinSense</span>
        </div>

        <div className="hidden lg:flex items-center gap-4">
          <h1 className="text-lg font-semibold text-slate-800 capitalize leading-none">
            {t.welcome_back}, <span className="text-blue-600">{userName}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <button 
            id="btn-quick-add"
            onClick={onAddTransaction}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 rounded-xl transition-all shadow-lg shadow-blue-100 font-bold text-sm lg:text-base shrink-0 active:scale-95"
            title={t.add_transaction}
          >
            <Plus size={20} />
            <span className="hidden sm:inline">{t.add_transaction}</span>
          </button>

          <div className="h-8 w-px bg-slate-200 hidden lg:block mx-1"></div>

          <div className="hidden lg:flex items-center gap-2">
             <button
                id="toggle-lang"
                onClick={() => updateLanguage(lang === 'en' ? 'ar' : 'en')}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Globe size={18} />
                <span className="hidden xl:inline uppercase text-[10px] font-black tracking-widest">{lang === 'en' ? 'Arabic' : 'English'}</span>
              </button>

              <select
                id="select-currency"
                value={currency.code}
                onChange={(e) => updateCurrencyByCode(e.target.value)}
                className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-600 border-none focus:ring-0 cursor-pointer hover:text-blue-600 transition-colors"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
          </div>

          <div className="h-8 w-px bg-slate-200 mx-1"></div>

          <div className="flex items-center gap-2">
            {userPhoto ? (
              <img src={userPhoto} alt="Profile" className="w-8 h-8 rounded-full border border-slate-200 object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <UserIcon size={16} />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
