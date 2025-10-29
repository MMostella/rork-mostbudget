import Colors from '@/constants/colors';
import { useBudget } from '@/contexts/BudgetContext';
import type { DailyExpense } from '@/types/budget';
import { Plus, Receipt, Trash2 } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function ExpensesScreen() {
  const { dailyExpenses, addDailyExpense, deleteDailyExpense, currentSpendingTotal, currentSavingsTotal } = useBudget();
  const [modalVisible, setModalVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const descriptionRef = useRef<TextInput>(null);
  const amountRef = useRef<TextInput>(null);

  const handleAddExpense = () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (!amount.trim()) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const newExpense: DailyExpense = {
      id: Date.now().toString(),
      description: description.trim(),
      amount: parsedAmount,
      date: new Date().toISOString(),
    };

    addDailyExpense(newExpense);
    setDescription('');
    setAmount('');
    setModalVisible(false);
    Keyboard.dismiss();
  };

  const handleDeleteExpense = (id: string, expenseDescription: string, expenseAmount: number) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expenseDescription}" ($${expenseAmount.toFixed(2)})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteDailyExpense(id),
        },
      ]
    );
  };

  const sortedExpenses = [...dailyExpenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalExpenses = dailyExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Current Spending</Text>
            <Text style={[styles.summaryAmount, { color: Colors.light.income }]}>
              ${currentSpendingTotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Current Savings</Text>
            <Text style={[styles.summaryAmount, { color: Colors.light.success }]}>
              ${currentSavingsTotal.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total Daily Expenses</Text>
          <Text style={styles.totalAmount}>${totalExpenses.toFixed(2)}</Text>
        </View>

        {dailyExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Receipt size={48} color={Colors.light.tabIconDefault} />
            <Text style={styles.emptyTitle}>No Daily Expenses</Text>
            <Text style={styles.emptyText}>
              Track your day-to-day expenses here. They&apos;ll be deducted from your spending (then savings if needed).
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {sortedExpenses.map((expense) => {
              const expenseDate = new Date(expense.date);
              const isToday = expenseDate.toDateString() === new Date().toDateString();
              const dateStr = isToday
                ? 'Today'
                : expenseDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

              return (
                <View key={expense.id} style={styles.expenseCard}>
                  <View style={styles.expenseContent}>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseDescription}>{expense.description}</Text>
                      <Text style={styles.expenseDate}>{dateStr}</Text>
                    </View>
                    <View style={styles.expenseRight}>
                      <Text style={styles.expenseAmount}>${expense.amount.toFixed(2)}</Text>
                      <Pressable
                        style={styles.deleteButton}
                        onPress={() =>
                          handleDeleteExpense(expense.id, expense.description, expense.amount)
                        }
                      >
                        <Trash2 size={18} color={Colors.light.danger} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus size={28} color="#FFFFFF" />
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Add Daily Expense</Text>

              <Text style={styles.label}>Description</Text>
              <TextInput
                ref={descriptionRef}
                style={styles.input}
                placeholder="Coffee, lunch, gas, etc."
                value={description}
                onChangeText={setDescription}
                returnKeyType="next"
                onSubmitEditing={() => amountRef.current?.focus()}
                blurOnSubmit={false}
              />

              <Text style={styles.label}>Amount</Text>
              <TextInput
                ref={amountRef}
                style={styles.input}
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={handleAddExpense}
              />

              {currentSpendingTotal > 0 || currentSavingsTotal > 0 ? (
                <View style={styles.warningCard}>
                  <Text style={styles.warningText}>
                    This will be deducted from your spending total
                    {currentSpendingTotal === 0 ? ' (then savings if needed)' : ''}.
                  </Text>
                </View>
              ) : (
                <View style={styles.infoCard}>
                  <Text style={styles.infoText}>
                    Add paychecks to track spending and savings balances.
                  </Text>
                </View>
              )}

              <View style={styles.modalActions}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => {
                    setModalVisible(false);
                    setDescription('');
                    setAmount('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.addButton} onPress={handleAddExpense}>
                  <Text style={styles.addButtonText}>Add Expense</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  summarySection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
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
  totalSection: {
    backgroundColor: Colors.light.tint,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#FFFFFF',
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
  list: {
    gap: 12,
  },
  expenseCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  expenseContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseInfo: {
    flex: 1,
    marginRight: 12,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  expenseRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.bills,
  },
  deleteButton: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  warningCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  warningText: {
    fontSize: 13,
    color: Colors.light.bills,
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  infoText: {
    fontSize: 13,
    color: Colors.light.primary,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  addButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
