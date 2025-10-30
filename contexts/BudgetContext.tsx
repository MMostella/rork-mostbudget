import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { BudgetSummary, BudgetPercentages, ExpenseItem, Income, Paycheck, AppSettings, DailyExpense, HouseholdMember } from '@/types/budget';

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
};

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [incomeData, expensesData, paychecksData, percentagesData, settingsData, dailyExpensesData, spendingData, savingsData, householdData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.INCOME),
        AsyncStorage.getItem(STORAGE_KEYS.EXPENSES),
        AsyncStorage.getItem(STORAGE_KEYS.PAYCHECKS),
        AsyncStorage.getItem(STORAGE_KEYS.PERCENTAGES),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.DAILY_EXPENSES),
        AsyncStorage.getItem(STORAGE_KEYS.SPENDING_TOTAL),
        AsyncStorage.getItem(STORAGE_KEYS.SAVINGS_TOTAL),
        AsyncStorage.getItem(STORAGE_KEYS.HOUSEHOLD),
      ]);

      if (incomeData) setIncome(JSON.parse(incomeData));
      if (expensesData) setExpenses(JSON.parse(expensesData));
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
      await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(newExpenses));
      setExpenses(newExpenses);
    } catch (error) {
      console.error('Error saving expenses:', error);
    }
  };

  const addIncome = useCallback((newIncome: Income) => {
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
    const updated = [...expenses, newExpense];
    saveExpenses(updated);
  }, [expenses]);

  const updateExpense = useCallback((id: string, updatedExpense: Partial<ExpenseItem>) => {
    const updated = expenses.map((item) =>
      item.id === id ? { ...item, ...updatedExpense } : item
    );
    saveExpenses(updated);
  }, [expenses]);

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

  const addPaycheck = useCallback((newPaycheck: Paycheck) => {
    const updated = [...paychecks, newPaycheck];
    savePaychecks(updated);
    
    const newSpending = currentSpendingTotal + (newPaycheck.spendingAmount ?? 0);
    const newSavings = currentSavingsTotal + (newPaycheck.savingsAmount ?? 0);
    updateSpendingSavingsTotals(newSpending, newSavings);
  }, [paychecks, currentSpendingTotal, currentSavingsTotal, updateSpendingSavingsTotals]);

  const updatePaycheck = useCallback((id: string, updatedPaycheck: Partial<Paycheck>) => {
    const updated = paychecks.map((item) =>
      item.id === id ? { ...item, ...updatedPaycheck } : item
    );
    savePaychecks(updated);
  }, [paychecks]);

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

  const getBudgetPercentages = useCallback((): BudgetPercentages => {
    const totalIncomeForBills = calculateMonthlyIncomeForBills();
    const totalExpenses = calculateTotalExpenses();

    if (totalIncomeForBills === 0) {
      return {
        billsPercentage: 0,
        spendPercentage: 0,
        savingsPercentage: 0,
        spendMultiplier,
        savingsMultiplier,
      };
    }

    const billsPercentage = (totalExpenses / totalIncomeForBills) * 100;
    const remaining = totalIncomeForBills - totalExpenses;
    const spendPercentage = (remaining * spendMultiplier / totalIncomeForBills) * 100;
    const savingsPercentage = (remaining * savingsMultiplier / totalIncomeForBills) * 100;

    return {
      billsPercentage,
      spendPercentage,
      savingsPercentage,
      spendMultiplier,
      savingsMultiplier,
    };
  }, [calculateMonthlyIncomeForBills, calculateTotalExpenses, spendMultiplier, savingsMultiplier]);

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
      addIncome,
      updateIncome,
      deleteIncome,
      addExpense,
      updateExpense,
      deleteExpense,
      addPaycheck,
      updatePaycheck,
      deletePaycheck,
      getBudgetSummary,
      getBudgetPercentages,
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
      addIncome,
      updateIncome,
      deleteIncome,
      addExpense,
      updateExpense,
      deleteExpense,
      addPaycheck,
      updatePaycheck,
      deletePaycheck,
      getBudgetSummary,
      getBudgetPercentages,
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
    ]
  );
});
