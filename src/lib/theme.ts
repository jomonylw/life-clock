export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
};

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '16px',
  full: '9999px',
};

export const fontFamily = {
  mono: 'monospace', // Start with system default monospace font
};

export const darkTheme = {
  colors: {
    primary: '#E0E0E0', // Light grey for primary text
    secondary: '#A0A0A0', // Darker grey for secondary text
    background: '#000000', // Pure black background
    surface: '#1A1A1A', // A slightly lighter black for surfaces
    accent: '#BE99FF', // A nice purple accent, like in gemini-cli
    success: '#4CAF50', // Green for success states
    warning: '#FFC107', // Yellow for warnings
    error: '#F44336', // Red for errors
    border: '#333333', // Dark grey for borders
  },
  spacing,
  borderRadius,
  fontFamily,
};

export const lightTheme = {
  colors: {
    primary: '#000000',
    secondary: '#4F4F4F',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    accent: '#8A2BE2', // A slightly darker purple for light bg
    success: '#2E7D32',
    warning: '#FFA000',
    error: '#D32F2F',
    border: '#E0E0E0',
  },
  spacing,
  borderRadius,
  fontFamily,
};

export type Theme = typeof darkTheme;

// We are building a CLI-style UI, so dark theme is the default.
export const defaultTheme: Theme = darkTheme;