import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LocationRecord {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  address?: string;
  accuracy?: number;
}

const LocationHistory = () => {
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    loadLocationHistory();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      // Check if location services are enabled
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable Location Services in your device settings.\n\n' +
          'Go to:\n' +
          '• Android: Settings → Location → Turn ON\n' +
          '• iOS: Settings → Privacy → Location Services → Turn ON',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings()
            }
          ]
        );
        return;
      }

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to use this feature.\n\n' +
          'Please allow location access in your app settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings()
            }
          ]
        );
        return;
      }

      // Get location with timeout
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 15000,
        maximumAge: 10000,
      });
      setCurrentLocation(location);
    } catch (error: any) {
      console.error('Error getting current location:', error);

      let errorMessage = 'Unable to get your current location. ';
      if (error.message?.includes('timeout')) {
        errorMessage += 'GPS signal is weak. Please move to an open area.';
      } else if (error.message?.includes('unavailable') || error.message?.includes('settings')) {
        errorMessage += 'Please ensure Location Services are enabled.';
      } else {
        errorMessage += 'Please try again in a moment.';
      }

      Alert.alert('Location Error', errorMessage);
    }
  };

  const loadLocationHistory = async () => {
    try {
      const historyJson = await AsyncStorage.getItem('locationHistory');
      if (historyJson) {
        const history = JSON.parse(historyJson);
        setLocations(history.reverse()); // Most recent first
      }
    } catch (error) {
      console.error('Error loading location history:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCurrentLocation = async () => {
    try {
      if (!currentLocation) {
        Alert.alert('Error', 'Unable to get current location');
        return;
      }

      const newRecord: LocationRecord = {
        id: Date.now().toString(),
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        timestamp: new Date().toISOString(),
        accuracy: currentLocation.coords.accuracy,
      };

      // Get address from coordinates
      try {
        const addressResults = await Location.reverseGeocodeAsync({
          latitude: newRecord.latitude,
          longitude: newRecord.longitude,
        });

        if (addressResults.length > 0) {
          const addr = addressResults[0];
          newRecord.address = `${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''}`.trim();
        }
      } catch (error) {
        console.error('Error getting address:', error);
      }

      const updatedLocations = [newRecord, ...locations];
      setLocations(updatedLocations);
      await AsyncStorage.setItem('locationHistory', JSON.stringify(updatedLocations));

      Alert.alert('Success', 'Location saved successfully');
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Error', 'Failed to save location');
    }
  };

  const deleteLocation = async (id: string) => {
    Alert.alert(
      'Delete Location',
      'Are you sure you want to delete this location record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedLocations = locations.filter(loc => loc.id !== id);
            setLocations(updatedLocations);
            await AsyncStorage.setItem('locationHistory', JSON.stringify(updatedLocations));
          },
        },
      ]
    );
  };

  const clearAllHistory = () => {
    Alert.alert(
      'Clear All History',
      'Are you sure you want to delete all location records? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setLocations([]);
            await AsyncStorage.removeItem('locationHistory');
            Alert.alert('Success', 'All location history cleared');
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const openInMaps = (latitude: number, longitude: number) => {
    // Opens location in default maps application
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Alert.alert(
      'Open in Maps',
      'This will open the location in your maps application.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open', onPress: () => console.log('Open maps:', url) },
      ]
    );
  };

  const gradientColors = theme === 'light'
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
          Location History
        </Text>
        {locations.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearAllHistory}
          >
            <Ionicons name="trash-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        )}
        {locations.length === 0 && <View style={{ width: 40 }} />}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.card }]}>
          <Ionicons name="information-circle" size={24} color="#14b8a6" />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Track important locations for your safety. Share this history with trusted contacts if needed.
          </Text>
        </View>

        {/* Save Current Location Button */}
        <TouchableOpacity
          style={[styles.saveLocationButton, { backgroundColor: '#14b8a6' }]}
          onPress={saveCurrentLocation}
          activeOpacity={0.8}
        >
          <Ionicons name="location" size={24} color="#fff" />
          <Text style={styles.saveLocationText}>Save Current Location</Text>
        </TouchableOpacity>

        {/* Current Location Display */}
        {currentLocation && (
          <View style={[styles.currentLocationCard, { backgroundColor: colors.card }]}>
            <View style={styles.currentLocationHeader}>
              <Ionicons name="navigate-circle" size={24} color="#14b8a6" />
              <Text style={[styles.currentLocationTitle, { color: colors.text }]}>
                Current Location
              </Text>
            </View>
            <Text style={[styles.coordinates, { color: colors.textSecondary }]}>
              {currentLocation.coords.latitude.toFixed(6)}, {currentLocation.coords.longitude.toFixed(6)}
            </Text>
            <Text style={[styles.accuracy, { color: colors.textSecondary }]}>
              Accuracy: ±{currentLocation.coords.accuracy?.toFixed(0)}m
            </Text>
          </View>
        )}

        {/* Location History List */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Saved Locations ({locations.length})
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#14b8a6" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading history...
            </Text>
          </View>
        ) : locations.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="location-outline" size={64} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Location History
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Save your current location to start tracking your movement history.
            </Text>
          </View>
        ) : (
          locations.map((location) => (
            <View
              key={location.id}
              style={[styles.locationCard, { backgroundColor: colors.card }]}
            >
              <View style={styles.locationHeader}>
                <View style={styles.locationIconContainer}>
                  <Ionicons name="location" size={24} color="#14b8a6" />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={[styles.locationDate, { color: colors.text }]}>
                    {formatDate(location.timestamp)}
                  </Text>
                  <Text style={[styles.locationTime, { color: colors.textSecondary }]}>
                    {formatTime(location.timestamp)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteLocation(location.id)}
                >
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>

              {location.address && (
                <Text style={[styles.locationAddress, { color: colors.textSecondary }]}>
                  {location.address}
                </Text>
              )}

              <Text style={[styles.locationCoordinates, { color: colors.textSecondary }]}>
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>

              {location.accuracy && (
                <Text style={[styles.locationAccuracy, { color: colors.textSecondary }]}>
                  Accuracy: ±{location.accuracy.toFixed(0)}m
                </Text>
              )}

              <TouchableOpacity
                style={styles.viewMapButton}
                onPress={() => openInMaps(location.latitude, location.longitude)}
              >
                <Ionicons name="map" size={16} color="#14b8a6" />
                <Text style={styles.viewMapText}>View on Map</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

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
  clearButton: {
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
    marginBottom: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  saveLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  saveLocationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  currentLocationCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  currentLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  currentLocationTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  coordinates: {
    fontSize: 14,
    marginBottom: 4,
  },
  accuracy: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  locationCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#14b8a620',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationDate: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  locationTime: {
    fontSize: 13,
  },
  deleteButton: {
    padding: 4,
  },
  locationAddress: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  locationCoordinates: {
    fontSize: 13,
    marginBottom: 4,
  },
  locationAccuracy: {
    fontSize: 12,
    marginBottom: 10,
  },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewMapText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#14b8a6',
  },
});

export default LocationHistory;
