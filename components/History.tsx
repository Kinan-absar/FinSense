import React from 'react';
import { Transaction } from '../types';
import { Language } from '../translations';
import TransactionList from './TransactionList';
import { Search, Filter } from 'lucide-react';

interface HistoryProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (t: Transaction) => void;
  lang: Language;
  currencySymbol: string;
  t: any;
}

const History: React.FC<HistoryProps> = ({ transactions, onDelete, onEdit, lang, currencySymbol, t }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');

  const filtered = transactions.filter(tr => {
    const matchesSearch = tr.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         tr.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || tr.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder={t.search || 'Search transactions...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="text-slate-400" size={18} />
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex-1 md:flex-none px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none font-medium text-slate-600"
          >
            <option value="all">{lang === 'ar' ? 'كل الفئات' : 'All Categories'}</option>
            {Object.keys(t.categories).map(cat => (
              <option key={cat} value={cat}>{t.categories[cat]}</option>
            ))}
          </select>
        </div>
      </div>

      <TransactionList 
        transactions={filtered} 
        onDelete={onDelete} 
        onEdit={onEdit} 
        lang={lang} 
        currencySymbol={currencySymbol} 
      />
    </div>
  );
};

export default History;
