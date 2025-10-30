import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type AppConfig = {
  appVersion: string;
  spendingPercentDefault: number;
  savingPercentDefault: number;
  featureTithes: boolean;
  appLogoURL: string;
  [key: string]: string | number | boolean;
};

const STORAGE_KEY = '@app_config';
const CONFIG_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSnymv07J_HgzaNmmstf410WD_bi5S6m_L_tbwjpF3CTlopu_cY7p1BFBS-FFZQf173IeLDVIxg1JbU/pub?output=csv';

const parseCSVToConfig = (csvText: string): AppConfig => {
  const lines = csvText.trim().split('\n');
  const config: any = {};

  for (const line of lines) {
    const [key, value] = line.split(',').map(s => s.trim());
    
    if (!key || !value) continue;

    if (value.toLowerCase() === 'true') {
      config[key] = true;
    } else if (value.toLowerCase() === 'false') {
      config[key] = false;
    } else if (!isNaN(Number(value)) && value !== '') {
      config[key] = Number(value);
    } else {
      config[key] = value;
    }
  }

  return config as AppConfig;
};

const fetchAppConfig = async (): Promise<AppConfig> => {
  try {
    const response = await fetch(CONFIG_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.status}`);
    }
    const csvText = await response.text();
    const config = parseCSVToConfig(csvText);
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    
    return config;
  } catch (error) {
    console.error('Error fetching app config:', error);
    
    const cachedConfig = await AsyncStorage.getItem(STORAGE_KEY);
    if (cachedConfig) {
      return JSON.parse(cachedConfig);
    }
    
    return {
      appVersion: '1.0.0',
      spendingPercentDefault: 60,
      savingPercentDefault: 40,
      featureTithes: true,
      appLogoURL: 'https://rork.app/pa/6g6ixd11m2bjzy28nn7jh/logo',
    };
  }
};

export const [AppConfigProvider, useAppConfig] = createContextHook(() => {
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  const configQuery = useQuery({
    queryKey: ['appConfig'],
    queryFn: fetchAppConfig,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data, isLoading, isError, refetch } = configQuery;

  useEffect(() => {
    if (data) {
      setLastFetchTime(new Date());
    }
  }, [data]);

  const refetchConfig = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return useMemo(
    () => ({
      config: data ?? {
        appVersion: '1.0.0',
        spendingPercentDefault: 60,
        savingPercentDefault: 40,
        featureTithes: true,
        appLogoURL: 'https://rork.app/pa/6g6ixd11m2bjzy28nn7jh/logo',
      },
      isLoading,
      isError,
      lastFetchTime,
      refetchConfig,
    }),
    [data, isLoading, isError, lastFetchTime, refetchConfig]
  );
});
