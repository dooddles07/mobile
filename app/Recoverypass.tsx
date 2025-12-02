import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import API_ENDPOINTS from '../config/api';

const API_URL = API_ENDPOINTS.AUTH;

const RecoveryPass = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState((params?.email as string) || '');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(900);
  const [canResend, setCanResend] = useState(false);

  // Password requirement states
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    passwordsMatch: false
  });

  // Validate password requirements
  useEffect(() => {
    setPasswordRequirements({
      minLength: newPassword.length >= 6,
      passwordsMatch: newPassword.length > 0 && newPassword === confirmPassword
    });
  }, [newPassword, confirmPassword]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResetPassword = async () => {
    if (!email.trim() || !resetCode.trim() || !newPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (resetCode.trim().length !== 6) {
      Alert.alert('Error', 'Reset code must be 6 digits');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          resetCode: resetCode.trim(),
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          data.message || 'Your password has been reset successfully',
          [{ text: 'OK', onPress: () => router.push('/') }]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to reset password.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setCountdown(900);
        setCanResend(false);
        Alert.alert('Success', 'A new reset code has been sent to your email');
      } else {
        Alert.alert('Error', data.message || 'Failed to resend code.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const gradientColors: readonly [string, string, string] = theme === 'light'
    ? ["rgba(254, 242, 242, 0.3)", "rgba(254, 226, 226, 0.3)", "rgba(254, 202, 202, 0.3)"]
    : ["rgba(15, 23, 42, 0.3)", "rgba(30, 41, 59, 0.3)", "rgba(51, 65, 85, 0.3)"];

  return (
    <ImageBackground
      source={require("../assets/images/bg2.jpg")}
      style={styles.container}
      imageStyle={{ opacity: 0.6 }}
    >
      <LinearGradient
      colors={gradientColors}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, width: "100%" }}
      >
        <ScrollView
          contentContainerStyle={[styles.innerContainer, { paddingTop: Math.max(insets.top + 20, 60), paddingBottom: Math.max(insets.bottom + 20, 40) }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with Back Button */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.logoContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter the 6-digit code sent to your email and create a new password
            </Text>
          </View>

          {/* Timer/Countdown */}
          {countdown > 0 ? (
            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={18} color="#f97316" style={{ marginRight: 8 }} />
              <Text style={styles.timerText}>
                Code expires in: <Text style={styles.timerValue}>{formatTime(countdown)}</Text>
              </Text>
            </View>
          ) : (
            <View style={[styles.timerContainer, styles.expiredContainer]}>
              <Ionicons name="alert-circle-outline" size={18} color="#ef4444" style={{ marginRight: 8 }} />
              <Text style={styles.expiredText}>
                Code expired. Request a new one.
              </Text>
            </View>
          )}

          {/* Input Fields */}
          <View style={styles.formContainer}>
            {!params?.email && (
              <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
                <Ionicons name="mail-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor="#cfa274ff"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            )}

            <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
              <Ionicons name="key-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={resetCode}
                onChangeText={(text) => setResetCode(text.replace(/[^0-9]/g, ''))}
                placeholder="6-Digit Reset Code"
                placeholderTextColor="#cfa274ff"
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                style={[styles.input, { color: colors.text }]}
                placeholder="New Password"
                placeholderTextColor="#cfa274ff"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                disabled={loading}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#f97316"
                />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={[styles.input, { color: colors.text }]}
                placeholder="Confirm Password"
                placeholderTextColor="#cfa274ff"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
                disabled={loading}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#f97316"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordHintContainer}>
              <View style={styles.requirementRow}>
                <Ionicons
                  name={passwordRequirements.minLength ? "checkmark-circle" : "close-circle"}
                  size={18}
                  color={passwordRequirements.minLength ? "#10b981" : "#ef4444"}
                  style={styles.requirementIcon}
                />
                <Text style={[
                  styles.passwordHint,
                  { color: passwordRequirements.minLength ? "#10b981" : colors.textSecondary }
                ]}>
                  Password must be at least 6 characters
                </Text>
              </View>

              <View style={styles.requirementRow}>
                <Ionicons
                  name={passwordRequirements.passwordsMatch ? "checkmark-circle" : "close-circle"}
                  size={18}
                  color={passwordRequirements.passwordsMatch ? "#10b981" : (confirmPassword.length > 0 ? "#ef4444" : "#9ca3af")}
                  style={styles.requirementIcon}
                />
                <Text style={[
                  styles.passwordHint,
                  { color: passwordRequirements.passwordsMatch ? "#10b981" : (confirmPassword.length > 0 ? "#ef4444" : colors.textSecondary) }
                ]}>
                  Passwords must match
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Reset Password</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resendButton, (loading || !canResend) && styles.resendButtonDisabled]}
              onPress={handleResendCode}
              disabled={loading || !canResend}
              activeOpacity={0.8}
            >
              <Text style={[styles.resendText, (loading || !canResend) && styles.resendTextDisabled]}>
                {canResend ? "Resend Code" : `Wait ${formatTime(countdown)} to resend`}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.inputBorder }]} />
              <Text style={[styles.dividerText, { color: colors.placeholder }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.inputBorder }]} />
            </View>

            <TouchableOpacity
              onPress={() => router.push("/")}
              disabled={loading}
              style={[styles.loginButton, { backgroundColor: colors.input }]}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
    </ImageBackground>
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
    width: '100%',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  timerText: {
    fontSize: 14,
    color: '#f97316',
  },
  timerValue: {
    fontWeight: '700',
    fontSize: 15,
  },
  expiredContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  expiredText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: "#f8e9c9ff",
    borderWidth: 1,
    shadowColor: '#f97316',
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
  passwordHintContainer: {
    marginBottom: 20,
    paddingLeft: 4,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementIcon: {
    marginRight: 8,
  },
  passwordHint: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  button: {
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  resendButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendText: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: '#9ca3af',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f97316',
  },
  loginButtonText: {
    color: '#f97316',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default RecoveryPass;