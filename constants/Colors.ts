// Dilo App - Design System Colors
// Basado en branding: Dark Mode elegante con acentos Verde Esmeralda y Azul Corporativo

export const Colors = {
  // Fondos (Dark Mode Premium - Deep Ocean)
  background: {
    primary: '#020412',      // Deepest Blue/Black (Almost Midnight)
    secondary: '#0B1026',    // Rich Dark Blue (Cards) - Replaces Gray
    tertiary: '#151C3B',     // Lighter Blue (Elevated Surfaces)
    card: 'rgba(11, 16, 38, 0.85)', // Glassmorphism with Dark Blue
  },

  // Acentos principales (Executive Blue & Cyan)
  accent: {
    primary: '#0EA5E9',      // Cyan Premium (Acción principal)
    primaryLight: '#7DD3FC',
    primaryDark: '#0284C7',
    emerald: '#10B981',      // Verde para estados (Dinero)
    emeraldLight: '#34D399',
    emeraldDark: '#059669',
  },

  // Estados financieros
  status: {
    income: '#10B981',       // Verde para ingresos (Sutil/Pro)
    expense: '#F43F5E',      // Rosa/Rojo Premium
    warning: '#F59E0B',      // Ámbar
    info: '#0EA5E9',         // Cyan
  },

  // Texto
  text: {
    primary: '#FFFFFF',
    secondary: '#A3A3A3',
    muted: '#737373',
    inverse: '#0D0D0D',
  },

  // Bordes
  border: {
    default: '#334155',      // Slate 700
    light: '#1E293B',        // Slate 800
    focus: '#0EA5E9',
  },

  // Estilos Premium (Tokens para componentes clave)
  premium: {
    actionGradient: ['#0EA5E9', '#0284C7'], // Cyan/Blue Gradient
    actionShadow: 'rgba(14, 165, 233, 0.4)',
    actionGlass: 'rgba(14, 165, 233, 0.1)',
    glassBg: 'rgba(15, 23, 42, 0.75)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    primaryGlow: 'rgba(14, 165, 233, 0.25)',
    spotlight: 'rgba(56, 189, 248, 0.05)',
    borderGlass: 'rgba(255, 255, 255, 0.1)',
  },

  // Gradientes
  gradients: {
    emerald: ['#10B981', '#059669'],
    blue: ['#0EA5E9', '#0284C7'],
    dark: ['#0F172A', '#020617'],
  },
} as const;

// Tipo para autocompletado
export type ColorScheme = typeof Colors;
