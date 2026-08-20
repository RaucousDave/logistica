import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import colors from "@/assets/styles/theme";

export default function SplashScreen() {
  return (
    <SafeAreaView style={[splashStyles.container]}>
      {/* Brand Icon Badge */}
      <View style={splashStyles.logoContainer}>
        <Text style={splashStyles.logoText}>A</Text>
      </View>

      {/* Brand Name Label */}
      <View style={splashStyles.textContainer}>
        <Text style={splashStyles.brandText}>LOGISTICA</Text>
      </View>
    </SafeAreaView>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background.app,
  },
  logoContainer: {
    backgroundColor: colors.primary.yellow,
    borderRadius: 20,
    width: 120,
    aspectRatio: 1, // Ensures perfect square shape regardless of screen width
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    // Subtle shadow for elevation
    shadowColor: colors.primary.yellow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  logoText: {
    textAlign: "center",
    fontSize: 72,
    fontWeight: "800", // Fixed string type
    color: colors.text.inverse, // Uses dark charcoal for contrast on yellow
    includeFontPadding: false,
  },
  textContainer: {
    alignItems: "center",
  },
  brandText: {
    letterSpacing: 4,
    color: colors.text.muted,
    fontSize: 22,
    fontWeight: "700",
    opacity: 0.6, // Fixed decimal opacity (0 to 1 scale)
  },
});
