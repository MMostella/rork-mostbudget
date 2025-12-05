import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';

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
    const url = data?.main?.data?.urlBuyMeACoffee as string | undefined;
    if (url) {
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Unable to open the link');
        }
      } catch (error) {
        console.error('Error opening Buy Me a Coffee link:', error);
      }
    }
  }, [data?.main?.data?.urlBuyMeACoffee]);

  const refetchConfig = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const PopupModal = useCallback(() => {
    if (!showPopup || !data?.popups) return null;

    const popupData = data.popups.popup || data.popups;
    const shouldShowButton = popupData.link === true && data.main?.data?.urlBuyMeACoffee;

    console.log('Popup modal rendering:', {
      link: popupData.link,
      shouldShowButton,
      urlBuyMeACoffee: data.main?.data?.urlBuyMeACoffee,
    });

    return (
      <Modal
        visible={showPopup}
        transparent
        animationType="fade"
        onRequestClose={dismissPopup}
      >
        <View style={popupStyles.overlay}>
          <View style={popupStyles.modal}>
            <Text style={popupStyles.title}>{popupData.title}</Text>
            <Text style={popupStyles.body}>{popupData.body}</Text>
            <Text style={popupStyles.support}>{popupData.support}</Text>

            <View style={popupStyles.buttonContainer}>
              {shouldShowButton && (
                <Pressable
                  style={popupStyles.coffeeButton}
                  onPress={handleBuyMeACoffee}
                >
                  <Text style={popupStyles.coffeeButtonText}>☕ Buy Me a Coffee</Text>
                </Pressable>
              )}

              <Pressable
                style={popupStyles.dismissButton}
                onPress={dismissPopup}
              >
                <Text style={popupStyles.dismissButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }, [showPopup, data, dismissPopup, handleBuyMeACoffee]);

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
      PopupModal,
    }),
    [data, isLoading, isError, lastFetchTime, refetchConfig, PopupModal]
  );
});

const popupStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  support: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
  },
  coffeeButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  coffeeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  dismissButton: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
});
