import React from 'react';
import { 
  LayoutDashboard, History, Target, CreditCard, 
  TrendingUp, LogOut, Globe, User as UserIcon, FileText
} from 'lucide-react';
import { ViewType } from '../types';
import { Language } from '../translations';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  lang: Language;
  t: any;
  onSignOut: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, lang, t, onSignOut }) => {
  const isRtl = lang === 'ar';

  const menuItems: { id: ViewType; icon: React.ReactNode; label: string }[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: t.overview },
    { id: 'analytics', icon: <TrendingUp size={20} />, label: t.analytics },
    { id: 'history', icon: <History size={20} />, label: t.history },
    { id: 'budgets', icon: <Target size={20} />, label: t.budgets },
    { id: 'accounts', icon: <CreditCard size={20} />, label: t.accounts },
    { id: 'statement', icon: <FileText size={20} />, label: t.statement },
    { id: 'profile', icon: <UserIcon size={20} />, label: t.profile },
  ];

  return (
    <div className={`hidden lg:flex flex-col w-64 bg-white border-${isRtl ? 'l' : 'r'} border-slate-200 h-screen sticky top-0`}>
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <TrendingUp size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">FinSense</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            onClick={() => setActiveView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeView === item.id 
                ? 'bg-blue-50 text-blue-600 font-medium' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button
          id="btn-logout"
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut size={20} />
          <span>{t.settings} ({t.logout || 'Log Out'})</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
