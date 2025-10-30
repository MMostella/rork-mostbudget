import { Tabs } from "expo-router";
import { ClipboardList, DollarSign, Home, PieChart, Receipt, Settings } from "lucide-react-native";
import React from "react";
import { Image, StyleSheet, View } from "react-native";

import Colors from "@/constants/colors";
import { useAppConfig } from "@/contexts/AppConfigContext";

export default function TabLayout() {
  const { config } = useAppConfig();

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
        headerLeft: () => (
          <View style={styles.headerLeftLogoContainer}>
            <Image
              source={{ uri: config.appLogoURL }}
              style={styles.headerLeftLogo}
              resizeMode="contain"
            />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="paycheck"
        options={{
          tabBarIcon: ({ color }) => <DollarSign color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          tabBarIcon: ({ color }) => <Receipt color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="percentages"
        options={{
          tabBarIcon: ({ color }) => <PieChart color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="setup"
        options={{
          tabBarIcon: ({ color }) => <ClipboardList color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerLogoContainer: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogo: {
    height: 40,
    width: 120,
  },
  headerLeftLogoContainer: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  headerLeftLogo: {
    height: 36,
    width: 100,
  },
});
