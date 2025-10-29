import Colors from '@/constants/colors';
import { useBudget } from '@/contexts/BudgetContext';
import { useAppConfig } from '@/contexts/AppConfigContext';
import type { HouseholdMember } from '@/types/budget';
import { Edit, Plus, RefreshCw, Trash2, Users } from 'lucide-react-native';
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
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function SettingsScreen() {
  const { config, refreshConfig, lastFetchTime } = useAppConfig();
  const { settings, updateSettings, currentSpendingTotal, currentSavingsTotal, setSpendingOrSavingsTotal, householdMembers, addHouseholdMember, updateHouseholdMember, deleteHouseholdMember } = useBudget();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tithePercentageText, setTithePercentageText] = useState(
    settings.tithePercentage.toString()
  );
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustTarget, setAdjustTarget] = useState<'spending' | 'savings'>('spending');
  const [householdModalVisible, setHouseholdModalVisible] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const [editingHouseholdMember, setEditingHouseholdMember] = useState<HouseholdMember | null>(null);
  const amountInputRef = useRef<TextInput>(null);
  const householdNameRef = useRef<TextInput>(null);

  const handleTitheToggle = (value: boolean) => {
    updateSettings({ titheEnabled: value });
  };

  const handleTithePercentageChange = (text: string) => {
    setTithePercentageText(text);
    const parsed = parseFloat(text);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      updateSettings({ tithePercentage: parsed });
    }
  };

  const handleTithePercentageBlur = () => {
    const parsed = parseFloat(tithePercentageText);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      Alert.alert('Invalid Percentage', 'Please enter a value between 0 and 100');
      setTithePercentageText(settings.tithePercentage.toString());
    }
  };

  const handleAdjustConfirm = () => {
    const parsedAmount = parseFloat(adjustAmount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    const currentBalance = adjustTarget === 'spending' ? currentSpendingTotal : currentSavingsTotal;

    Alert.alert(
      'Confirm Change',
      `Are you sure you want to change your ${adjustTarget} total?\n\nCurrent ${adjustTarget}: ${currentBalance.toFixed(2)}\nNew ${adjustTarget}: ${parsedAmount.toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            await setSpendingOrSavingsTotal(parsedAmount, adjustTarget);
            setAdjustAmount('');
            setAdjustModalVisible(false);
            Keyboard.dismiss();
          },
        },
      ]
    );
  };

  const handleAddHouseholdMember = () => {
    if (!householdName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    if (editingHouseholdMember) {
      updateHouseholdMember(editingHouseholdMember.id, { name: householdName.trim() });
    } else {
      const newMember: HouseholdMember = {
        id: Date.now().toString(),
        name: householdName.trim(),
      };
      addHouseholdMember(newMember);
    }

    setHouseholdName('');
    setEditingHouseholdMember(null);
    setHouseholdModalVisible(false);
  };

  const handleDeleteHouseholdMember = (id: string, name: string) => {
    Alert.alert('Delete Household Member', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteHouseholdMember(id),
      },
    ]);
  };

  const handleRefreshConfig = async () => {
    setIsRefreshing(true);
    await refreshConfig();
    setIsRefreshing(false);
    Alert.alert('Config Refreshed', 'App configuration has been updated from the server.');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerDescription}>Manage your budget preferences and household</Text>
        </View>

        {config.featureHouseholdMembers && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Household Members</Text>

              <View style={styles.settingCard}>
                <View style={styles.householdHeader}>
                  <View style={styles.householdHeaderLeft}>
                    <Users size={20} color={Colors.light.tint} />
                    <Text style={styles.settingLabel}>Manage household members</Text>
                  </View>
                  <Pressable
                    style={styles.addHouseholdButton}
                    onPress={() => setHouseholdModalVisible(true)}
                  >
                    <Plus size={20} color={Colors.light.tint} />
                  </Pressable>
                </View>
                {householdMembers.length === 0 ? (
                  <Text style={styles.emptyHouseholdText}>No household members added</Text>
                ) : (
                  <View style={styles.householdList}>
                    {householdMembers.map((member) => (
                      <View key={member.id} style={styles.householdMemberRow}>
                        <Text style={styles.householdMemberName}>{member.name}</Text>
                        <View style={styles.householdActions}>
                          <Pressable
                            style={styles.householdActionButton}
                            onPress={() => {
                              setEditingHouseholdMember(member);
                              setHouseholdName(member.name);
                              setHouseholdModalVisible(true);
                            }}
                          >
                            <Edit size={18} color={Colors.light.tint} />
                          </Pressable>
                          <Pressable
                            style={styles.householdActionButton}
                            onPress={() => handleDeleteHouseholdMember(member.id, member.name)}
                          >
                            <Trash2 size={18} color={Colors.light.danger} />
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>How Household Members Work</Text>
              <Text style={styles.infoText}>
                Add household members who earn income. You can assign paychecks and expenses to help track who contributes to the budget. This helps you manage shared finances and see individual contributions.
              </Text>
            </View>
          </>
        )}

        {config.featureTithes && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tithing</Text>

              <View style={styles.settingCard}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Enable Tithe</Text>
                    <Text style={styles.settingDescription}>
                      Automatically calculate tithe from paychecks
                    </Text>
                  </View>
                  <Switch
                    value={settings.titheEnabled}
                    onValueChange={handleTitheToggle}
                    trackColor={{
                      false: Colors.light.border,
                      true: Colors.light.tint,
                    }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {settings.titheEnabled && (
                  <View style={styles.percentageContainer}>
                    <Text style={styles.percentageLabel}>Tithe Percentage</Text>
                    <View style={styles.percentageInputWrapper}>
                      <TextInput
                        style={styles.percentageInput}
                        value={tithePercentageText}
                        onChangeText={handleTithePercentageChange}
                        onBlur={handleTithePercentageBlur}
                        keyboardType="decimal-pad"
                        placeholder="10"
                        maxLength={5}
                      />
                      <Text style={styles.percentageSymbol}>%</Text>
                    </View>
                    <Text style={styles.percentageHint}>
                      {settings.tithePercentage}% of each paycheck will be set aside for tithe
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>How Tithe Works</Text>
              <Text style={styles.infoText}>
                When enabled, the tithe amount will be automatically calculated and shown as an
                expense when you log a paycheck. The tithe is calculated before other expenses
                are paid.
              </Text>
            </View>
          </>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manual Adjustments</Text>

          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Adjust Spending or Savings</Text>
            <Text style={styles.settingDescription}>
              Manually change your spending or savings balance
            </Text>
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>Spending:</Text>
                <Text style={[styles.balanceAmount, { color: Colors.light.income }]}>
                  ${currentSpendingTotal.toFixed(2)}
                </Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>Savings:</Text>
                <Text style={[styles.balanceAmount, { color: Colors.light.success }]}>
                  ${currentSavingsTotal.toFixed(2)}
                </Text>
              </View>
            </View>
            <Pressable
              style={styles.deductButton}
              onPress={() => setAdjustModalVisible(true)}
            >
              <Text style={styles.deductButtonText}>Adjust Totals</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Configuration</Text>
          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Version: {config.appVersion}</Text>
            <Text style={styles.settingDescription}>Last synced: {lastFetchTime ? new Date(lastFetchTime).toLocaleString() : 'Never'}</Text>
            <Pressable style={[styles.deductButton, styles.refreshButton, isRefreshing && styles.deductButtonDisabled]} onPress={handleRefreshConfig} disabled={isRefreshing}>
              <RefreshCw size={16} color="#FFFFFF" />
              <Text style={styles.deductButtonText}>{isRefreshing ? 'Refreshing...' : 'Refresh Config'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={adjustModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAdjustModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setAdjustModalVisible(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Adjust Balance</Text>
              <Text style={styles.modalDescription}>
                Set a new total for your spending or savings balance
              </Text>

              <Text style={styles.label}>Adjust</Text>
              <View style={styles.optionsRow}>
                <Pressable
                  style={[
                    styles.optionButton,
                    adjustTarget === 'spending' && styles.optionButtonActive,
                  ]}
                  onPress={() => setAdjustTarget('spending')}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      adjustTarget === 'spending' && styles.optionButtonTextActive,
                    ]}
                  >
                    Spending
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.optionButton,
                    adjustTarget === 'savings' && styles.optionButtonActive,
                  ]}
                  onPress={() => setAdjustTarget('savings')}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      adjustTarget === 'savings' && styles.optionButtonTextActive,
                    ]}
                  >
                    Savings
                  </Text>
                </Pressable>
              </View>

              <View style={styles.currentBalanceCard}>
                <Text style={styles.currentBalanceLabel}>Current {adjustTarget}:</Text>
                <Text style={styles.currentBalanceAmount}>
                  ${(adjustTarget === 'spending' ? currentSpendingTotal : currentSavingsTotal).toFixed(2)}
                </Text>
              </View>

              <Text style={styles.label}>New Amount</Text>
              <TextInput
                ref={amountInputRef}
                style={styles.input}
                placeholder="0.00"
                value={adjustAmount}
                onChangeText={setAdjustAmount}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={handleAdjustConfirm}
              />

              <View style={styles.warningCard}>
                <Text style={styles.warningText}>
                  ⚠️ This will set your {adjustTarget} balance to the amount entered. Make sure the amount is correct before confirming.
                </Text>
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => {
                    setAdjustModalVisible(false);
                    setAdjustAmount('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.confirmButton} onPress={handleAdjustConfirm}>
                  <Text style={styles.confirmButtonText}>Confirm Change</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={householdModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setHouseholdModalVisible(false);
          setEditingHouseholdMember(null);
          setHouseholdName('');
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => {
              setHouseholdModalVisible(false);
              setEditingHouseholdMember(null);
              setHouseholdName('');
            }}
          >
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>
                {editingHouseholdMember ? 'Edit Household Member' : 'Add Household Member'}
              </Text>
              <Text style={styles.modalDescription}>
                Enter the name of the household member who earns income or pays expenses
              </Text>

              <Text style={styles.label}>Name</Text>
              <TextInput
                ref={householdNameRef}
                style={styles.input}
                placeholder="e.g. John, Jane"
                value={householdName}
                onChangeText={setHouseholdName}
                returnKeyType="done"
                onSubmitEditing={handleAddHouseholdMember}
              />

              <View style={styles.modalActions}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => {
                    setHouseholdModalVisible(false);
                    setEditingHouseholdMember(null);
                    setHouseholdName('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.confirmButton} onPress={handleAddHouseholdMember}>
                  <Text style={styles.confirmButtonText}>
                    {editingHouseholdMember ? 'Update' : 'Add'}
                  </Text>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  settingCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  percentageContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  percentageLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  percentageInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  percentageInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
    paddingVertical: 12,
  },
  percentageSymbol: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
    marginLeft: 8,
  },
  percentageHint: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontStyle: 'italic' as const,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 12,
  },
  balanceItem: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
    fontWeight: '600' as const,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  deductButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  deductButtonDisabled: {
    opacity: 0.5,
  },
  deductButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
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
  optionsRow: {
    flexDirection: 'column' as const,
    gap: 8,
    marginBottom: 12,
  },
  optionButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  optionButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    textAlign: 'center',
  },
  optionButtonTextActive: {
    color: '#FFFFFF',
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
    padding: 16,
    marginTop: 16,
  },
  warningText: {
    fontSize: 13,
    color: Colors.light.bills,
    lineHeight: 20,
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
  confirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  currentBalanceCard: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  currentBalanceLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 4,
  },
  currentBalanceAmount: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  householdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  householdHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addHouseholdButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    borderWidth: 2,
    borderColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHouseholdText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingVertical: 12,
  },
  householdList: {
    gap: 8,
  },
  householdMemberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
  },
  householdMemberName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  householdActions: {
    flexDirection: 'row',
    gap: 12,
  },
  householdActionButton: {
    padding: 4,
  },
  refreshButton: {
    marginTop: 16,
  },
});
