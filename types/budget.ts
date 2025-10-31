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
  dueDate?: string;
  description?: string;
  householdMemberId?: string;
  amountPaid: number;
  isPaid: boolean;
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

export type Payment = {
  id: string;
  expenseId: string;
  amount: number;
  date: string;
  paycheckId: string;
};

export type MonthlyArchive = {
  month: string;
  expenses: ExpenseItem[];
  payments: Payment[];
  totalPaid: number;
  totalBills: number;
};

export const EXPENSE_CATEGORIES = [
  'Rent/Mortgage',
  'Utilities',
  'Internet',
  'Phone',
  'Groceries & Dining Out',
  'Transportation',
  'Car Payment',
  'Car Insurance',
  'Health & Medical',
  'Household Supplies',
  'Subscriptions',
  'Debt Payments',
  'Childcare & School',
  'Other',
] as const;
