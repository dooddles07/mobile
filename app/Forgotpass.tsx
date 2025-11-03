import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';

const API_URL = 'http://192.168.100.6:10000/api/auth';

const ForgotPass = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendEmail = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
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
        Alert.alert(
          'Success',
          data.message || 'Password reset code has been sent to your email',
          [
            {
              text: 'OK',
              onPress: () => {
                router.push({
                  pathname: '/Recoverypass',
                  params: { email: email.toLowerCase().trim() }
                });
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to send reset code.');
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
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a 6-digit code to reset your password.
          </Text>

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

          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={handleSendEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Send Reset Code</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have account? </Text>
            <TouchableOpacity onPress={() => router.push('/')} disabled={loading}>
              <Text style={styles.loginLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
    marginBottom: 30,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000',
  },
  sendButton: {
    backgroundColor: '#7CB342',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
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

export default ForgotPass;