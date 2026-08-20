import React from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useOrderStore } from "@/stores/OrderStore";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import colors, { typography } from "@/assets/styles/theme";
import { APP_STRINGS } from "@/constants/strings";
import { Header } from "@/components/common/Header";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CustomButton } from "@/components/common/CustomButton";

export const ActiveDeliveryScreen = () => {
  const router = useRouter();
  const { activeOrder } = useOrderStore();

  const handleCall = () => {
    if (activeOrder?.driverPhone) {
      Linking.openURL(`tel:${activeOrder.driverPhone}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={APP_STRINGS.activeDelivery.screenTitle}
        showBack
        onBackPress={() => router.replace("/(client)/dashboard" as any)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Map / Tracking Header Card */}
        <View style={styles.trackingHeaderCard}>
          <View style={styles.mapMock}>
            <MaterialCommunityIcons
              name="navigation-variant"
              size={48}
              color={colors.primary.yellow}
            />
            <Text style={styles.mapText}>Live GPS Tracking Active</Text>
          </View>

          <View style={styles.statusRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusHeadline}>
                {activeOrder?.status === "delivered"
                  ? APP_STRINGS.activeDelivery.delivered
                  : APP_STRINGS.activeDelivery.inTransit}
              </Text>
              <Text style={styles.etaText}>
                ETA: {activeOrder?.etaMinutes || 12} minutes remaining
              </Text>
            </View>
            {activeOrder && <StatusBadge status={activeOrder.status} />}
          </View>
        </View>

        {/* Assigned Driver Card */}
        {activeOrder?.driverName && (
          <View style={styles.driverCard}>
            <View style={styles.driverInfoRow}>
              <View style={styles.driverAvatar}>
                <Feather name="user" size={24} color={colors.text.inverse} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{activeOrder.driverName}</Text>
                <Text style={styles.vehicleDetails}>
                  {activeOrder.vehicleType.toUpperCase()} • {activeOrder.vehiclePlate}
                </Text>
              </View>

              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color={colors.primary.yellow} />
                <Text style={styles.ratingText}>
                  {activeOrder.driverRating || 4.9}
                </Text>
              </View>
            </View>

            {/* Quick Contact Buttons */}
            <View style={styles.contactRow}>
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={handleCall}
                activeOpacity={0.85}
              >
                <Feather
                  name="phone-call"
                  size={16}
                  color={colors.primary.yellow}
                />
                <Text style={styles.contactBtnText}>
                  {APP_STRINGS.activeDelivery.contactDriver}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => {}}
                activeOpacity={0.85}
              >
                <Feather
                  name="message-square"
                  size={16}
                  color={colors.primary.yellow}
                />
                <Text style={styles.contactBtnText}>
                  {APP_STRINGS.activeDelivery.messageDriver}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Package & Address Breakdown */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Delivery Details</Text>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Package Title</Text>
            <Text style={styles.detailValue}>
              {activeOrder?.packageDetails.title || "Standard Package"}
            </Text>
          </View>

          <View style={styles.addressBox}>
            <View style={styles.addressRow}>
              <Ionicons
                name="ellipse"
                size={12}
                color={colors.primary.yellow}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.addressType}>
                  {APP_STRINGS.activeDelivery.pickupAddress}
                </Text>
                <Text style={styles.addressText}>
                  {activeOrder?.pickupLocation.address}
                </Text>
              </View>
            </View>

            <View style={styles.addressLine} />

            <View style={styles.addressRow}>
              <Ionicons
                name="location"
                size={14}
                color={colors.status.success}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.addressType}>
                  {APP_STRINGS.activeDelivery.dropoffAddress}
                </Text>
                <Text style={styles.addressText}>
                  {activeOrder?.dropoffLocation.address}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <CustomButton
          title="Return to Dashboard"
          variant="secondary"
          onPress={() => router.replace("/(client)/dashboard" as any)}
          style={{ marginTop: 12 }}
        />
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
  trackingHeaderCard: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: 16,
  },
  mapMock: {
    height: 140,
    backgroundColor: colors.background.input,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  mapText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 8,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusHeadline: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  etaText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  driverCard: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: 16,
  },
  driverInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary.yellow,
    justifyContent: "center",
    alignItems: "center",
  },
  driverName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  vehicleDetails: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.background.input,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
  },
  contactRow: {
    flexDirection: "row",
    gap: 10,
  },
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.background.input,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  contactBtnText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
  },
  detailsCard: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: 16,
  },
  detailsTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    marginBottom: 12,
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  detailValue: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    marginTop: 2,
  },
  addressBox: {
    backgroundColor: colors.background.input,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  addressType: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  addressText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
    marginTop: 2,
  },
  addressLine: {
    width: 2,
    height: 14,
    backgroundColor: colors.border.subtle,
    marginLeft: 5,
    marginVertical: 4,
  },
});
