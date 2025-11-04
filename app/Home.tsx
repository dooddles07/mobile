import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  Image,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import axios from "axios";

const { width } = Dimensions.get("window");

// Task name for background location tracking
const LOCATION_TASK_NAME = "background-location-task";

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error("Location task error:", error);
    return;
  }
  if (data) {
    const { locations } = data;
    const location = locations[0];
    
    if (location) {
      try {
        const username = await AsyncStorage.getItem("username");
        const { latitude, longitude } = location.coords;
        
        console.log(`Background location update: ${latitude}, ${longitude}`);
        
        // Send location update to backend
        await axios.post("http://192.168.100.6:10000/api/sos/send", {
          username,
          latitude: Number(latitude),
          longitude: Number(longitude),
        });
        
        console.log("Location updated successfully in background");
      } catch (error) {
        console.error("Error updating location in background:", error);
      }
    }
  }
});

const Home = () => {
  const [username, setUsername] = useState("Loading...");
  const [fullname, setFullname] = useState("Loading...");
  const [loading, setLoading] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem("username");
        const storedFullname = await AsyncStorage.getItem("fullname");

        setUsername(storedUsername || "Guest");
        setFullname(storedFullname || storedUsername || "Guest");

        // Check if user has active SOS on app start
        if (storedUsername) {
          await checkActiveSOS(storedUsername);
        }
      } catch (error) {
        console.error("Failed to retrieve user data:", error);
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
    };
  }, []);

  const checkActiveSOS = async (username: string) => {
    try {
      const response = await axios.get(
        `http://192.168.100.6:10000/api/sos/active/${username}`
      );

      if (response.data.hasActiveSOS) {
        setSosActive(true);
        startPulseAnimation();
        // Resume location tracking
        startLocationTracking();
        // Start status checking to detect admin resolve
        startStatusChecking();
      }
    } catch (error) {
      console.log("No active SOS found");
    }
  };

  const startStatusChecking = () => {
    // Check SOS status every 10 seconds
    statusCheckIntervalRef.current = setInterval(async () => {
      try {
        const response = await axios.get(
          `http://192.168.100.6:10000/api/sos/active/${username}`
        );

        // If no active SOS found, admin has resolved it
        if (!response.data.hasActiveSOS) {
          await handleAdminResolve();
        }
      } catch (error: any) {
        // 404 means no active SOS - admin resolved it
        if (error?.response?.status === 404) {
          await handleAdminResolve();
        }
      }
    }, 10000) as any; // Check every 10 seconds
  };

  const stopStatusChecking = () => {
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
      statusCheckIntervalRef.current = null;
    }
  };

  const handleAdminResolve = async () => {
    console.log("SOS has been resolved by admin");

    // Stop all tracking and animations
    await stopLocationTracking();
    stopPulseAnimation();
    stopStatusChecking();

    // Update UI
    setSosActive(false);

    // Notify user
    Alert.alert(
      "SOS Resolved",
      "Your emergency has been resolved by emergency responders. Stay safe!",
      [{ text: "OK" }]
    );
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
  
  if (backgroundStatus !== "granted") {
    console.log("Background permission not granted, using foreground only");
  }

  // Update location every 60 seconds (1 minute)
  locationIntervalRef.current = setInterval(async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const { latitude, longitude, accuracy: locationAccuracy } = location.coords;
      
      console.log(`Updating location: ${latitude}, ${longitude} (${Math.round(locationAccuracy || 0)}m)`);

      await axios.post("http://192.168.100.6:10000/api/sos/send", {
        username,
        latitude: Number(latitude),
        longitude: Number(longitude),
      });

      setLastUpdate(new Date());
      console.log("Location updated successfully");
    } catch (error) {
      console.error("Error updating location:", error);
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
    console.log("Background location tracking started");
  } catch (error) {
    console.log("Background tracking not available:", error);
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
        console.log("Background location tracking stopped");
      }
    } catch (error) {
      console.log("Error stopping background tracking:", error);
    }

    setLastUpdate(null);
  };

  const handleSOS = async () => {
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

                // Cancel SOS in backend
                await axios.post("http://192.168.100.6:10000/api/sos/cancel", {
                  username,
                });

                stopPulseAnimation();
                setSosActive(false);
                Alert.alert("SOS Cancelled", "Your SOS alert has been cancelled and location tracking stopped.");
              } catch (error) {
                console.error("Cancel SOS error:", error);
                Alert.alert("Error", "Failed to cancel SOS. Please try again.");
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
      return;
    }

    // Request location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Location permission is required to send SOS."
      );
      return;
    }

    setLoading(true);

    try {
  // Get initial location
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.BestForNavigation,
  });

  const { latitude, longitude, accuracy: locationAccuracy } = location.coords;
  
  console.log(`Initial location accuracy: ${Math.round(locationAccuracy || 0)} meters`);

  // Send initial SOS to backend
  const response = await axios.post(
    "http://192.168.100.6:10000/api/sos/send",
    {
      username,
      latitude: Number(latitude),
      longitude: Number(longitude),
    }
  );

  console.log("Initial SOS response:", response.data);

  startPulseAnimation();
  setSosActive(true);
  setLastUpdate(new Date());

  await startLocationTracking();

  // Start checking SOS status for admin resolve
  startStatusChecking();

  Alert.alert(
    "SOS Activated",
    `Your location is being tracked every minute.\n\nAccuracy: ${Math.round(locationAccuracy || 0)}m\nLocation: ${response.data.sos.address || 'Location sent'}`,
    [{ text: "OK" }]
  );
} catch (error) {
  console.error(
    axios.isAxiosError(error)
      ? error.response?.data || error.message
      : error
  );
  Alert.alert(
    "Error",
    "Failed to send location. Please check your internet connection and try again."
  );
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
      colors={["#defcf9", "#cadefc", "#c3bef0", "#cca8e9"]}
      style={styles.container}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={require("../assets/images/bg1.png")}
          style={styles.logo}
        />
        <Text style={styles.headerText}>Welcome, {fullname}</Text>
      </View>

      {/* SOS BUTTON */}
      <View style={styles.sosContainer}>
        <Animated.View
          style={[
            styles.sosButton,
            {
              transform: [{ scale: scaleAnim }],
              backgroundColor: sosActive ? "#ff3b3b" : "#8c01c0",
            },
          ]}
        >
          <TouchableOpacity
            style={styles.sosTouchable}
            onPress={handleSOS}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <>
                <Text style={styles.sosText}>SOS</Text>
                {sosActive && (
                  <Text style={styles.activeText}>Active</Text>
                )}
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
        
        {sosActive && (
          <View style={styles.trackingInfo}>
            <Text style={styles.statusText}>
              🚨 SOS Active - Location Tracking
            </Text>
            {lastUpdate && (
              <Text style={styles.updateText}>
                📍 {formatLastUpdate()}
              </Text>
            )}
            <Text style={styles.infoText}>
              Updating every 1 minute
            </Text>
            <Text style={styles.cancelText}>
              Tap button to cancel
            </Text>
          </View>
        )}
      </View>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.push("/Account")}
        >
          <Ionicons name="person-outline" size={30} color="white" />
          <Text style={styles.navText}>Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.push("/Home")}
        >
          <Ionicons name="home-outline" size={30} color="white" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.push("/Chatlist")}
        >
          <Ionicons name="call-outline" size={30} color="white" />
          <Text style={styles.navText}>Contact</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#8c01c0",
    marginTop: 20,
    marginHorizontal: 20,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
    resizeMode: "contain",
  },
  headerText: {
    color: "#8c01c0",
    fontSize: 18,
    fontWeight: "bold",
  },
  sosContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  sosTouchable: {
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
  },
  sosText: {
    fontSize: 75,
    fontWeight: "bold",
    color: "#ffffff",
  },
  activeText: {
    fontSize: 18,
    color: "#ffffff",
    marginTop: 5,
    fontWeight: "600",
  },
  trackingInfo: {
    marginTop: 30,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 15,
    borderRadius: 15,
    marginHorizontal: 20,
  },
  statusText: {
    fontSize: 16,
    color: "#ff3b3b",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  updateText: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  infoText: {
    fontSize: 13,
    color: "#888",
    marginTop: 5,
  },
  cancelText: {
    fontSize: 13,
    color: "#999",
    marginTop: 8,
    fontStyle: "italic",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    elevation: 10,
    backgroundColor: "#8c01c0",
  },
  navButton: {
    alignItems: "center",
  },
  navText: {
    color: "white",
    fontSize: 12,
    marginTop: 3,
    fontWeight: "600",
  },
});

export default Home;