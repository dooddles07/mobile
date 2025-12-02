import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafetyTip {
  category: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  tips: string[];
}

const SafetyTips = () => {
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const safetyTips: SafetyTip[] = [
    {
      category: 'Personal Safety',
      icon: 'shield-checkmark',
      color: '#dc2626',
      tips: [
        'Always trust your instincts. If something feels wrong, remove yourself from the situation.',
        'Share your location with trusted friends or family members when going out.',
        'Keep your phone charged and have emergency contacts easily accessible.',
        'Avoid walking alone at night in unfamiliar or poorly lit areas.',
        'Be aware of your surroundings and avoid distractions like excessive phone use.',
        'Learn basic self-defense techniques and carry personal safety devices if legal.',
        'Vary your daily routines to avoid predictable patterns.',
      ],
    },
    {
      category: 'Digital Safety',
      icon: 'phone-portrait',
      color: '#8b5cf6',
      tips: [
        'Enable location services only for trusted apps and turn off when not needed.',
        'Use strong, unique passwords and enable two-factor authentication.',
        'Be cautious about sharing personal information on social media.',
        'Don\'t post real-time locations or travel plans publicly.',
        'Regularly review app permissions and revoke unnecessary access.',
        'Block and report suspicious accounts or harassment immediately.',
        'Keep your device\'s operating system and apps updated.',
      ],
    },
    {
      category: 'Home Safety',
      icon: 'home',
      color: '#f97316',
      tips: [
        'Install quality locks on all doors and windows.',
        'Keep emergency exits clear and accessible at all times.',
        'Install smoke detectors and check them regularly.',
        'Don\'t open the door to strangers without verification.',
        'Keep important documents in a secure, fireproof location.',
        'Have a family emergency plan and practice it regularly.',
        'Install adequate lighting around entry points of your home.',
        'Consider a home security system or doorbell camera.',
      ],
    },
    {
      category: 'Domestic Violence Prevention',
      icon: 'heart-dislike',
      color: '#ef4444',
      tips: [
        'Recognize warning signs: extreme jealousy, controlling behavior, isolation from friends/family.',
        'Document incidents with dates, times, and descriptions if safe to do so.',
        'Keep important documents (ID, passport, bank info) in a safe place.',
        'Have a safety plan: identify safe places to go and people to call.',
        'Memorize emergency hotline numbers (911, 1-800-VAWC).',
        'Tell trusted friends, family, or neighbors about the situation.',
        'Keep a prepacked bag with essentials in case you need to leave quickly.',
        'Remember: abuse is never your fault, and help is available.',
      ],
    },
    {
      category: 'Travel Safety',
      icon: 'car',
      color: '#06b6d4',
      tips: [
        'Research your destination and know safe areas vs. areas to avoid.',
        'Share your itinerary with someone you trust.',
        'Keep copies of important documents separate from originals.',
        'Use official transportation services and verify driver identity.',
        'Stay in well-reviewed accommodations in safe neighborhoods.',
        'Keep valuables secure and out of sight.',
        'Learn basic phrases in the local language including "help" and "police".',
        'Register with your embassy if traveling internationally.',
      ],
    },
    {
      category: 'Online Dating Safety',
      icon: 'heart',
      color: '#ec4899',
      tips: [
        'Meet in public places for initial dates and tell someone where you\'re going.',
        'Arrange your own transportation to and from the meeting place.',
        'Don\'t share personal information (address, workplace) too early.',
        'Video chat before meeting in person to verify identity.',
        'Trust your instincts - if something feels off, end the date.',
        'Avoid excessive alcohol consumption on first dates.',
        'Research the person online if possible, but respect privacy.',
        'Report suspicious profiles or behavior to the platform.',
      ],
    },
    {
      category: 'Workplace Safety',
      icon: 'briefcase',
      color: '#10b981',
      tips: [
        'Know your company\'s policies on harassment and reporting procedures.',
        'Document any incidents of harassment or discrimination.',
        'Keep workplace relationships professional and maintain boundaries.',
        'Don\'t work alone in isolated areas, especially after hours.',
        'Report safety hazards to management immediately.',
        'Know the location of emergency exits and first aid supplies.',
        'Attend safety training sessions and briefings.',
        'Keep your workspace organized to prevent accidents.',
      ],
    },
    {
      category: 'Emergency Preparedness',
      icon: 'alert-circle',
      color: '#fbbf24',
      tips: [
        'Keep an emergency kit with water, food, first aid, and flashlight.',
        'Have a family communication plan for emergencies.',
        'Know the evacuation routes in your building and area.',
        'Keep a list of emergency contacts and important medical information.',
        'Learn basic first aid and CPR.',
        'Have backup power sources like power banks or generators.',
        'Keep some cash on hand in case ATMs are unavailable.',
        'Stay informed about weather alerts and local emergencies.',
      ],
    },
  ];

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const gradientColors: readonly [string, string, string] = theme === 'light'
    ? ["rgba(254, 242, 242, 0.3)", "rgba(254, 226, 226, 0.3)", "rgba(254, 202, 202, 0.3)"]
    : ["rgba(15, 23, 42, 0.3)", "rgba(30, 41, 59, 0.3)", "rgba(51, 65, 85, 0.3)"];

  return (
    <View style={[styles.container, { backgroundColor: '#fcc585' }]}>
      <LinearGradient colors={gradientColors} style={styles.container}>
        {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: Math.max(insets.top + 10, 50) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Safety Tips
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.card }]}>
          <Ionicons name="bulb" size={24} color="#fbbf24" />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Your safety is our priority. Read these tips and share them with loved ones.
          </Text>
        </View>

        {/* Categories */}
        {safetyTips.map((category, index) => (
          <View key={index} style={[styles.categoryCard, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => toggleExpand(index)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryTitleRow}>
                <View style={[styles.categoryIconContainer, { backgroundColor: `${category.color}20` }]}>
                  <Ionicons name={category.icon} size={24} color={category.color} />
                </View>
                <Text style={[styles.categoryTitle, { color: colors.text }]}>
                  {category.category}
                </Text>
              </View>
              <Ionicons
                name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {expandedIndex === index && (
              <View style={styles.tipsContainer}>
                {category.tips.map((tip, tipIndex) => (
                  <View key={tipIndex} style={styles.tipRow}>
                    <View style={[styles.bulletPoint, { backgroundColor: category.color }]} />
                    <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                      {tip}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Emergency Contact Banner */}
        <View style={[styles.emergencyBanner, { backgroundColor: '#ef444420' }]}>
          <Ionicons name="call" size={24} color="#ef4444" />
          <View style={styles.emergencyTextContainer}>
            <Text style={[styles.emergencyTitle, { color: '#ef4444' }]}>
              In immediate danger?
            </Text>
            <Text style={[styles.emergencyText, { color: colors.text }]}>
              Call 911 or 1-800-VAWC for emergency assistance
            </Text>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  categoryCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  tipsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tipRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingLeft: 12,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 12,
  },
  emergencyTextContainer: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emergencyText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default SafetyTips;
