import Colors from '@/constants/colors';
import { useBudget } from '@/contexts/BudgetContext';
import { ArrowDownLeft, CreditCard, DollarSign, PiggyBank, Wallet } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function DashboardScreen() {
  const { getBudgetSummary, isLoading, income, expenses, currentSpendingTotal, currentSavingsTotal } = useBudget();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  const summary = getBudgetSummary();
  const currentDate = new Date();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Your Budget</Text>
          <Text style={styles.date}>
            {currentDate.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>

<View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <View style={styles.statIconContainer}>
              <ArrowDownLeft size={20} color={Colors.light.income} />
            </View>
            <Text style={styles.statLabel}>Income</Text>
            <Text style={[styles.statAmount, { color: Colors.light.income }]}>
              ${summary.totalIncome.toFixed(2)}
            </Text>
            <Text style={styles.statCount}>{income.length} sources</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <View style={styles.statIconContainer}>
              <CreditCard size={20} color={Colors.light.bills} />
            </View>
            <Text style={styles.statLabel}>Expenses</Text>
            <Text style={[styles.statAmount, { color: Colors.light.bills }]}>
              ${summary.totalExpenses.toFixed(2)}
            </Text>
            <Text style={styles.statCount}>{expenses.length} items</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <View style={styles.statIconContainer}>
              <PiggyBank size={20} color={Colors.light.success} />
            </View>
            <Text style={styles.statLabel}>Savings Balance</Text>
            <Text style={[styles.statAmount, { color: Colors.light.success }]}>
              ${currentSavingsTotal.toFixed(2)}
            </Text>
            <Text style={styles.statCount}>current</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <View style={styles.statIconContainer}>
              <Wallet size={20} color={Colors.light.income} />
            </View>
            <Text style={styles.statLabel}>Spending Balance</Text>
            <Text style={[styles.statAmount, { color: Colors.light.income }]}>
              ${currentSpendingTotal.toFixed(2)}
            </Text>
            <Text style={styles.statCount}>current</Text>
          </View>
        </View>

        {income.length === 0 && expenses.length === 0 && (
          <View style={styles.emptyState}>
            <DollarSign size={48} color={Colors.light.tabIconDefault} />
            <Text style={styles.emptyTitle}>Start Your Budget Journey</Text>
            <Text style={styles.emptyText}>
              Add your income sources and expenses to track your finances and log paychecks when you get paid.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '500' as const,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
    fontWeight: '600' as const,
  },
  statAmount: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  statCount: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },

  emptyState: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
