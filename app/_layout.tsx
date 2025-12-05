import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BudgetProvider } from "@/contexts/BudgetContext";
import { AppConfigProvider, useAppConfig } from "@/contexts/AppConfigContext";
import { View, StyleSheet, Image } from "react-native";
import Colors from "@/constants/colors";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { PopupModal } = useAppConfig();

  return (
    <>
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="get-started"
          options={{
            presentation: "modal",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="debug-config"
          options={{
            presentation: "modal",
            headerShown: false,
          }}
        />
      </Stack>
      <PopupModal />
    </>
  );
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return (
      <View style={styles.loadingContainer}>
        <Image
          source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/rf5f6f8aquhtgzrt3l4f5" }}
          style={styles.loadingLogo}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppConfigProvider>
        <BudgetProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
              <RootLayoutNav />
            </View>
          </GestureHandlerRootView>
        </BudgetProvider>
      </AppConfigProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.primary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingLogo: {
    width: 200,
    height: 200,
  },
});
