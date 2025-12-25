export const COLORS = {
    // Premium Rose Gold Palette (Customer)
    roseGold: '#B76E79', // Base
    roseGoldLight: '#E5B2B9', // Soft
    roseGoldDark: '#8D5159', // Deep
    roseGoldMuted: '#C9A9A6', // Subtle
    roseGoldGradient: ['#E5B2B9', '#B76E79'], // Main Gradient

    // Technician Theme Colors
    technicianPrimary: '#8D5159', // Deep Rose
    technicianAccent: '#C9A9A6',  // Muted Rose
    technicianDark: '#5A3D42',    // Dark Brown
    technicianLight: '#F5E6E8',   // Very light rose
    technicianBg: '#FFF9F9',      // Almost white with rose tint

    // Metallic / Gold accents
    gold: '#D4AF37',
    copper: '#B87333',

    // Support Colors
    navy: '#1A237E',
    white: '#FFFFFF',
    black: '#121212',
    grey: '#757575',
    greyLight: '#F5F5F5',
    greyMedium: '#E0E0E0',

    // Semantic Colors
    success: '#4CAF50',
    earningsGreen: '#4CAF50',
    error: '#F44336',
    warning: '#FFC107',
    warningAmber: '#FFA726',
    info: '#2196F3',

    // Backgrounds
    background: '#FFFFFF',
    card: '#FFFFFF',
    primaryBg: '#FFF5F6', // Very light rose tint
    secondaryBg: '#F8F9FA',
    overlay: 'rgba(0, 0, 0, 0.4)',
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
    header: 60,
};

export const FONTS = {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    heavy: 'System',
};

export const SHADOWS = {
    none: { elevation: 0, shadowOpacity: 0 },
    light: {
        shadowColor: "#B76E79",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    medium: {
        shadowColor: "#B76E79",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    heavy: {
        shadowColor: "#B76E79",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 10,
    }
};

export default {
    COLORS,
    SPACING,
    FONTS,
    SHADOWS,
};
