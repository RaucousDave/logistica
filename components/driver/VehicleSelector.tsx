import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { VehicleType } from "@/types/auth";
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import colors, { typography } from "@/assets/styles/theme";

interface VehicleOption {
  id: VehicleType;
  title: string;
  desc: string;
  iconName: string;
}

const VEHICLES: VehicleOption[] = [
  {
    id: "motorcycle",
    title: "Motorcycle",
    desc: "Best for quick, small package delivery",
    iconName: "motorbike",
  },
  {
    id: "car",
    title: "Car / Sedan",
    desc: "Ideal for medium boxes and fragile items",
    iconName: "car-side",
  },
  {
    id: "van",
    title: "Delivery Van",
    desc: "Perfect for heavy cargo or large shipments",
    iconName: "truck-cargo-container",
  },
];

interface VehicleSelectorProps {
  selectedVehicle: VehicleType;
  onSelect: (vehicle: VehicleType) => void;
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  selectedVehicle,
  onSelect,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Select Vehicle Type</Text>
      <View style={styles.list}>
        {VEHICLES.map((vehicle) => {
          const isSelected = selectedVehicle === vehicle.id;
          return (
            <TouchableOpacity
              key={vehicle.id}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => onSelect(vehicle.id)}
              activeOpacity={0.85}
            >
              <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                <MaterialCommunityIcons
                  name={vehicle.iconName as any}
                  size={26}
                  color={isSelected ? colors.text.inverse : colors.primary.yellow}
                />
              </View>

              <View style={styles.details}>
                <Text style={styles.title}>{vehicle.title}</Text>
                <Text style={styles.desc}>{vehicle.desc}</Text>
              </View>

              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && (
                  <Ionicons name="checkmark" size={14} color={colors.text.inverse} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 10,
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
  },
  cardSelected: {
    borderColor: colors.primary.yellow,
    backgroundColor: "#1E2024",
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.background.input,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconBoxSelected: {
    backgroundColor: colors.primary.yellow,
  },
  details: {
    flex: 1,
  },
  title: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    marginBottom: 2,
  },
  desc: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.text.muted,
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    backgroundColor: colors.primary.yellow,
    borderColor: colors.primary.yellow,
  },
});
