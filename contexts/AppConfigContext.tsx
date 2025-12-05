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
const CONFIG_URL = 'https://script.google.com/macros/s/AKfycbzoSRxVzBh9k7n5LS5sq-oqSwybBaY89zb5gSNZmXBDqVp9JamBeTQHf2yjVB056hCF/exec?config=AppConfig_Main';

const fetchAppConfig = async (): Promise<AppConfig> => {
  console.log('Fetching app config from:', CONFIG_URL);
  try {
    const response = await fetch(CONFIG_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.status}`);
    }
    const config = await response.json();
    console.log('App config fetched successfully:', config);
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    await AsyncStorage.setItem(STORAGE_KEY + '_timestamp', new Date().toISOString());
    
    return config as AppConfig;
  } catch (error) {
    console.error('Error fetching app config:', error);
    
    const cachedConfig = await AsyncStorage.getItem(STORAGE_KEY);
    if (cachedConfig) {
      console.log('Using cached app config');
      return JSON.parse(cachedConfig);
    }
    
    console.log('Using fallback app config');
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
