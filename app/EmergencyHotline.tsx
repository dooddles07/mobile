import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Hotline {
  name: string;
  number: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  available: string;
  color: string;
}

const EmergencyHotline = () => {
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const hotlines: Hotline[] = [
    {
      name: 'PNP Emergency',
      number: '911',
      description: 'Philippine National Police - For crimes, emergencies, and immediate police assistance',
      icon: 'shield-checkmark',
      available: '24/7',
      color: '#ef4444',
    },
    {
      name: 'VAWC Hotline',
      number: '1-800-VAWC',
      description: 'Violence Against Women and Children - For domestic violence, abuse, and related concerns',
      icon: 'heart-circle',
      available: '24/7',
      color: '#ec4899',
    },
    {
      name: 'Women\'s Crisis Hotline',
      number: '8-734-9389',
      description: 'National Commission on the Role of Filipino Women - Crisis intervention and support',
      icon: 'people',
      available: '24/7',
      color: '#d946ef',
    },
    {
      name: 'Philippine Red Cross',
      number: '143',
      description: 'Emergency medical services, disaster response, and ambulance services',
      icon: 'medical',
      available: '24/7',
      color: '#dc2626',
    },
    {
      name: 'DSWD Crisis Intervention',
      number: '8-931-8101',
      description: 'Department of Social Welfare and Development - Social welfare assistance',
      icon: 'home',
      available: 'Mon-Fri 8AM-5PM',
      color: '#10b981',
    },
    {
      name: 'NCMH Crisis Hotline',
      number: '0917-899-8727',
      description: 'National Center for Mental Health - Mental health crisis and counseling',
      icon: 'heart',
      available: '24/7',
      color: '#8b5cf6',
    },
    {
      name: 'DOJ Action Center',
      number: '8-523-8481',
      description: 'Department of Justice - Legal assistance and complaints',
      icon: 'document-text',
      available: 'Mon-Fri 8AM-5PM',
      color: '#0891b2',
    },
    {
      name: 'Women and Children Protection Center',
      number: '8-723-0401',
      description: 'Philippine National Police - Specialized support for women and children',
      icon: 'shield',
      available: '24/7',
      color: '#f97316',
    },
    {
      name: 'Child Protection Hotline',
      number: '1-8477',
      description: 'Council for the Welfare of Children - Child abuse and protection concerns',
      icon: 'happy',
      available: '24/7',
      color: '#06b6d4',
    },
    {
      name: 'Bantay Bata 163',
      number: '163',
      description: 'Child abuse hotline - Report child abuse and exploitation',
      icon: 'shield-half',
      available: '24/7',
      color: '#6366f1',
    },
  ];

  const handleCall = (number: string, name: string) => {
    const phoneNumber = number.replace(/[^0-9]/g, '');
    Alert.alert(
      'Call Emergency Hotline',
      `Do you want to call ${name}?\n${number}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(`tel:${phoneNumber}`).catch(() => {
              Alert.alert('Error', 'Unable to make phone call');
            });
          },
        },
      ]
    );
  };

  const gradientColors: readonly [string, string, string] = theme === 'light'
    ? ['#fef2f2', '#fee2e2', '#fecaca']
    : ['#0f172a', '#1e293b', '#334155'];

  return (
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
          Emergency Hotlines
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: colors.card }]}>
        <Ionicons name="information-circle" size={24} color="#f97316" />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          All hotlines are for the Philippines. Tap to call directly.
        </Text>
      </View>

      {/* Hotlines List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}
        showsVerticalScrollIndicator={false}
      >
        {hotlines.map((hotline, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.hotlineCard, { backgroundColor: colors.card }]}
            onPress={() => handleCall(hotline.number, hotline.name)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${hotline.color}20` }]}>
              <Ionicons name={hotline.icon} size={28} color={hotline.color} />
            </View>

            <View style={styles.hotlineInfo}>
              <View style={styles.hotlineHeader}>
                <Text style={[styles.hotlineName, { color: colors.text }]}>
                  {hotline.name}
                </Text>
                <View style={[styles.availableBadge, { backgroundColor: `${hotline.color}15` }]}>
                  <Text style={[styles.availableText, { color: hotline.color }]}>
                    {hotline.available}
                  </Text>
                </View>
              </View>

              <Text style={[styles.hotlineNumber, { color: hotline.color }]}>
                {hotline.number}
              </Text>

              <Text style={[styles.hotlineDescription, { color: colors.textSecondary }]}>
                {hotline.description}
              </Text>

              <View style={styles.callButtonContainer}>
                <Ionicons name="call" size={16} color={hotline.color} />
                <Text style={[styles.callButtonText, { color: hotline.color }]}>
                  Tap to Call
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Bottom Spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </LinearGradient>
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  hotlineCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  hotlineInfo: {
    flex: 1,
  },
  hotlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  hotlineName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  availableBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  availableText: {
    fontSize: 11,
    fontWeight: '600',
  },
  hotlineNumber: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  hotlineDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  callButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EmergencyHotline;
