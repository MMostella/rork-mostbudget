import { Tabs, router } from "expo-router";
import { ClipboardList, DollarSign, FileText, HelpCircle, Home, PieChart, Receipt, Settings } from "lucide-react-native";
import React from "react";
import { Image, StyleSheet, TouchableOpacity } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FFFFFF",
        headerShown: true,
        tabBarShowLabel: false,
        headerStyle: {
          backgroundColor: "#8cb276",
        },
        tabBarStyle: {
          backgroundColor: "#8cb276",
        },
        headerTitle: () => (
          <Image
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/gb7b09hh40o2v5w400z83' }}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        ),
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push('/get-started')}
            style={styles.helpButton}
          >
            <HelpCircle size={24} color="#FFFFFF" />
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
        name="bills"
        options={{
          tabBarIcon: ({ color }) => <FileText color={color} size={24} />,
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
  headerLogo: {
    height: 40,
    width: 40,
  },
  helpButton: {
    marginRight: 16,
    padding: 4,
  },
});
