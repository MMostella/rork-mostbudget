import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BudgetProvider } from "@/contexts/BudgetContext";
import { AppConfigProvider, useAppConfig } from "@/contexts/AppConfigContext";
import { View, StyleSheet, Image, Modal, Pressable, ScrollView, Text } from "react-native";
import Colors from "@/constants/colors";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();



function RootLayoutNav() {
  const { popupState } = useAppConfig();
  const {
    showPopup,
    popupModalData,
    dismissPopup,
    handleBuyMeACoffee,
  } = popupState;

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
      {showPopup && popupModalData && (
        <Modal
          visible={showPopup}
          transparent
          animationType="fade"
          onRequestClose={dismissPopup}
        >
          <View style={popupStyles.overlay}>
            <View style={popupStyles.modal}>
              <ScrollView
                style={popupStyles.scrollView}
                contentContainerStyle={popupStyles.scrollContent}
                showsVerticalScrollIndicator={true}
              >
                <Text style={popupStyles.title}>{popupModalData.popupData.title}</Text>
                <Text style={popupStyles.body}>{popupModalData.popupData.body}</Text>
                <Text style={popupStyles.support}>{popupModalData.popupData.support}</Text>
              </ScrollView>

              <View style={popupStyles.buttonContainer}>
                {popupModalData.shouldShowButton && (
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
                  <Text style={popupStyles.dismissButtonText}>
                    Close
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
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

const popupStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: "center",
  },
  body: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 24,
    marginBottom: 16,
    textAlign: "center",
  },
  support: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: "center",
  },
  buttonContainer: {
    gap: 12,
    marginTop: 16,
  },
  coffeeButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  coffeeButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  dismissButton: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
});
