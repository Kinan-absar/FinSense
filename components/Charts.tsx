import React, { useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { Transaction, Category, Currency, BudgetGoal } from '../types';
import { Language, translations } from '../translations';

interface Props {
  transactions: Transaction[];
  goals?: BudgetGoal[];
  currency?: Currency;
  lang?: Language;
  t?: any;
  view?: 'dashboard' | 'analytics-mood' | 'analytics-trend' | 'analytics-categories';
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#06b6d4'];

const Charts: React.FC<Props> = ({ transactions, goals = [], currency, lang = 'en', t: tProp, view = 'dashboard' }) => {
  const t = tProp || translations[lang];
  
  const filteredTransactions = useMemo(() => 
    transactions.filter(tr => !tr.isSettlement && tr.type === 'expense'), 
  [transactions]);

  const categoryData = useMemo(() => filteredTransactions.reduce((acc, curr) => {
    const existing = acc.find(item => item.name === curr.category);
    if (existing) {
      existing.value += curr.amount;
    } else {
      acc.push({ name: curr.category, value: curr.amount });
    }
    return acc;
  }, [] as { name: Category; value: number }[]), [filteredTransactions]);

  const moodData = useMemo(() => filteredTransactions.reduce((acc, curr) => {
    const existing = acc.find(item => item.name === curr.mood);
    if (existing) {
      existing.value += curr.amount;
    } else {
      acc.push({ name: curr.mood, value: curr.amount });
    }
    return acc;
  }, [] as { name: string; value: number }[]), [filteredTransactions]);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const dailyData = last7Days.map(date => {
    const total = filteredTransactions
      .filter(t => t.date === date)
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      name: new Date(date).toLocaleDateString(lang, { weekday: 'short' }),
      amount: total
    };
  });

  const last6Months = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        month: d.getMonth(),
        year: d.getFullYear(),
        label: d.toLocaleDateString(lang, { month: 'short' })
      };
    }).reverse();
  }, [lang]);

  const trendData = useMemo(() => last6Months.map(m => {
    const monthTransactions = transactions.filter(tr => {
      const d = new Date(tr.date);
      return d.getMonth() === m.month && d.getFullYear() === m.year;
    });
    const income = monthTransactions.filter(tr => tr.type === 'income').reduce((s, tr) => s + tr.amount, 0);
    const expense = monthTransactions.filter(tr => tr.type === 'expense' && !tr.isSettlement).reduce((s, tr) => s + tr.amount, 0);
    return {
      name: m.label,
      income,
      expense
    };
  }), [transactions, last6Months]);

  const comparisonData = useMemo(() => {
    return goals.map(goal => {
      const spent = transactions
        .filter(tr => {
          const d = new Date(tr.date);
          const now = new Date();
          return tr.category === goal.category && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && tr.type === 'expense';
        })
        .reduce((acc, curr) => acc + curr.amount, 0);
      return {
        name: (t.categories as any)[goal.category] || goal.category,
        spent,
        limit: goal.limit
      };
    });
  }, [transactions, goals, t.categories]);

  if (view === 'analytics-mood') {
    return (
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={moodData}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              cx="50%"
              cy="50%"
            >
              {moodData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => value.toFixed(2)}
              contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1) padding: 16px' }}
            />
            <Legend formatter={(value: string) => (t.moods as any)[value] || value} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (view === 'analytics-trend') {
    return (
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (view === 'analytics-categories') {
    return (
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={comparisonData} layout="vertical" margin={{ left: 40, right: 40 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#64748b' }} width={120} />
            <Tooltip contentStyle={{ borderRadius: '16px' }} />
            <Legend />
            <Bar dataKey="spent" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
            <Bar dataKey="limit" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col min-h-[440px]">
        <h3 className="text-[10px] font-black text-slate-400 mb-8 uppercase tracking-[0.2em]">{t.spending_by_category}</h3>
        <div className="flex-1 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                innerRadius={80}
                outerRadius={105}
                paddingAngle={6}
                dataKey="value"
                cx="50%"
                cy="42%"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => value.toFixed(2)}
                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px' }}
                itemStyle={{ fontWeight: '800', fontSize: '12px' }}
              />
              <Legend 
                verticalAlign="bottom" 
                align="center"
                iconType="circle"
                wrapperStyle={{ paddingTop: '32px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                formatter={(value: Category) => (t.categories as any)[value] || value}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col min-h-[440px]">
        <h3 className="text-[10px] font-black text-slate-400 mb-8 uppercase tracking-[0.2em]">{t.daily_trend}</h3>
        <div className="flex-1 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
              />
              <Tooltip 
                formatter={(value: number) => value.toFixed(2)}
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px' }}
                itemStyle={{ fontWeight: '800', fontSize: '12px' }}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Charts;
