import Colors from '@/constants/colors';
import { useBudget } from '@/contexts/BudgetContext';
import type { OneTimeExpense, Paycheck } from '@/types/budget';
import { EXPENSE_CATEGORIES } from '@/types/budget';
import { CheckCircle2, Circle, DollarSign, Edit2, Plus, Trash2, X } from 'lucide-react-native';
import { useRef, useState, useMemo } from 'react';
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

export default function PaycheckScreen() {
  const { paychecks, expenses, income, householdMembers, addPaycheck, deletePaycheck, updatePaycheck, settings, getBudgetPercentages, getBudgetSummary } = useBudget();
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<Paycheck['frequency']>('biweekly');
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [selectedIncomeSourceId, setSelectedIncomeSourceId] = useState<string | undefined>(undefined);
  const [customIncomeSource, setCustomIncomeSource] = useState('');
  const [addRemainingToSavings, setAddRemainingToSavings] = useState(false);
  const [oneTimeExpenses, setOneTimeExpenses] = useState<OneTimeExpense[]>([]);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editExpenseName, setEditExpenseName] = useState('');
  const [editExpenseAmount, setEditExpenseAmount] = useState('');
  const [editExpenseCategory, setEditExpenseCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [showAddOneTimeExpense, setShowAddOneTimeExpense] = useState(false);

  const amountInputRef = useRef<TextInput>(null);

  const handleAddPaycheck = () => {
    if (!amount.trim()) {
      Alert.alert('Error', 'Please enter paycheck amount');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const titheAmount = settings.titheEnabled
      ? (parsedAmount * settings.tithePercentage) / 100
      : 0;

    const summary = getBudgetSummary();
    const totalMonthlyIncome = summary.totalIncome;
    const totalMonthlyExpenses = summary.totalBills;

    const billsPercentage = totalMonthlyIncome > 0 ? (totalMonthlyExpenses / totalMonthlyIncome) * 100 : 0;
    const remainingPercentage = 100 - billsPercentage;
    const percentages = getBudgetPercentages();
    const spendingPercentage = remainingPercentage * percentages.spendMultiplier;
    const savingsPercentage = remainingPercentage * percentages.savingsMultiplier;

    const billsAmount = (parsedAmount * billsPercentage) / 100;
    const actualBillsPaid = selectedExpensesTotal + titheAmount;
    
    const spendingAmountBase = (parsedAmount * spendingPercentage) / 100;
    const savingsAmountBase = (parsedAmount * savingsPercentage) / 100;
    let spendingAmount = spendingAmountBase;
    let savingsAmount = savingsAmountBase;
    
    if (addRemainingToSavings) {
      const remaining = parsedAmount - actualBillsPaid;
      savingsAmount = Math.max(0, remaining);
      spendingAmount = 0;
    } else {
      if (actualBillsPaid > billsAmount) {
        const overpayment = actualBillsPaid - billsAmount;
        spendingAmount = Math.max(0, spendingAmountBase - overpayment);
        const remainingOverpayment = Math.max(0, overpayment - spendingAmountBase);
        savingsAmount = Math.max(0, savingsAmountBase - remainingOverpayment);
      } else {
        const unusedBillAmount = billsAmount - actualBillsPaid;
        savingsAmount = savingsAmountBase + unusedBillAmount;
      }
    }

    const newPaycheck: Paycheck = {
      id: Date.now().toString(),
      amount: parsedAmount,
      frequency,
      date: new Date().toISOString(),
      paidExpenseIds: selectedExpenseIds,
      titheAmount: settings.titheEnabled ? titheAmount : undefined,
      savingsAmount,
      spendingAmount,
      incomeSourceId: selectedIncomeSourceId === 'other' ? undefined : selectedIncomeSourceId,
      customIncomeSource: selectedIncomeSourceId === 'other' ? customIncomeSource : undefined,
      oneTimeExpenses: oneTimeExpenses.length > 0 ? oneTimeExpenses : undefined,
    };

    addPaycheck(newPaycheck);
    setAmount('');
    setFrequency('biweekly');
    setSelectedExpenseIds([]);
    setSelectedIncomeSourceId(undefined);
    setCustomIncomeSource('');
    setAddRemainingToSavings(false);
    setOneTimeExpenses([]);
    setShowAddOneTimeExpense(false);
    setModalVisible(false);
  };

  const handleDeletePaycheck = (id: string, paycheckAmount: number) => {
    Alert.alert('Delete Paycheck', `Are you sure you want to delete $${paycheckAmount.toFixed(2)} paycheck?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deletePaycheck(id),
      },
    ]);
  };

  const toggleExpenseSelection = (expenseId: string) => {
    setSelectedExpenseIds((prev) => {
      if (prev.includes(expenseId)) {
        return prev.filter((id) => id !== expenseId);
      }
      
      if (!amount || parseFloat(amount) <= 0) {
        return [...prev, expenseId];
      }
      
      const parsedAmount = parseFloat(amount);
      const expense = filteredExpenses.find(e => e.id === expenseId);
      const oneTimeExpense = oneTimeExpenses.find(e => e.id === expenseId);
      
      let expenseAmount = 0;
      if (expense) {
        const oneTimeEdit = oneTimeExpenses.find(ote => ote.id === expense.id && ote.isEdited);
        expenseAmount = oneTimeEdit ? oneTimeEdit.amount : getAdjustedExpenseAmountMemo(expense.amount);
      } else if (oneTimeExpense) {
        expenseAmount = oneTimeExpense.amount;
      }
      
      const titheAmount = settings.titheEnabled ? (parsedAmount * settings.tithePercentage) / 100 : 0;
      const newTotal = selectedExpensesTotal + expenseAmount + titheAmount;
      
      if (newTotal > parsedAmount) {
        Alert.alert('Cannot Add Expense', 'Total expenses cannot exceed paycheck amount.');
        return prev;
      }
      
      return [...prev, expenseId];
    });
  };

  const startEditingExpense = (expenseId: string, name: string, amount: number, category: string, isPreexisting: boolean) => {
    setEditingExpenseId(expenseId);
    setEditExpenseName(name);
    setEditExpenseAmount(amount.toString());
    setEditExpenseCategory(category);
  };

  const saveEditedExpense = () => {
    if (!editExpenseName.trim() || !editExpenseAmount.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const parsedAmount = parseFloat(editExpenseAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const existingOneTimeExpense = oneTimeExpenses.find(e => e.id === editingExpenseId);
    if (existingOneTimeExpense) {
      if (editingExpenseId === 'add_one_time_temp') {
        const finalExpense: OneTimeExpense = {
          id: `onetime_${Date.now()}`,
          name: editExpenseName.trim(),
          amount: parsedAmount,
          category: editExpenseCategory,
        };
        setOneTimeExpenses(prev => [...prev.filter(e => e.id !== 'add_one_time_temp'), finalExpense]);
        setSelectedExpenseIds(prev => [...prev.filter(id => id !== 'add_one_time_temp'), finalExpense.id]);
        setShowAddOneTimeExpense(false);
      } else {
        setOneTimeExpenses(prev => prev.map(e => 
          e.id === editingExpenseId 
            ? { ...e, name: editExpenseName.trim(), amount: parsedAmount, category: editExpenseCategory }
            : e
        ));
      }
    } else {
      const newOneTimeExpense: OneTimeExpense = {
        id: editingExpenseId!,
        name: editExpenseName.trim(),
        amount: parsedAmount,
        category: editExpenseCategory,
        isEdited: true,
      };
      setOneTimeExpenses(prev => [...prev, newOneTimeExpense]);
    }

    setEditingExpenseId(null);
    setEditExpenseName('');
    setEditExpenseAmount('');
    setEditExpenseCategory(EXPENSE_CATEGORIES[0] as string);
  };

  const cancelEditingExpense = () => {
    const existingOneTimeExpense = oneTimeExpenses.find(e => e.id === editingExpenseId);
    if (existingOneTimeExpense && editingExpenseId === 'add_one_time_temp') {
      setOneTimeExpenses(prev => prev.filter(e => e.id !== 'add_one_time_temp'));
      setSelectedExpenseIds(prev => prev.filter(id => id !== 'add_one_time_temp'));
      setShowAddOneTimeExpense(false);
      setEditingExpenseId(null);
      setEditExpenseName('');
      setEditExpenseAmount('');
      setEditExpenseCategory(EXPENSE_CATEGORIES[0]);
    } else if (existingOneTimeExpense && existingOneTimeExpense.isEdited) {
      setEditingExpenseId(null);
      setEditExpenseName('');
      setEditExpenseAmount('');
      setEditExpenseCategory(EXPENSE_CATEGORIES[0]);
    } else if (existingOneTimeExpense) {
      setOneTimeExpenses(prev => prev.filter(e => e.id !== editingExpenseId));
      setSelectedExpenseIds(prev => prev.filter(id => id !== editingExpenseId));
      setEditingExpenseId(null);
      setEditExpenseName('');
      setEditExpenseAmount('');
      setEditExpenseCategory(EXPENSE_CATEGORIES[0]);
    } else {
      setEditingExpenseId(null);
      setEditExpenseName('');
      setEditExpenseAmount('');
      setEditExpenseCategory(EXPENSE_CATEGORIES[0]);
    }
  };

  const handleToggleAddOneTimeExpense = () => {
    if (showAddOneTimeExpense) {
      const addExpenseId = 'add_one_time_temp';
      setOneTimeExpenses(prev => prev.filter(e => e.id !== addExpenseId));
      setSelectedExpenseIds(prev => prev.filter(id => id !== addExpenseId));
      setShowAddOneTimeExpense(false);
    } else {
      const newExpense: OneTimeExpense = {
        id: 'add_one_time_temp',
        name: 'One-Time Expense',
        amount: 0,
        category: EXPENSE_CATEGORIES[0],
      };
      setOneTimeExpenses(prev => [...prev, newExpense]);
      setSelectedExpenseIds(prev => [...prev, newExpense.id]);
      setShowAddOneTimeExpense(true);
      setEditingExpenseId(newExpense.id);
      setEditExpenseName('One-Time Expense');
      setEditExpenseAmount('0');
      setEditExpenseCategory(EXPENSE_CATEGORIES[0]);
    }
  };

  const frequencies: { value: Paycheck['frequency']; label: string }[] = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  const getAdjustedExpenseAmount = (expenseAmount: number): number => {
    switch (frequency) {
      case 'weekly':
        return expenseAmount / 4;
      case 'biweekly':
        return expenseAmount / 2;
      case 'monthly':
        return expenseAmount;
    }
  };

  const getFilteredExpenses = () => {
    if (!selectedIncomeSourceId || selectedIncomeSourceId === 'other') {
      return expenses;
    }
    const selectedIncome = income.find(inc => inc.id === selectedIncomeSourceId);
    if (!selectedIncome || !selectedIncome.householdMemberId) {
      return expenses;
    }
    return expenses.filter(exp => 
      !exp.householdMemberId || exp.householdMemberId === selectedIncome.householdMemberId
    );
  };

  const filteredExpenses = getFilteredExpenses();

  const getAdjustedExpenseAmountMemo = (expenseAmount: number): number => {
    switch (frequency) {
      case 'weekly':
        return expenseAmount / 4;
      case 'biweekly':
        return expenseAmount / 2;
      case 'monthly':
        return expenseAmount;
    }
  };

  const selectedExpensesTotal = useMemo(() => {
    let total = 0;
    filteredExpenses.forEach(exp => {
      if (selectedExpenseIds.includes(exp.id)) {
        const oneTimeEdit = oneTimeExpenses.find(ote => ote.id === exp.id && ote.isEdited);
        if (oneTimeEdit) {
          total += oneTimeEdit.amount;
        } else {
          total += getAdjustedExpenseAmountMemo(exp.amount);
        }
      }
    });
    oneTimeExpenses.forEach(ote => {
      if (!ote.isEdited && selectedExpenseIds.includes(ote.id)) {
        total += ote.amount;
      }
    });
    return total;
  }, [filteredExpenses, selectedExpenseIds, oneTimeExpenses, frequency]);

  const calculatedPreview = useMemo(() => {
    if (!amount || parseFloat(amount) <= 0) {
      return null;
    }

    const parsedAmount = parseFloat(amount);
    const summary = getBudgetSummary();
    const totalMonthlyIncome = summary.totalIncome;
    const totalMonthlyExpenses = summary.totalBills;

    const billsPercentage = totalMonthlyIncome > 0 ? (totalMonthlyExpenses / totalMonthlyIncome) * 100 : 0;
    const remainingPercentage = 100 - billsPercentage;
    const percentages = getBudgetPercentages();
    const spendingPercentageBase = remainingPercentage * percentages.spendMultiplier;
    const savingsPercentageBase = remainingPercentage * percentages.savingsMultiplier;

    const billsAmount = (parsedAmount * billsPercentage) / 100;
    const titheAmount = settings.titheEnabled ? (parsedAmount * settings.tithePercentage) / 100 : 0;
    const actualBillsPaid = selectedExpensesTotal + titheAmount;
    
    const spendingAmountBase = (parsedAmount * spendingPercentageBase) / 100;
    const savingsAmountBase = (parsedAmount * savingsPercentageBase) / 100;
    let spendingAmount = spendingAmountBase;
    let savingsAmount = savingsAmountBase;
    const remainingBillAmount = billsAmount - actualBillsPaid;

    if (addRemainingToSavings) {
      const remaining = parsedAmount - actualBillsPaid;
      savingsAmount = Math.max(0, remaining);
      spendingAmount = 0;
    } else {
      if (actualBillsPaid > billsAmount) {
        const overpayment = actualBillsPaid - billsAmount;
        spendingAmount = Math.max(0, spendingAmountBase - overpayment);
        const remainingOverpayment = Math.max(0, overpayment - spendingAmountBase);
        savingsAmount = Math.max(0, savingsAmountBase - remainingOverpayment);
      } else {
        const unusedBillAmount = billsAmount - actualBillsPaid;
        savingsAmount = savingsAmountBase + unusedBillAmount;
      }
    }

    return {
      billsPercentage,
      spendingPercentageBase,
      savingsPercentageBase,
      billsAmount,
      spendingAmount,
      savingsAmount,
      remainingBillAmount,
      actualBillsPaid,
      spendingAmountBase,
      savingsAmountBase,
    };
  }, [amount, selectedExpensesTotal, addRemainingToSavings, settings, getBudgetSummary, getBudgetPercentages]);

  const sortedPaychecks = [...paychecks].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {paychecks.length === 0 ? (
          <View style={styles.emptyState}>
            <DollarSign size={48} color={Colors.light.tabIconDefault} />
            <Text style={styles.emptyTitle}>No Paychecks Yet</Text>
            <Text style={styles.emptyText}>
              Log your paychecks and select which expenses you&apos;ll pay
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {sortedPaychecks.map((paycheck) => {
              const paycheckDate = new Date(paycheck.date);
              const isToday = paycheckDate.toDateString() === new Date().toDateString();
              const dateStr = isToday
                ? 'Today'
                : paycheckDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

              const getAdjustedAmountForFrequency = (expenseAmount: number): number => {
                switch (paycheck.frequency) {
                  case 'weekly':
                    return expenseAmount / 4;
                  case 'biweekly':
                    return expenseAmount / 2;
                  case 'monthly':
                    return expenseAmount;
                }
              };

              const paycheckIncome = paycheck.incomeSourceId ? income.find(inc => inc.id === paycheck.incomeSourceId) : undefined;
              const displayIncomeName = paycheckIncome?.name || (paycheck as any).customIncomeSource;
              const paidExpenses = expenses.filter((exp) =>
                paycheck.paidExpenseIds.includes(exp.id)
              );
              
              const oneTimeExpensesForPaycheck = paycheck.oneTimeExpenses || [];
              
              let totalPaid = 0;
              paidExpenses.forEach(exp => {
                const oneTimeEdit = oneTimeExpensesForPaycheck.find(ote => ote.id === exp.id && ote.isEdited);
                if (oneTimeEdit) {
                  totalPaid += oneTimeEdit.amount;
                } else {
                  totalPaid += getAdjustedAmountForFrequency(exp.amount);
                }
              });
              
              oneTimeExpensesForPaycheck.forEach(ote => {
                if (!ote.isEdited && paycheck.paidExpenseIds.includes(ote.id)) {
                  totalPaid += ote.amount;
                }
              });

              const titheAmount = paycheck.titheAmount ?? 0;
              const totalWithTithe = totalPaid + titheAmount;

              return (
                <View key={paycheck.id} style={styles.paycheckCard}>
                  <View style={styles.paycheckHeader}>
                    <View style={styles.paycheckInfo}>
                      <Text style={styles.paycheckAmount}>
                        ${paycheck.amount.toFixed(2)}
                      </Text>
                      <Text style={styles.paycheckMeta}>
                        {paycheck.frequency} • {dateStr}
                        {displayIncomeName && ` • ${displayIncomeName}`}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => handleDeletePaycheck(paycheck.id, paycheck.amount)}
                    >
                      <Trash2 size={20} color={Colors.light.danger} />
                    </Pressable>
                  </View>

                  {((paidExpenses.length > 0 || oneTimeExpensesForPaycheck.some(ote => !ote.isEdited)) || titheAmount > 0) && (
                    <View style={styles.paidExpensesSection}>
                      <Text style={styles.paidExpensesTitle}>Paid Expenses:</Text>
                      {titheAmount > 0 && (
                        <View style={styles.paidExpenseRow}>
                          <View style={styles.paidExpenseCheckbox}>
                            <Pressable
                              onPress={() => {
                                const current = (paycheck as any).checkedExpenses || {};
                                updatePaycheck(paycheck.id, {
                                  ...paycheck,
                                  checkedExpenses: {
                                    ...current,
                                    tithe: !current.tithe,
                                  },
                                });
                              }}
                            >
                              {((paycheck as any).checkedExpenses?.tithe) ? (
                                <CheckCircle2 size={18} color={Colors.light.success} />
                              ) : (
                                <Circle size={18} color={Colors.light.textSecondary} />
                              )}
                            </Pressable>
                          </View>
                          <Text style={[styles.paidExpenseName, styles.titheText]}>Tithe</Text>
                          <Text style={[styles.paidExpenseAmount, styles.titheText]}>
                            ${titheAmount.toFixed(2)}
                          </Text>
                        </View>
                      )}
                      {paidExpenses.map((exp) => {
                        const oneTimeEdit = oneTimeExpensesForPaycheck.find(ote => ote.id === exp.id && ote.isEdited);
                        const displayAmount = oneTimeEdit ? oneTimeEdit.amount : getAdjustedAmountForFrequency(exp.amount);
                        const displayName = oneTimeEdit ? oneTimeEdit.name : exp.name;
                        
                        return (
                          <View key={exp.id} style={styles.paidExpenseRow}>
                            <View style={styles.paidExpenseCheckbox}>
                              <Pressable
                                onPress={() => {
                                  const current = (paycheck as any).checkedExpenses || {};
                                  updatePaycheck(paycheck.id, {
                                    ...paycheck,
                                    checkedExpenses: {
                                      ...current,
                                      [exp.id]: !current[exp.id],
                                    },
                                  });
                                }}
                              >
                                {((paycheck as any).checkedExpenses?.[exp.id]) ? (
                                  <CheckCircle2 size={18} color={Colors.light.success} />
                                ) : (
                                  <Circle size={18} color={Colors.light.textSecondary} />
                                )}
                              </Pressable>
                            </View>
                            <Text style={styles.paidExpenseName}>
                              {displayName}
                              {oneTimeEdit && <Text style={styles.editedLabel}> (edited)</Text>}
                            </Text>
                            <Text style={styles.paidExpenseAmount}>
                              ${displayAmount.toFixed(2)}
                            </Text>
                          </View>
                        );
                      })}
                      {oneTimeExpensesForPaycheck.filter(ote => !ote.isEdited).map((ote) => (
                        <View key={ote.id} style={styles.paidExpenseRow}>
                          <View style={styles.paidExpenseCheckbox}>
                            <Pressable
                              onPress={() => {
                                const current = (paycheck as any).checkedExpenses || {};
                                updatePaycheck(paycheck.id, {
                                  ...paycheck,
                                  checkedExpenses: {
                                    ...current,
                                    [ote.id]: !current[ote.id],
                                  },
                                });
                              }}
                            >
                              {((paycheck as any).checkedExpenses?.[ote.id]) ? (
                                <CheckCircle2 size={18} color={Colors.light.success} />
                              ) : (
                                <Circle size={18} color={Colors.light.textSecondary} />
                              )}
                            </Pressable>
                          </View>
                          <Text style={styles.paidExpenseName}>
                            {ote.name}
                            <Text style={styles.oneTimeLabel}> (one-time)</Text>
                          </Text>
                          <Text style={styles.paidExpenseAmount}>
                            ${ote.amount.toFixed(2)}
                          </Text>
                        </View>
                      ))}
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Paid:</Text>
                        <Text style={styles.totalAmount}>${totalWithTithe.toFixed(2)}</Text>
                      </View>
                      {paycheck.savingsAmount !== undefined && paycheck.spendingAmount !== undefined && (
                        <View style={styles.allocationSection}>
                          <View style={styles.allocationRow}>
                            <Text style={styles.allocationLabel}>Spending:</Text>
                            <Text style={[styles.allocationAmount, { color: Colors.light.income }]}>
                              ${paycheck.spendingAmount.toFixed(2)}
                            </Text>
                          </View>
                          <View style={styles.allocationRow}>
                            <Text style={styles.allocationLabel}>Savings:</Text>
                            <Text style={[styles.allocationAmount, { color: Colors.light.success }]}>
                              ${paycheck.savingsAmount.toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
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
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.modalTitle}>Log Paycheck</Text>

                {income.length > 0 && (
                  <>
                    <Text style={styles.label}>Income Source (Optional)</Text>
                    <View style={styles.incomeSourceGrid}>
                      <Pressable
                        style={[
                          styles.incomeSourceButton,
                          selectedIncomeSourceId === undefined && styles.incomeSourceButtonActive,
                        ]}
                        onPress={() => {
                          setSelectedIncomeSourceId(undefined);
                          setSelectedExpenseIds([]);
                        }}
                      >
                        <Text
                          style={[
                            styles.incomeSourceButtonText,
                            selectedIncomeSourceId === undefined && styles.incomeSourceButtonTextActive,
                          ]}
                        >
                          None
                        </Text>
                      </Pressable>
                      {income.map((inc) => {
                        const member = inc.householdMemberId ? householdMembers.find(m => m.id === inc.householdMemberId) : null;
                        return (
                          <Pressable
                            key={inc.id}
                            style={[
                              styles.incomeSourceButton,
                              selectedIncomeSourceId === inc.id && styles.incomeSourceButtonActive,
                            ]}
                            onPress={() => {
                              setSelectedIncomeSourceId(inc.id);
                              setSelectedExpenseIds([]);
                            }}
                          >
                            <Text
                              style={[
                                styles.incomeSourceButtonText,
                                selectedIncomeSourceId === inc.id && styles.incomeSourceButtonTextActive,
                              ]}
                            >
                              {inc.name}
                              {member && ` (${member.name})`}
                            </Text>
                          </Pressable>
                        );
                      })}
                      <Pressable
                        style={[
                          styles.incomeSourceButton,
                          selectedIncomeSourceId === 'other' && styles.incomeSourceButtonActive,
                        ]}
                        onPress={() => {
                          setSelectedIncomeSourceId('other');
                          setSelectedExpenseIds([]);
                        }}
                      >
                        <Text
                          style={[
                            styles.incomeSourceButtonText,
                            selectedIncomeSourceId === 'other' && styles.incomeSourceButtonTextActive,
                          ]}
                        >
                          Other
                        </Text>
                      </Pressable>
                    </View>
                  </>
                )}

                {selectedIncomeSourceId === 'other' && (
                  <>
                    <Text style={styles.label}>Custom Income Source Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter income source name"
                      value={customIncomeSource}
                      onChangeText={setCustomIncomeSource}
                      returnKeyType="done"
                    />
                  </>
                )}

                <Text style={styles.label}>Paycheck Amount</Text>
                <TextInput
                  ref={amountInputRef}
                  style={styles.input}
                  placeholder="0.00"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />

                <Text style={styles.label}>Frequency</Text>
                <View style={styles.frequencyGrid}>
                  {frequencies.map((freq) => (
                    <Pressable
                      key={freq.value}
                      style={[
                        styles.frequencyButton,
                        frequency === freq.value && styles.frequencyButtonActive,
                      ]}
                      onPress={() => setFrequency(freq.value)}
                    >
                      <Text
                        style={[
                          styles.frequencyButtonText,
                          frequency === freq.value && styles.frequencyButtonTextActive,
                        ]}
                      >
                        {freq.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {calculatedPreview && amount && (
                  <View style={styles.percentagePreview}>
                    <View style={styles.percentageRow}>
                      <Text style={styles.percentageName}>Ready to Budget</Text>
                      <Text style={styles.percentageAmount}>${(calculatedPreview.billsAmount - (settings.titheEnabled ? (parseFloat(amount) * settings.tithePercentage) / 100 : 0)).toFixed(2)}</Text>
                    </View>
                    {selectedExpensesTotal > 0 && (
                      <View style={styles.remainingBillRow}>
                        <Text style={styles.remainingBillText}>Left to Assign:</Text>
                        <Text style={[styles.remainingBillAmount, calculatedPreview.remainingBillAmount < 0 && { color: Colors.light.danger }]}>
                          ${calculatedPreview.remainingBillAmount.toFixed(2)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                <Text style={styles.label}>Select Expenses to Pay</Text>
                {filteredExpenses.length === 0 && oneTimeExpenses.length === 0 ? (
                  <Text style={styles.noExpensesText}>
                    {selectedIncomeSourceId 
                      ? 'No expenses assigned to this income source' 
                      : 'No expenses added yet'}
                  </Text>
                ) : (
                  <View style={styles.expensesList}>
                    {filteredExpenses.map((expense) => {
                      const isSelected = selectedExpenseIds.includes(expense.id);
                      const oneTimeEdit = oneTimeExpenses.find(ote => ote.id === expense.id && ote.isEdited);
                      const adjustedAmount = oneTimeEdit ? oneTimeEdit.amount : getAdjustedExpenseAmount(expense.amount);
                      const displayName = oneTimeEdit ? oneTimeEdit.name : expense.name;
                      
                      return (
                        <View key={expense.id}>
                          {editingExpenseId === expense.id ? (
                            <View style={styles.editExpenseCard}>
                              <Text style={styles.editExpenseTitle}>Edit Expense (One-Time)</Text>
                              <TextInput
                                style={styles.input}
                                placeholder="Name"
                                value={editExpenseName}
                                onChangeText={setEditExpenseName}
                              />
                              <TextInput
                                style={styles.input}
                                placeholder="Amount"
                                value={editExpenseAmount}
                                onChangeText={setEditExpenseAmount}
                                keyboardType="decimal-pad"
                              />
                              <View style={styles.editExpenseActions}>
                                <Pressable style={styles.cancelEditButton} onPress={cancelEditingExpense}>
                                  <Text style={styles.cancelEditButtonText}>Cancel</Text>
                                </Pressable>
                                <Pressable style={styles.saveEditButton} onPress={saveEditedExpense}>
                                  <Text style={styles.saveEditButtonText}>Save</Text>
                                </Pressable>
                              </View>
                            </View>
                          ) : (
                            <Pressable
                              style={styles.expenseSelectRow}
                              onPress={() => toggleExpenseSelection(expense.id)}
                            >
                              {isSelected ? (
                                <CheckCircle2 size={24} color={Colors.light.success} />
                              ) : (
                                <Circle size={24} color={Colors.light.textSecondary} />
                              )}
                              <View style={styles.expenseSelectInfo}>
                                <Text style={styles.expenseSelectName}>
                                  {displayName}
                                  {oneTimeEdit && <Text style={styles.editedLabelSmall}> (edited)</Text>}
                                </Text>
                                <Text style={styles.expenseSelectCategory}>{oneTimeEdit ? oneTimeEdit.category : expense.category}</Text>
                              </View>
                              <Text style={styles.expenseSelectAmount}>
                                ${adjustedAmount.toFixed(2)}
                              </Text>
                              {isSelected && (
                                <Pressable 
                                  style={styles.editIconButton}
                                  onPress={() => startEditingExpense(expense.id, displayName, adjustedAmount, oneTimeEdit ? oneTimeEdit.category : expense.category, true)}
                                >
                                  <Edit2 size={18} color={Colors.light.tint} />
                                </Pressable>
                              )}
                            </Pressable>
                          )}
                        </View>
                      );
                    })}
                    {oneTimeExpenses.filter(ote => !ote.isEdited).map((ote) => {
                      const isSelected = selectedExpenseIds.includes(ote.id);
                      
                      return (
                        <View key={ote.id}>
                          {editingExpenseId === ote.id ? (
                            <View style={styles.editExpenseCard}>
                              <Text style={styles.editExpenseTitle}>Edit One-Time Expense</Text>
                              <TextInput
                                style={styles.input}
                                placeholder="Name"
                                value={editExpenseName}
                                onChangeText={setEditExpenseName}
                              />
                              <TextInput
                                style={styles.input}
                                placeholder="Amount"
                                value={editExpenseAmount}
                                onChangeText={setEditExpenseAmount}
                                keyboardType="decimal-pad"
                              />
                              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.categoryRow}>
                                  {EXPENSE_CATEGORIES.map((cat) => (
                                    <Pressable
                                      key={cat}
                                      style={[
                                        styles.categoryButton,
                                        editExpenseCategory === cat && styles.categoryButtonActive,
                                      ]}
                                      onPress={() => setEditExpenseCategory(cat)}
                                    >
                                      <Text
                                        style={[
                                          styles.categoryButtonText,
                                          editExpenseCategory === cat && styles.categoryButtonTextActive,
                                        ]}
                                      >
                                        {cat}
                                      </Text>
                                    </Pressable>
                                  ))}
                                </View>
                              </ScrollView>
                              <View style={styles.editExpenseActions}>
                                <Pressable style={styles.cancelEditButton} onPress={cancelEditingExpense}>
                                  <Text style={styles.cancelEditButtonText}>Cancel</Text>
                                </Pressable>
                                <Pressable style={styles.saveEditButton} onPress={saveEditedExpense}>
                                  <Text style={styles.saveEditButtonText}>Save</Text>
                                </Pressable>
                              </View>
                            </View>
                          ) : (
                            <Pressable
                              style={styles.expenseSelectRow}
                              onPress={() => toggleExpenseSelection(ote.id)}
                            >
                              {isSelected ? (
                                <CheckCircle2 size={24} color={Colors.light.success} />
                              ) : (
                                <Circle size={24} color={Colors.light.textSecondary} />
                              )}
                              <View style={styles.expenseSelectInfo}>
                                <Text style={styles.expenseSelectName}>
                                  {ote.name}
                                  <Text style={styles.oneTimeLabelSmall}> (one-time)</Text>
                                </Text>
                                <Text style={styles.expenseSelectCategory}>{ote.category}</Text>
                              </View>
                              <Text style={styles.expenseSelectAmount}>
                                ${ote.amount.toFixed(2)}
                              </Text>
                              {isSelected && (
                                <Pressable 
                                  style={styles.editIconButton}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    startEditingExpense(ote.id, ote.name, ote.amount, ote.category, false);
                                  }}
                                >
                                  <Edit2 size={18} color={Colors.light.tint} />
                                </Pressable>
                              )}
                              <Pressable 
                                style={styles.deleteIconButton}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  setOneTimeExpenses(prev => prev.filter(e => e.id !== ote.id));
                                  setSelectedExpenseIds(prev => prev.filter(id => id !== ote.id));
                                }}
                              >
                                <X size={18} color={Colors.light.danger} />
                              </Pressable>
                            </Pressable>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}

                <Pressable
                  style={styles.checkboxRow}
                  onPress={handleToggleAddOneTimeExpense}
                >
                  {showAddOneTimeExpense ? (
                    <CheckCircle2 size={24} color={Colors.light.success} />
                  ) : (
                    <Circle size={24} color={Colors.light.textSecondary} />
                  )}
                  <View style={styles.checkboxTextContainer}>
                    <Text style={styles.checkboxLabel}>Add One-Time Expense</Text>
                    <Text style={styles.checkboxDescription}>
                      Add a custom expense for this paycheck only
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  style={styles.checkboxRow}
                  onPress={() => setAddRemainingToSavings(!addRemainingToSavings)}
                >
                  {addRemainingToSavings ? (
                    <CheckCircle2 size={24} color={Colors.light.success} />
                  ) : (
                    <Circle size={24} color={Colors.light.textSecondary} />
                  )}
                  <View style={styles.checkboxTextContainer}>
                    <Text style={styles.checkboxLabel}>Add Remaining to Savings</Text>
                    <Text style={styles.checkboxDescription}>
                      All remaining amount after expenses and tithe will go to savings
                    </Text>
                  </View>
                </Pressable>

                {(selectedExpenseIds.length > 0 || settings.titheEnabled) && (
                  <View style={styles.selectedSummary}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.selectedSummaryText}>
                        Selected: {selectedExpenseIds.length} expenses
                      </Text>
                      <Text style={styles.selectedSummaryAmount}>
                        ${selectedExpensesTotal.toFixed(2)}
                      </Text>
                    </View>
                    {settings.titheEnabled && amount && parseFloat(amount) > 0 && (
                      <View style={styles.summaryRow}>
                        <Text style={styles.selectedSummaryText}>
                          Tithe ({settings.tithePercentage}%):
                        </Text>
                        <Text style={styles.selectedSummaryAmount}>
                          ${((parseFloat(amount) * settings.tithePercentage) / 100).toFixed(2)}
                        </Text>
                      </View>
                    )}
                    <View style={[styles.summaryRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.3)' }]}>
                      <Text style={[styles.selectedSummaryText, { fontWeight: '700' as const }]}>
                        Total:
                      </Text>
                      <Text style={[styles.selectedSummaryAmount, { fontWeight: '700' as const }]}>
                        ${
                          (selectedExpensesTotal + (settings.titheEnabled && amount ? (parseFloat(amount) * settings.tithePercentage) / 100 : 0)).toFixed(2)
                        }
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.addButton} onPress={handleAddPaycheck}>
                    <Text style={styles.addButtonText}>Log Paycheck</Text>
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
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
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
    gap: 16,
  },
  paycheckCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  paycheckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  paycheckInfo: {
    flex: 1,
  },
  paycheckAmount: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.income,
    marginBottom: 4,
  },
  paycheckMeta: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  deleteButton: {
    padding: 8,
  },
  paidExpensesSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 16,
  },
  paidExpensesTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  paidExpenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paidExpenseCheckbox: {
    marginRight: 8,
  },
  paidExpenseName: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
  },
  paidExpenseAmount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.bills,
  },
  titheText: {
    fontStyle: 'italic' as const,
    color: Colors.light.primary,
  },
  allocationSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  allocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  allocationLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  allocationAmount: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
    maxHeight: '85%',
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
    marginBottom: 12,
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
  noExpensesText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  expensesList: {
    gap: 12,
  },
  expenseSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  expenseSelectInfo: {
    flex: 1,
    marginLeft: 12,
  },
  expenseSelectName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  expenseSelectCategory: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  expenseSelectAmount: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.light.bills,
    marginRight: 8,
  },
  selectedSummary: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    flexDirection: 'column' as const,
    gap: 8,
  },
  selectedSummaryText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  selectedSummaryAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
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
  percentagePreview: {
    backgroundColor: Colors.light.tint,
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
  },
  percentageTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  percentageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  percentageLabel: {
    flex: 1,
  },
  percentageName: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 2,
  },
  percentageValue: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.7,
    fontWeight: '600' as const,
  },
  percentageAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  remainingBillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  remainingBillText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  remainingBillAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  incomeSourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  incomeSourceButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  incomeSourceButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  incomeSourceButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  incomeSourceButtonTextActive: {
    color: '#FFFFFF',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginTop: 16,
    marginBottom: 8,
  },
  checkboxTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  checkboxDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  editIconButton: {
    padding: 8,
    marginLeft: 4,
  },
  deleteIconButton: {
    padding: 8,
    marginLeft: 4,
  },
  editExpenseCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.light.tint,
    marginBottom: 12,
  },
  editExpenseTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  editExpenseActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelEditButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
  },
  cancelEditButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  saveEditButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
  },
  saveEditButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
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
  addExpenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.tint,
    marginTop: 12,
    gap: 8,
  },
  addExpenseButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.tint,
  },
  addExpenseModalContent: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    maxHeight: '70%',
  },
  editedLabel: {
    fontSize: 12,
    color: Colors.light.tint,
    fontStyle: 'italic' as const,
  },
  editedLabelSmall: {
    fontSize: 11,
    color: Colors.light.tint,
    fontStyle: 'italic' as const,
  },
  oneTimeLabel: {
    fontSize: 12,
    color: Colors.light.success,
    fontStyle: 'italic' as const,
  },
  oneTimeLabelSmall: {
    fontSize: 11,
    color: Colors.light.success,
    fontStyle: 'italic' as const,
  },
});
