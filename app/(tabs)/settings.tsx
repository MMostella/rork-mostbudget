import Colors from '@/constants/colors';
import { useBudget } from '@/contexts/BudgetContext';
import type { HouseholdMember } from '@/types/budget';
import { ChevronRight, Download, Edit, Plus, Settings as SettingsIcon, Trash2, Upload, Users } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import BackupService from '@/src/services/BackupService';
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

type ModalType = 'adjust' | 'household' | 'edit-household' | null;
type EditItem = HouseholdMember | null;

export default function SettingsScreen() {
  const { 
    settings, 
    updateSettings, 
    currentSpendingTotal, 
    currentSavingsTotal, 
    setSpendingOrSavingsTotal, 
    householdMembers, 
    addHouseholdMember, 
    updateHouseholdMember, 
    deleteHouseholdMember,
  } = useBudget();
  
  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingItem, setEditingItem] = useState<EditItem>(null);
  
  const [tithePercentageText, setTithePercentageText] = useState(
    settings.tithePercentage.toString()
  );
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustTarget, setAdjustTarget] = useState<'spending' | 'savings'>('spending');
  const [householdName, setHouseholdName] = useState('');

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
            setModalType(null);
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

    if (modalType === 'edit-household' && editingItem && 'name' in editingItem) {
      updateHouseholdMember(editingItem.id, { name: householdName.trim() });
    } else {
      const newMember: HouseholdMember = {
        id: Date.now().toString(),
        name: householdName.trim(),
      };
      addHouseholdMember(newMember);
    }

    setHouseholdName('');
    setEditingItem(null);
    setModalType(null);
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

  const handleExportData = async () => {
    try {
      await BackupService.shareBackup();
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleImportData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      Alert.alert(
        'Import Data',
        'This will replace all your current data with the imported data. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            style: 'destructive',
            onPress: async () => {
              try {
                await BackupService.loadBackupFromFile(result.assets[0].uri);
                Alert.alert(
                  'Success',
                  'Data imported successfully. Please restart the app to see the changes.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Reload the app context
                        router.replace('/');
                      },
                    },
                  ]
                );
              } catch (error) {
                Alert.alert('Error', 'Failed to import data. Please check the file format.');
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to select file');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <SettingsIcon size={32} color={Colors.light.tint} />
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Customize your budget preferences</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Setup</Text>
          
          <Pressable 
            style={styles.navigationCard}
            onPress={() => router.push('/budget-setup')}
          >
            <View style={styles.navigationContent}>
              <View style={styles.navigationLeft}>
                <SettingsIcon size={20} color={Colors.light.tint} />
                <View style={styles.navigationTextContainer}>
                  <Text style={styles.navigationTitle}>Budget Setup</Text>
                  <Text style={styles.navigationDescription}>Manage income sources and expenses</Text>
                </View>
              </View>
              <ChevronRight size={20} color={Colors.light.textSecondary} />
            </View>
          </Pressable>
        </View>

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
                onPress={() => setModalType('household')}
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
                          setEditingItem(member);
                          setHouseholdName(member.name);
                          setModalType('edit-household');
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



        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Backup</Text>

          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Export & Import</Text>
            <Text style={styles.settingDescription}>
              Backup your data or restore from a previous backup
            </Text>
            <View style={styles.backupButtonsRow}>
              <Pressable
                style={styles.backupButton}
                onPress={handleExportData}
              >
                <Download size={18} color={Colors.light.tint} />
                <Text style={styles.backupButtonText}>Export Data</Text>
              </Pressable>
              <Pressable
                style={styles.backupButton}
                onPress={handleImportData}
              >
                <Upload size={18} color={Colors.light.tint} />
                <Text style={styles.backupButtonText}>Import Data</Text>
              </Pressable>
            </View>
          </View>
        </View>

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
              onPress={() => setModalType('adjust')}
            >
              <Text style={styles.deductButtonText}>Adjust Totals</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={modalType === 'adjust'}
        animationType="slide"
        transparent
        onRequestClose={() => setModalType(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setModalType(null)}>
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
                  ⚠️ This will set your {adjustTarget} balance to the amount entered.
                </Text>
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => {
                    setModalType(null);
                    setAdjustAmount('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.confirmButton} onPress={handleAdjustConfirm}>
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={modalType === 'household' || modalType === 'edit-household'}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setModalType(null);
          setEditingItem(null);
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
              setModalType(null);
              setEditingItem(null);
              setHouseholdName('');
            }}
          >
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>
                {modalType === 'edit-household' ? 'Edit Household Member' : 'Add Household Member'}
              </Text>
              <Text style={styles.modalDescription}>
                Enter the name of the household member
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
                    setModalType(null);
                    setEditingItem(null);
                    setHouseholdName('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.confirmButton} onPress={handleAddHouseholdMember}>
                  <Text style={styles.confirmButtonText}>
                    {modalType === 'edit-household' ? 'Update' : 'Add'}
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
    paddingBottom: 100,
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
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
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
  subsection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
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
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 2,
    borderColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: 10,
  },
  itemCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  itemRight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 4,
  },
  itemDescription: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
    fontStyle: 'italic' as const,
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
    marginBottom: 24,
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
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
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
  currentBalanceCard: {
    backgroundColor: Colors.light.primary,
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
  navigationCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  navigationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navigationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  navigationTextContainer: {
    flex: 1,
  },
  navigationTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  navigationDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
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
  householdMemberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  householdMemberPickerRow: {
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
  backupButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  backupButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: Colors.light.tint,
  },
  backupButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.tint,
  },
});
