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
import { useTheme, Theme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import API_ENDPOINTS from '../config/api';

// Types
interface UserProfile {
  fullname: string;
  email: string;
  username: string;
  contactNumber: string;
  avatar: string;
}

// Constants
const ACCENT_COLOR = "#f97316";
const API_BASE_URL = `${API_ENDPOINTS.BASE_URL}/api`;

const Account: React.FC = () => {
  const { theme, toggleTheme: toggleGlobalTheme, colors } = useTheme();
  const insets = useSafeAreaInsets();

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

      const apiResponse = await response.json();

      // Handle new response format: apiResponse.data contains the actual data
      const data = apiResponse.data || apiResponse;

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
        throw new Error(apiResponse.message || 'Failed to load profile');
      }

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

      const apiResponse = await response.json();

      // Handle new response format
      const data = apiResponse.data || apiResponse;

      if (response.ok) {
        Alert.alert("Success", "Profile updated successfully!");

        // Update local storage
        if (data.user) {
          await AsyncStorage.setItem('username', data.user.username);
          await AsyncStorage.setItem('email', data.user.email);
        }

        // Update original profile state
        setOriginalProfile(profile);
      } else {
        Alert.alert("Error", apiResponse.message || "Failed to update profile");
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
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;

        setIsLoading(true);

        try {
          const token = await AsyncStorage.getItem('token');

          const response = await fetch(imageUri);
          const blob = await response.blob();

          const reader = new FileReader();
          reader.readAsDataURL(blob);

          reader.onloadend = async () => {
            const base64data = reader.result as string;

            try {
              const uploadResponse = await fetch(`${API_BASE_URL}/auth/upload-avatar`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ avatar: base64data }),
              });

              const apiResponse = await uploadResponse.json();

              // Handle new response format
              const data = apiResponse.data || apiResponse;

              if (uploadResponse.ok) {
                const avatarUrl = data.avatar || data.user?.avatar;
                if (avatarUrl) {
                  setProfile(prev => ({ ...prev, avatar: avatarUrl }));
                  await AsyncStorage.setItem('avatar', avatarUrl);
                }
                Alert.alert('Success', 'Profile picture updated successfully!');
              } else {
                Alert.alert('Error', apiResponse.message || 'Failed to upload image');
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
              router.replace("/");
            }
          }
        }
      ]
    );
  }, []);

  const toggleTheme = useCallback(async () => {
    toggleGlobalTheme();
    setMenuOpen(false);
  }, [toggleGlobalTheme]);

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

  const styles = getStyles(theme, colors);

  if (isFetching) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={ACCENT_COLOR} />
        <Text style={[styles.loadingText, { marginTop: 16, color: colors.text }]}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 50) }]}>
        <TouchableOpacity
          onPress={() => router.push("/Home")}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>Account Settings</Text>

        <View style={{ position: 'relative' }}>
          <TouchableOpacity
            onPress={() => setMenuOpen(!menuOpen)}
            style={styles.headerButton}
          >
            <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
          </TouchableOpacity>

          {menuOpen && (
            <>
              <TouchableOpacity
                style={styles.menuOverlay}
                onPress={() => setMenuOpen(false)}
                activeOpacity={1}
              />
              <ScrollView
                style={[styles.dropdownMenu, { backgroundColor: colors.card }]}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
              >
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleMenuAction("theme")}
                >
                  <Ionicons name="color-palette-outline" size={20} color={ACCENT_COLOR} />
                  <Text style={[styles.dropdownItemText, { color: colors.text }]}>
                    Theme: {theme === "light" ? "Light" : "Dark"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleMenuAction("notification")}
                >
                  <Ionicons
                    name={notificationsEnabled ? "notifications-outline" : "notifications-off-outline"}
                    size={20}
                    color={ACCENT_COLOR}
                  />
                  <Text style={[styles.dropdownItemText, { color: colors.text }]}>
                    Notifications: {notificationsEnabled ? "On" : "Off"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleMenuAction("help")}
                >
                  <Ionicons name="help-circle-outline" size={20} color={ACCENT_COLOR} />
                  <Text style={[styles.dropdownItemText, { color: colors.text }]}>Help & Support</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleMenuAction("about")}
                >
                  <Ionicons name="information-circle-outline" size={20} color={ACCENT_COLOR} />
                  <Text style={[styles.dropdownItemText, { color: colors.text }]}>About ResQYou</Text>
                </TouchableOpacity>

                <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleMenuAction("delete")}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  <Text style={[styles.dropdownItemText, { color: '#ef4444' }]}>
                    Delete Account
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </>
          )}
        </View>
      </View>

      {/* Main Content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 40) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={[styles.profileHeader, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={handleImageUpload} activeOpacity={0.8}>
            <View style={styles.avatarContainer}>
              {profile.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="person" size={50} color={ACCENT_COLOR} />
                </View>
              )}
              <View style={styles.avatarBadge}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
          <Text style={[styles.profileName, { color: colors.text }]}>{profile.fullname || 'User Name'}</Text>
          <Text style={[styles.profileUsername, { color: colors.textSecondary }]}>@{profile.username}</Text>
        </View>

        {/* Profile Information Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Profile Information</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
            <TextInput
              value={profile.fullname}
              onChangeText={(text) => setProfile(prev => ({ ...prev, fullname: text }))}
              placeholder="Enter your full name"
              style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              placeholderTextColor={colors.placeholder}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <TextInput
              value={profile.email}
              onChangeText={(text) => setProfile(prev => ({ ...prev, email: text }))}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              placeholderTextColor={colors.placeholder}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Contact Number</Text>
            <TextInput
              value={profile.contactNumber}
              onChangeText={(text) => setProfile(prev => ({ ...prev, contactNumber: text }))}
              placeholder="Enter your contact number"
              keyboardType="phone-pad"
              style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              placeholderTextColor={colors.placeholder}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Username</Text>
            <TextInput
              value={profile.username}
              editable={false}
              style={[styles.input, styles.disabledInput, { backgroundColor: colors.backgroundSecondary, color: colors.textSecondary, borderColor: colors.border }]}
              placeholderTextColor={colors.placeholder}
            />
            <Text style={[styles.helperText, { color: colors.textTertiary }]}>Username cannot be changed</Text>
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
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Update Profile</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Password Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Change Password</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Current Password</Text>
            <View style={[styles.passwordWrapper, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <TextInput
                secureTextEntry={!passwordVisibility.old}
                value={passwords.old}
                onChangeText={(text) => setPasswords(prev => ({ ...prev, old: text }))}
                placeholder="Enter current password"
                style={[styles.passwordInput, { color: colors.text }]}
                placeholderTextColor={colors.placeholder}
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
            <Text style={[styles.label, { color: colors.textSecondary }]}>New Password</Text>
            <View style={[styles.passwordWrapper, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <TextInput
                secureTextEntry={!passwordVisibility.new}
                value={passwords.new}
                onChangeText={(text) => setPasswords(prev => ({ ...prev, new: text }))}
                placeholder="Enter new password"
                style={[styles.passwordInput, { color: colors.text }]}
                placeholderTextColor={colors.placeholder}
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
            <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm New Password</Text>
            <View style={[styles.passwordWrapper, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <TextInput
                secureTextEntry={!passwordVisibility.confirm}
                value={passwords.confirm}
                onChangeText={(text) => setPasswords(prev => ({ ...prev, confirm: text }))}
                placeholder="Re-enter new password"
                style={[styles.passwordInput, { color: colors.text }]}
                placeholderTextColor={colors.placeholder}
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
              <>
                <Ionicons name="key-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Change Password</Text>
              </>
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
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Help Modal */}
      <Modal
        visible={showHelp}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHelp(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: ACCENT_COLOR }]}>Help & Support</Text>
            <Text style={[styles.modalText, { color: colors.text }]}>
              Need assistance? Contact our support team:{'\n\n'}
              📧 Email: support@resqyou.com{'\n'}
              📞 Hotline: 1-800-RESQYOU{'\n\n'}
              Available 24/7
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: ACCENT_COLOR }]}
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
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: ACCENT_COLOR }]}>About ResQYou</Text>
            <Text style={[styles.modalText, { color: colors.text }]}>
              ResQYou Support App v1.0.0{'\n\n'}
              Providing support and resources for those affected by violence against women and children.{'\n\n'}
              © 2024 ResQYou. All rights reserved.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: ACCENT_COLOR }]}
              onPress={() => setShowAbout(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Styles Function
const getStyles = (theme: Theme, colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 100,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  menuOverlay: {
    position: 'absolute',
    top: -100,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 999,
  },
  dropdownMenu: {
    position: "absolute",
    top: 55,
    right: 0,
    borderRadius: 12,
    minWidth: 250,
    maxHeight: 400,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dropdownItemText: {
    marginLeft: 12,
    fontSize: 15,
  },
  menuDivider: {
    height: 1,
    marginVertical: 4,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 32,
    marginBottom: 16,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: ACCENT_COLOR,
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: ACCENT_COLOR,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.card,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 14,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: "600",
    fontSize: 14,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  disabledInput: {
    opacity: 0.6,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeIcon: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: ACCENT_COLOR,
  },
  secondaryButton: {
    backgroundColor: "#6c757d",
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
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
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalText: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
});

export default Account;
