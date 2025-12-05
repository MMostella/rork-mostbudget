import Colors from '@/constants/colors';
import { useBudget } from '@/contexts/BudgetContext';
import { useAppConfig } from '@/contexts/AppConfigContext';
import { AlertTriangle, ChevronLeft, Download, Upload, Bug } from 'lucide-react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import BackupService from '@/src/services/BackupService';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useState, useRef } from 'react';

export default function DangerZoneScreen() {
  const { currentSpendingTotal, currentSavingsTotal, setSpendingOrSavingsTotal } = useBudget();
  const { config } = useAppConfig();
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustTarget, setAdjustTarget] = useState<'spending' | 'savings'>('spending');
  const [versionTapCount, setVersionTapCount] = useState(0);
  const [showDebugOption, setShowDebugOption] = useState(false);
  const amountInputRef = useRef<TextInput>(null);

  const handleVersionPress = () => {
    const newCount = versionTapCount + 1;
    setVersionTapCount(newCount);

    if (newCount === 5) {
      setShowDebugOption(true);
      Alert.alert('Debug Mode', 'Debug option unlocked!');
    }

    setTimeout(() => {
      setVersionTapCount(0);
    }, 2000);
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

  const handleAdjustConfirm = () => {
    const parsedAmount = parseFloat(adjustAmount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    const currentBalance = adjustTarget === 'spending' ? currentSpendingTotal : currentSavingsTotal;

    Alert.alert(
      'Confirm Change',
      `Are you sure you want to change your ${adjustTarget} total?\n\nCurrent ${adjustTarget}: $${currentBalance.toFixed(2)}\nNew ${adjustTarget}: $${parsedAmount.toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            await setSpendingOrSavingsTotal(parsedAmount, adjustTarget);
            setAdjustAmount('');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={Colors.light.text} />
        </Pressable>
        <View style={styles.headerContent}>
          <AlertTriangle size={32} color={Colors.light.danger} />
          <Text style={styles.headerTitle}>Danger Zone</Text>
          <Text style={styles.headerSubtitle}>Handle sensitive operations with care</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>

          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Current Version</Text>
            <Pressable onPress={handleVersionPress}>
              <Text style={styles.versionText}>{config.appVersion}</Text>
            </Pressable>
            {showDebugOption && (
              <Pressable
                style={styles.debugButton}
                onPress={() => router.push('/debug-config')}
              >
                <Bug size={18} color={Colors.light.tint} />
                <Text style={styles.debugButtonText}>View AppConfig Debug</Text>
              </Pressable>
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

            <Pressable
              style={styles.confirmButton}
              onPress={handleAdjustConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirm Adjustment</Text>
            </Pressable>
          </View>
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
  header: {
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
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
    textAlign: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
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
  confirmButton: {
    backgroundColor: Colors.light.danger,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  versionText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.tint,
    marginTop: 8,
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: Colors.light.tint,
    marginTop: 16,
  },
  debugButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.tint,
  },
});
