import Colors from '@/constants/colors';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GetStartedScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Get Started</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>💡 How MostBudget Works</Text>
        <Text style={styles.subtitle}>
          Welcome to MostBudget — your simple way to manage household finances with ease!
        </Text>
        <Text style={styles.subtitle}>Let&apos;s get you started in just a few steps 👇</Text>

        <View style={styles.step}>
          <Text style={styles.stepNumber}>1️⃣ Go to Settings</Text>
          <Text style={styles.stepText}>
            Enable optional features like Tithing or Multiple Household Members.
          </Text>
          <Text style={styles.stepText}>
            Add your household members so you can track who&apos;s responsible for each income or expense.
          </Text>
        </View>

        <View style={styles.step}>
          <Text style={styles.stepNumber}>2️⃣ Set Up Your Budget</Text>
          <Text style={styles.stepText}>Head to the Setup tab.</Text>
          <Text style={styles.stepText}>Enter your expected income and monthly expenses.</Text>
          <Text style={styles.stepText}>
            Assign each income or expense to a specific household member if needed.
          </Text>
          <Text style={styles.stepText}>
            This helps MostBudget show only what&apos;s relevant to each person or income source.
          </Text>
        </View>

        <View style={styles.step}>
          <Text style={styles.stepNumber}>3️⃣ Review Your Percentages</Text>
          <Text style={styles.stepText}>
            Open the Percentages tab to see a clear breakdown of your Bills, Spending, and Savings.
          </Text>
          <Text style={styles.stepText}>
            Use this view to understand where your money is going each month.
          </Text>
        </View>

        <View style={styles.step}>
          <Text style={styles.stepNumber}>4️⃣ Start Tracking Paychecks</Text>
          <Text style={styles.stepText}>As you get paid, log each paycheck in the app.</Text>
          <Text style={styles.stepText}>
            Watch your income and expenses update automatically as you go!
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            That&apos;s it — you&apos;re ready to take control of your household budget. 🎉
          </Text>
          <Text style={styles.footerText}>
            You can revisit this guide anytime from the ? icon in the top right corner of your screen.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    lineHeight: 24,
    marginBottom: 8,
  },
  step: {
    marginTop: 24,
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  stepText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
    paddingLeft: 8,
  },
  footer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
  },
  footerText: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
    marginBottom: 8,
  },
});
