import React, { useState, useCallback, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import * as ImagePicker from 'expo-image-picker';

// Types
interface UserProfile {
  fullname: string;
  email: string;
  username: string;
  contactNumber: string;
  avatar: string;
}

type Theme = "light" | "dark";

// Constants
const ACCENT_COLOR = "#8c01c0";
const API_BASE_URL = "http://192.168.100.6:10000/api";

const Account: React.FC = () => {
  // User Profile State
  const [profile, setProfile] = useState<UserProfile>({
    fullname: "",
    email: "",
    username: "",
    contactNumber: "",
    avatar: "",
  });

  const [originalProfile, setOriginalProfile] = useState<UserProfile>({
    fullname: "",
    email: "",
    username: "",
    contactNumber: "",
    avatar: "",
  });

  // Password State
  const [passwords, setPasswords] = useState({
    old: "",
    new: "",
    confirm: "",
  });

  const [passwordVisibility, setPasswordVisibility] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  // UI State
  const [theme, setTheme] = useState<Theme>("light");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  // Modal State
  const [showHelp, setShowHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // Load user data on mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsFetching(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert("Error", "Please login first");
        router.replace('/');
        return;
      }

      // Fetch from API
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.user) {
        const userData = {
          fullname: data.user.fullname || "",
          email: data.user.email || "",
          username: data.user.username || "",
          contactNumber: data.user.contactNumber || "",
          avatar: data.user.avatar || "",
        };
        
        setProfile(userData);
        setOriginalProfile(userData);
        
        // Also update AsyncStorage
        await AsyncStorage.setItem('username', userData.username);
        await AsyncStorage.setItem('email', userData.email);
        if (userData.avatar) {
          await AsyncStorage.setItem('avatar', userData.avatar);
        }
      } else {
        throw new Error(data.message || 'Failed to load profile');
      }

      // Load theme
      const storedTheme = await AsyncStorage.getItem('theme') as Theme;
      if (storedTheme) setTheme(storedTheme);
      
    } catch (error) {
      console.error('Failed to load user data:', error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setIsFetching(false);
    }
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const hasProfileChanges = (): boolean => {
    return profile.fullname !== originalProfile.fullname ||
           profile.email !== originalProfile.email ||
           profile.contactNumber !== originalProfile.contactNumber;
  };

  const handleUpdateProfile = useCallback(async () => {
    if (!hasProfileChanges()) {
      Alert.alert("Info", "No changes to update");
      return;
    }

    if (!profile.fullname.trim()) {
      Alert.alert("Error", "Full name is required");
      return;
    }

    if (!profile.email.trim()) {
      Alert.alert("Error", "Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullname: profile.fullname,
          email: profile.email,
          contactNumber: profile.contactNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Profile updated successfully!");
        
        // Update local storage
        await AsyncStorage.setItem('username', data.user.username);
        await AsyncStorage.setItem('email', data.user.email);
        
        // Update original profile state
        setOriginalProfile(profile);
      } else {
        Alert.alert("Error", data.message || "Failed to update profile");
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Please try again.");
      console.error('Update error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile, originalProfile]);

  const handleChangePassword = useCallback(async () => {
    if (!passwords.old || !passwords.new || !passwords.confirm) {
      Alert.alert("Error", "Please fill all password fields");
      return;
    }
    
    if (passwords.new !== passwords.confirm) {
      Alert.alert("Error", "New passwords do not match!");
      return;
    }

    const passwordError = validatePassword(passwords.new);
    if (passwordError) {
      Alert.alert("Error", passwordError);
      return;
    }

    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword: passwords.old,
          newPassword: passwords.new,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Password changed successfully!");
        setPasswords({ old: "", new: "", confirm: "" });
      } else {
        Alert.alert("Error", data.message || "Failed to change password");
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Please try again.");
      console.error('Change password error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [passwords]);

  const handleImageUpload = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Reduce quality to make base64 smaller
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // Show loading
        setIsLoading(true);
        
        try {
          const token = await AsyncStorage.getItem('token');
          
          // Read file as base64
          const response = await fetch(imageUri);
          const blob = await response.blob();
          
          // Convert blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          
          reader.onloadend = async () => {
            const base64data = reader.result as string;
            
            try {
              // Send to server
              const uploadResponse = await fetch(`${API_BASE_URL}/auth/upload-avatar`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ avatar: base64data }),
              });

              const data = await uploadResponse.json();

              if (uploadResponse.ok) {
                // Update profile with new avatar
                setProfile(prev => ({ ...prev, avatar: data.avatar }));
                await AsyncStorage.setItem('avatar', data.avatar);
                Alert.alert('Success', 'Profile picture updated successfully!');
              } else {
                Alert.alert('Error', data.message || 'Failed to upload image');
              }
            } catch (uploadError) {
              console.error('Upload error:', uploadError);
              Alert.alert('Error', 'Failed to upload image. Please try again.');
            } finally {
              setIsLoading(false);
            }
          };
          
          reader.onerror = () => {
            setIsLoading(false);
            Alert.alert('Error', 'Failed to read image file');
          };
          
        } catch (error) {
          setIsLoading(false);
          console.error('Processing error:', error);
          Alert.alert('Error', 'Failed to process image. Please try again.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Image picker error:', error);
    }
  }, []);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account permanently? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              
              const response = await fetch(`${API_BASE_URL}/auth/delete`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
              });

              if (response.ok) {
                await AsyncStorage.clear();
                Alert.alert("Success", "Account deleted successfully");
                router.replace('/');
              } else {
                const data = await response.json();
                Alert.alert("Error", data.message || "Failed to delete account");
              }
            } catch (error) {
              Alert.alert("Error", "Network error. Please try again.");
              console.error('Delete error:', error);
            }
          },
          style: "destructive"
        }
      ]
    );
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              if (token) {
                await fetch(`${API_BASE_URL}/auth/logout`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` },
                });
              }
            } catch (error) {
              console.error('Logout error:', error);
            } finally {
              await AsyncStorage.clear();
              router.replace('/');
            }
          }
        }
      ]
    );
  }, []);

  const toggleTheme = useCallback(async () => {
    const newTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
    setMenuOpen(false);
  }, [theme]);

  const toggleNotifications = useCallback(() => {
    setNotificationsEnabled(prev => !prev);
    setMenuOpen(false);
  }, []);

  const togglePasswordVisibility = useCallback((field: keyof typeof passwordVisibility) => {
    setPasswordVisibility(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const handleMenuAction = useCallback((action: string) => {
    setMenuOpen(false);
    switch (action) {
      case "theme":
        toggleTheme();
        break;
      case "notification":
        toggleNotifications();
        break;
      case "help":
        setShowHelp(true);
        break;
      case "about":
        setShowAbout(true);
        break;
      case "delete":
        handleDeleteAccount();
        break;
    }
  }, [toggleTheme, toggleNotifications, handleDeleteAccount]);

  const styles = getStyles(theme);

  if (isFetching) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={ACCENT_COLOR} />
        <Text style={[styles.label, { marginTop: 16 }]}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header Icons */}
      <View style={styles.headerIcons}>
        <TouchableOpacity 
          onPress={() => router.push("/Home")} 
          style={styles.iconButton}
          accessible={true}
          accessibilityLabel="Go back to home"
        >
          <Ionicons name="arrow-back" size={26} color={ACCENT_COLOR} />
        </TouchableOpacity>

        <View>
          <TouchableOpacity 
            onPress={() => setMenuOpen(!menuOpen)} 
            style={styles.iconButton}
            accessible={true}
            accessibilityLabel="Open menu"
          >
            <Ionicons name="menu" size={26} color={ACCENT_COLOR} />
          </TouchableOpacity>

          {menuOpen && (
            <>
              <TouchableOpacity 
                style={styles.menuOverlay}
                onPress={() => setMenuOpen(false)}
                activeOpacity={1}
              />
              <View style={styles.dropdownMenu}>
                <TouchableOpacity 
                  style={styles.dropdownItem} 
                  onPress={() => handleMenuAction("theme")}
                  activeOpacity={0.7}
                >
                  <Ionicons name="settings-outline" size={18} color={ACCENT_COLOR} />
                  <Text style={styles.dropdownItemText}>
                    Theme: {theme === "light" ? "Light" : "Dark"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.dropdownItem} 
                  onPress={() => handleMenuAction("notification")}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={notificationsEnabled ? "notifications-outline" : "notifications-off-outline"}
                    size={18} 
                    color={ACCENT_COLOR} 
                  />
                  <Text style={styles.dropdownItemText}>
                    Notifications: {notificationsEnabled ? "On" : "Off"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.dropdownItem} 
                  onPress={() => handleMenuAction("help")}
                  activeOpacity={0.7}
                >
                  <Ionicons name="help-circle-outline" size={18} color={ACCENT_COLOR} />
                  <Text style={styles.dropdownItemText}>Help</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.dropdownItem} 
                  onPress={() => handleMenuAction("about")}
                  activeOpacity={0.7}
                >
                  <Ionicons name="information-circle-outline" size={18} color={ACCENT_COLOR} />
                  <Text style={styles.dropdownItemText}>About</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity 
                  style={styles.dropdownItem} 
                  onPress={() => handleMenuAction("delete")}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={18} color="#dc3545" />
                  <Text style={[styles.dropdownItemText, styles.dropdownDelete]}>
                    Delete Account
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Avatar Section */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleImageUpload} activeOpacity={0.8}>
              <View style={styles.avatarContainer}>
                {profile.avatar ? (
                  <Image source={{ uri: profile.avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={50} color={ACCENT_COLOR} />
                  </View>
                )}
                <View style={styles.avatarBadge}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
            <Text style={styles.title}>My Account</Text>
            <Text style={styles.subtitle}>@{profile.username}</Text>
          </View>

          {/* Profile Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                value={profile.fullname}
                onChangeText={(text) => setProfile(prev => ({ ...prev, fullname: text }))}
                placeholder="Enter your full name"
                style={styles.input}
                placeholderTextColor={theme === "light" ? "#999" : "#666"}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={profile.email}
                onChangeText={(text) => setProfile(prev => ({ ...prev, email: text }))}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                placeholderTextColor={theme === "light" ? "#999" : "#666"}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Number</Text>
              <TextInput
                value={profile.contactNumber}
                onChangeText={(text) => setProfile(prev => ({ ...prev, contactNumber: text }))}
                placeholder="Enter your contact number"
                keyboardType="phone-pad"
                style={styles.input}
                placeholderTextColor={theme === "light" ? "#999" : "#666"}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                value={profile.username}
                editable={false}
                style={[styles.input, styles.disabledInput]}
                placeholderTextColor={theme === "light" ? "#999" : "#666"}
              />
              <Text style={styles.helperText}>Username cannot be changed</Text>
            </View>

            <TouchableOpacity 
              onPress={handleUpdateProfile} 
              style={[styles.button, styles.primaryButton, !hasProfileChanges() && styles.disabledButton]}
              disabled={isLoading || !hasProfileChanges()}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Update Profile</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Password Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Change Password</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  secureTextEntry={!passwordVisibility.old}
                  value={passwords.old}
                  onChangeText={(text) => setPasswords(prev => ({ ...prev, old: text }))}
                  placeholder="Enter current password"
                  style={styles.passwordInput}
                  placeholderTextColor={theme === "light" ? "#999" : "#666"}
                />
                <TouchableOpacity 
                  onPress={() => togglePasswordVisibility('old')} 
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={passwordVisibility.old ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color={ACCENT_COLOR}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  secureTextEntry={!passwordVisibility.new}
                  value={passwords.new}
                  onChangeText={(text) => setPasswords(prev => ({ ...prev, new: text }))}
                  placeholder="Enter new password"
                  style={styles.passwordInput}
                  placeholderTextColor={theme === "light" ? "#999" : "#666"}
                />
                <TouchableOpacity 
                  onPress={() => togglePasswordVisibility('new')} 
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={passwordVisibility.new ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color={ACCENT_COLOR}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  secureTextEntry={!passwordVisibility.confirm}
                  value={passwords.confirm}
                  onChangeText={(text) => setPasswords(prev => ({ ...prev, confirm: text }))}
                  placeholder="Re-enter new password"
                  style={styles.passwordInput}
                  placeholderTextColor={theme === "light" ? "#999" : "#666"}
                />
                <TouchableOpacity 
                  onPress={() => togglePasswordVisibility('confirm')} 
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={passwordVisibility.confirm ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color={ACCENT_COLOR}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              onPress={handleChangePassword} 
              style={[styles.button, styles.secondaryButton]}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Change Password</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity 
            onPress={handleLogout} 
            style={[styles.button, styles.logoutButton]}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Help Modal */}
      <Modal
        visible={showHelp}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHelp(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Help & Support</Text>
            <Text style={styles.modalText}>
              Need assistance? Contact our support team:{'\n\n'}
              📧 Email: support@resqyou.com{'\n'}
              📞 Hotline: 1-800-RESQYOU{'\n\n'}
              Available 24/7
            </Text>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => setShowHelp(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* About Modal */}
      <Modal
        visible={showAbout}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAbout(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>About ResQYou</Text>
            <Text style={styles.modalText}>
              ResQYou Support App v1.0.0{'\n\n'}
              Providing support and resources for those affected by violence against women and children.{'\n\n'}
              © 2024 ResQYou. All rights reserved.
            </Text>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => setShowAbout(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

// Styles Function
const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme === "light" ? "#f5f5f5" : "#1c1c1c",
  },
  headerIcons: {
    position: "absolute",
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 1000,
  },
  iconButton: {
    padding: 10,
    backgroundColor: theme === "light" ? "#fff" : "#2b2b2b",
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: -1000,
    right: -1000,
    bottom: -1000,
  },
  dropdownMenu: {
    position: "absolute",
    top: 45,
    right: 0,
    backgroundColor: theme === "light" ? "#fff" : "#2b2b2b",
    borderWidth: 1,
    borderColor: "#8c01c0",
    borderRadius: 8,
    minWidth: 220,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemText: {
    marginLeft: 12,
    fontSize: 14,
    color: theme === "light" ? "#333" : "#fff",
  },
  dropdownDelete: {
    color: "#dc3545",
    fontWeight: "600",
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme === "light" ? "#e0e0e0" : "#444",
    marginVertical: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 120 : 90,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: theme === "light" ? "#fff" : "#2b2b2b",
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#8c01c0",
  },
  avatarPlaceholder: {
    backgroundColor: theme === "light" ? "#f0e7ff" : "#3b3b3b",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#8c01c0",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: theme === "light" ? "#fff" : "#2b2b2b",
  },
  title: {
    marginTop: 12,
    fontSize: 24,
    color: "#8c01c0",
    fontWeight: "bold",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: theme === "light" ? "#666" : "#999",
  },
  section: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme === "light" ? "#e0e0e0" : "#444",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme === "light" ? "#333" : "#fff",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontWeight: "600",
    fontSize: 14,
    color: theme === "light" ? "#333" : "#e0e0e0",
  },
  input: {
    backgroundColor: theme === "light" ? "#f5f5f5" : "#3b3b3b",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme === "light" ? "#e0e0e0" : "#555",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: theme === "light" ? "#333" : "#fff",
  },
  disabledInput: {
    opacity: 0.6,
    backgroundColor: theme === "light" ? "#e8e8e8" : "#2a2a2a",
  },
  helperText: {
    fontSize: 12,
    color: theme === "light" ? "#666" : "#999",
    marginTop: 4,
    fontStyle: "italic",
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme === "light" ? "#f5f5f5" : "#3b3b3b",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme === "light" ? "#e0e0e0" : "#555",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: theme === "light" ? "#333" : "#fff",
  },
  eyeIcon: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  button: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#8c01c0",
  },
  secondaryButton: {
    backgroundColor: "#6c757d",
  },
  logoutButton: {
    backgroundColor: "#dc3545",
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme === "light" ? "#fff" : "#2b2b2b",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#8c01c0",
    marginBottom: 12,
  },
  modalText: {
    fontSize: 15,
    color: theme === "light" ? "#333" : "#e0e0e0",
    lineHeight: 22,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: "#8c01c0",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});

export default Account;