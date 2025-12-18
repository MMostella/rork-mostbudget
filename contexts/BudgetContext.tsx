import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { BudgetSummary, BudgetPercentages, ExpenseItem, Income, Paycheck, AppSettings, DailyExpense, HouseholdMember, Payment, MonthlyArchive, BillMonthState } from '@/types/budget';

const STORAGE_KEYS = {
  INCOME: '@budget_income',
  EXPENSES: '@budget_expenses',
  PAYCHECKS: '@budget_paychecks',
  PERCENTAGES: '@budget_percentages',
  SETTINGS: '@budget_settings',
  DAILY_EXPENSES: '@budget_daily_expenses',
  SPENDING_TOTAL: '@budget_spending_total',
  SAVINGS_TOTAL: '@budget_savings_total',
  HOUSEHOLD: '@budget_household',
  PAYMENTS: '@budget_payments',
  ARCHIVES: '@budget_archives',
  LAST_RESET_DATE: '@budget_last_reset_date',
  BILL_MONTH_STATES: '@budget_bill_month_states',
};

const DEFAULT_INCOME_SOURCES: Income[] = [
  {
    id: 'preset_income_1',
    name: 'Salary1',
    amount: 0,
    frequency: 'monthly',
    startDate: new Date().toISOString(),
    usedForBills: true,
  },
  {
    id: 'preset_income_2',
    name: 'Salary2',
    amount: 0,
    frequency: 'monthly',
    startDate: new Date().toISOString(),
    usedForBills: true,
  },
];

const MAX_INCOME_SOURCES = 5;
const MAX_EXPENSES = 15;

const DEFAULT_EXPENSES: ExpenseItem[] = [
  { id: 'preset_exp_1', name: 'Rent/Mortgage', amount: 0, category: 'Rent/Mortgage', amountPaid: 0, isPaid: false },
  { id: 'preset_exp_2', name: 'Utilities', amount: 0, category: 'Utilities', amountPaid: 0, isPaid: false },
  { id: 'preset_exp_3', name: 'Internet', amount: 0, category: 'Internet', amountPaid: 0, isPaid: false },
  { id: 'preset_exp_4', name: 'Phone', amount: 0, category: 'Phone', amountPaid: 0, isPaid: false },
  { id: 'preset_exp_5', name: 'Groceries & Dining Out', amount: 0, category: 'Groceries & Dining Out', amountPaid: 0, isPaid: false },
  { id: 'preset_exp_6', name: 'Transportation', amount: 0, category: 'Transportation', amountPaid: 0, isPaid: false },
  { id: 'preset_exp_7', name: 'Car Payment', amount: 0, category: 'Car Payment', amountPaid: 0, isPaid: false },
  { id: 'preset_exp_8', name: 'Car Insurance', amount: 0, category: 'Car Insurance', amountPaid: 0, isPaid: false },
  { id: 'preset_exp_9', name: 'Health & Medical', amount: 0, category: 'Health & Medical', amountPaid: 0, isPaid: false },
  { id: 'preset_exp_10', name: 'Household Supplies', amount: 0, category: 'Household Supplies', amountPaid: 0, isPaid: false },
  { id: 'preset_exp_11', name: 'Subscriptions', amount: 0, category: 'Subscriptions', amountPaid: 0, isPaid: false },
  { id: 'preset_exp_12', name: 'Debt Payments', amount: 0, category: 'Debt Payments', amountPaid: 0, isPaid: false },
  { id: 'preset_exp_13', name: 'Childcare & School', amount: 0, category: 'Childcare & School', amountPaid: 0, isPaid: false },
];

