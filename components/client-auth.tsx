import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import colors, { typography } from "@/assets/styles/theme";
import { APP_STRINGS } from "@/constants/strings";
import { CustomInput } from "@/components/common/CustomInput";
import { CustomButton } from "@/components/common/CustomButton";
import { Header } from "@/components/common/Header";
import { useSignIn } from "@/hooks/useSignIn";
import { useRegisterClient } from "@/hooks/useSignUp";

export default function ClientAuthScreen() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const signInMutation = useSignIn();
  const registerClientMutation = useRegisterClient();

  const handleSubmit = () => {
    if (isLogin) {
      signInMutation.mutate(
        { username: username || email, password, role: 'client' },
        {
          onSuccess: () => {
            router.replace("/(client)" as any);
          },
          onError: (err) => {
            Alert.alert("Login Failed", err.message);
          },
        }
      );
    } else {
      registerClientMutation.mutate(
        { username, email, password, phone_number: phone },
        {
          onSuccess: () => {
            router.replace("/(client)" as any);
          },
          onError: (err) => {
            Alert.alert("Registration Failed", err.message);
          },
        }
      );
    }
  };

  const handleSwitchToDriver = () => {
    router.replace("/(auth)/driver");
  };

  const isLoading = signInMutation.isPending || registerClientMutation.isPending;

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={APP_STRINGS.auth.customerAuthTitle}
        showBack
        onBackPress={() => router.replace("/onboarding")}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>
            {APP_STRINGS.auth.customerAuthSubtitle}
          </Text>

          {/* Toggle Tab */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, isLogin && styles.tabActive]}
              onPress={() => setIsLogin(true)}
            >
              <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, !isLogin && styles.tabActive]}
              onPress={() => setIsLogin(false)}
            >
              <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <CustomInput
            label="Username"
            placeholder="Enter your username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            leftIcon={
              <Feather
                name="user"
                size={20}
                color={colors.text.secondary}
              />
            }
          />

          {!isLogin && (
            <CustomInput
              label={APP_STRINGS.auth.emailLabel}
              placeholder={APP_STRINGS.auth.emailPlaceholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={
                <Feather
                  name="mail"
                  size={20}
                  color={colors.text.secondary}
                />
              }
            />
          )}

          <CustomInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon={
              <Feather
                name="lock"
                size={20}
                color={colors.text.secondary}
              />
            }
          />

          {!isLogin && (
            <CustomInput
              label={APP_STRINGS.auth.phoneLabel}
              placeholder={APP_STRINGS.auth.phonePlaceholder}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              leftIcon={
                <Feather
                  name="phone"
                  size={20}
                  color={colors.text.secondary}
                />
              }
            />
          )}

          {/* Submit Button */}
          <CustomButton
            title={
              isLogin
                ? APP_STRINGS.auth.loginBtn
                : APP_STRINGS.auth.registerBtn
            }
            loading={isLoading}
            onPress={handleSubmit}
            style={{ marginTop: 12 }}
          />

          {/* Switch Role Option */}
          <TouchableOpacity
            style={styles.switchRoleBtn}
            onPress={handleSwitchToDriver}
          >
            <Ionicons
              name="car-outline"
              size={18}
              color={colors.primary.yellow}
            />
            <Text style={styles.switchRoleText}>
              Are you a Courier Driver? Sign in here
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.app,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.primary.yellow,
  },
  tabText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.bold,
  },
  switchRoleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 28,
    paddingVertical: 12,
  },
  switchRoleText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.primary.yellow,
  },
});
