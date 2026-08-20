import React from "react";
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
import { Ionicons, Feather } from "@expo/vector-icons";
import colors, { typography } from "@/assets/styles/theme";
import { APP_STRINGS } from "@/constants/strings";
import { CustomButton } from "@/components/common/CustomButton";
import { CustomInput } from "@/components/common/CustomInput";
import { StatusBadge } from "@/components/common/StatusBadge";

export const CustomerDashboard = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeOrder } = useOrderStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Greeting */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.headerGreeting}>
              {APP_STRINGS.customerDashboard.greeting}
            </Text>
            <Text style={styles.headerName}>{user?.username || "Client"} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push("/onboarding")}
          >
            <Feather name="settings" size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Quick Action: Send Package Card */}
        <View style={styles.actionCard}>
          <View style={styles.actionCardContent}>
            <Text style={styles.actionCardTitle}>
              {APP_STRINGS.customerDashboard.createOrderCardTitle}
            </Text>
            <Text style={styles.actionCardDesc}>
              {APP_STRINGS.customerDashboard.createOrderCardDesc}
            </Text>
            <CustomButton
              title={APP_STRINGS.customerDashboard.sendPackageBtn}
              onPress={() => router.push("/(client)/create-order" as any)}
              style={{ marginTop: 14 }}
              icon={
                <Feather
                  name="plus-circle"
                  size={18}
                  color={colors.text.inverse}
                />
              }
            />
          </View>
        </View>

        {/* Tracking Search Input */}
        <View style={styles.searchSection}>
          <CustomInput
            placeholder="Search by Tracking ID or item..."
            leftIcon={
              <Ionicons name="search" size={20} color={colors.text.secondary} />
            }
          />
        </View>

        {/* Active Shipment Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {APP_STRINGS.customerDashboard.activeDeliveryHeader}
          </Text>
        </View>

        {activeOrder ? (
          <TouchableOpacity
            style={styles.shipmentCard}
            onPress={() => router.push("/(client)/active-delivery" as any)}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Feather
                  name="box"
                  size={20}
                  color={colors.primary.yellow}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.itemTitle}>
                  {activeOrder.packageDetails.title}
                </Text>
              </View>
              <StatusBadge
                status={activeOrder.status}
              />
            </View>

            <Text style={styles.trackingNumber}>ID: {activeOrder.id}</Text>

            {/* Route Points */}
            <View style={styles.routeContainer}>
              <View style={styles.routePoint}>
                <Ionicons
                  name="ellipse"
                  size={10}
                  color={colors.primary.yellow}
                />
                <Text style={styles.routeText} numberOfLines={1}>
                  {activeOrder.pickupLocation.address}
                </Text>
              </View>

              <View style={styles.routeLine} />

              <View style={styles.routePoint}>
                <Ionicons
                  name="location"
                  size={12}
                  color={colors.status.success}
                />
                <Text style={styles.routeText} numberOfLines={1}>
                  {activeOrder.dropoffLocation.address}
                </Text>
              </View>
            </View>

            <View style={styles.shipmentFooter}>
              <Text style={styles.footerEta}>
                Est. ETA: {activeOrder.etaMinutes || 15} mins
              </Text>
              <View style={styles.trackLink}>
                <Text style={styles.trackLinkText}>Live Track</Text>
                <Feather
                  name="chevron-right"
                  size={16}
                  color={colors.primary.yellow}
                />
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              {APP_STRINGS.customerDashboard.noActiveDelivery}
            </Text>
          </View>
        )}

        {/* Switch Account Role */}
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
    paddingVertical: 10,
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
  profileBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.background.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  actionCard: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: 16,
  },
  actionCardContent: {},
  actionCardTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    marginBottom: 4,
  },
  actionCardDesc: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  searchSection: {
    marginBottom: 12,
  },
  sectionHeader: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  shipmentCard: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: colors.primary.yellow,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: "row",
    flexWrap: 'wrap',
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  trackingNumber: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  routeContainer: {
    backgroundColor: colors.background.input,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  routePoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routeText: {
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
  shipmentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerEta: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  trackLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  trackLinkText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: colors.primary.yellow,
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
