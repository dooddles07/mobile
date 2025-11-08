import React, { useState } from 'react';
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

interface Resource {
  title: string;
  organization: string;
  description: string;
  contact?: string;
  website?: string;
  address?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  category: string;
}

const Resources = () => {
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Legal', 'Medical', 'Shelter', 'Counseling', 'Government'];

  const resources: Resource[] = [
    // Legal Resources
    {
      title: 'Public Attorney\'s Office (PAO)',
      organization: 'Department of Justice',
      description: 'Free legal services for indigent litigants including legal advice, representation, and assistance.',
      contact: '8-929-9436',
      website: 'https://pao.gov.ph',
      address: 'DOJ Building, Padre Faura St., Ermita, Manila',
      icon: 'document-text',
      color: '#3b82f6',
      category: 'Legal',
    },
    {
      title: 'Integrated Bar of the Philippines',
      organization: 'IBP',
      description: 'Free legal aid and consultation through their Legal Aid for Indigent Clients program.',
      contact: '8-818-4690',
      website: 'https://ibp.org.ph',
      address: '15 Julia Vargas Ave., Ortigas Center, Pasig City',
      icon: 'briefcase',
      color: '#0891b2',
      category: 'Legal',
    },
    {
      title: 'Commission on Human Rights',
      organization: 'CHR',
      description: 'Investigates human rights violations and provides legal assistance to victims.',
      contact: '8-927-4033',
      website: 'https://chr.gov.ph',
      address: 'Commonwealth Ave., Diliman, Quezon City',
      icon: 'shield-checkmark',
      color: '#06b6d4',
      category: 'Legal',
    },

    // Medical Resources
    {
      title: 'Philippine General Hospital',
      organization: 'PGH',
      description: 'Government hospital providing emergency medical care and specialized treatment.',
      contact: '8-554-8400',
      address: 'Taft Ave., Ermita, Manila',
      icon: 'medkit',
      color: '#ef4444',
      category: 'Medical',
    },
    {
      title: 'National Center for Mental Health',
      organization: 'NCMH',
      description: 'Mental health services, crisis intervention, and counseling.',
      contact: '0917-899-8727',
      website: 'https://ncmh.gov.ph',
      address: 'Nueve de Febrero St., Mandaluyong City',
      icon: 'heart',
      color: '#8b5cf6',
      category: 'Medical',
    },
    {
      title: 'Philippine Red Cross',
      organization: 'PRC',
      description: 'Emergency medical services, blood donation, and disaster response.',
      contact: '143 / 8-527-0000',
      website: 'https://redcross.org.ph',
      address: 'PICC, Roxas Blvd., Pasay City',
      icon: 'medical',
      color: '#dc2626',
      category: 'Medical',
    },

    // Shelter Resources
    {
      title: 'Tahanan Sta. Luisa',
      organization: 'DSWD',
      description: 'Safe haven for women and children victims of domestic violence.',
      contact: '8-734-9389',
      address: 'Don Mariano Marcos Ave., Quezon City',
      icon: 'home',
      color: '#14b8a6',
      category: 'Shelter',
    },
    {
      title: 'Marillac Hills',
      organization: 'Private',
      description: 'Shelter for abandoned and abused children.',
      contact: '8-941-0233',
      address: 'Alabang, Muntinlupa City',
      icon: 'people',
      color: '#10b981',
      category: 'Shelter',
    },
    {
      title: 'Haven for Women',
      organization: 'Private',
      description: 'Temporary shelter and rehabilitation for women survivors of violence.',
      contact: '8-926-2664',
      icon: 'rose',
      color: '#ec4899',
      category: 'Shelter',
    },

    // Counseling Resources
    {
      title: 'National Mental Health Crisis Hotline',
      organization: 'DOH',
      description: '24/7 mental health crisis intervention and counseling services.',
      contact: '1553 / 0917-899-8727',
      icon: 'chatbubbles',
      color: '#a855f7',
      category: 'Counseling',
    },
    {
      title: 'In Touch Crisis Line',
      organization: 'Private',
      description: 'Free and confidential crisis intervention and suicide prevention hotline.',
      contact: '8-893-7603 / 0917-800-1123',
      icon: 'call',
      color: '#6366f1',
      category: 'Counseling',
    },
    {
      title: 'Natasha Goulbourn Foundation',
      organization: 'NGO',
      description: 'Mental health awareness and crisis support services.',
      contact: '0917-558-4673',
      website: 'https://ngf-hope.org',
      icon: 'ribbon',
      color: '#7c3aed',
      category: 'Counseling',
    },

    // Government Resources
    {
      title: 'DSWD Crisis Intervention Unit',
      organization: 'Department of Social Welfare',
      description: 'Social welfare services and protective custody for abuse victims.',
      contact: '8-931-8101',
      website: 'https://dswd.gov.ph',
      address: 'DSWD Building, IBP Road, Batasan, Quezon City',
      icon: 'business',
      color: '#14b8a6',
      category: 'Government',
    },
    {
      title: 'Philippine Commission on Women',
      organization: 'PCW',
      description: 'Advocacy and support for women\'s rights and gender equality.',
      contact: '8-735-1654',
      website: 'https://pcw.gov.ph',
      address: '1145 PSSC Building, Commonwealth Ave., Quezon City',
      icon: 'woman',
      color: '#f43f5e',
      category: 'Government',
    },
    {
      title: 'Council for the Welfare of Children',
      organization: 'CWC',
      description: 'Child protection services and advocacy for children\'s rights.',
      contact: '1-8477',
      website: 'https://cwc.gov.ph',
      address: '2nd Floor, DSWD Building, IBP Road, Quezon City',
      icon: 'happy',
      color: '#06b6d4',
      category: 'Government',
    },
  ];

  const filteredResources = selectedCategory === 'All'
    ? resources
    : resources.filter(r => r.category === selectedCategory);

  const handleContact = (contact: string, title: string) => {
    const phoneNumber = contact.split('/')[0].trim().replace(/[^0-9]/g, '');
    Alert.alert(
      'Contact Resource',
      `Call ${title}?\n${contact}`,
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

  const handleWebsite = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open website');
    });
  };

  const gradientColors: readonly [string, string, string] = theme === 'light'
    ? ['#f0fdfa', '#ccfbf1', '#99f6e4']
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
          Resources
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && { backgroundColor: '#14b8a6' },
              selectedCategory !== category && { backgroundColor: colors.card },
            ]}
            onPress={() => setSelectedCategory(category)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category && { color: '#fff' },
                selectedCategory !== category && { color: colors.text },
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Resources List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.card }]}>
          <Ionicons name="information-circle" size={24} color="#14b8a6" />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Find organizations and services that can help you in times of need.
          </Text>
        </View>

        {filteredResources.map((resource, index) => (
          <View key={index} style={[styles.resourceCard, { backgroundColor: colors.card }]}>
            <View style={styles.resourceHeader}>
              <View style={[styles.iconContainer, { backgroundColor: `${resource.color}20` }]}>
                <Ionicons name={resource.icon} size={28} color={resource.color} />
              </View>
              <View style={styles.resourceTitleContainer}>
                <Text style={[styles.resourceTitle, { color: colors.text }]}>
                  {resource.title}
                </Text>
                <Text style={[styles.organization, { color: colors.textSecondary }]}>
                  {resource.organization}
                </Text>
              </View>
            </View>

            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {resource.description}
            </Text>

            {resource.address && (
              <View style={styles.infoRow}>
                <Ionicons name="location" size={16} color={colors.textSecondary} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  {resource.address}
                </Text>
              </View>
            )}

            <View style={styles.actionsRow}>
              {resource.contact && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: `${resource.color}15` }]}
                  onPress={() => handleContact(resource.contact!, resource.title)}
                >
                  <Ionicons name="call" size={16} color={resource.color} />
                  <Text style={[styles.actionButtonText, { color: resource.color }]}>
                    Call
                  </Text>
                </TouchableOpacity>
              )}

              {resource.website && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: `${resource.color}15` }]}
                  onPress={() => handleWebsite(resource.website!)}
                >
                  <Ionicons name="globe" size={16} color={resource.color} />
                  <Text style={[styles.actionButtonText, { color: resource.color }]}>
                    Website
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
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
  categoryScroll: {
    maxHeight: 50,
    marginTop: 8,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
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
  resourceCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resourceHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resourceTitleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  organization: {
    fontSize: 13,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Resources;
