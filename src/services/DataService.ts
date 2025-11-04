import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageKeys } from '@/src/utils/storageKeys';
import type { 
  Income, 
  ExpenseItem, 
  Paycheck, 
  AppSettings, 
  DailyExpense, 
  HouseholdMember, 
  Payment, 
  MonthlyArchive 
} from '@/types/budget';

type BudgetPercentagesData = {
  spendMultiplier: number;
  savingsMultiplier: number;
};

export const DataService = {
  async getIncome(): Promise<Income[]> {
    try {
      const data = await AsyncStorage.getItem(storageKeys.INCOME);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting income:', error);
      return [];
    }
  },

  async setIncome(income: Income[]): Promise<void> {
    try {
      await AsyncStorage.setItem(storageKeys.INCOME, JSON.stringify(income));
    } catch (error) {
      console.error('Error setting income:', error);
    }
  },

  async getExpenses(): Promise<ExpenseItem[]> {
    try {
      const data = await AsyncStorage.getItem(storageKeys.EXPENSES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting expenses:', error);
      return [];
    }
  },

  async setExpenses(expenses: ExpenseItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(storageKeys.EXPENSES, JSON.stringify(expenses));
    } catch (error) {
      console.error('Error setting expenses:', error);
    }
  },

  async getPaychecks(): Promise<Paycheck[]> {
    try {
      const data = await AsyncStorage.getItem(storageKeys.PAYCHECKS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting paychecks:', error);
      return [];
    }
  },

  async setPaychecks(paychecks: Paycheck[]): Promise<void> {
    try {
      await AsyncStorage.setItem(storageKeys.PAYCHECKS, JSON.stringify(paychecks));
    } catch (error) {
      console.error('Error setting paychecks:', error);
    }
  },

  async getPercentages(): Promise<BudgetPercentagesData | null> {
    try {
      const data = await AsyncStorage.getItem(storageKeys.PERCENTAGES);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting percentages:', error);
      return null;
    }
  },

  async setPercentages(percentages: BudgetPercentagesData): Promise<void> {
    try {
      await AsyncStorage.setItem(storageKeys.PERCENTAGES, JSON.stringify(percentages));
    } catch (error) {
      console.error('Error setting percentages:', error);
    }
  },

  async getSettings(): Promise<AppSettings | null> {
    try {
      const data = await AsyncStorage.getItem(storageKeys.SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting settings:', error);
      return null;
    }
  },

  async setSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(storageKeys.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error setting settings:', error);
    }
  },

  async getDailyExpenses(): Promise<DailyExpense[]> {
    try {
      const data = await AsyncStorage.getItem(storageKeys.DAILY_EXPENSES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting daily expenses:', error);
      return [];
    }
  },

  async setDailyExpenses(expenses: DailyExpense[]): Promise<void> {
    try {
      await AsyncStorage.setItem(storageKeys.DAILY_EXPENSES, JSON.stringify(expenses));
    } catch (error) {
      console.error('Error setting daily expenses:', error);
    }
  },

  async getSpendingTotal(): Promise<number> {
    try {
      const data = await AsyncStorage.getItem(storageKeys.SPENDING_TOTAL);
      if (data && data !== 'null') {
        const parsed = parseFloat(data);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    } catch (error) {
      console.error('Error getting spending total:', error);
      return 0;
    }
  },

  async setSpendingTotal(amount: number): Promise<void> {
    try {
      await AsyncStorage.setItem(storageKeys.SPENDING_TOTAL, amount.toString());
    } catch (error) {
      console.error('Error setting spending total:', error);
    }
  },

  async getSavingsTotal(): Promise<number> {
    try {
      const data = await AsyncStorage.getItem(storageKeys.SAVINGS_TOTAL);
      if (data && data !== 'null') {
        const parsed = parseFloat(data);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    } catch (error) {
      console.error('Error getting savings total:', error);
      return 0;
    }
  },

  async setSavingsTotal(amount: number): Promise<void> {
    try {
      await AsyncStorage.setItem(storageKeys.SAVINGS_TOTAL, amount.toString());
    } catch (error) {
      console.error('Error setting savings total:', error);
    }
  },

  async getHouseholdMembers(): Promise<HouseholdMember[]> {
    try {
      const data = await AsyncStorage.getItem(storageKeys.HOUSEHOLD);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting household members:', error);
      return [];
    }
  },

  async setHouseholdMembers(members: HouseholdMember[]): Promise<void> {
    try {
      await AsyncStorage.setItem(storageKeys.HOUSEHOLD, JSON.stringify(members));
    } catch (error) {
      console.error('Error setting household members:', error);
    }
  },

  async getPayments(): Promise<Payment[]> {
    try {
      const data = await AsyncStorage.getItem(storageKeys.PAYMENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting payments:', error);
      return [];
    }
  },

  async setPayments(payments: Payment[]): Promise<void> {
    try {
      await AsyncStorage.setItem(storageKeys.PAYMENTS, JSON.stringify(payments));
    } catch (error) {
      console.error('Error setting payments:', error);
    }
  },

  async getArchives(): Promise<MonthlyArchive[]> {
    try {
      const data = await AsyncStorage.getItem(storageKeys.ARCHIVES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting archives:', error);
      return [];
    }
  },

  async setArchives(archives: MonthlyArchive[]): Promise<void> {
    try {
      await AsyncStorage.setItem(storageKeys.ARCHIVES, JSON.stringify(archives));
    } catch (error) {
      console.error('Error setting archives:', error);
    }
  },

  async getLastResetDate(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(storageKeys.LAST_RESET_DATE);
    } catch (error) {
      console.error('Error getting last reset date:', error);
      return null;
    }
  },

  async setLastResetDate(date: string): Promise<void> {
    try {
      await AsyncStorage.setItem(storageKeys.LAST_RESET_DATE, date);
    } catch (error) {
      console.error('Error setting last reset date:', error);
    }
  },

  async updateSpendingSavingsTotals(spending: number, savings: number): Promise<void> {
    try {
      await Promise.all([
        this.setSpendingTotal(spending),
        this.setSavingsTotal(savings),
      ]);
    } catch (error) {
      console.error('Error updating spending/savings totals:', error);
    }
  },
};

export default DataService;
