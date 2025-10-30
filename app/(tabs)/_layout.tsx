import { Tabs, router } from "expo-router";
import { ClipboardList, DollarSign, HelpCircle, Home, PieChart, Receipt, Settings } from "lucide-react-native";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

import Colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        headerShown: true,
        tabBarShowLabel: false,
        headerTitle: "",
        headerLeft: () => (
          <View style={styles.headerLogoContainer}>
            <Image
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/6et2v32sviqr9mrtxo9gt' }}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
        ),
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push('/get-started')}
            style={styles.helpButton}
          >
            <HelpCircle size={24} color={Colors.light.tint} />
          </TouchableOpacity>
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
    height: 44,
    width: 160,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginLeft: 12,
  },
  headerLogo: {
    height: 44,
    width: 160,
  },
  helpButton: {
    marginRight: 16,
    padding: 4,
  },
});
