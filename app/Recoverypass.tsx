import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const API_URL = 'http://192.168.100.6:10000/api/auth';

const RecoveryPass = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [email, setEmail] = useState((params?.email as string) || '');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(900);
  const [canResend, setCanResend] = useState(false);

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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
                disabled={loading}
              >
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to your email and create a new password.
            </Text>

            {countdown > 0 ? (
              <View style={styles.timerContainer}>
                <Text style={styles.timerText}>
                  Code expires in: <Text style={styles.timerValue}>{formatTime(countdown)}</Text>
                </Text>
              </View>
            ) : (
              <View style={[styles.timerContainer, styles.expiredContainer]}>
                <Text style={styles.expiredText}>
                  ⚠️ Code has expired. Please request a new one.
                </Text>
              </View>
            )}

            {!params?.email && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Your Email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="6-Digit Reset Code"
                placeholderTextColor="#999"
                value={resetCode}
                onChangeText={(text) => setResetCode(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="New Password"
                  placeholderTextColor="#999"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  disabled={loading}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm Password"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                  disabled={loading}
                >
                  <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.passwordHint}>
              • Password must be at least 6 characters{'\n'}
              • Passwords must match
            </Text>

            <TouchableOpacity
              style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Reset Password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendCode}
              disabled={loading || !canResend}
            >
              <Text style={[styles.resendText, (loading || !canResend) && styles.resendTextDisabled]}>
                {canResend ? "Resend Code" : `Wait ${formatTime(countdown)} to resend`}
              </Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Remember your password? </Text>
              <TouchableOpacity onPress={() => router.push('/')} disabled={loading}>
                <Text style={styles.loginLink}>Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#000',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  timerContainer: {
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  timerText: {
    fontSize: 14,
    color: '#F57C00',
    textAlign: 'center',
  },
  timerValue: {
    fontWeight: '700',
    fontSize: 16,
  },
  expiredContainer: {
    backgroundColor: '#FFEBEE',
    borderColor: '#EF5350',
  },
  expiredText: {
    fontSize: 14,
    color: '#C62828',
    textAlign: 'center',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingHorizontal: 20,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000',
  },
  eyeButton: {
    padding: 5,
  },
  eyeIcon: {
    fontSize: 20,
  },
  passwordHint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
    marginLeft: 10,
    lineHeight: 18,
  },
  confirmButton: {
    backgroundColor: '#7CB342',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  resendText: {
    color: '#7CB342',
    fontSize: 14,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: '#999',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    paddingBottom: 30,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#7CB342',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RecoveryPass;