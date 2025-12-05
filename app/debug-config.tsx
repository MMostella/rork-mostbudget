import Colors from '@/constants/colors';
import { useAppConfig } from '@/contexts/AppConfigContext';
import { ChevronLeft, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';

export default function DebugConfigScreen() {
  const { config, allConfigs, isLoading, isError, lastFetchTime, refetchConfig } = useAppConfig();
  const [cachedTimestamp, setCachedTimestamp] = useState<string | null>(null);
  const [popupsTimestamp, setPopupsTimestamp] = useState<string | null>(null);
  const [remindersTimestamp, setRemindersTimestamp] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const loadCachedTimestamps = async () => {
      const [mainTs, popupsTs, remindersTs] = await Promise.all([
        AsyncStorage.getItem('@app_config_timestamp'),
        AsyncStorage.getItem('@app_config_popups_timestamp'),
        AsyncStorage.getItem('@app_config_reminders_timestamp'),
      ]);
      setCachedTimestamp(mainTs);
      setPopupsTimestamp(popupsTs);
      setRemindersTimestamp(remindersTs);
    };
    loadCachedTimestamps();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchConfig();
    const [mainTs, popupsTs, remindersTs] = await Promise.all([
      AsyncStorage.getItem('@app_config_timestamp'),
      AsyncStorage.getItem('@app_config_popups_timestamp'),
      AsyncStorage.getItem('@app_config_reminders_timestamp'),
    ]);
    setCachedTimestamp(mainTs);
    setPopupsTimestamp(popupsTs);
    setRemindersTimestamp(remindersTs);
    setIsRefreshing(false);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Unknown';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString();
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
          <Text style={styles.headerTitle}>AppConfig Debug</Text>
          <Text style={styles.headerSubtitle}>View current configuration</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusSection}>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Status</Text>
                <View style={styles.statusBadge}>
                  {isLoading ? (
                    <>
                      <ActivityIndicator size="small" color={Colors.light.tint} />
                      <Text style={[styles.statusText, { color: Colors.light.tint }]}>Loading</Text>
                    </>
                  ) : isError ? (
                    <>
                      <XCircle size={16} color={Colors.light.danger} />
                      <Text style={[styles.statusText, { color: Colors.light.danger }]}>Error</Text>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} color={Colors.light.success} />
                      <Text style={[styles.statusText, { color: Colors.light.success }]}>Active</Text>
                    </>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.timestampRow}>
              <Clock size={16} color={Colors.light.textSecondary} />
              <View style={styles.timestampInfo}>
                <Text style={styles.timestampLabel}>Last Fetch:</Text>
                <Text style={styles.timestampValue}>{formatDate(lastFetchTime)}</Text>
              </View>
            </View>

            {cachedTimestamp && (
              <View style={styles.timestampRow}>
                <Clock size={16} color={Colors.light.textSecondary} />
                <View style={styles.timestampInfo}>
                  <Text style={styles.timestampLabel}>Cached At:</Text>
                  <Text style={styles.timestampValue}>{formatDate(cachedTimestamp)}</Text>
                </View>
              </View>
            )}

            <Pressable
              style={styles.refreshButton}
              onPress={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw 
                size={18} 
                color={isRefreshing ? Colors.light.textSecondary : Colors.light.tint} 
              />
              <Text style={[
                styles.refreshButtonText,
                isRefreshing && styles.refreshButtonTextDisabled
              ]}>
                {isRefreshing ? 'Refreshing...' : 'Refresh Config'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AppConfig_Main</Text>
          <View style={styles.configCard}>
            {config.data && Object.entries(config.data).map(([key, value]) => (
              <View key={key} style={styles.configRow}>
                <Text style={styles.configKey}>{key}</Text>
                <Text style={styles.configValue}>
                  {typeof value === 'boolean' 
                    ? (value ? 'true' : 'false')
                    : typeof value === 'object'
                    ? JSON.stringify(value)
                    : String(value)}
                </Text>
              </View>
            ))}
          </View>
          {cachedTimestamp && (
            <Text style={styles.timestampNote}>Cached: {formatDate(cachedTimestamp)}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popups Config</Text>
          <View style={styles.configCard}>
            {Object.entries(allConfigs.popups).map(([key, value]) => (
              <View key={key} style={styles.configRow}>
                <Text style={styles.configKey}>{key}</Text>
                <Text style={styles.configValue}>
                  {typeof value === 'boolean' 
                    ? (value ? 'true' : 'false')
                    : typeof value === 'object'
                    ? JSON.stringify(value)
                    : String(value)}
                </Text>
              </View>
            ))}
          </View>
          {popupsTimestamp && (
            <Text style={styles.timestampNote}>Cached: {formatDate(popupsTimestamp)}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminders Config</Text>
          <View style={styles.configCard}>
            {Object.keys(allConfigs.reminders).length > 0 ? (
              Object.entries(allConfigs.reminders).map(([key, value]) => (
                <View key={key} style={styles.configRow}>
                  <Text style={styles.configKey}>{key}</Text>
                  <Text style={styles.configValue}>
                    {typeof value === 'boolean' 
                      ? (value ? 'true' : 'false')
                      : typeof value === 'object'
                      ? JSON.stringify(value)
                      : String(value)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No reminders configured</Text>
            )}
          </View>
          {remindersTimestamp && (
            <Text style={styles.timestampNote}>Cached: {formatDate(remindersTimestamp)}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Raw JSON (All Configs)</Text>
          <View style={styles.jsonCard}>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <Text style={styles.jsonText}>
                {JSON.stringify(allConfigs, null, 2)}
              </Text>
            </ScrollView>
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
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  statusSection: {
    marginBottom: 24,
  },
  statusCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusItem: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  timestampInfo: {
    flex: 1,
  },
  timestampLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  timestampValue: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '500' as const,
  },
  refreshButton: {
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
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.tint,
  },
  refreshButtonTextDisabled: {
    color: Colors.light.textSecondary,
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
  configCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  configKey: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    flex: 1,
  },
  configValue: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  jsonCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  jsonText: {
    fontSize: 12,
    color: '#9CDCFE',
    fontFamily: 'monospace',
  },
  timestampNote: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    padding: 12,
  },
});
