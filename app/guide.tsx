import Colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function GuideScreen() {
  const router = useRouter();

  const steps = [
    {
      number: '1️⃣',
      title: 'Go to Settings',
      content: [
        'Enable optional features like Tithing or Multiple Household Members.',
        'Add your household members so you can track who\'s responsible for each income or expense.',
      ],
    },
    {
      number: '2️⃣',
      title: 'Set Up Your Budget',
      content: [
        'Head to the Setup tab.',
        'Enter your expected income and monthly expenses.',
        'Assign each income or expense to a specific household member if needed.',
        'This helps MostBudget show only what\'s relevant to each person or income source.',
      ],
    },
    {
      number: '3️⃣',
      title: 'Review Your Percentages',
      content: [
        'Open the Percentages tab to see a clear breakdown of your Bills, Spending, and Savings.',
        'Use this view to understand where your money is going each month.',
      ],
    },
    {
      number: '4️⃣',
      title: 'Start Tracking Paychecks',
      content: [
        'As you get paid, log each paycheck in the app.',
        'Watch your income and expenses update automatically as you go!',
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.emoji}>💡</Text>
          <Text style={styles.title}>How MostBudget Works</Text>
          <Text style={styles.subtitle}>
            Welcome to MostBudget — your simple way to manage household finances with ease!
          </Text>
          <Text style={styles.subtitle}>Let's get you started in just a few steps 👇</Text>
        </View>

        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <Text style={styles.stepNumber}>{step.number}</Text>
                <Text style={styles.stepTitle}>{step.title}</Text>
              </View>
              <View style={styles.stepContent}>
                {step.content.map((item, itemIndex) => (
                  <View key={itemIndex} style={styles.contentItem}>
                    <CheckCircle2 size={16} color={Colors.light.tint} style={styles.checkIcon} />
                    <Text style={styles.contentText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <View style={styles.celebrationBox}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.celebrationText}>
              That's it — you're ready to take control of your household budget.
            </Text>
          </View>
          <Text style={styles.footerNote}>
            You can revisit this guide anytime from the ? icon in the top right corner of your screen.
          </Text>
        </View>

        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeButtonText}>Got It!</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  stepsContainer: {
    gap: 20,
    marginBottom: 32,
  },
  stepCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    fontSize: 32,
    marginRight: 12,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    flex: 1,
  },
  stepContent: {
    gap: 12,
  },
  contentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkIcon: {
    marginTop: 2,
    marginRight: 10,
    flexShrink: 0,
  },
  contentText: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
    flex: 1,
  },
  footer: {
    marginBottom: 24,
    gap: 20,
  },
  celebrationBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  celebrationEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  celebrationText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  footerNote: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  closeButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
