
export type Category = 
  | 'Food & Dining'
  | 'Transportation'
  | 'Shopping'
  | 'Entertainment'
  | 'Bills & Utilities'
  | 'Health'
  | 'Education'
  | 'Other';

export type Mood = 'Happy' | 'Stressed' | 'Tired' | 'Bored' | 'Excited' | 'Neutral';

export type Currency = {
  code: string;
  symbol: string;
  label: string;
};

export type AccountType = 'Checking' | 'Savings' | 'Credit Card' | 'Investment' | 'Cash';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
}

export interface Transaction {
  id: string;
  amount: number;
  category: Category;
  date: string; 
  time: string; 
  description: string;
  mood: Mood;
  accountId?: string;
}

export interface BehavioralInsight {
  title: string;
  description: string;
  severity: 'neutral' | 'warning' | 'positive';
  type: 'pattern' | 'budget' | 'psychology';
}

export interface BudgetGoal {
  id: string;
  category: Category;
  limit: number;
}
