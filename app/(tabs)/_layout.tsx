import { Tabs, useRouter } from "expo-router";
import { ClipboardList, DollarSign, HelpCircle, Home, PieChart, Receipt, Settings } from "lucide-react-native";
import React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";

import Colors from "@/constants/colors";
import { useAppConfig } from "@/contexts/AppConfigContext";

export default function TabLayout() {
  const { config } = useAppConfig();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        headerShown: true,
        tabBarShowLabel: false,
        headerTitle: () => (
          <View style={styles.headerLogoContainer}>
            <Image
              source={{ uri: config.appLogoURL }}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
        ),
        headerRight: () => (
          <Pressable
            style={styles.helpButton}
            onPress={() => router.push('/guide')}
          >
            <HelpCircle size={24} color={Colors.light.tint} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="paycheck"
        options={{
          title: "Paycheck",
          tabBarIcon: ({ color }) => <DollarSign color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Expenses",
          tabBarIcon: ({ color }) => <Receipt color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="percentages"
        options={{
          title: "Percentages",
          tabBarIcon: ({ color }) => <PieChart color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="setup"
        options={{
          title: "Setup",
          tabBarIcon: ({ color }) => <ClipboardList color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerLogoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    height: 40,
    width: 200,
  },
  helpButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
