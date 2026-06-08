import React from 'react';
import { BudgetGoal, Transaction, Category } from '../types';
import { Language } from '../translations';
import { CATEGORIES } from '../constants';
import { Plus, Target, Trash2, Edit2, AlertCircle } from 'lucide-react';

interface BudgetsProps {
  goals: BudgetGoal[];
  transactions: Transaction[];
  onAdd: () => void;
  onEdit: (goal: BudgetGoal) => void;
  onDelete: (id: string) => void;
  onToggleItem: (goalId: string, itemId: string) => void;
  lang: Language;
  formatMoney: (amount: number) => string;
  t: any;
}

const Budgets: React.FC<BudgetsProps> = ({ goals, transactions, onAdd, onEdit, onDelete, onToggleItem, lang, formatMoney, t }) => {
  const now = new Date();
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">{t.budgets}</h2>
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <Plus size={18} />
          {t.new_budget}
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
          <Target size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-bold italic">{t.no_budgets}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map(goal => {
            const spent = transactions
              .filter(tr => {
                const d = new Date(tr.date);
                return tr.category === goal.category && 
                       d.getMonth() === now.getMonth() && 
                       d.getFullYear() === now.getFullYear() && 
                       tr.type === 'expense';
              })
              .reduce((acc, curr) => acc + curr.amount, 0);
            
            const percent = Math.min(100, (spent / goal.limit) * 100);
            const isExceeded = spent > goal.limit;

            return (
              <div key={goal.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{t.categories[goal.category]}</h3>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-black mt-1">
                      {t.limit}: {formatMoney(goal.limit)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => onEdit(goal)} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => onDelete(goal.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className={`text-sm font-black font-mono ${isExceeded ? 'text-rose-600' : 'text-slate-800'}`}>
                      {formatMoney(spent)}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {Math.round(percent)}%
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${isExceeded ? 'bg-rose-500' : percent > 80 ? 'bg-amber-500' : 'bg-blue-600'}`} 
                      style={{ width: `${percent}%` }} 
                    />
                  </div>
                </div>

                {isExceeded && (
                  <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded-xl">
                    <AlertCircle size={16} />
                    <span className="text-xs font-bold">{t.limit_exceeded}</span>
                  </div>
                )}

                {/* Sub-items Checklist */}
                {goal.items && goal.items.length > 0 && (
                  <div className="border-t border-slate-50 pt-3 mt-4 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <span>{t.trip_checklist}</span>
                      <span className="font-mono text-[10px]">
                        {goal.items.filter(i => i.completed).length}/{goal.items.length}
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {goal.items.map(item => {
                        return (
                          <div 
                            key={item.id} 
                            onClick={() => onToggleItem(goal.id, item.id)}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 cursor-pointer transition-all text-xs select-none"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                item.completed 
                                  ? 'bg-blue-600 border-blue-600 text-white' 
                                  : 'border-slate-300 bg-white'
                              }`}>
                                {item.completed && (
                                  <svg className="w-2.5 h-2.5 stroke-[3] fill-none stroke-current" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                  </svg>
                                )}
                              </span>
                              <span className={`font-medium ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                {item.name}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-slate-500">
                              {formatMoney(item.cost)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Budgets;
