import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Image, StyleSheet, View } from "react-native";
import { BudgetProvider } from "@/contexts/BudgetContext";
import { AppConfigProvider, useAppConfig } from "@/contexts/AppConfigContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="guide" options={{ presentation: "modal", headerTitle: "Get Started" }} />
    </Stack>
  );
}

function CustomSplashScreen() {
  const { config, isLoading } = useAppConfig();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        setAppReady(true);
        SplashScreen.hideAsync();
      }, 500);
    }
  }, [isLoading]);

  if (appReady) {
    return null;
  }

  return (
    <View style={styles.splashContainer}>
      <Image
        source={{ uri: config.splashLogoURL }}
        style={styles.splashLogo}
        resizeMode="contain"
      />
    </View>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppConfigProvider>
        <BudgetProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <CustomSplashScreen />
            <RootLayoutNav />
          </GestureHandlerRootView>
        </BudgetProvider>
      </AppConfigProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  splashLogo: {
    width: 200,
    height: 200,
  },
});
