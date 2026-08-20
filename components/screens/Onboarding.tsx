import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "@/assets/styles/globals";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import colors from "@/assets/styles/theme";
import { APP_STRINGS } from "@/constants/strings";
import { CustomButton } from "@/components/common/CustomButton";

export const OnboardingScreen = () => {
  const [selectedRole, setSelectedRole] = useState<'client' | 'driver'>('client');
  const router = useRouter();

  const handleProceed = () => {
    if (selectedRole === "client") {
      router.push("/(auth)/client" as any);
    } else {
      router.push("/(auth)/driver" as any);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.onboardingContainer}>
        {/* Header */}
        <View style={styles.onboardingHeader}>
          <Text style={styles.brandTitle}>{APP_STRINGS.appName}</Text>
          <Text style={styles.title}>{APP_STRINGS.onboarding.title}</Text>
          <Text style={styles.subtitle}>{APP_STRINGS.onboarding.subtitle}</Text>
        </View>

        {/* Role Cards */}
        <View style={styles.rolesContainer}>
          {/* Customer / Sender Card */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === "client" && styles.roleCardSelected,
            ]}
            onPress={() => setSelectedRole("client")}
            activeOpacity={0.85}
          >
            <View style={styles.roleIconBadge}>
              <Feather
                name="package"
                size={24}
                color={
                  selectedRole === "client"
                    ? colors.primary.yellow
                    : colors.text.secondary
                }
              />
            </View>
            <Text style={styles.roleTitle}>
              {APP_STRINGS.onboarding.customerTitle}
            </Text>
            <Text style={styles.roleDescription}>
              {APP_STRINGS.onboarding.customerDesc}
            </Text>
          </TouchableOpacity>

          {/* Courier / Driver Card */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === "driver" && styles.roleCardSelected,
            ]}
            onPress={() => setSelectedRole("driver")}
            activeOpacity={0.85}
          >
            <View style={styles.roleIconBadge}>
              <MaterialCommunityIcons
                name="truck-delivery-outline"
                size={26}
                color={
                  selectedRole === "driver"
                    ? colors.primary.yellow
                    : colors.text.secondary
                }
              />
            </View>
            <Text style={styles.roleTitle}>
              {APP_STRINGS.onboarding.driverTitle}
            </Text>
            <Text style={styles.roleDescription}>
              {APP_STRINGS.onboarding.driverDesc}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Get Started Button */}
        <CustomButton
          title={APP_STRINGS.onboarding.getStarted}
          onPress={handleProceed}
          icon={
            <Feather
              name="arrow-right"
              size={20}
              color={colors.text.inverse}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
};
