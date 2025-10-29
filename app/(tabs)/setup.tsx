import Colors from '@/constants/colors';
import { useBudget } from '@/contexts/BudgetContext';
import type { ExpenseItem, Income } from '@/types/budget';
import { EXPENSE_CATEGORIES } from '@/types/budget';
import { Edit, Plus, Trash2 } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  Alert,
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

type ModalType = 'income' | 'expense' | 'edit-income' | 'edit-expense' | null;
type EditItem = Income | ExpenseItem | null;

export default function SetupScreen() {
  const { income, expenses, addIncome, deleteIncome, addExpense, deleteExpense, updateIncome, updateExpense, householdMembers } = useBudget();
  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingItem, setEditingItem] = useState<EditItem>(null);
  
  const [incomeName, setIncomeName] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeFrequency, setIncomeFrequency] = useState<Income['frequency']>('weekly');
  const [incomeHouseholdMemberId, setIncomeHouseholdMemberId] = useState<string | undefined>(undefined);
  const [incomeUsedForBills, setIncomeUsedForBills] = useState(true);
  
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDueDay, setExpenseDueDay] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseHouseholdMemberId, setExpenseHouseholdMemberId] = useState<string | undefined>(undefined);

  const incomeAmountRef = useRef<TextInput>(null);
  const expenseAmountRef = useRef<TextInput>(null);
  const expenseDueDayRef = useRef<TextInput>(null);

  const handleAddIncome = () => {
    if (!incomeName.trim() || !incomeAmount.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const parsedAmount = parseFloat(incomeAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const monthlyAmount = getMonthlyIncomeAmount(parsedAmount, incomeFrequency);

    if (modalType === 'edit-income' && editingItem) {
      updateIncome(editingItem.id, {
        name: incomeName.trim(),
        amount: monthlyAmount,
        frequency: 'monthly',
        householdMemberId: incomeHouseholdMemberId,
        usedForBills: incomeUsedForBills,
      });
    } else {
      const newIncome: Income = {
        id: Date.now().toString(),
        name: incomeName.trim(),
        amount: monthlyAmount,
        frequency: 'monthly',
        startDate: new Date().toISOString(),
        householdMemberId: incomeHouseholdMemberId,
        usedForBills: incomeUsedForBills,
      };
      addIncome(newIncome);
    }

    setIncomeName('');
    setIncomeAmount('');
    setIncomeFrequency('weekly');
    setIncomeHouseholdMemberId(undefined);
    setIncomeUsedForBills(true);
    setEditingItem(null);
    setModalType(null);
  };

  const handleAddExpense = () => {
    if (!expenseName.trim() || !expenseAmount.trim()) {
      Alert.alert('Error', 'Please fill in name and amount');
      return;
    }

    const parsedAmount = parseFloat(expenseAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    let parsedDay: number | undefined = undefined;
    if (expenseDueDay.trim()) {
      parsedDay = parseInt(expenseDueDay, 10);
      if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) {
        Alert.alert('Error', 'Please enter a valid day (1-31) or leave empty');
        return;
      }
    }

    if (modalType === 'edit-expense' && editingItem) {
      updateExpense(editingItem.id, {
        name: expenseName.trim(),
        amount: parsedAmount,
        category: expenseCategory,
        dueDay: parsedDay,
        description: expenseDescription.trim() || undefined,
        householdMemberId: expenseHouseholdMemberId,
      });
    } else {
      const newExpense: ExpenseItem = {
        id: Date.now().toString(),
        name: expenseName.trim(),
        amount: parsedAmount,
        category: expenseCategory,
        dueDay: parsedDay,
        description: expenseDescription.trim() || undefined,
        householdMemberId: expenseHouseholdMemberId,
      };
      addExpense(newExpense);
    }

    setExpenseName('');
    setExpenseAmount('');
    setExpenseDueDay('');
    setExpenseCategory(EXPENSE_CATEGORIES[0]);
    setExpenseDescription('');
    setExpenseHouseholdMemberId(undefined);
    setEditingItem(null);
    setModalType(null);
  };

  const handleDeleteIncome = (id: string, name: string) => {
    Alert.alert('Delete Income', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteIncome(id),
      },
    ]);
  };

  const handleDeleteExpense = (id: string, name: string) => {
    Alert.alert('Delete Expense', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteExpense(id),
      },
    ]);
  };

  const getMonthlyIncomeAmount = (amount: number, frequency: Income['frequency']): number => {
    switch (frequency) {
      case 'weekly':
        return amount * 4;
      case 'biweekly':
        return amount * 2;
      case 'monthly':
        return amount;
      case 'yearly':
        return amount / 12;
    }
  };

  const totalMonthlyIncome = income.reduce((sum, item) => sum + item.amount, 0);
  const totalMonthlyExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const incomeFrequencies: { value: Income['frequency']; label: string }[] = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCards}>
          <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.summaryLabel}>Monthly Income</Text>
            <Text style={[styles.summaryAmount, { color: Colors.light.income }]}>
              ${totalMonthlyIncome.toFixed(2)}
            </Text>
            <Text style={styles.summaryCount}>{income.length} sources</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FFF3E0' }]}>
            <Text style={styles.summaryLabel}>Monthly Expenses</Text>
            <Text style={[styles.summaryAmount, { color: Colors.light.bills }]}>
              ${totalMonthlyExpenses.toFixed(2)}
            </Text>
            <Text style={styles.summaryCount}>{expenses.length} items</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Income Sources</Text>
            <Pressable
              style={styles.addButton}
              onPress={() => setModalType('income')}
            >
              <Plus size={20} color={Colors.light.tint} />
            </Pressable>
          </View>
          {income.length === 0 ? (
            <Text style={styles.emptyText}>No income sources added</Text>
          ) : (
            <View style={styles.list}>
              {income.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMeta}>
                      Monthly total{item.usedForBills === false ? ' • Extra Income (not used for bills)' : ''}{item.householdMemberId ? (() => {
                        const member = householdMembers.find(m => m.id === item.householdMemberId);
                        return member ? ` • ${member.name}` : '';
                      })() : ''}
                    </Text>
                  </View>
                  <View style={styles.itemRight}>
                    <Text style={[styles.itemAmount, { color: Colors.light.income }]}>
                      ${item.amount.toFixed(2)}
                    </Text>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => {
                        setEditingItem(item);
                        setIncomeName(item.name);
                        setIncomeAmount(item.amount.toString());
                        setIncomeFrequency('monthly');
                        setIncomeHouseholdMemberId(item.householdMemberId);
                        setIncomeUsedForBills(item.usedForBills ?? true);
                        setModalType('edit-income');
                      }}
                    >
                      <Edit size={18} color={Colors.light.tint} />
                    </Pressable>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => handleDeleteIncome(item.id, item.name)}
                    >
                      <Trash2 size={18} color={Colors.light.danger} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expenses & Bills</Text>
            <Pressable
              style={styles.addButton}
              onPress={() => setModalType('expense')}
            >
              <Plus size={20} color={Colors.light.tint} />
            </Pressable>
          </View>
          {expenses.length === 0 ? (
            <Text style={styles.emptyText}>No expenses added</Text>
          ) : (
            <View style={styles.list}>
              {expenses
                .sort((a, b) => {
                  if (a.dueDay && b.dueDay) return a.dueDay - b.dueDay;
                  if (a.dueDay) return -1;
                  if (b.dueDay) return 1;
                  return a.name.localeCompare(b.name);
                })
                .map((expense) => (
                  <View key={expense.id} style={styles.itemCard}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{expense.name}</Text>
                      <Text style={styles.itemMeta}>
                        {expense.category}{expense.dueDay ? ` • Due: Day ${expense.dueDay}` : ''}{expense.householdMemberId ? (() => {
                          const member = householdMembers.find(m => m.id === expense.householdMemberId);
                          return member ? ` • ${member.name}` : '';
                        })() : ''}
                      </Text>
                      {expense.description && (
                        <Text style={styles.itemDescription}>{expense.description}</Text>
                      )}
                    </View>
                    <View style={styles.itemRight}>
                      <Text style={[styles.itemAmount, { color: Colors.light.bills }]}>
                        ${expense.amount.toFixed(2)}
                      </Text>
                      <Pressable
                        style={styles.deleteButton}
                        onPress={() => {
                          setEditingItem(expense);
                          setExpenseName(expense.name);
                          setExpenseAmount(expense.amount.toString());
                          setExpenseDueDay(expense.dueDay?.toString() || '');
                          setExpenseCategory(expense.category);
                          setExpenseDescription(expense.description || '');
                          setExpenseHouseholdMemberId(expense.householdMemberId);
                          setModalType('edit-expense');
                        }}
                      >
                        <Edit size={18} color={Colors.light.tint} />
                      </Pressable>
                      <Pressable
                        style={styles.deleteButton}
                        onPress={() => handleDeleteExpense(expense.id, expense.name)}
                      >
                        <Trash2 size={18} color={Colors.light.danger} />
                      </Pressable>
                    </View>
                  </View>
                ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={modalType === 'income' || modalType === 'edit-income'}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setModalType(null);
          setEditingItem(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setModalType(null)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.modalTitle}>{modalType === 'edit-income' ? 'Edit Income Source' : 'Add Income Source'}</Text>
                <Text style={styles.modalDescription}>
                  Enter your income amount and frequency. It will be converted to monthly total.
                </Text>

                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Salary, Freelance"
                  value={incomeName}
                  onChangeText={setIncomeName}
                  returnKeyType="next"
                  onSubmitEditing={() => incomeAmountRef.current?.focus()}
                  blurOnSubmit={false}
                />

                <Text style={styles.label}>Frequency</Text>
                <View style={styles.frequencyGrid}>
                  {incomeFrequencies.map((freq) => (
                    <Pressable
                      key={freq.value}
                      style={[
                        styles.frequencyButton,
                        incomeFrequency === freq.value && styles.frequencyButtonActive,
                      ]}
                      onPress={() => setIncomeFrequency(freq.value)}
                    >
                      <Text
                        style={[
                          styles.frequencyButtonText,
                          incomeFrequency === freq.value && styles.frequencyButtonTextActive,
                        ]}
                      >
                        {freq.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.label}>Amount</Text>
                <TextInput
                  ref={incomeAmountRef}
                  style={styles.input}
                  placeholder="0.00"
                  value={incomeAmount}
                  onChangeText={setIncomeAmount}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />

                {incomeAmount && parseFloat(incomeAmount) > 0 && (
                  <View style={styles.conversionInfo}>
                    <Text style={styles.conversionText}>
                      Monthly Total: ${getMonthlyIncomeAmount(parseFloat(incomeAmount), incomeFrequency).toFixed(2)}
                    </Text>
                  </View>
                )}

                <Text style={styles.label}>Used For Bills</Text>
                <View style={styles.usedForBillsGrid}>
                  <Pressable
                    style={[
                      styles.usedForBillsButton,
                      incomeUsedForBills && styles.usedForBillsButtonActive,
                    ]}
                    onPress={() => setIncomeUsedForBills(true)}
                  >
                    <Text
                      style={[
                        styles.usedForBillsButtonText,
                        incomeUsedForBills && styles.usedForBillsButtonTextActive,
                      ]}
                    >
                      Yes
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.usedForBillsButton,
                      !incomeUsedForBills && styles.usedForBillsButtonActive,
                    ]}
                    onPress={() => setIncomeUsedForBills(false)}
                  >
                    <Text
                      style={[
                        styles.usedForBillsButtonText,
                        !incomeUsedForBills && styles.usedForBillsButtonTextActive,
                      ]}
                    >
                      No (Extra Income)
                    </Text>
                  </Pressable>
                </View>
                <Text style={styles.helperText}>
                  Extra income will be included in total income but won&apos;t affect bill percentage calculations
                </Text>

                {householdMembers.length > 0 && (
                  <>
                    <Text style={styles.label}>Household Member (Optional)</Text>
                    <View style={styles.householdMemberGrid}>
                      <Pressable
                        style={[
                          styles.householdMemberButton,
                          incomeHouseholdMemberId === undefined && styles.householdMemberButtonActive,
                        ]}
                        onPress={() => setIncomeHouseholdMemberId(undefined)}
                      >
                        <Text
                          style={[
                            styles.householdMemberButtonText,
                            incomeHouseholdMemberId === undefined && styles.householdMemberButtonTextActive,
                          ]}
                        >
                          None
                        </Text>
                      </Pressable>
                      {householdMembers.map((member) => (
                        <Pressable
                          key={member.id}
                          style={[
                            styles.householdMemberButton,
                            incomeHouseholdMemberId === member.id && styles.householdMemberButtonActive,
                          ]}
                          onPress={() => setIncomeHouseholdMemberId(member.id)}
                        >
                          <Text
                            style={[
                              styles.householdMemberButtonText,
                              incomeHouseholdMemberId === member.id && styles.householdMemberButtonTextActive,
                            ]}
                          >
                            {member.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}

                <View style={styles.modalActions}>
                  <Pressable style={styles.cancelButton} onPress={() => setModalType(null)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.saveButton} onPress={handleAddIncome}>
                    <Text style={styles.saveButtonText}>{modalType === 'edit-income' ? 'Update' : 'Add'}</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={modalType === 'expense' || modalType === 'edit-expense'}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setModalType(null);
          setEditingItem(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setModalType(null)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.modalTitle}>{modalType === 'edit-expense' ? 'Edit Expense/Bill' : 'Add Expense/Bill'}</Text>
                <Text style={styles.modalDescription}>
                  Enter the monthly amount for this expense.
                </Text>

                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Rent, Groceries, Internet"
                  value={expenseName}
                  onChangeText={setExpenseName}
                  returnKeyType="next"
                  onSubmitEditing={() => expenseAmountRef.current?.focus()}
                  blurOnSubmit={false}
                />

                <Text style={styles.label}>Amount (Monthly)</Text>
                <TextInput
                  ref={expenseAmountRef}
                  style={styles.input}
                  placeholder="0.00"
                  value={expenseAmount}
                  onChangeText={setExpenseAmount}
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                  onSubmitEditing={() => expenseDueDayRef.current?.focus()}
                  blurOnSubmit={false}
                />

                <Text style={styles.label}>Due Day (Optional, 1-31)</Text>
                <TextInput
                  ref={expenseDueDayRef}
                  style={styles.input}
                  placeholder="e.g. 15"
                  value={expenseDueDay}
                  onChangeText={setExpenseDueDay}
                  keyboardType="number-pad"
                  maxLength={2}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />

                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Add notes or details about this expense"
                  value={expenseDescription}
                  onChangeText={setExpenseDescription}
                  returnKeyType="done"
                  multiline
                  numberOfLines={3}
                />

                <Text style={styles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categoryRow}>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat}
                        style={[
                          styles.categoryButton,
                          expenseCategory === cat && styles.categoryButtonActive,
                        ]}
                        onPress={() => setExpenseCategory(cat)}
                      >
                        <Text
                          style={[
                            styles.categoryButtonText,
                            expenseCategory === cat && styles.categoryButtonTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>

                {householdMembers.length > 0 && (
                  <>
                    <Text style={styles.label}>Paid By (Optional)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.householdMemberRow}>
                        <Pressable
                          style={[
                            styles.householdMemberButton,
                            expenseHouseholdMemberId === undefined && styles.householdMemberButtonActive,
                          ]}
                          onPress={() => setExpenseHouseholdMemberId(undefined)}
                        >
                          <Text
                            style={[
                              styles.householdMemberButtonText,
                              expenseHouseholdMemberId === undefined && styles.householdMemberButtonTextActive,
                            ]}
                          >
                            Everyone
                          </Text>
                        </Pressable>
                        {householdMembers.map((member) => (
                          <Pressable
                            key={member.id}
                            style={[
                              styles.householdMemberButton,
                              expenseHouseholdMemberId === member.id && styles.householdMemberButtonActive,
                            ]}
                            onPress={() => setExpenseHouseholdMemberId(member.id)}
                          >
                            <Text
                              style={[
                                styles.householdMemberButtonText,
                                expenseHouseholdMemberId === member.id && styles.householdMemberButtonTextActive,
                              ]}
                            >
                              {member.name}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </>
                )}

                <View style={styles.modalActions}>
                  <Pressable style={styles.cancelButton} onPress={() => setModalType(null)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.saveButton} onPress={handleAddExpense}>
                    <Text style={styles.saveButtonText}>{modalType === 'edit-expense' ? 'Update' : 'Add'}</Text>
                  </Pressable>
                </View>
              </ScrollView>
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
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 8,
    fontWeight: '600' as const,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 2,
    borderColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  list: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  itemRight: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  itemAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  itemDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
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
  frequencyGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  frequencyButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  frequencyButtonTextActive: {
    color: '#FFFFFF',
  },
  conversionInfo: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  conversionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
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
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  householdMemberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  householdMemberRow: {
    flexDirection: 'row',
    gap: 8,
  },
  householdMemberButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  householdMemberButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  householdMemberButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  householdMemberButtonTextActive: {
    color: '#FFFFFF',
  },
  usedForBillsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  usedForBillsButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  usedForBillsButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  usedForBillsButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  usedForBillsButtonTextActive: {
    color: '#FFFFFF',
  },
  helperText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 8,
    lineHeight: 16,
  },
});