export const [BudgetProvider, useBudget] = createContextHook(() => {
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [paychecks, setPaychecks] = useState<Paycheck[]>([]);
  const [spendMultiplier, setSpendMultiplier] = useState(0.6);
  const [savingsMultiplier, setSavingsMultiplier] = useState(0.4);
  const [settings, setSettings] = useState<AppSettings>({
    titheEnabled: false,
    tithePercentage: 10,
  });
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpense[]>([]);
  const [currentSpendingTotal, setCurrentSpendingTotal] = useState(0);
  const [currentSavingsTotal, setCurrentSavingsTotal] = useState(0);
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [billMonthStates, setBillMonthStates] = useState<BillMonthState[]>([]);
  const [archives, setArchives] = useState<MonthlyArchive[]>([]);
  const [lastResetDate, setLastResetDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getCurrentMonthYear = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const [incomeData, expensesData, paychecksData, percentagesData, settingsData, dailyExpensesData, spendingData, savingsData, householdData, paymentsData, archivesData, lastResetData, billMonthStatesData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.INCOME),
        AsyncStorage.getItem(STORAGE_KEYS.EXPENSES),
        AsyncStorage.getItem(STORAGE_KEYS.PAYCHECKS),
        AsyncStorage.getItem(STORAGE_KEYS.PERCENTAGES),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.DAILY_EXPENSES),
        AsyncStorage.getItem(STORAGE_KEYS.SPENDING_TOTAL),
        AsyncStorage.getItem(STORAGE_KEYS.SAVINGS_TOTAL),
        AsyncStorage.getItem(STORAGE_KEYS.HOUSEHOLD),
        AsyncStorage.getItem(STORAGE_KEYS.PAYMENTS),
        AsyncStorage.getItem(STORAGE_KEYS.ARCHIVES),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_RESET_DATE),
        AsyncStorage.getItem(STORAGE_KEYS.BILL_MONTH_STATES),
      ]);

      if (incomeData) {
        setIncome(JSON.parse(incomeData));
      } else {
        setIncome(DEFAULT_INCOME_SOURCES);
        await AsyncStorage.setItem(STORAGE_KEYS.INCOME, JSON.stringify(DEFAULT_INCOME_SOURCES));
      }

      if (expensesData) {
        setExpenses(JSON.parse(expensesData));
      } else {
        setExpenses(DEFAULT_EXPENSES);
        await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(DEFAULT_EXPENSES));
      }
      if (paychecksData) setPaychecks(JSON.parse(paychecksData));
      if (percentagesData) {
        const parsed = JSON.parse(percentagesData);
        setSpendMultiplier(parsed.spendMultiplier ?? 0.6);
        setSavingsMultiplier(parsed.savingsMultiplier ?? 0.4);
      }
      if (settingsData) {
        const parsed = JSON.parse(settingsData);
        setSettings({
          titheEnabled: parsed.titheEnabled ?? false,
          tithePercentage: parsed.tithePercentage ?? 10,
        });
      }
      if (dailyExpensesData) setDailyExpenses(JSON.parse(dailyExpensesData));
      if (spendingData && spendingData !== 'null') {
        const parsed = parseFloat(spendingData);
        if (!isNaN(parsed)) {
          setCurrentSpendingTotal(parsed);
        }
      }
      if (savingsData && savingsData !== 'null') {
        const parsed = parseFloat(savingsData);
        if (!isNaN(parsed)) {
          setCurrentSavingsTotal(parsed);
        }
      }
      if (householdData) setHouseholdMembers(JSON.parse(householdData));
      if (paymentsData) {
        const parsed = JSON.parse(paymentsData);
        const migratedPayments = parsed.map((p: Payment) => ({
          ...p,
          monthYear: p.monthYear || getCurrentMonthYear(),
        }));
        setPayments(migratedPayments);
      }
      if (billMonthStatesData) setBillMonthStates(JSON.parse(billMonthStatesData));
      if (archivesData) setArchives(JSON.parse(archivesData));
      if (lastResetDate) setLastResetDate(lastResetData);
    } catch (error) {
      console.error('Error loading budget data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveIncome = async (newIncome: Income[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.INCOME, JSON.stringify(newIncome));
      setIncome(newIncome);
    } catch (error) {
      console.error('Error saving income:', error);
    }
  };

  const saveExpenses = async (newExpenses: ExpenseItem[]) => {
    try {
      console.log('Saving expenses to AsyncStorage:', newExpenses);
      await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(newExpenses));
      setExpenses(newExpenses);
    } catch (error) {
      console.error('Error saving expenses:', error);
    }
  };

  const addIncome = useCallback((newIncome: Income) => {
    if (income.length >= MAX_INCOME_SOURCES) {
      console.error(`Cannot add more than ${MAX_INCOME_SOURCES} income sources`);
      return;
    }
    const updated = [...income, newIncome];
    saveIncome(updated);
  }, [income]);

  const updateIncome = useCallback((id: string, updatedIncome: Partial<Income>) => {
    const updated = income.map((item) =>
      item.id === id ? { ...item, ...updatedIncome } : item
    );
    saveIncome(updated);
  }, [income]);

  const deleteIncome = useCallback((id: string) => {
    const updated = income.filter((item) => item.id !== id);
    saveIncome(updated);
  }, [income]);

  const addExpense = useCallback((newExpense: ExpenseItem) => {
    if (expenses.length >= MAX_EXPENSES) {
      console.error(`Cannot add more than ${MAX_EXPENSES} expenses`);
      return;
    }
    const updated = [...expenses, newExpense];
    saveExpenses(updated);
  }, [expenses]);

  const updateExpense = useCallback((id: string, updatedExpense: Partial<ExpenseItem>) => {
    const updated = expenses.map((item) =>
      item.id === id ? { ...item, ...updatedExpense } : item
    );
    saveExpenses(updated);
  }, [expenses]);

  const reorderExpenses = useCallback((newExpensesOrder: ExpenseItem[]) => {
    console.log('Reordering expenses:', newExpensesOrder);
    saveExpenses(newExpensesOrder);
  }, []);

  const deleteExpense = useCallback((id: string) => {
    const updated = expenses.filter((item) => item.id !== id);
    saveExpenses(updated);
  }, [expenses]);

  const savePaychecks = async (newPaychecks: Paycheck[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PAYCHECKS, JSON.stringify(newPaychecks));
      setPaychecks(newPaychecks);
    } catch (error) {
      console.error('Error saving paychecks:', error);
    }
  };

  const updateSpendingSavingsTotals = useCallback(async (spending: number, savings: number) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.SPENDING_TOTAL, spending.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.SAVINGS_TOTAL, savings.toString()),
      ]);
      setCurrentSpendingTotal(spending);
      setCurrentSavingsTotal(savings);
    } catch (error) {
      console.error('Error updating spending/savings totals:', error);
    }
  }, []);

  const getAdjustedExpenseAmount = (expenseAmount: number, frequency: 'weekly' | 'biweekly' | 'monthly'): number => {
    switch (frequency) {
      case 'weekly':
        return expenseAmount / 4;
      case 'biweekly':
        return expenseAmount / 2;
      case 'monthly':
        return expenseAmount;
    }
  };

  const savePayments = async (newPayments: Payment[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(newPayments));
      setPayments(newPayments);
    } catch (error) {
      console.error('Error saving payments:', error);
    }
  };

  const saveBillMonthStates = async (newStates: BillMonthState[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BILL_MONTH_STATES, JSON.stringify(newStates));
      setBillMonthStates(newStates);
    } catch (error) {
      console.error('Error saving bill month states:', error);
    }
  };

  const getPaymentsForMonth = useCallback((monthYear: string): Payment[] => {
    return payments.filter(p => p.monthYear === monthYear);
  }, [payments]);

  const ensureMonthStateExists = useCallback(async (monthYear: string) => {
    const existingState = billMonthStates.find(s => s.monthYear === monthYear);
    if (!existingState) {
      const newState: BillMonthState = {
        monthYear,
        payments: [],
      };
      const updatedStates = [...billMonthStates, newState];
      await saveBillMonthStates(updatedStates);
    }
  }, [billMonthStates]);

  const recordPayment = useCallback(async (expenseId: string, amount: number, paycheckId: string, monthYear?: string) => {
    const targetMonthYear = monthYear || getCurrentMonthYear();
    await ensureMonthStateExists(targetMonthYear);
    
    const newPayment: Payment = {
      id: Date.now().toString(),
      expenseId,
      amount,
      date: new Date().toISOString(),
      paycheckId,
      monthYear: targetMonthYear,
    };
    
    const updatedPayments = [...payments, newPayment];
    await savePayments(updatedPayments);
    
    const expense = expenses.find(e => e.id === expenseId);
    if (expense) {
      const totalPaidForExpense = updatedPayments
        .filter(p => p.expenseId === expenseId && p.monthYear === targetMonthYear)
        .reduce((sum, p) => sum + p.amount, 0);
      
      const isPaid = totalPaidForExpense >= expense.amount;
      
      const updatedExpenses = expenses.map(e =>
        e.id === expenseId
          ? { ...e, amountPaid: totalPaidForExpense, isPaid }
          : e
      );
      
      await saveExpenses(updatedExpenses);
    }
  }, [payments, expenses, ensureMonthStateExists]);

  const addPaycheck = useCallback((newPaycheck: Paycheck) => {
    const updated = [...paychecks, newPaycheck];
    savePaychecks(updated);
    
    const newSpending = currentSpendingTotal + (newPaycheck.spendingAmount ?? 0);
    const newSavings = currentSavingsTotal + (newPaycheck.savingsAmount ?? 0);
    updateSpendingSavingsTotals(newSpending, newSavings);
  }, [paychecks, currentSpendingTotal, currentSavingsTotal, updateSpendingSavingsTotals]);

  const updatePaycheck = useCallback(async (id: string, updatedPaycheck: Partial<Paycheck>) => {
    const oldPaycheck = paychecks.find(p => p.id === id);
    const updated = paychecks.map((item) =>
      item.id === id ? { ...item, ...updatedPaycheck } : item
    );
    await savePaychecks(updated);
    
    if (oldPaycheck && updatedPaycheck.checkedExpenses) {
      const oldChecked = (oldPaycheck as any).checkedExpenses || {};
      const newChecked = updatedPaycheck.checkedExpenses;
      
      for (const expenseId in newChecked) {
        if (newChecked[expenseId] && !oldChecked[expenseId]) {
          const expense = expenses.find(e => e.id === expenseId);
          if (expense && expenseId !== 'tithe') {
            const adjustedAmount = getAdjustedExpenseAmount(expense.amount, oldPaycheck.frequency);
            await recordPayment(expenseId, adjustedAmount, id, oldPaycheck.monthYear);
          } else if (expenseId === 'tithe' && oldPaycheck.titheAmount) {
            console.log('Tithe marked as paid');
          }
        }
      }
    }
  }, [paychecks, expenses, recordPayment]);

  const deletePaycheck = useCallback((id: string) => {
    const paycheckToDelete = paychecks.find((item) => item.id === id);
    const updated = paychecks.filter((item) => item.id !== id);
    savePaychecks(updated);
    
    if (paycheckToDelete) {
      const newSpending = Math.max(0, currentSpendingTotal - (paycheckToDelete.spendingAmount ?? 0));
      const newSavings = Math.max(0, currentSavingsTotal - (paycheckToDelete.savingsAmount ?? 0));
      updateSpendingSavingsTotals(newSpending, newSavings);
    }
  }, [paychecks, currentSpendingTotal, currentSavingsTotal, updateSpendingSavingsTotals]);

  const calculateMonthlyIncome = useCallback((): number => {
    return income.reduce((total, item) => {
      let monthlyAmount = 0;
      switch (item.frequency) {
        case 'weekly':
          monthlyAmount = item.amount * 4.33;
          break;
        case 'biweekly':
          monthlyAmount = item.amount * 2.17;
          break;
        case 'monthly':
          monthlyAmount = item.amount;
          break;
        case 'yearly':
          monthlyAmount = item.amount / 12;
          break;
      }
      return total + monthlyAmount;
    }, 0);
  }, [income]);

  const calculateMonthlyIncomeForBills = useCallback((): number => {
    return income.reduce((total, item) => {
      if (item.usedForBills === false) {
        return total;
      }
      let monthlyAmount = 0;
      switch (item.frequency) {
        case 'weekly':
          monthlyAmount = item.amount * 4.33;
          break;
        case 'biweekly':
          monthlyAmount = item.amount * 2.17;
          break;
        case 'monthly':
          monthlyAmount = item.amount;
          break;
        case 'yearly':
          monthlyAmount = item.amount / 12;
          break;
      }
      return total + monthlyAmount;
    }, 0);
  }, [income]);

  const calculateTotalExpenses = useCallback((): number => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  }, [expenses]);

  const getBudgetSummary = useCallback((): BudgetSummary => {
    const totalIncome = calculateMonthlyIncome();
    const totalExpenses = calculateTotalExpenses();
    const balance = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalBills: totalExpenses,
      totalExpenses,
      balance,
    };
  }, [calculateMonthlyIncome, calculateTotalExpenses]);

  const getTithingAmount = useCallback((): number => {
    if (!settings.titheEnabled) return 0;
    const totalIncomeForBills = calculateMonthlyIncomeForBills();
    return totalIncomeForBills * (settings.tithePercentage / 100);
  }, [settings, calculateMonthlyIncomeForBills]);

  const getBudgetPercentages = useCallback((): BudgetPercentages => {
    const totalIncomeForBills = calculateMonthlyIncomeForBills();
    const totalExpenses = calculateTotalExpenses();
    const titheAmount = getTithingAmount();
    
    const totalExpensesWithTithing = totalExpenses + titheAmount;

    if (totalIncomeForBills === 0) {
      return {
        billsPercentage: 0,
        spendPercentage: 0,
        savingsPercentage: 0,
        spendMultiplier,
        savingsMultiplier,
      };
    }

    const billsPercentage = (totalExpensesWithTithing / totalIncomeForBills) * 100;
    const remaining = totalIncomeForBills - totalExpensesWithTithing;
    const spendPercentage = (remaining * spendMultiplier / totalIncomeForBills) * 100;
    const savingsPercentage = (remaining * savingsMultiplier / totalIncomeForBills) * 100;

    return {
      billsPercentage,
      spendPercentage,
      savingsPercentage,
      spendMultiplier,
      savingsMultiplier,
    };
  }, [calculateMonthlyIncomeForBills, calculateTotalExpenses, getTithingAmount, spendMultiplier, savingsMultiplier]);

  const updatePercentageMultipliers = useCallback(async (spend: number, savings: number) => {
    try {
      const data = { spendMultiplier: spend, savingsMultiplier: savings };
      await AsyncStorage.setItem(STORAGE_KEYS.PERCENTAGES, JSON.stringify(data));
      setSpendMultiplier(spend);
      setSavingsMultiplier(savings);
    } catch (error) {
      console.error('Error saving percentage multipliers:', error);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    try {
      const updated = { ...settings, ...newSettings };
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      setSettings(updated);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [settings]);

  const getTotalSavings = useCallback((): number => {
    return paychecks.reduce((total, paycheck) => total + (paycheck.savingsAmount ?? 0), 0);
  }, [paychecks]);

  const getTotalSpending = useCallback((): number => {
    return paychecks.reduce((total, paycheck) => total + (paycheck.spendingAmount ?? 0), 0);
  }, [paychecks]);

  const saveDailyExpenses = async (newExpenses: DailyExpense[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_EXPENSES, JSON.stringify(newExpenses));
      setDailyExpenses(newExpenses);
    } catch (error) {
      console.error('Error saving daily expenses:', error);
    }
  };

  const addDailyExpense = useCallback((expense: DailyExpense) => {
    const updated = [...dailyExpenses, expense];
    saveDailyExpenses(updated);

    let newSpending = currentSpendingTotal - expense.amount;
    let newSavings = currentSavingsTotal;

    if (newSpending < 0) {
      newSavings = currentSavingsTotal + newSpending;
      newSpending = 0;
      if (newSavings < 0) {
        newSpending = newSavings;
        newSavings = 0;
      }
    }

    updateSpendingSavingsTotals(newSpending, newSavings);
  }, [dailyExpenses, currentSpendingTotal, currentSavingsTotal, updateSpendingSavingsTotals]);

  const deleteDailyExpense = useCallback((id: string) => {
    const expenseToDelete = dailyExpenses.find((item) => item.id === id);
    const updated = dailyExpenses.filter((item) => item.id !== id);
    saveDailyExpenses(updated);

    if (expenseToDelete) {
      const newSpending = currentSpendingTotal + expenseToDelete.amount;
      updateSpendingSavingsTotals(newSpending, currentSavingsTotal);
    }
  }, [dailyExpenses, currentSpendingTotal, currentSavingsTotal, updateSpendingSavingsTotals]);

  const setSpendingOrSavingsTotal = useCallback(async (amount: number, target: 'spending' | 'savings') => {
    let newSpending = currentSpendingTotal;
    let newSavings = currentSavingsTotal;

    if (target === 'spending') {
      newSpending = Math.max(0, amount);
    } else {
      newSavings = Math.max(0, amount);
    }

    await updateSpendingSavingsTotals(newSpending, newSavings);
  }, [currentSpendingTotal, currentSavingsTotal, updateSpendingSavingsTotals]);

  const saveHouseholdMembers = async (newMembers: HouseholdMember[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HOUSEHOLD, JSON.stringify(newMembers));
      setHouseholdMembers(newMembers);
    } catch (error) {
      console.error('Error saving household members:', error);
    }
  };

  const addHouseholdMember = useCallback((newMember: HouseholdMember) => {
    const updated = [...householdMembers, newMember];
    saveHouseholdMembers(updated);
  }, [householdMembers]);

  const updateHouseholdMember = useCallback((id: string, updatedMember: Partial<HouseholdMember>) => {
    const updated = householdMembers.map((member) =>
      member.id === id ? { ...member, ...updatedMember } : member
    );
    saveHouseholdMembers(updated);
  }, [householdMembers]);

  const deleteHouseholdMember = useCallback((id: string) => {
    const updated = householdMembers.filter((member) => member.id !== id);
    saveHouseholdMembers(updated);
  }, [householdMembers]);

  const getExpensePaymentStatus = useCallback((expenseId: string, monthYear?: string) => {
    const targetMonthYear = monthYear || getCurrentMonthYear();
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return { status: 'unpaid' as const, amountPaid: 0, amountDue: 0, percentPaid: 0 };
    
    const totalPaid = payments
      .filter(p => p.expenseId === expenseId && p.monthYear === targetMonthYear)
      .reduce((sum, p) => sum + p.amount, 0);
    
    const amountDue = Math.max(0, expense.amount - totalPaid);
    const percentPaid = expense.amount > 0 ? (totalPaid / expense.amount) * 100 : 0;
    
    let status: 'paid' | 'partially-paid' | 'unpaid';
    if (totalPaid >= expense.amount) {
      status = 'paid';
    } else if (totalPaid > 0) {
      status = 'partially-paid';
    } else {
      status = 'unpaid';
    }
    
    return { status, amountPaid: totalPaid, amountDue, percentPaid };
  }, [expenses, payments]);

  const getBillsSummary = useCallback((monthYear?: string) => {
    const targetMonthYear = monthYear || getCurrentMonthYear();
    const totalBills = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalPaid = payments
      .filter(p => p.monthYear === targetMonthYear)
      .reduce((sum, p) => sum + p.amount, 0);
    const totalRemaining = Math.max(0, totalBills - totalPaid);
    
    return {
      totalBills,
      totalPaid,
      totalRemaining,
    };
  }, [expenses, payments]);

  const archiveAndResetMonth = useCallback(async (currentMonth: string) => {
    try {
      const archive: MonthlyArchive = {
        month: currentMonth,
        expenses: expenses.map(e => ({ ...e })),
        payments: payments.map(p => ({ ...p })),
        totalPaid: payments.reduce((sum, p) => sum + p.amount, 0),
        totalBills: expenses.reduce((sum, e) => sum + e.amount, 0),
      };
      
      const updatedArchives = [...archives, archive];
      await AsyncStorage.setItem(STORAGE_KEYS.ARCHIVES, JSON.stringify(updatedArchives));
      setArchives(updatedArchives);
      
      const resetExpenses = expenses.map(e => ({
        ...e,
        amountPaid: 0,
        isPaid: false,
      }));
      await saveExpenses(resetExpenses);
      
      await savePayments([]);
      
      const now = new Date();
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_RESET_DATE, now.toISOString());
      setLastResetDate(now.toISOString());
      
      console.log(`Monthly data archived for ${currentMonth} and reset for new month`);
    } catch (error) {
      console.error('Error archiving and resetting monthly data:', error);
    }
  }, [expenses, payments, archives]);

  const checkAndResetMonthly = useCallback(async () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    if (lastResetDate) {
      const lastReset = new Date(lastResetDate);
      const lastMonth = `${lastReset.getFullYear()}-${String(lastReset.getMonth() + 1).padStart(2, '0')}`;
      
      if (currentMonth !== lastMonth) {
        await archiveAndResetMonth(currentMonth);
      }
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_RESET_DATE, now.toISOString());
      setLastResetDate(now.toISOString());
    }
  }, [lastResetDate, archiveAndResetMonth]);

  return useMemo(
    () => ({
      income,
      expenses,
      paychecks,
      isLoading,
      settings,
      dailyExpenses,
      currentSpendingTotal,
      currentSavingsTotal,
      householdMembers,
      payments,
      billMonthStates,
      archives,
      maxIncomeLimit: MAX_INCOME_SOURCES,
      maxExpenseLimit: MAX_EXPENSES,
      addIncome,
      updateIncome,
      deleteIncome,
      addExpense,
      updateExpense,
      deleteExpense,
      reorderExpenses,
      addPaycheck,
      updatePaycheck,
      deletePaycheck,
      getBudgetSummary,
      getBudgetPercentages,
      getTithingAmount,
      updatePercentageMultipliers,
      updateSettings,
      getTotalSavings,
      getTotalSpending,
      addDailyExpense,
      deleteDailyExpense,
      updateSpendingSavingsTotals,
      setSpendingOrSavingsTotal,
      addHouseholdMember,
      updateHouseholdMember,
      deleteHouseholdMember,
      recordPayment,
      getExpensePaymentStatus,
      getBillsSummary,
      checkAndResetMonthly,
      getPaymentsForMonth,
      getCurrentMonthYear,
    }),
    [
      income,
      expenses,
      paychecks,
      isLoading,
      settings,
      dailyExpenses,
      currentSpendingTotal,
      currentSavingsTotal,
      householdMembers,
      payments,
      billMonthStates,
      archives,
      addIncome,
      updateIncome,
      deleteIncome,
      addExpense,
      updateExpense,
      deleteExpense,
      reorderExpenses,
      addPaycheck,
      updatePaycheck,
      deletePaycheck,
      getBudgetSummary,
      getBudgetPercentages,
      getTithingAmount,
      updatePercentageMultipliers,
      updateSettings,
      getTotalSavings,
      getTotalSpending,
      addDailyExpense,
      deleteDailyExpense,
      updateSpendingSavingsTotals,
      setSpendingOrSavingsTotal,
      addHouseholdMember,
      updateHouseholdMember,
      deleteHouseholdMember,
      recordPayment,
      getExpensePaymentStatus,
      getBillsSummary,
      checkAndResetMonthly,
      getPaymentsForMonth,
    ]
  );
});
