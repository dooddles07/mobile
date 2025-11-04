import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

const API_URL = "http://192.168.100.6:10000/api/auth"; // Your computer's IP address

const LoginScreen = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter your username and password.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data?.token) {
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("username", username);
        Alert.alert("Success", "Login successful!");
        router.push("/Home");
      } else {
        Alert.alert("Login Failed", data.message || "Invalid credentials.");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  return (
    <LinearGradient
      colors={["#cadefc", "#c3bef0", "#cca8e9", "#8c01c0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, width: "100%" }}
      >
        <ScrollView contentContainerStyle={styles.innerContainer}>
          <Image
            source={require("../assets/images/bg1.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor="#666"
              autoCapitalize="none"
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity onPress={() => router.push("/Forgotpass")}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/Register")}>
            <Text style={styles.registerText}>
              Don't have an account?{" "}
              <Text style={styles.registerLink}>Register</Text>
            </Text>
          </TouchableOpacity>
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
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 10,
  },
  inputContainer: {
    marginTop: 20,
    width: "100%",
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#cca8e9",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 15,
    width: "100%",
  },
  button: {
    backgroundColor: "#8c01c0",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  forgotText: {
    color: "#6e6e6e",
    fontSize: 14,
    textDecorationLine: "underline",
    alignSelf: "flex-end",
    marginTop: 8,
  },
  registerText: {
    marginTop: 25,
    color: "#444",
    fontSize: 14,
    textAlign: "center",
  },
  registerLink: {
    color: "#8b5cf6",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});

export default LoginScreen;