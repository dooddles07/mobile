import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  Linking,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as IntentLauncher from 'expo-intent-launcher';
import axios from "axios";
import { useTheme } from "../contexts/ThemeContext";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { initializeSocket, onSOSResolved, removeListener, disconnectSocket } from "../utils/socket";
import soundManager from "../utils/soundManager";
import API_ENDPOINTS from "../config/api";

const { width } = Dimensions.get("window");

// Task name for background location tracking
const LOCATION_TASK_NAME = "background-location-task";

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    return;
  }
  if (data) {
    const { locations } = data;
    const location = locations[0];

    if (location) {
      try {
        const username = await AsyncStorage.getItem("username");
        const { latitude, longitude } = location.coords;

        const backgroundPayload = {
          username,
          latitude: Number(latitude),
          longitude: Number(longitude),
        };

        // Send location update to backend
        const bgResponse = await axios.post(`${API_ENDPOINTS.SOS}/send`, backgroundPayload);
      } catch (error) {
        // Silent failure for background tasks
      }
    }
  }
});

const Home = () => {
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState("Loading...");
  const [fullname, setFullname] = useState("Loading...");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketInitialized = useRef<boolean>(false);
  const sosResolveInProgressRef = useRef<boolean>(false);

  const gradientColors: readonly [string, string, string] = theme === 'light'
    ? ["#f0fdfa", "#ccfbf1", "#99f6e4"]
    : ["#0f172a", "#1e293b", "#334155"];

  // Helper function to open device location settings
  const openLocationSettings = async () => {
    try {
      if (Platform.OS === 'android') {
        // Open Android Location Settings
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS
        );
      } else {
        // Open iOS Settings app (will open main settings, user navigates to Location Services)
        await Linking.openURL('app-settings:');
      }
    } catch (error) {
      // Fallback to app settings if location settings fails
      await Linking.openSettings();
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem("username");
        const storedFullname = await AsyncStorage.getItem("fullname");
        const storedAvatar = await AsyncStorage.getItem("avatar");

        setUsername(storedUsername || "Guest");
        setFullname(storedFullname || storedUsername || "Guest");
        setAvatar(storedAvatar);

        // Check if user has active SOS on app start
        if (storedUsername) {
          await checkActiveSOS(storedUsername);
        }

        // Initialize socket connection and listen for sos-resolved events
        if (!socketInitialized.current) {
          try {
            await initializeSocket();
            socketInitialized.current = true;

            // Listen for SOS resolved event from backend
            onSOSResolved(async (data) => {
              await handleAdminResolve();
            });
          } catch (error) {
            // Socket initialization failed silently
          }
        }
      } catch (error) {
        setUsername("Error");
        setFullname("Error");
      }
    };
    fetchUserData();

    // Cleanup on unmount
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
      }
      // Clean up socket listeners
      removeListener('sos-resolved');
      // Stop SOS sound on component unmount
      soundManager.stopSOSSound();
    };
  }, []);

  const checkActiveSOS = async (username: string) => {
    try {
      const response = await axios.get(
        `${API_ENDPOINTS.SOS}/active/${username}`
      );

      if (response.data.hasActiveSOS) {
        setSosActive(true);
        startPulseAnimation();
        // Resume SOS sound
        await soundManager.playSOSSound();
        // Resume location tracking
        startLocationTracking();
        // Start status checking as a fallback (less aggressive now)
        startStatusChecking();
      }
    } catch (error) {
      // No active SOS found
    }
  };

  const startStatusChecking = () => {
    // Check SOS status every 5 minutes as a fallback (socket is primary method)
    // This is just a safety net in case socket connection fails
    statusCheckIntervalRef.current = setInterval(async () => {
      try {
        const response = await axios.get(
          `${API_ENDPOINTS.SOS}/active/${username}`
        );

        // If no active SOS found, it might have been resolved
        if (!response.data.hasActiveSOS) {
          await handleAdminResolve();
        }
      } catch (error: any) {
        // 404 means no active SOS
        if (error?.response?.status === 404) {
          await handleAdminResolve();
        }
      }
    }, 300000) as any; // Check every 5 minutes (300000ms) instead of 10 seconds
  };

  const stopStatusChecking = () => {
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
      statusCheckIntervalRef.current = null;
    }
  };

  const handleAdminResolve = async () => {
    // Prevent duplicate calls - only process if one isn't already in progress
    if (sosResolveInProgressRef.current) {
      return;
    }

    sosResolveInProgressRef.current = true;

    try {
      // Stop all tracking and animations
      await stopLocationTracking();
      stopPulseAnimation();
      stopStatusChecking();

      // Stop SOS sound
      await soundManager.stopSOSSound();

      // Update UI
      setSosActive(false);

      // Notify user
      Alert.alert(
        "SOS Resolved",
        "Your emergency has been resolved by emergency responders. Stay safe!",
        [{ text: "OK" }]
      );
    } finally {
      sosResolveInProgressRef.current = false;
    }
  };

  const startPulseAnimation = () => {
    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    animationRef.current.start();
  };

  const stopPulseAnimation = () => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
    scaleAnim.setValue(1);
  };

  const startLocationTracking = async () => {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

  if (foregroundStatus !== "granted") {
    Alert.alert("Permission Denied", "Location permission is required.");
    return;
  }

  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

  // Update location every 60 seconds (1 minute)
  locationIntervalRef.current = setInterval(async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const { latitude, longitude, accuracy: locationAccuracy } = location.coords;

      const updatePayload = {
        username,
        latitude: Number(latitude),
        longitude: Number(longitude),
      };

      const updateResponse = await axios.post(`${API_ENDPOINTS.SOS}/send`, updatePayload);

      setLastUpdate(new Date());
    } catch (error) {
      // Location update error
    }
  }, 60000) as any; // Type assertion to fix TypeScript issue

  try {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 60000,
      distanceInterval: 50,
      foregroundService: {
        notificationTitle: "SOS Active",
        notificationBody: "Your location is being tracked for emergency",
        notificationColor: "#ff3b3b",
      },
    });
  } catch (error) {
    // Background tracking not available
  }
};

  const stopLocationTracking = async () => {
    // Stop interval
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }

    // Stop background location updates
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }
    } catch (error) {
      // Error stopping background tracking
    }

    setLastUpdate(null);
  };

  const handleSOS = async () => {

    // Validate username is loaded before allowing SOS
    if (!username || username === "Loading..." || username === "Guest" || username === "Error") {
      Alert.alert(
        "Not Ready",
        "Please wait while your profile is loading, or log in to use SOS.",
        [{ text: "OK" }]
      );
      return;
    }

    // If SOS is active, cancel it
    if (sosActive) {
      Alert.alert(
        "Cancel SOS",
        "Are you sure you want to cancel the SOS alert? Location tracking will stop.",
        [
          {
            text: "No",
            style: "cancel",
          },
          {
            text: "Yes, Cancel",
            style: "destructive",
            onPress: async () => {
              try {
                setLoading(true);

                // Stop location tracking
                await stopLocationTracking();

                // Stop status checking
                stopStatusChecking();

                // Stop SOS sound
                await soundManager.stopSOSSound();

                // Cancel SOS in backend
                await axios.post(`${API_ENDPOINTS.SOS}/cancel`, {
                  username,
                });

                stopPulseAnimation();
                setSosActive(false);
                Alert.alert("SOS Cancelled", "Your SOS alert has been cancelled and location tracking stopped.");
              } catch (error: any) {

                // If 404, it means the SOS was already resolved or cancelled
                if (error?.response?.status === 404) {
                  stopPulseAnimation();
                  await soundManager.stopSOSSound();
                  setSosActive(false);
                  Alert.alert(
                    "SOS Already Resolved",
                    "This emergency has already been resolved or cancelled. Location tracking stopped.",
                    [{ text: "OK" }]
                  );
                } else {
                  Alert.alert("Error", "Failed to cancel SOS. Please try again.");
                }
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
      return;
    }

    setLoading(true);

    try {
      // Step 1: Automatically request location permission - this will prompt user to enable location if it's off
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        // Check if location services are disabled vs permission denied
        const isLocationEnabled = await Location.hasServicesEnabledAsync();

        if (!isLocationEnabled) {
          // Location services are disabled on the device
          Alert.alert(
            "Enable Location",
            "Location is turned off. Please enable it to send SOS alerts.",
            [
              {
                text: "Open Settings",
                onPress: openLocationSettings
              },
              { text: "Cancel", style: "cancel" }
            ]
          );
        } else {
          // Permission was denied
          Alert.alert(
            "Location Permission Required",
            "Location access is needed to send your coordinates in SOS alerts. Tap 'Open Settings' to grant permission.",
            [
              {
                text: "Open Settings",
                onPress: openLocationSettings
              },
              { text: "Cancel", style: "cancel" }
            ]
          );
        }
        setLoading(false);
        return;
      }

      // Step 3: Get initial location with better error handling
      let location;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced, // Changed from BestForNavigation for faster response
          timeout: 15000, // 15 second timeout
          maximumAge: 10000, // Accept locations up to 10 seconds old
        });
      } catch (locationError: any) {

        // Provide specific error messages
        let errorMessage = "Unable to get your current location. ";

        if (locationError.message?.includes("timeout")) {
          errorMessage += "GPS signal is weak. Please move to an open area and try again.";
        } else if (locationError.message?.includes("unavailable")) {
          errorMessage += "Please ensure Location Services are enabled and try again.";
        } else if (locationError.message?.includes("settings")) {
          errorMessage += "Please check your device location settings.";
        } else {
          errorMessage += "Please try again in a moment.";
        }

        Alert.alert(
          "Location Error",
          errorMessage,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings()
            },
            {
              text: "Retry",
              onPress: () => handleSOS() // Retry the SOS function
            }
          ]
        );
        setLoading(false);
        return;
      }

      const { latitude, longitude, accuracy: locationAccuracy } = location.coords;

      // Validate data before sending
      if (!username || username === 'Loading...' || username === 'Guest') {
        throw new Error('Invalid username. Please ensure you are logged in.');
      }

      if (!latitude || !longitude) {
        throw new Error('Invalid location coordinates.');
      }

      const sosPayload = {
        username,
        latitude: Number(latitude),
        longitude: Number(longitude),
      };

      // Step 4: Send initial SOS to backend
      const response = await axios.post(
        `${API_ENDPOINTS.SOS}/send`,
        sosPayload
      );

      startPulseAnimation();
      setSosActive(true);
      setLastUpdate(new Date());

      // Play SOS sound with looping
      await soundManager.playSOSSound();

      await startLocationTracking();

      // Socket will notify us when admin resolves, no need for aggressive polling
      // Fallback polling is only started when resuming an existing SOS on app load

      // Extract address safely from response - handle different response formats
      const sosData = response.data?.sos || response.data?.data?.sos || response.data;
      const address = sosData?.address || 'Location sent successfully';

      Alert.alert(
        "SOS Activated ✅",
        `Your location is being shared with emergency responders.\n\n` +
        `📍 Accuracy: ${Math.round(locationAccuracy || 0)}m\n` +
        `📍 Location: ${address}\n\n` +
        `Updates every 60 seconds.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      let errorTitle = "SOS Failed";
      let errorMessage = "Unable to send SOS alert.";

      if (axios.isAxiosError(error)) {

        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          errorMessage = "Request timed out. The server might be sleeping (Render free tier). Please try again in 30 seconds.";
        } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else if (error.response) {
          // Server responded with error
          const status = error.response.status;
          const serverMessage = error.response.data?.message || error.response.data?.error;

          if (status === 400) {
            errorMessage = `Invalid data: ${serverMessage || 'Please check location permissions'}`;
          } else if (status === 404) {
            errorMessage = "SOS endpoint not found. Please contact support.";
          } else if (status === 500) {
            errorMessage = `Server error: ${serverMessage || 'Please try again'}`;
          } else {
            errorMessage = serverMessage || `Server error (${status}). Please try again.`;
          }
        } else if (error.request) {
          // Request made but no response
          errorMessage = "No response from server. The backend might be sleeping (Render free tier takes ~30s to wake up). Please wait and try again.";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      Alert.alert(errorTitle, errorMessage, [
        { text: "OK" },
        {
          text: "Retry",
          onPress: () => handleSOS()
        }
      ]);
      stopPulseAnimation();
    } finally {
      setLoading(false);
    }
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return "";
    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return `Updated ${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    return `Updated ${diffMins}m ago`;
  };

  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.container}
    >
      {/* STATUS BAR */}
      <View style={[styles.statusBar, { backgroundColor: colors.card, paddingTop: Math.max(insets.top, 50) }]}>
        <View style={styles.statusContent}>
          <View style={styles.avatarCircle}>
            {avatar ? (
              <Image
                source={{ uri: avatar }}
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons name="person" size={24} color={colors.primary} />
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Hello,</Text>
            <Text style={[styles.userName, { color: colors.text }]}>{fullname}</Text>
          </View>
        </View>
        {sosActive && (
          <View style={styles.activeIndicator}>
            <View style={styles.activeDot} />
            <Text style={styles.activeLabel}>Active</Text>
          </View>
        )}
      </View>

      {/* MAIN CONTENT */}
      <ScrollView
        style={styles.mainContent}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SOS BUTTON */}
        <View style={styles.sosWrapper}>
          <Animated.View
            style={[
              styles.sosButton,
              sosActive && styles.sosButtonActive,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.sosTouchable}
              onPress={handleSOS}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : (
                <View style={styles.sosContent}>
                  <Ionicons
                    name="alert-circle"
                    size={50}
                    color="#fff"
                    style={styles.sosIcon}
                  />
                  <Text style={styles.sosText}>
                    {sosActive ? "CANCEL" : "SOS"}
                  </Text>
                  <Text style={styles.sosSubtext}>
                    {sosActive ? "Tap to stop" : "Emergency"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* STATUS MESSAGE */}
        {sosActive ? (
          <View style={[styles.trackingCard, { backgroundColor: colors.card }]}>
            <Ionicons name="radio-outline" size={24} color={colors.danger} />
            <View style={styles.trackingContent}>
              <Text style={[styles.trackingTitle, { color: colors.text }]}>Location Tracking Active</Text>
              <Text style={[styles.trackingSubtitle, { color: colors.textSecondary }]}>
                Emergency services notified • Updates every 1 min
              </Text>
              {lastUpdate && (
                <Text style={[styles.lastUpdate, { color: colors.textTertiary }]}>{formatLastUpdate()}</Text>
              )}
            </View>
          </View>
        ) : (
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              You're protected. Tap SOS in case of emergency
            </Text>
          </View>
        )}

        {/* QUICK ACTIONS */}
        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>

          <View style={styles.quickActionsGrid}>
            {/* Emergency Contacts */}
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              activeOpacity={0.7}
              onPress={() => router.push('/EmergencyHotline')}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Ionicons name="call" size={24} color="#ef4444" />
              </View>
              <Text style={[styles.actionCardTitle, { color: colors.text }]}>Emergency</Text>
              <Text style={[styles.actionCardSubtitle, { color: colors.textSecondary }]}>Hotline</Text>
            </TouchableOpacity>

            {/* Safety Tips */}
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              activeOpacity={0.7}
              onPress={() => router.push('/SafetyTips')}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: 'rgba(251, 191, 36, 0.1)' }]}>
                <Ionicons name="bulb" size={24} color="#fbbf24" />
              </View>
              <Text style={[styles.actionCardTitle, { color: colors.text }]}>Safety</Text>
              <Text style={[styles.actionCardSubtitle, { color: colors.textSecondary }]}>Tips</Text>
            </TouchableOpacity>

            {/* Location History */}
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              activeOpacity={0.7}
              onPress={() => router.push('/LocationHistory')}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: 'rgba(20, 184, 166, 0.1)' }]}>
                <Ionicons name="location" size={24} color="#14b8a6" />
              </View>
              <Text style={[styles.actionCardTitle, { color: colors.text }]}>Location</Text>
              <Text style={[styles.actionCardSubtitle, { color: colors.textSecondary }]}>History</Text>
            </TouchableOpacity>

            {/* Resources */}
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              activeOpacity={0.7}
              onPress={() => router.push('/Resources')}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <Ionicons name="book" size={24} color="#8b5cf6" />
              </View>
              <Text style={[styles.actionCardTitle, { color: colors.text }]}>Resources</Text>
              <Text style={[styles.actionCardSubtitle, { color: colors.textSecondary }]}>& Info</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SAFETY STATUS */}
        <View style={styles.safetyStatusSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Safety Status</Text>

          <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
            <View style={styles.statusHeader}>
              <View style={styles.statusBadge}>
                <Ionicons name="shield-checkmark" size={20} color="#10b981" />
                <Text style={styles.statusBadgeText}>Protected</Text>
              </View>
              <Text style={[styles.statusTime, { color: colors.textTertiary }]}>All systems active</Text>
            </View>

            <View style={styles.statusItems}>
              <View style={styles.statusItem}>
                <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                <Text style={[styles.statusItemText, { color: colors.textSecondary }]}>Location tracking ready</Text>
              </View>
              <View style={styles.statusItem}>
                <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                <Text style={[styles.statusItemText, { color: colors.textSecondary }]}>Emergency contacts available</Text>
              </View>
              <View style={styles.statusItem}>
                <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                <Text style={[styles.statusItemText, { color: colors.textSecondary }]}>Support team online</Text>
              </View>
            </View>
          </View>
        </View>

        {/* EMERGENCY NUMBERS */}
        <View style={styles.emergencySection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Hotlines</Text>
            <TouchableOpacity onPress={() => router.push('/EmergencyHotline')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.emergencyCard, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={styles.emergencyItem}
              activeOpacity={0.7}
              onPress={() => Linking.openURL('tel:1800VAWC')}
            >
              <View style={styles.emergencyLeft}>
                <Ionicons name="call" size={20} color="#ef4444" />
                <Text style={[styles.emergencyText, { color: colors.text }]}>VAWC Hotline</Text>
              </View>
              <Text style={[styles.emergencyNumber, { color: colors.textSecondary }]}>1-800-VAWC</Text>
            </TouchableOpacity>

            <View style={[styles.emergencyDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.emergencyItem}
              activeOpacity={0.7}
              onPress={() => Linking.openURL('tel:911')}
            >
              <View style={styles.emergencyLeft}>
                <Ionicons name="call" size={20} color="#ef4444" />
                <Text style={[styles.emergencyText, { color: colors.text }]}>Emergency</Text>
              </View>
              <Text style={[styles.emergencyNumber, { color: colors.textSecondary }]}>911</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.push("/Account")}
        >
          <View style={styles.navIconWrapper}>
            <Ionicons name="person-outline" size={22} color={colors.textSecondary} />
          </View>
          <Text style={[styles.navText, { color: colors.textSecondary }]}>Profile</Text>
        </TouchableOpacity>

        <View style={[styles.navDivider, { backgroundColor: colors.border }]} />

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.push("/Chatlist")}
        >
          <View style={styles.navIconWrapper}>
            <Ionicons name="chatbubbles-outline" size={22} color={colors.textSecondary} />
          </View>
          <Text style={[styles.navText, { color: colors.textSecondary }]}>Messages</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Top Status Bar
  statusBar: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(20, 184, 166, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userInfo: {
    justifyContent: "center",
  },
  greeting: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  userName: {
    fontSize: 18,
    color: "#1f2937",
    fontWeight: "700",
    marginTop: 2,
  },
  activeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ef4444",
    marginRight: 5,
  },
  activeLabel: {
    fontSize: 11,
    color: "#ef4444",
    fontWeight: "700",
  },
  // Main Content
  mainContent: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 20,
  },
  sosWrapper: {
    alignItems: "center",
    marginBottom: 20,
  },
  sosButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#14b8a6",
    shadowColor: "#14b8a6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  sosButtonActive: {
    backgroundColor: "#ef4444",
    shadowColor: "#ef4444",
  },
  sosTouchable: {
    width: "100%",
    height: "100%",
    borderRadius: 90,
    justifyContent: "center",
    alignItems: "center",
  },
  sosContent: {
    alignItems: "center",
  },
  sosIcon: {
    marginBottom: 6,
  },
  sosText: {
    fontSize: 38,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 3,
  },
  sosSubtext: {
    fontSize: 13,
    color: "#fff",
    opacity: 0.95,
    marginTop: 2,
    fontWeight: "600",
  },
  // Info Cards
  trackingCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 20,
    borderRadius: 18,
    width: "100%",
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  trackingContent: {
    flex: 1,
    marginLeft: 12,
  },
  trackingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  trackingSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
  lastUpdate: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 8,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 20,
    borderRadius: 18,
    width: "100%",
    shadowColor: "#14b8a6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  infoText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  // Bottom Navigation
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 30,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    justifyContent: "space-around",
    alignItems: "center",
  },
  navButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  navIconWrapper: {
    marginBottom: 2,
  },
  navDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 16,
  },
  navText: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2,
    fontWeight: "600",
  },
  // Section Styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#14b8a6',
  },
  // Quick Actions
  quickActionsSection: {
    marginTop: 24,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#14b8a6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 2,
  },
  actionCardSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  // Safety Status
  safetyStatusSection: {
    marginTop: 8,
  },
  statusCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#10b981",
    marginLeft: 6,
  },
  statusTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
  statusItems: {
    gap: 12,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusItemText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 10,
    flex: 1,
  },
  // Emergency Section
  emergencySection: {
    marginTop: 24,
  },
  emergencyCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 4,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  emergencyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  emergencyLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  emergencyText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
    marginLeft: 12,
  },
  emergencyNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6b7280",
  },
  emergencyDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 16,
  },
});

export default Home;