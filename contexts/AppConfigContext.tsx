import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking } from 'react-native';

export type AppConfig = {
  data: {
    appVersion: string;
    currentAppVersion?: string;
    spendingPercentDefault: number;
    savingPercentDefault: number;
    featureTithes: boolean;
    appLogoURL: string;
    urlBuyMeACoffee?: string;
    [key: string]: string | number | boolean | undefined;
  };
  [key: string]: any;
};

export type PopupConfig = {
  messageVersion?: string;
  title?: string;
  body?: string;
  support?: string;
  link?: boolean;
  popup?: {
    messageVersion: string;
    title: string;
    body: string;
    support: string;
    link: boolean;
  };
  [key: string]: string | number | boolean | undefined | { [key: string]: string | number | boolean };
};

export type ReminderConfig = {
  [key: string]: string | number | boolean;
};

export type AllConfigs = {
  main: AppConfig;
  popups: PopupConfig;
  reminders: ReminderConfig;
};

const STORAGE_KEY = '@app_config';
const POPUPS_STORAGE_KEY = '@app_config_popups';
const REMINDERS_STORAGE_KEY = '@app_config_reminders';
const LAST_POPUP_VERSION_KEY = '@last_popup_version';
const BASE_CONFIG_URL = 'https://script.google.com/macros/s/AKfycbzoSRxVzBh9k7n5LS5sq-oqSwybBaY89zb5gSNZmXBDqVp9JamBeTQHf2yjVB056hCF/exec?config=';

const fetchConfig = async (configType: string, storageKey: string, fallback: any): Promise<any> => {
  const url = BASE_CONFIG_URL + configType;
  console.log(`Fetching ${configType} from:`, url);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${configType}: ${response.status}`);
    }
    const config = await response.json();
    console.log(`${configType} fetched successfully:`, config);
    
    await AsyncStorage.setItem(storageKey, JSON.stringify(config));
    await AsyncStorage.setItem(storageKey + '_timestamp', new Date().toISOString());
    
    return config;
  } catch (error) {
    console.error(`Error fetching ${configType}:`, error);
    
    const cachedConfig = await AsyncStorage.getItem(storageKey);
    if (cachedConfig) {
      console.log(`Using cached ${configType}`);
      return JSON.parse(cachedConfig);
    }
    
    console.log(`Using fallback ${configType}`);
    return fallback;
  }
};

const fetchAllConfigs = async (): Promise<AllConfigs> => {
  const [main, popups, reminders] = await Promise.all([
    fetchConfig('AppConfig_Main', STORAGE_KEY, {
      data: {
        appVersion: '1.0.0',
        spendingPercentDefault: 60,
        savingPercentDefault: 40,
        featureTithes: true,
        appLogoURL: 'https://rork.app/pa/6g6ixd11m2bjzy28nn7jh/logo',
      },
    }),
    fetchConfig('Popups', POPUPS_STORAGE_KEY, {
      messageVersion: '0',
      title: '',
      body: '',
      support: '',
      link: false,
    }),
    fetchConfig('Reminders', REMINDERS_STORAGE_KEY, {}),
  ]);

  return { main, popups, reminders };
};

export const [AppConfigProvider, useAppConfig] = createContextHook(() => {
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);

  const configQuery = useQuery({
    queryKey: ['appConfig'],
    queryFn: fetchAllConfigs,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data, isLoading, isError, refetch } = configQuery;

  const checkForNewPopup = useCallback(async () => {
    if (!data?.popups || popupDismissed) return;

    try {
      const lastVersion = await AsyncStorage.getItem(LAST_POPUP_VERSION_KEY);
      const currentVersion = (data.popups.popup?.messageVersion || data.popups.messageVersion) as string | undefined;

      console.log('Popup version check:', { lastVersion, currentVersion });

      if (lastVersion !== currentVersion && currentVersion && currentVersion !== '0') {
        console.log('New popup version detected, showing popup');
        setShowPopup(true);
      }
    } catch (error) {
      console.error('Error checking popup version:', error);
    }
  }, [data?.popups, popupDismissed]);

  useEffect(() => {
    if (data) {
      setLastFetchTime(new Date());
      checkForNewPopup();
    }
  }, [data, checkForNewPopup]);

  const dismissPopup = useCallback(async () => {
    setShowPopup(false);
    setPopupDismissed(true);
    const messageVersion = (data?.popups?.popup?.messageVersion || data?.popups?.messageVersion) as string | undefined;
    if (messageVersion) {
      await AsyncStorage.setItem(LAST_POPUP_VERSION_KEY, messageVersion);
      console.log('Popup dismissed, saved version:', messageVersion);
    }
  }, [data?.popups]);

  const handleBuyMeACoffee = useCallback(async () => {
    let url: string | undefined;
    
    if (data?.main?.main?.data) {
      const dataArray = data.main.main.data;
      const urlBuyMeACoffeeItem = dataArray.find((item: any) => item.key === 'urlBuyMeACoffee');
      url = urlBuyMeACoffeeItem?.value;
    } else if (data?.main?.data?.urlBuyMeACoffee) {
      url = data.main.data.urlBuyMeACoffee as string;
    }

    console.log('Buy Me a Coffee URL:', url);

    if (url) {
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          console.log('Unable to open the link');
        }
      } catch (error) {
        console.error('Error opening Buy Me a Coffee link:', error);
      }
    } else {
      console.log('No Buy Me a Coffee URL found');
    }
  }, [data?.main]);

  const refetchConfig = useCallback(async () => {
    await refetch();
  }, [refetch]);



  const popupModalData = useMemo(() => {
    if (!data?.popups) return null;

    const popupData = data.popups.popup || data.popups;
    
    let urlBuyMeACoffee: string | undefined;
    if (data?.main?.main?.data) {
      const dataArray = data.main.main.data;
      const urlBuyMeACoffeeItem = dataArray.find((item: any) => item.key === 'urlBuyMeACoffee');
      urlBuyMeACoffee = urlBuyMeACoffeeItem?.value;
    } else if (data?.main?.data?.urlBuyMeACoffee) {
      urlBuyMeACoffee = data.main.data.urlBuyMeACoffee as string;
    }

    console.log('Popup modal data:', { popupData, urlBuyMeACoffee, linkField: popupData.link });

    return {
      popupData,
      urlBuyMeACoffee,
      shouldShowButton: popupData.link === true && !!urlBuyMeACoffee,
    };
  }, [data]);

  return useMemo(
    () => ({
      config: data?.main ?? {
        data: {
          appVersion: '1.0.0',
          spendingPercentDefault: 60,
          savingPercentDefault: 40,
          featureTithes: true,
          appLogoURL: 'https://rork.app/pa/6g6ixd11m2bjzy28nn7jh/logo',
        },
      },
      allConfigs: data ?? {
        main: {
          data: {
            appVersion: '1.0.0',
            spendingPercentDefault: 60,
            savingPercentDefault: 40,
            featureTithes: true,
            appLogoURL: 'https://rork.app/pa/6g6ixd11m2bjzy28nn7jh/logo',
          },
        },
        popups: {
          messageVersion: '0',
          title: '',
          body: '',
          support: '',
          link: false,
        },
        reminders: {},
      },
      isLoading,
      isError,
      lastFetchTime,
      refetchConfig,
      popupState: {
        showPopup,
        popupModalData,
        dismissPopup,
        handleBuyMeACoffee,
      },
    }),
    [data, isLoading, isError, lastFetchTime, refetchConfig, showPopup, popupModalData, dismissPopup, handleBuyMeACoffee]
  );
});


