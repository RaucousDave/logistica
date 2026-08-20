import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { OrderStatus } from "@/types/order";
import colors, { typography } from "@/assets/styles/theme";

interface StatusBadgeProps {
  status: OrderStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "searching":
        return {
          label: "Searching Driver",
          color: colors.status.warning,
          bg: "#2A2315",
        };
      case "driver_assigned":
        return {
          label: "Driver Assigned",
          color: colors.primary.yellow,
          bg: "#23241A",
        };
      case "in_transit":
      case "picked_up":
        return {
          label: "In Transit",
          color: colors.primary.yellow,
          bg: "#23241A",
        };
      case "delivered":
        return {
          label: "Delivered",
          color: colors.status.success,
          bg: "#15281B",
        };
      case "cancelled":
        return {
          label: "Cancelled",
          color: colors.status.danger,
          bg: "#2A1818",
        };
      default:
        return {
          label: "Pending",
          color: colors.text.secondary,
          bg: colors.background.input,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
  },
});
