export type Category = 
  | 'Food & Dining'
  | 'Transportation'
  | 'Shopping'
  | 'Entertainment'
  | 'Bills & Utilities'
  | 'Health'
  | 'Education'
  | 'Settlement'
  | 'Other';

export type Mood = 'Happy' | 'Stressed' | 'Tired' | 'Bored' | 'Excited' | 'Neutral';

export type Currency = {
  code: string;
  symbol: string;
  label: string;
};

export type AccountType = 'Checking' | 'Savings' | 'Credit Card' | 'Investment' | 'Cash';

export type ViewType = 'dashboard' | 'history' | 'budgets' | 'accounts' | 'profile' | 'statement';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  createdAt: any;
  lastLogin: any;
}

export interface UserSettings {
  language: 'en' | 'ar';
  currency: Currency;
  updatedAt?: any;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  creditLimit?: number; 
  createdAt?: any;
}

// Fixed: Added isSettlement and targetAccountId properties to Transaction interface
export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  category: Category;
  date: string; 
  time: string; 
  description: string;
  mood: Mood;
  accountId: string;
  isSettlement?: boolean;
  targetAccountId?: string | null;
  createdAt?: any;
}

export interface BudgetGoal {
  id: string;
  userId: string;
  category: Category;
  limit: number;
  createdAt?: any;
}