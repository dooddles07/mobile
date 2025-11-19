import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_ENDPOINTS from '../config/api';

const API_URL = API_ENDPOINTS.AUTH;

const Register = () => {
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!fullname || !email || !username || !password || !confirmPassword || !contactNumber) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    // Validate password requirements
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters long.");
      return;
    }

    if (!/(?=.*[a-z])/.test(password)) {
      Alert.alert("Weak Password", "Password must contain at least one lowercase letter.");
      return;
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      Alert.alert("Weak Password", "Password must contain at least one uppercase letter.");
      return;
    }

    if (!/(?=.*\d)/.test(password)) {
      Alert.alert("Weak Password", "Password must contain at least one number.");
      return;
    }

    // Validate username format
    if (username.length < 3 || username.length > 30) {
      Alert.alert("Invalid Username", "Username must be 3-30 characters long.");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      Alert.alert("Invalid Username", "Username can only contain letters, numbers, and underscores.");
      return;
    }

    setIsLoading(true);
    try {
      const requestData = {
        fullname,
        email,
        username,
        password,
        contactNumber,
      };

      console.log('Sending registration request to:', `${API_URL}/register`);
      console.log('Request data:', { ...requestData, password: '***' }); // Hide password in logs

      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await res.json();

      console.log('Registration response status:', res.status);
      console.log('Registration response data:', data);

      if (res.ok) {
        // Clear any old avatar from previous sessions
        await AsyncStorage.removeItem("avatar");

        Alert.alert("Success", "Registered successfully!");
        router.replace("/");
      } else {
        const errorMessage = data.message || "Please try again.";
        console.error('Registration failed:', errorMessage);
        Alert.alert("Registration Failed", errorMessage);
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert("Error", `Network error: ${error.message || 'Please check your connection and try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const gradientColors = theme === 'dark'
    ? ["#0f172a", "#1e293b", "#334155"]
    : ["#f0fdfa", "#ccfbf1", "#99f6e4"];

  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, width: "100%" }}
      >
        <ScrollView
          contentContainerStyle={[styles.innerContainer, { paddingTop: Math.max(insets.top + 20, 60), paddingBottom: Math.max(insets.bottom + 20, 40) }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Back Button */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={isLoading}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.logoContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Join us today</Text>
          </View>

          {/* Input Fields */}
          <View style={styles.formContainer}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
              <Ionicons name="person-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={fullname}
                onChangeText={setFullname}
                placeholder="Full Name"
                placeholderTextColor={colors.placeholder}
                editable={!isLoading}
              />
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
              <Ionicons name="mail-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
              <Ionicons name="call-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={contactNumber}
                onChangeText={setContactNumber}
                placeholder="Contact Number"
                placeholderTextColor={colors.placeholder}
                keyboardType="phone-pad"
                editable={!isLoading}
              />
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
              <Ionicons name="at-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                style={[styles.input, { color: colors.text }]}
                placeholder="Password"
                placeholderTextColor={colors.placeholder}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {password.length > 0 && (
              <View style={styles.passwordRequirements}>
                <Text style={[styles.requirementText, { color: colors.textSecondary }]}>Password must contain:</Text>
                <View style={styles.requirementRow}>
                  <Ionicons
                    name={password.length >= 6 ? "checkmark-circle" : "close-circle"}
                    size={16}
                    color={password.length >= 6 ? "#10b981" : "#ef4444"}
                  />
                  <Text style={[styles.requirementItem, { color: password.length >= 6 ? "#10b981" : colors.textSecondary }]}>
                    At least 6 characters
                  </Text>
                </View>
                <View style={styles.requirementRow}>
                  <Ionicons
                    name={/(?=.*[a-z])/.test(password) ? "checkmark-circle" : "close-circle"}
                    size={16}
                    color={/(?=.*[a-z])/.test(password) ? "#10b981" : "#ef4444"}
                  />
                  <Text style={[styles.requirementItem, { color: /(?=.*[a-z])/.test(password) ? "#10b981" : colors.textSecondary }]}>
                    One lowercase letter
                  </Text>
                </View>
                <View style={styles.requirementRow}>
                  <Ionicons
                    name={/(?=.*[A-Z])/.test(password) ? "checkmark-circle" : "close-circle"}
                    size={16}
                    color={/(?=.*[A-Z])/.test(password) ? "#10b981" : "#ef4444"}
                  />
                  <Text style={[styles.requirementItem, { color: /(?=.*[A-Z])/.test(password) ? "#10b981" : colors.textSecondary }]}>
                    One uppercase letter
                  </Text>
                </View>
                <View style={styles.requirementRow}>
                  <Ionicons
                    name={/(?=.*\d)/.test(password) ? "checkmark-circle" : "close-circle"}
                    size={16}
                    color={/(?=.*\d)/.test(password) ? "#10b981" : "#ef4444"}
                  />
                  <Text style={[styles.requirementItem, { color: /(?=.*\d)/.test(password) ? "#10b981" : colors.textSecondary }]}>
                    One number
                  </Text>
                </View>
              </View>
            )}

            <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={[styles.input, { color: colors.text }]}
                placeholder="Confirm Password"
                placeholderTextColor={colors.placeholder}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Create Account</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or continue with</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Ionicons name="logo-google" size={24} color="#DB4437" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Ionicons name="logo-facebook" size={24} color="#1877F2" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Ionicons name="logo-apple" size={24} color={theme === 'dark' ? '#ffffff' : '#000000'} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 10,
    width: "100%",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
  },
  formContainer: {
    width: "100%",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    shadowColor: "#14b8a6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  passwordRequirements: {
    backgroundColor: 'rgba(20, 184, 166, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    marginTop: -8,
  },
  requirementText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementItem: {
    fontSize: 12,
    marginLeft: 8,
  },
  button: {
    backgroundColor: "#14b8a6",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 8,
    shadowColor: "#14b8a6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: "500",
  },
  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 4,
  },
  socialButton: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default Register;