import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet } from "react-native";
import { Header } from "@/components/common/Header";
import colors, { typography } from "@/assets/styles/theme";
import { Feather } from "@expo/vector-icons";

export const ProfileScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Header title="My Profile" />
        <View style={styles.content}>
          <View style={styles.avatar}>
            <Feather name="user" size={40} color={colors.text.inverse} />
          </View>
          <Text style={styles.name}>User Profile</Text>
          <Text style={styles.email}>user@logistica.com</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.app,
    paddingVertical: 10,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.yellow,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  name: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
  },
  email: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 4,
  },
});
