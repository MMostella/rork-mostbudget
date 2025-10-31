import Colors from '@/constants/colors';
import { useBudget } from '@/contexts/BudgetContext';
import { CheckCircle2, Circle, Receipt } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function BillsScreen() {
  const { expenses, getExpensePaymentStatus, getBillsSummary, getBudgetSummary, isLoading } = useBudget();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const billsSummary = getBillsSummary();
  const budgetSummary = getBudgetSummary();
  const remainingBalance = budgetSummary.totalIncome - billsSummary.totalPaid;

  const sortedExpenses = [...expenses].sort((a, b) => {
    const statusA = getExpensePaymentStatus(a.id);
    const statusB = getExpensePaymentStatus(b.id);
    
    if (statusA.status === 'unpaid' && statusB.status !== 'unpaid') return -1;
    if (statusA.status !== 'unpaid' && statusB.status === 'unpaid') return 1;
    if (statusA.status === 'partially-paid' && statusB.status === 'paid') return -1;
    if (statusA.status === 'paid' && statusB.status === 'partially-paid') return 1;
    
    return a.name.localeCompare(b.name);
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Income</Text>
            <Text style={[styles.summaryAmount, { color: Colors.light.income }]}>
              ${budgetSummary.totalIncome.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Bills</Text>
            <Text style={[styles.summaryAmount, { color: Colors.light.bills }]}>
              ${billsSummary.totalBills.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Amount Paid</Text>
            <Text style={[styles.summaryAmount, { color: Colors.light.success }]}>
              ${billsSummary.totalPaid.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Remaining Balance</Text>
            <Text style={[styles.summaryAmount, { color: Colors.light.primary }]}>
              ${remainingBalance.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Overall Progress</Text>
            <Text style={styles.progressPercentage}>
              {billsSummary.totalBills > 0 
                ? ((billsSummary.totalPaid / billsSummary.totalBills) * 100).toFixed(1) 
                : 0}%
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { 
                  width: billsSummary.totalBills > 0 
                    ? `${Math.min((billsSummary.totalPaid / billsSummary.totalBills) * 100, 100)}%` 
                    : '0%',
                  backgroundColor: Colors.light.primary,
                }
              ]} 
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bills Status</Text>
          {expenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Receipt size={48} color={Colors.light.tabIconDefault} />
              <Text style={styles.emptyTitle}>No Bills Yet</Text>
              <Text style={styles.emptyText}>
                Add your bills in the Setup tab to start tracking payments
              </Text>
            </View>
          ) : (
            <View style={styles.billsList}>
              {sortedExpenses.map((expense) => {
                const paymentStatus = getExpensePaymentStatus(expense.id);
                const { status, amountPaid, amountDue, percentPaid } = paymentStatus;

                let statusColor = Colors.light.textSecondary;
                let statusBgColor = '#E0E0E0';
                let statusText = 'Unpaid';
                if (status === 'paid') {
                  statusColor = Colors.light.success;
                  statusBgColor = '#E8F5E9';
                  statusText = 'Paid';
                } else if (status === 'partially-paid') {
                  statusColor = Colors.light.primary;
                  statusBgColor = '#FFF3E0';
                  statusText = 'Partial';
                }

                return (
                  <View key={expense.id} style={styles.billCard}>
                    <View style={styles.billHeader}>
                      <View style={styles.billInfo}>
                        <Text style={styles.billName}>{expense.name}</Text>
                        <Text style={styles.billCategory}>{expense.category}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
                        {status === 'paid' ? (
                          <CheckCircle2 size={20} color={Colors.light.success} />
                        ) : status === 'partially-paid' ? (
                          <Circle size={20} color={Colors.light.primary} />
                        ) : (
                          <Circle size={20} color={Colors.light.textSecondary} />
                        )}
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {statusText}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.billAmounts}>
                      <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>Total Due:</Text>
                        <Text style={[styles.amountValue, { color: Colors.light.bills }]}>
                          ${expense.amount.toFixed(2)}
                        </Text>
                      </View>
                      {status !== 'unpaid' && (
                        <>
                          <View style={styles.amountRow}>
                            <Text style={styles.amountLabel}>Paid:</Text>
                            <Text style={[styles.amountValue, { color: Colors.light.success }]}>
                              ${amountPaid.toFixed(2)}
                            </Text>
                          </View>
                          <View style={styles.amountRow}>
                            <Text style={styles.amountLabel}>Remaining:</Text>
                            <Text style={[styles.amountValue, { color: Colors.light.bills }]}>
                              ${amountDue.toFixed(2)}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>

                    <View style={styles.progressBarContainer}>
                      <View 
                        style={[
                          styles.progressBar, 
                          { 
                            width: `${Math.min(percentPaid, 100)}%`,
                            backgroundColor: status === 'paid' ? Colors.light.success : Colors.light.primary,
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {percentPaid.toFixed(0)}% paid
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
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
  loadingText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  summarySection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 8,
    fontWeight: '600' as const,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  progressCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.primary,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: 'right',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
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
  billsList: {
    gap: 12,
  },
  billCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  billInfo: {
    flex: 1,
  },
  billName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  billCategory: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  billAmounts: {
    marginBottom: 12,
    gap: 6,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
