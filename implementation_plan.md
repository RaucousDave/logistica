# Implementation Plan - Logistica Expo React Native App Refactoring & Architecture

This document presents the detailed blueprint and phased implementation plan for standardizing, modularizing, and elevating the **Logistica** mobile app to a production-grade, Android-first Expo React Native application.

---

## 🏗 System Architecture & Folder Restructuring Plan

To adhere to modern React Native / Expo Router best practices and maintain clean separation of concerns, the existing folder structure will be reorganized as follows:

```
logistica-app-revised/
├── app/                      # Expo Router File-based Navigation
│   ├── (auth)/               # Authentication route group
│   │   ├── _layout.tsx
│   │   ├── client-auth.tsx
│   │   └── driver-auth.tsx
│   ├── (client)/             # Customer / Sender route group
│   │   ├── _layout.tsx
│   │   ├── dashboard.tsx
│   │   ├── create-order.tsx
│   │   └── active-delivery.tsx
│   ├── (driver)/             # Driver / Courier route group
│   │   ├── _layout.tsx
│   │   ├── dashboard.tsx
│   │   └── active-job.tsx
│   ├── _layout.tsx           # Main Root Layout (Font loading, ThemeProvider, Auth Guard)
│   ├── index.tsx             # Entry redirect logic based on state
│   └── onboarding.tsx        # Role selection screen
├── assets/
│   ├── fonts/                # Custom Font files (Poppins TTF/OTF)
│   └── styles/
│       ├── theme.ts          # Centralized Design Tokens (Colors, Typography, Spacing)
│       └── globals.ts        # Global utility styles
├── components/               # Reusable Modular UI Components
│   ├── common/               # Shared general components
│   │   ├── CustomButton.tsx
│   │   ├── CustomInput.tsx
│   │   ├── Header.tsx
│   │   ├── StatusBadge.tsx
│   │   └── Icon.tsx / VectorIcon helpers
│   ├── client/               # Client-specific UI components
│   │   ├── AddressSelector.tsx
│   │   └── OrderSummaryCard.tsx
│   ├── driver/               # Driver-specific UI components
│   │   ├── JobRequestCard.tsx
│   │   └── VehicleSelector.tsx
│   └── screens/              # Screen View Components
│       ├── OnboardingScreen.tsx
│       ├── ClientAuthScreen.tsx
│       ├── DriverAuthScreen.tsx
│       ├── CustomerDashboardScreen.tsx
│       ├── DriverDashboardScreen.tsx
│       ├── CreateOrderScreen.tsx
│       └── ActiveDeliveryScreen.tsx
├── constants/                # App-wide Static Constants & Configuration
│   ├── strings.ts            # Dynamic localization & app string catalog
│   ├── config.ts             # App configurations & map defaults
│   └── mockData.ts           # Mock deliveries, drivers, and user profiles
├── hooks/                    # Custom React Hooks
│   ├── useAppTheme.ts
│   └── useNavigationGuard.ts
├── stores/                   # Zustand Global State Management
│   ├── useAuthStore.ts       # Authentication, User Session & Role management
│   ├── useOrderStore.ts      # Active orders, creation draft, history
│   └── useAppStore.ts        # Global app settings, active status
└── types/                    # TypeScript interfaces & types
    ├── auth.ts
    ├── order.ts
    └── theme.ts
```

---

## 🎨 Design System, Custom Typography & Theme Integration

1. **Custom Font Integration (Poppins)**:
   - Configure `@expo-google-fonts/poppins` in `app/_layout.tsx` using `useFonts`.
   - Prevent layout shift by keeping `SplashScreen.preventAutoHideAsync()` active until Poppins fonts are loaded.
   - Update `assets/styles/theme.ts` to include typography definitions (`fontFamily: { regular: 'Poppins_400Regular', medium: 'Poppins_500Medium', semiBold: 'Poppins_600SemiBold', bold: 'Poppins_700Bold' }`).

2. **Full Dynamic Theme Usage**:
   - Ensure all screen styles directly consume colors, typography, border radius, and spacing tokens from `assets/styles/theme.ts`.

3. **Replacing Emojis with Vector Icons**:
   - Eliminate raw emoji characters (e.g. 📦, 🚚, ⚡, ⭐, 📍, 📞, 💬, 👤) across screens.
   - Replace them with `@expo/vector-icons` (`Ionicons`, `Feather`, `MaterialCommunityIcons`) matching Android Material & modern dark mode aesthetics.

4. **Elimination of Hardcoded Values**:
   - Move strings, fixed vehicle options, delivery statuses, step labels, and default mock values into dynamic constants/Zustand state files.

---

## 🔄 Reusable Components & Modularization Strategy

1. **`CustomButton`**: Standard primary, secondary, and disabled buttons with loading indicators, proper press opacity, and Poppins font typography.
2. **`CustomInput`**: Form field wrapper with icon support, focus borders, label, and error state handling.
3. **`Header`**: Top bar supporting title, back navigation button, sub-title, and status indicators.
4. **`StatusBadge`**: Dynamic badge for order status ("In Transit", "Delivered", "Searching for Driver").
5. **`VehicleSelector`**: Radio card component for driver onboarding vehicle selection.
6. **`OrderSummaryCard`**: Shared package and order details summary container.

---

## 🚀 Step-by-Step Implementation Phases

### **Phase 1: Project Setup, Reorganization & Core Architecture**
- Restructure project directory into `types/`, `constants/`, `hooks/`, `components/common/`, `components/client/`, `components/driver/`, and clean up `app/` routes.
- Load `@expo-google-fonts/poppins` in root layout (`app/_layout.tsx`).
- Refactor `assets/styles/theme.ts` with font families and complete color palettes.
- Create central `constants/strings.ts` and `constants/mockData.ts`.

### **Phase 2: Common UI Component Library & Emoji Replacement**
- Build modular atomic components: `CustomButton`, `CustomInput`, `Header`, `StatusBadge`, `VehicleSelector`.
- Replace all raw emojis in onboarding and auth components with `@expo/vector-icons` (`Ionicons`, `Feather`, `MaterialCommunityIcons`).

### **Phase 3: Role-Based Onboarding & Auth Flow**
- Refactor `stores/AuthStore.tsx` to handle unified role switching (`customer` vs `driver`), persistent profile state, and driver registration steps.
- Connect `OnboardingScreen` to route dynamically to client or driver auth screens.
- Refactor `ClientAuthScreen` and `DriverAuthScreen` using common components, validation, and Zustand state.

### **Phase 4: Customer Flow Screens (Dashboard, Create Order, Active Delivery)**
- Link `app/(client)/create-order.tsx` and `app/(client)/active-delivery.tsx` to their component views.
- Refactor `CustomerDashboardScreen`: replace mock cards with Zustand state / constants, add action handlers for creating delivery and viewing active delivery.
- Refactor `CreateOrderScreen`: dynamic package type selection, address input validation, vehicle type choice, step indicator.
- Refactor `ActiveDeliveryScreen`: interactive driver tracking status, driver call/message buttons, live status steps, order details card.

### **Phase 5: Driver Flow Screens & Final Integration Verification**
- Create Driver routes (`app/(driver)/dashboard.tsx`, `app/(driver)/active-job.tsx`).
- Implement `DriverDashboardScreen`: online/offline toggle, active delivery requests modal/card, earnings overview.
- Perform end-to-end user navigation tests for both **Customer** and **Driver** roles.
- Run typecheck (`tsc`) and Expo linting.

---

## 🔔 Phase Completion Notifications

At the completion of each phase, a progress report will be delivered detailing the completed changes and next steps.
