export type HouseholdMember = {
  id: string;
  name: string;
};

export type Income = {
  id: string;
  name: string;
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  startDate: string;
  householdMemberId?: string;
  usedForBills?: boolean;
};

export type ExpenseItem = {
  id: string;
  name: string;
  amount: number;
  category: string;
  dueDay?: number;
  description?: string;
  householdMemberId?: string;
};

export type OneTimeExpense = {
  id: string;
  name: string;
  amount: number;
  category: string;
  isEdited?: boolean;
};

export type Paycheck = {
  id: string;
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  date: string;
  paidExpenseIds: string[];
  titheAmount?: number;
  savingsAmount?: number;
  spendingAmount?: number;
  incomeSourceId?: string;
  customIncomeSource?: string;
  checkedExpenses?: { [key: string]: boolean };
  oneTimeExpenses?: OneTimeExpense[];
};

export type BudgetSummary = {
  totalIncome: number;
  totalBills: number;
  totalExpenses: number;
  balance: number;
};

export type BudgetPercentages = {
  billsPercentage: number;
  spendPercentage: number;
  savingsPercentage: number;
  spendMultiplier: number;
  savingsMultiplier: number;
};

export type AppSettings = {
  titheEnabled: boolean;
  tithePercentage: number;
};

export type DailyExpense = {
  id: string;
  description: string;
  amount: number;
  date: string;
};

export const EXPENSE_CATEGORIES = [
  'Rent/Mortgage',
  'Utilities',
  'Insurance',
  'Loan',
  'Food & Dining',
  'Vehicle',
  'Cell Phone',
  'Shopping',
  'Entertainment',
  'Health',
  'Credit Card',
  'Other',
] as const;
