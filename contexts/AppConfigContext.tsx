import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface AppConfig {
  appVersion: string;
  spendingPercentDefault: number;
  savingPercentDefault: number;
  featureTithes: boolean;
  featureHouseholdMembers: boolean;
  appLogoURL: string;
  splashLogoURL: string;
  [key: string]: string | number | boolean;
}

const STORAGE_KEY = '@app_config';
const CONFIG_ENDPOINT = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSnymv07J_HgzaNmmstf410WD_bi5S6m_L_tbwjpF3CTlopu_cY7p1BFBS-FFZQf173IeLDVIxg1JbU/pub?output=csv';
const CACHE_DURATION = 1000 * 60 * 60;

const defaultConfig: AppConfig = {
  appVersion: '1.0.0',
  spendingPercentDefault: 0.6,
  savingPercentDefault: 0.4,
  featureTithes: true,
  featureHouseholdMembers: true,
  appLogoURL: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/cxeki5it6ixy7by31yulm',
  splashLogoURL: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/cxeki5it6ixy7by31yulm',
};

export const [AppConfigProvider, useAppConfig] = createContextHook(() => {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = useCallback((csv: string): AppConfig => {
    console.log('Parsing CSV config data');
    const lines = csv.trim().split('\n');
    const configData: Partial<AppConfig> = {};

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const [key, value] = line.split(',').map(s => s.trim());
      if (!key || !value) continue;

      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true') {
        (configData as Record<string, string | number | boolean>)[key] = true;
      } else if (lowerValue === 'false') {
        (configData as Record<string, string | number | boolean>)[key] = false;
      } else if (!isNaN(parseFloat(value))) {
        (configData as Record<string, string | number | boolean>)[key] = parseFloat(value);
      } else {
        (configData as Record<string, string | number | boolean>)[key] = value;
      }
    }

    console.log('Parsed config:', configData);
    return { ...defaultConfig, ...configData } as AppConfig;
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      console.log('Fetching config from:', CONFIG_ENDPOINT);
      const response = await fetch(CONFIG_ENDPOINT);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const csvData = await response.text();
      console.log('Received CSV data, length:', csvData.length);
      
      const parsedConfig = parseCSV(csvData);
      
      const timestamp = Date.now();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        config: parsedConfig,
        timestamp,
      }));

      setConfig(parsedConfig);
      setLastFetchTime(timestamp);
      setError(null);
      console.log('Config updated successfully');
    } catch (err) {
      console.error('Error fetching config:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch config');
    } finally {
      setIsLoading(false);
    }
  }, [parseCSV]);

  const loadConfig = useCallback(async () => {
    try {
      console.log('Loading app config');
      const cachedData = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (cachedData) {
        const { config: cached, timestamp } = JSON.parse(cachedData);
        const age = Date.now() - timestamp;
        
        console.log(`Cached config found, age: ${Math.round(age / 1000)}s`);
        
        if (age < CACHE_DURATION) {
          console.log('Using cached config');
          setConfig(cached);
          setLastFetchTime(timestamp);
          setIsLoading(false);
          return;
        }
      }

      console.log('Fetching fresh config from server');
      await fetchConfig();
    } catch (err) {
      console.error('Error loading config:', err);
      setError(err instanceof Error ? err.message : 'Failed to load config');
      setIsLoading(false);
    }
  }, [fetchConfig]);

  const refreshConfig = useCallback(async () => {
    console.log('Manual config refresh requested');
    setIsLoading(true);
    await fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);



  return useMemo(
    () => ({
      config,
      isLoading,
      error,
      lastFetchTime,
      refreshConfig,
    }),
    [config, isLoading, error, lastFetchTime, refreshConfig]
  );
});
