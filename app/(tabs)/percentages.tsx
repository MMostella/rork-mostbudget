import Colors from '@/constants/colors';
import { useBudget } from '@/contexts/BudgetContext';
import { Settings } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function PercentagesScreen() {
  const { getBudgetPercentages, getBudgetSummary, updatePercentageMultipliers, isLoading } =
    useBudget();
  const [modalVisible, setModalVisible] = useState(false);
  const [spendInput, setSpendInput] = useState('');
  const [savingsInput, setSavingsInput] = useState('');
  
  const spendInputRef = useRef<TextInput>(null);
  const savingsInputRef = useRef<TextInput>(null);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  const percentages = getBudgetPercentages();
  const summary = getBudgetSummary();

  const handleOpenModal = () => {
    setSpendInput((percentages.spendMultiplier * 100).toString());
    setSavingsInput((percentages.savingsMultiplier * 100).toString());
    setModalVisible(true);
  };

  const handleUpdateMultipliers = () => {
    const spend = parseFloat(spendInput);
    const savings = parseFloat(savingsInput);

    if (isNaN(spend) || isNaN(savings)) {
      Alert.alert('Error', 'Please enter valid percentages');
      return;
    }

    if (spend < 0 || savings < 0 || spend > 100 || savings > 100) {
      Alert.alert('Error', 'Percentages must be between 0 and 100');
      return;
    }

    if (Math.abs(spend + savings - 100) > 0.01) {
      Alert.alert('Error', 'Spend and Savings percentages must add up to 100%');
      return;
    }

    updatePercentageMultipliers(spend / 100, savings / 100);
    setModalVisible(false);
  };

  const remaining = summary.totalIncome - summary.totalBills;
  const spendAmount = remaining * percentages.spendMultiplier;
  const savingsAmount = remaining * percentages.savingsMultiplier;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Budget Breakdown</Text>
            <Text style={styles.subtitle}>
              {new Date().toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
          <Pressable style={styles.settingsButton} onPress={handleOpenModal}>
            <Settings size={24} color={Colors.light.tint} />
          </Pressable>
        </View>

        <View style={styles.incomeCard}>
          <Text style={styles.incomeLabel}>Total Monthly Income</Text>
          <Text style={styles.incomeAmount}>${summary.totalIncome.toFixed(2)}</Text>
        </View>

        <View style={styles.percentagesContainer}>
          <View style={[styles.percentageCard, { backgroundColor: '#FFF3E0' }]}>
            <View style={styles.percentageHeader}>
              <Text style={styles.percentageLabel}>Bills</Text>
              <View style={[styles.badge, { backgroundColor: Colors.light.bills }]}>
                <Text style={styles.badgeText}>{percentages.billsPercentage.toFixed(1)}%</Text>
              </View>
            </View>
            <Text style={[styles.percentageAmount, { color: Colors.light.bills }]}>
              ${summary.totalBills.toFixed(2)}
            </Text>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.min(percentages.billsPercentage, 100)}%`,
                    backgroundColor: Colors.light.bills,
                  },
                ]}
              />
            </View>
            <Text style={styles.percentageFormula}>Total Bills ÷ Income</Text>
          </View>

          <View style={[styles.percentageCard, { backgroundColor: '#E8F5E9' }]}>
            <View style={styles.percentageHeader}>
              <Text style={styles.percentageLabel}>Spending</Text>
              <View style={[styles.badge, { backgroundColor: Colors.light.income }]}>
                <Text style={styles.badgeText}>{percentages.spendPercentage.toFixed(1)}%</Text>
              </View>
            </View>
            <Text style={[styles.percentageAmount, { color: Colors.light.income }]}>
              ${spendAmount.toFixed(2)}
            </Text>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.min(percentages.spendPercentage, 100)}%`,
                    backgroundColor: Colors.light.income,
                  },
                ]}
              />
            </View>
            <Text style={styles.percentageFormula}>
              (Income - Bills) × {(percentages.spendMultiplier * 100).toFixed(0)}% ÷ Income
            </Text>
          </View>

          <View style={[styles.percentageCard, { backgroundColor: '#E3F2FD' }]}>
            <View style={styles.percentageHeader}>
              <Text style={styles.percentageLabel}>Savings</Text>
              <View style={[styles.badge, { backgroundColor: Colors.light.primary }]}>
                <Text style={styles.badgeText}>{percentages.savingsPercentage.toFixed(1)}%</Text>
              </View>
            </View>
            <Text style={[styles.percentageAmount, { color: Colors.light.primary }]}>
              ${savingsAmount.toFixed(2)}
            </Text>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.min(percentages.savingsPercentage, 100)}%`,
                    backgroundColor: Colors.light.primary,
                  },
                ]}
              />
            </View>
            <Text style={styles.percentageFormula}>
              (Income - Bills) × {(percentages.savingsMultiplier * 100).toFixed(0)}% ÷ Income
            </Text>
          </View>
        </View>

        {summary.totalIncome === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Income Data</Text>
            <Text style={styles.emptyText}>
              Add income sources to see your budget breakdown percentages
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => { Keyboard.dismiss(); setModalVisible(false); }}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <KeyboardAwareScrollView
              enableOnAndroid
              enableAutomaticScroll
              extraScrollHeight={Platform.OS === 'ios' ? 20 : 40}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>Adjust Percentages</Text>
              <Text style={styles.modalDescription}>
                Set how you want to split remaining money (after bills) between spending and savings
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Spending %</Text>
                <TextInput
                  ref={spendInputRef}
                  style={styles.input}
                  placeholder="60"
                  value={spendInput}
                  onChangeText={setSpendInput}
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                  onSubmitEditing={() => savingsInputRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Savings %</Text>
                <TextInput
                  ref={savingsInputRef}
                  style={styles.input}
                  placeholder="40"
                  value={savingsInput}
                  onChangeText={setSavingsInput}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
              </View>

              <Text style={styles.helperText}>
                Total must equal 100%. Current: {(parseFloat(spendInput || '0') + parseFloat(savingsInput || '0')).toFixed(1)}%
              </Text>

              <View style={styles.modalActions}>
                <Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.saveButton} onPress={handleUpdateMultipliers}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </Pressable>
              </View>
            </KeyboardAwareScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  incomeCard: {
    backgroundColor: Colors.light.tint,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  incomeLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  incomeAmount: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  percentagesContainer: {
    gap: 16,
  },
  percentageCard: {
    borderRadius: 16,
    padding: 20,
  },
  percentageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  percentageLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  percentageAmount: {
    fontSize: 32,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  percentageFormula: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontStyle: 'italic' as const,
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
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalScrollContent: {
    flexGrow: 1,
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
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
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
  helperText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
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
});
