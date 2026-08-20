const colors = {
  // Primary & Accent Colors
  primary: {
    yellow: "#F3E879", // Soft pastel lemon yellow from buttons, badges, and active tabs
    yellowDark: "#D8C857", // Slightly deeper tone for route lines and icons
    yellowHover: "#E5D863",
  },

  // Dark Theme Backgrounds
  background: {
    app: "#0D0E11", // Main dark background canvas
    card: "#16181C", // Surface card containers
    input: "#1C1E23", // Input fields & inner panels
    bottomNav: "#14171F", // Floating bottom navigation bar
    elevated: "#23262E",
  },

  // Border & Divider Colors
  border: {
    subtle: "#2A2D35", // Subdued borders and dividers
    active: "#F3E879",
  },

  // Typography
  text: {
    primary: "#FFFFFF", // Main headers & title text
    secondary: "#8F94A0", // Secondary sub-labels & dates
    muted: "#5A5F6D", // Muted/placeholder text
    inverse: "#0D0E11", // Dark text rendered inside the yellow pills/buttons
  },

  // Status & Utility Colors
  status: {
    success: "#4CD964",
    warning: "#FF9500",
    danger: "#FF3B30",
    info: "#F3E879",
    inactive: "#3A3D46",
    online: "#4CD964",
    offline: "#5A5F6D",
  },
};

export const typography = {
  fontFamily: {
    regular: "Poppins_400Regular",
    medium: "Poppins_500Medium",
    semiBold: "Poppins_600SemiBold",
    bold: "Poppins_700Bold",
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
  },
};

export default colors;
