import React, { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/AuthStore";
import { useOrderStore } from "@/stores/OrderStore";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import colors, { typography } from "@/assets/styles/theme";
import { APP_STRINGS } from "@/constants/strings";
import { CustomButton } from "@/components/common/CustomButton";

export const DriverDashboard = () => {
  const router = useRouter();
  const { user, toggleDriverAvailability } = useAuthStore();
  const { availableJobs, acceptJob } = useOrderStore();
  const [toggling, setToggling] = useState(false);

  const isDriverOnline = !!user?.is_available;

  const handleToggleOnline = async () => {
    try {
      setToggling(true);
      await toggleDriverAvailability(!isDriverOnline);
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header & Status Toggle */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.headerGreeting}>Courier Portal</Text>
            <Text style={styles.headerName}>{user?.username || "Driver"} 👋</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.statusBadge,
              {
                backgroundColor: isDriverOnline
                  ? "#1A3320"
                  : colors.background.card,
              },
            ]}
            onPress={handleToggleOnline}
            disabled={toggling}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isDriverOnline
                    ? colors.status.online
                    : colors.status.offline,
                },
              ]}
            />
            <Text style={styles.statusText}>
              {isDriverOnline
                ? APP_STRINGS.driverDashboard.statusOnline
                : APP_STRINGS.driverDashboard.statusOffline}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Driver Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              {APP_STRINGS.driverDashboard.todayEarnings}
            </Text>
            <Text style={styles.statValue}>$184.50</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              {APP_STRINGS.driverDashboard.completedJobs}
            </Text>
            <Text style={styles.statValue}>12 Orders</Text>
          </View>
        </View>

        {/* Section: Nearby Delivery Requests */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {APP_STRINGS.driverDashboard.availableRequests}
          </Text>
        </View>

        {isDriverOnline ? (
          availableJobs.length > 0 ? (
            availableJobs.map((job) => (
              <View key={job.id} style={styles.jobCard}>
                <View style={styles.jobHeader}>
                  <View style={styles.tag}>
                    <MaterialCommunityIcons
                      name="cube-outline"
                      size={14}
                      color={colors.primary.yellow}
                    />
                    <Text style={styles.tagText}>
                      {job.packageDetails.category.replace("_", " ").toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.jobPayout}>
                    ${job.estimatedPrice.toFixed(2)}
                  </Text>
                </View>

                <Text style={styles.jobItemName}>
                  {job.packageDetails.title}
                </Text>

                {/* Pickup & Dropoff Route */}
                <View style={styles.routeContainer}>
                  <View style={styles.routePoint}>
                    <Ionicons
                      name="ellipse"
                      size={10}
                      color={colors.primary.yellow}
                    />
                    <Text style={styles.pointText} numberOfLines={1}>
                      Pickup: {job.pickupLocation.address}
                    </Text>
                  </View>

                  <View style={styles.routeLine} />

                  <View style={styles.routePoint}>
                    <Ionicons
                      name="location"
                      size={12}
                      color={colors.status.success}
                    />
                    <Text style={styles.pointText} numberOfLines={1}>
                      Dropoff: {job.dropoffLocation.address}
                    </Text>
                  </View>
                </View>

                <CustomButton
                  title={APP_STRINGS.driverDashboard.acceptJob}
                  onPress={() => {
                    acceptJob(job.id);
                    router.push("/(driver)/active-job" as any);
                  }}
                  icon={
                    <Feather
                      name="check-circle"
                      size={18}
                      color={colors.text.inverse}
                    />
                  }
                />
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No jobs available nearby right now.
              </Text>
            </View>
          )
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              You are currently offline. Go online to receive delivery requests.
            </Text>
          </View>
        )}

        {/* Role Switcher */}
        <TouchableOpacity
          style={styles.switchRoleButton}
          onPress={() => router.push("/onboarding")}
        >
          <Feather
            name="repeat"
            size={16}
            color={colors.text.secondary}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.switchRoleText}>Switch Account Role</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.app,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerGreeting: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  headerName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  statLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  jobCard: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: 16,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.background.input,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.primary.yellow,
  },
  jobPayout: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primary.yellow,
  },
  jobItemName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    marginBottom: 10,
  },
  routeContainer: {
    backgroundColor: colors.background.input,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pointText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
    flex: 1,
  },
  routeLine: {
    width: 2,
    height: 12,
    backgroundColor: colors.border.subtle,
    marginLeft: 4,
    marginVertical: 2,
  },
  emptyCard: {
    backgroundColor: colors.background.card,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  emptyText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
  },
  switchRoleButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  switchRoleText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});
