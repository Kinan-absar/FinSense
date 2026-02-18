import React from 'react';
import { 
  Utensils, 
  Car, 
  ShoppingBag, 
  Gamepad2, 
  Lightbulb, 
  HeartPulse, 
  GraduationCap, 
  MoreHorizontal,
  ArrowDownRight
} from 'lucide-react';
import { Category, Mood, BudgetGoal, Currency } from './types';

export const CATEGORIES: Category[] = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Health',
  'Education',
  'Settlement',
  'Other'
];

export const MOODS: Mood[] = ['Happy', 'Stressed', 'Tired', 'Bored', 'Excited', 'Neutral'];

export const CURRENCIES: Currency[] = [
  { code: 'SAR', symbol: '﷼', label: 'Saudi Riyal' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'QAR', symbol: 'ر.ق', label: 'Qatari Riyal' },
  { code: 'KWD', symbol: 'د.ك', label: 'Kuwaiti Dinar' },
  { code: 'BHD', symbol: 'د.ب', label: 'Bahraini Dinar' },
  { code: 'OMR', symbol: 'ر.ع.', label: 'Omani Rial' },
  { code: 'EGP', symbol: 'E£', label: 'Egyptian Pound' },
  { code: 'JOD', symbol: 'JD', label: 'Jordanian Dinar' }
];

export const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  'Food & Dining': <Utensils className="w-5 h-5" />,
  'Transportation': <Car className="w-5 h-5" />,
  'Shopping': <ShoppingBag className="w-5 h-5" />,
  'Entertainment': <Gamepad2 className="w-5 h-5" />,
  'Bills & Utilities': <Lightbulb className="w-5 h-5" />,
  'Health': <HeartPulse className="w-5 h-5" />,
  'Education': <GraduationCap className="w-5 h-5" />,
  'Settlement': <ArrowDownRight className="w-5 h-5" />,
  'Other': <MoreHorizontal className="w-5 h-5" />
};

const now = new Date();
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

export const INITIAL_GOALS: Omit<BudgetGoal, 'userId'>[] = [
  { id: '1', category: 'Food & Dining', limit: 1500, startDate: firstDay, endDate: lastDay },
  { id: '2', category: 'Entertainment', limit: 800, startDate: firstDay, endDate: lastDay },
  { id: '3', category: 'Shopping', limit: 1000, startDate: firstDay, endDate: lastDay },
];