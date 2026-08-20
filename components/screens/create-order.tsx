import React, { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useOrderStore } from "@/stores/OrderStore";
import { VehicleType } from "@/types/auth";
import { PackageCategory } from "@/types/order";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import colors, { typography } from "@/assets/styles/theme";
import { APP_STRINGS } from "@/constants/strings";
import { Header } from "@/components/common/Header";
import { CustomInput } from "@/components/common/CustomInput";
import { CustomButton } from "@/components/common/CustomButton";
import { VehicleSelector } from "@/components/driver/VehicleSelector";

const CATEGORIES: { id: PackageCategory; title: string; icon: string }[] = [
  { id: "document", title: "Documents", icon: "file-text" },
  { id: "small_box", title: "Small Box", icon: "package" },
  { id: "medium_box", title: "Medium Box", icon: "box" },
  { id: "heavy_cargo", title: "Heavy Cargo", icon: "archive" },
];

export const CreateOrderScreen = () => {
  const router = useRouter();
  const { createOrder } = useOrderStore();

  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState<PackageCategory>("small_box");
  const [vehicle, setVehicle] = useState<VehicleType>("motorcycle");

  const handleConfirm = () => {
    createOrder({
      pickupLocation: { latitude: 37.7749, longitude: -122.4194, address: pickup || "742 Evergreen Terrace" },
      dropoffLocation: { latitude: 37.7833, longitude: -122.4167, address: dropoff || "100 Pine Street" },
      packageDetails: { category, title: itemName || "General Parcel" },
      vehicleType: vehicle,
      estimatedPrice: vehicle === "motorcycle" ? 15 : vehicle === "car" ? 25 : 45,
    });
    router.replace("/(client)/active-delivery" as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={APP_STRINGS.createOrder.screenTitle}
        showBack
        onBackPress={() => router.back()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Section 1: Address Details */}
          <Text style={styles.sectionHeader}>
            {APP_STRINGS.createOrder.step1Title}
          </Text>

          <CustomInput
            label={APP_STRINGS.createOrder.pickupLabel}
            placeholder={APP_STRINGS.createOrder.pickupPlaceholder}
            value={pickup}
            onChangeText={setPickup}
            leftIcon={
              <Ionicons
                name="ellipse"
                size={16}
                color={colors.primary.yellow}
              />
            }
          />

          <CustomInput
            label={APP_STRINGS.createOrder.dropoffLabel}
            placeholder={APP_STRINGS.createOrder.dropoffPlaceholder}
            value={dropoff}
            onChangeText={setDropoff}
            leftIcon={
              <Ionicons
                name="location"
                size={18}
                color={colors.status.success}
              />
            }
          />

          {/* Section 2: Package Info */}
          <Text style={styles.sectionHeader}>
            {APP_STRINGS.createOrder.step2Title}
          </Text>

          <CustomInput
            label={APP_STRINGS.createOrder.packageNameLabel}
            placeholder={APP_STRINGS.createOrder.packageNamePlaceholder}
            value={itemName}
            onChangeText={setItemName}
            leftIcon={
              <Feather
                name="gift"
                size={18}
                color={colors.text.secondary}
              />
            }
          />

          <Text style={styles.inputLabel}>
            {APP_STRINGS.createOrder.categoryLabel}
          </Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    isSelected && styles.categorySelected,
                  ]}
                  onPress={() => setCategory(cat.id)}
                  activeOpacity={0.85}
                >
                  <Feather
                    name={cat.icon as any}
                    size={20}
                    color={
                      isSelected
                        ? colors.text.inverse
                        : colors.primary.yellow
                    }
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      isSelected && styles.categoryTextSelected,
                    ]}
                  >
                    {cat.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Section 3: Required Vehicle */}
          <VehicleSelector selectedVehicle={vehicle} onSelect={setVehicle} />

          {/* Price Summary & Confirm */}
          <View style={styles.priceSummary}>
            <Text style={styles.priceLabel}>Estimated Price</Text>
            <Text style={styles.priceValue}>
              ${vehicle === "motorcycle" ? "15.00" : vehicle === "car" ? "25.00" : "45.00"}
            </Text>
          </View>

          <CustomButton
            title={APP_STRINGS.createOrder.confirmOrderBtn}
            onPress={handleConfirm}
            style={{ marginTop: 8 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  sectionHeader: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    marginBottom: 12,
    marginTop: 8,
  },
  inputLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  categorySelected: {
    backgroundColor: colors.primary.yellow,
    borderColor: colors.primary.yellow,
  },
  categoryText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
  },
  categoryTextSelected: {
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.bold,
  },
  priceSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.background.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginVertical: 16,
  },
  priceLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  priceValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.primary.yellow,
  },
});
