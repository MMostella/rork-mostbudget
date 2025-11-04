import Colors from '@/constants/colors';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
          Welcome to MostBudget — your simple way to manage household finances with confidence!
        </Text>
        <Text style={styles.subtitle}>Let&apos;s get you set up in just a few steps 👇</Text>

        <View style={styles.step}>
          <Text style={styles.stepNumber}>1️⃣ Go to the Settings Tab</Text>
          <Text style={styles.stepText}>This is your starting point.</Text>
          <Text style={styles.stepText}>Add your income sources and monthly expenses</Text>
          <Text style={styles.stepText}>Add household members (optional)</Text>
          <Text style={styles.stepText}>Enable Tithing (optional)</Text>
          <Text style={styles.stepText}>This builds the foundation of your budget.</Text>
        </View>

        <View style={styles.step}>
          <Text style={styles.stepNumber}>2️⃣ Review Your Percentages</Text>
          <Text style={styles.stepText}>
            Open the Percentages tab to see how your income is allocated across:
          </Text>
          <Text style={styles.stepText}>Bills</Text>
          <Text style={styles.stepText}>Spending</Text>
          <Text style={styles.stepText}>Savings</Text>
          <Text style={styles.stepText}>
            Make sure everything fits within your income before logging paychecks.
          </Text>
        </View>

        <View style={styles.step}>
          <Text style={styles.stepNumber}>3️⃣ Log Your Income</Text>
          <Text style={styles.stepText}>When you get paid:</Text>
          <Text style={styles.stepText}>Go to the Paychecks section</Text>
          <Text style={styles.stepText}>Log each paycheck</Text>
          <Text style={styles.stepText}>
            MostBudget automatically distributes your income according to your budget plan.
          </Text>
        </View>

        <View style={styles.step}>
          <Text style={styles.stepNumber}>4️⃣ Track Your Bills</Text>
          <Text style={styles.stepText}>
            Visit the Bills tab to mark bills as paid and monitor upcoming due dates.
          </Text>
          <Text style={styles.stepText}>
            This helps ensure everything gets paid on time — with less stress.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>🌐 Useful Links</Text>
          <Text style={styles.footerText}>
            You can find the Privacy Policy, iOS download link, and ways to support the developer at:
          </Text>
          <TouchableOpacity 
            onPress={() => Linking.openURL('https://mostbudget.my.canva.site/info')}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>MostBudget Website</Text>
          </TouchableOpacity>
          <Text style={styles.footerText}>
            If you find MostBudget helpful, support is always appreciated ❤️
          </Text>
          <Text style={styles.footerText}>
            Even small contributions help keep the app improving and available for everyone.
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
  footerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  footerText: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  linkButton: {
    marginVertical: 8,
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 15,
    color: '#2196F3',
    lineHeight: 22,
    textDecorationLine: 'underline' as const,
    fontWeight: '600' as const,
  },
});
