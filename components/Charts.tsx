import React from 'react';
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
  Legend 
} from 'recharts';
import { Transaction, Category } from '../types';
import { Language, translations } from '../translations';

interface Props {
  transactions: Transaction[];
  lang?: Language;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#06b6d4'];

const Charts: React.FC<Props> = ({ transactions, lang = 'en' }) => {
  const t = translations[lang];
  
  const categoryData = transactions.reduce((acc, curr) => {
    const existing = acc.find(item => item.name === curr.category);
    if (existing) {
      existing.value += curr.amount;
    } else {
      acc.push({ name: curr.category, value: curr.amount });
    }
    return acc;
  }, [] as { name: Category; value: number }[]);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const dailyData = last7Days.map(date => {
    const total = transactions
      .filter(t => t.date === date)
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      name: new Date(date).toLocaleDateString(lang, { weekday: 'short' }),
      amount: total
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col min-h-[440px]">
        <h3 className="text-[10px] font-black text-gray-400 mb-8 uppercase tracking-[0.2em]">{t.spending_by_category}</h3>
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

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col min-h-[440px]">
        <h3 className="text-[10px] font-black text-gray-400 mb-8 uppercase tracking-[0.2em]">{t.daily_trend}</h3>
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