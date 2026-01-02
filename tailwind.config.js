/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}",
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                // Fondos (Dark Mode Elegante)
                background: {
                    primary: '#0D0D0D',
                    secondary: '#1A1A1A',
                    tertiary: '#262626',
                },
                // Acentos principales
                emerald: {
                    DEFAULT: '#10B981',
                    light: '#34D399',
                    dark: '#059669',
                },
                corporate: {
                    blue: '#3B82F6',
                    blueLight: '#60A5FA',
                },
                // Estados
                income: '#10B981',
                expense: '#EF4444',
                warning: '#F59E0B',
                // Texto
                text: {
                    primary: '#FFFFFF',
                    secondary: '#A3A3A3',
                    muted: '#737373',
                },
                // Bordes
                border: {
                    DEFAULT: '#333333',
                    focus: '#10B981',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
