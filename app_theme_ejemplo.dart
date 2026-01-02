import 'package:flutter/material.dart';

/// Tema de la aplicación POS Venezuela
/// Diseño profesional moderno con paleta elegante (Emerald/Slate)
class AppTheme {
  // ========== PALETA PRINCIPAL (Premium) ==========
  static const Color primary = Color(0xFF10B981);        // Esmeralda Premium
  static const Color primaryDark = Color(0xFF065F46);    // Esmeralda profundo
  static const Color primaryLight = Color(0xFF34D399);   // Esmeralda brillante
  
  // Acentos complementarios
  static const Color accent = Color(0xFF0EA5E9);         // Azul Cyan (Premium)
  static const Color accentLight = Color(0xFF7DD3FC);    // Cyan claro
  
  // ========== COLORES MODO OSCURO (Deep Ocean) ==========
  static const Color darkBg = Color(0xFF020617);         // Fondo casi negro (Slate 950)
  static const Color darkCard = Color(0xFF0F172A);       // Slate 900
  static const Color darkCardAlt = Color(0xFF1E293B);    // Slate 800
  static const Color darkDivider = Color(0xFF334155);    // Slate 700
  static const Color darkSurface = Color(0xFF020617);
  
  // ========== COLORES MODO CLARO ==========
  static const Color lightBg = Color(0xFFF9FAFB);        // Gris muy claro
  static const Color lightCard = Color(0xFFFFFFFF);      // Blanco
  static const Color lightCardAlt = Color(0xFFF3F4F6);   // Gris claro
  static const Color lightDivider = Color(0xFFE5E7EB);   // Gris
  static const Color lightSurface = Color(0xFFFFFFFF);
  
  // ========== COLORES SEMÁNTICOS ==========
  static const Color success = Color(0xFF10B981);        // Verde (Igual a Primary)
  static const Color error = Color(0xFFEF4444);          // Rojo
  static const Color warning = Color(0xFFF59E0B);        // Amarillo
  static const Color info = Color(0xFF3B82F6);           // Azul
  
  // ========== COLORES DE TEXTO ==========
  static const Color textDark = Color(0xFF111827);       // Texto oscuro
  static const Color textLight = Color(0xFFFFFFFF);      // Texto claro
  static const Color textMuted = Color(0xFF6B7280);      // Texto secundario oscuro
  static const Color textMutedLight = Color(0xFF9CA3AF); // Texto secundario claro

  // ========== COLORES NEON (Dashboard/Charts) ==========
  static const Color neonGreen = Color(0xFF10B981);
  static const Color neonPurple = Color(0xFF8B5CF6);
  static const Color neonBlue = Color(0xFF0EA5E9);
  static const Color neonKevin = Color(0xFFFF00FF); // Magenta vibrante
  
  // ========== TEMA OSCURO ==========
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: darkBg,
      primaryColor: primary,
      cardColor: darkCard,
      dividerColor: darkDivider,
      
      colorScheme: const ColorScheme.dark(
        primary: primary,
        secondary: accent,
        surface: darkCard,
        error: error,
        onPrimary: textLight,
        onSecondary: textLight,
        onSurface: textLight,
        onError: textLight,
        // Nuevos roles semánticos Material 3
        surfaceContainer: darkCard,
        surfaceContainerHigh: darkCardAlt,
      ),
      
      appBarTheme: const AppBarTheme(
        backgroundColor: darkBg,
        foregroundColor: textLight,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textLight,
        ),
      ),
      
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: darkCard,
        selectedItemColor: primary,
        unselectedItemColor: textMutedLight,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      
      cardTheme: CardThemeData(
        color: darkCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: darkDivider.withOpacity(0.3)),
        ),
      ),
      
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: textLight,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
      ),
      
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primary,
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),
      
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: primary,
        foregroundColor: textLight,
        elevation: 4,
      ),
      
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: darkCardAlt,
        labelStyle: const TextStyle(color: textMutedLight),
        hintStyle: TextStyle(color: textMutedLight.withOpacity(0.6)),
        prefixIconColor: textMutedLight,
        suffixIconColor: textMutedLight,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: darkDivider.withOpacity(0.3)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      
      dialogTheme: DialogThemeData(
        backgroundColor: darkCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        titleTextStyle: const TextStyle(color: textLight, fontSize: 18, fontWeight: FontWeight.w600),
      ),
      
      snackBarTheme: SnackBarThemeData(
        backgroundColor: darkCardAlt,
        contentTextStyle: const TextStyle(color: textLight),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        behavior: SnackBarBehavior.floating,
      ),
      
      listTileTheme: const ListTileThemeData(
        iconColor: textMutedLight,
        textColor: textLight,
      ),
      
      chipTheme: ChipThemeData(
        backgroundColor: darkCardAlt,
        labelStyle: const TextStyle(color: textLight),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      
      tabBarTheme: const TabBarThemeData(
        labelColor: primary,
        unselectedLabelColor: textMutedLight,
        indicatorColor: primary,
      ),
    );
  }
  
  // ========== TEMA CLARO ==========
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: lightBg,
      primaryColor: primary,
      cardColor: lightCard,
      dividerColor: lightDivider,
      
      colorScheme: const ColorScheme.light(
        primary: primary,
        secondary: accent,
        surface: lightCard,
        error: error,
        onPrimary: textLight,
        onSecondary: textLight,
        onSurface: textDark,
        onError: textLight,
        // Nuevos roles semánticos
        surfaceContainer: lightCard,
        surfaceContainerHigh: lightCardAlt,
      ),
      
      appBarTheme: const AppBarTheme(
        backgroundColor: lightBg,
        foregroundColor: textDark,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textDark,
        ),
      ),
      
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: lightCard,
        selectedItemColor: primary,
        unselectedItemColor: textMuted,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      
      cardTheme: CardThemeData(
        color: lightCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: lightDivider),
        ),
      ),
      
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: textLight,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
      ),
      
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primary,
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),
      
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: primary,
        foregroundColor: textLight,
        elevation: 4,
      ),
      
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: lightCardAlt,
        labelStyle: const TextStyle(color: textMuted),
        hintStyle: TextStyle(color: textMuted.withOpacity(0.6)),
        prefixIconColor: textMuted,
        suffixIconColor: textMuted,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: lightDivider),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      
      dialogTheme: DialogThemeData(
        backgroundColor: lightCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        titleTextStyle: const TextStyle(color: textDark, fontSize: 18, fontWeight: FontWeight.w600),
      ),
      
      snackBarTheme: SnackBarThemeData(
        backgroundColor: textDark,
        contentTextStyle: const TextStyle(color: textLight),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        behavior: SnackBarBehavior.floating,
      ),
      
      listTileTheme: const ListTileThemeData(
        iconColor: textMuted,
        textColor: textDark,
      ),
      
      chipTheme: ChipThemeData(
        backgroundColor: lightCardAlt,
        labelStyle: const TextStyle(color: textDark),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      
      tabBarTheme: const TabBarThemeData(
        labelColor: primary,
        unselectedLabelColor: textMuted,
        indicatorColor: primary,
      ),
    );
  }
  
  // ========== HELPERS DINÁMICOS ==========
  static bool isDark(BuildContext context) => Theme.of(context).brightness == Brightness.dark;
  
  static Color getBackground(BuildContext context) => isDark(context) ? darkBg : lightBg;
  static Color getCardColor(BuildContext context) => isDark(context) ? darkCard : lightCard;
  static Color getCardAltColor(BuildContext context) => isDark(context) ? darkCardAlt : lightCardAlt;
  static Color getTextColor(BuildContext context) => isDark(context) ? textLight : textDark;
  static Color getMutedTextColor(BuildContext context) => isDark(context) ? textMutedLight : textMuted;
  static Color getDividerColor(BuildContext context) => isDark(context) ? darkDivider : lightDivider;
  static Color getSurfaceColor(BuildContext context) => isDark(context) ? darkSurface : lightSurface;
  
  // ========== DECORACIONES PREMIUM (Glassmorphism) ==========
  static BoxDecoration getGlassDecoration(BuildContext context, {double opacity = 0.1, double blur = 10.0}) {
    final isDarkMode = isDark(context);
    return BoxDecoration(
      color: (isDarkMode ? Colors.white : Colors.black).withOpacity(opacity),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(
        color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.1),
        width: 1.5,
      ),
    );
  }
  
  // ========== LEGACY COMPATIBILITY (DEPRECATED) ==========
  @Deprecated('Use darkBg instead')
  static const Color bgPrimary = darkBg;
  @Deprecated('Use darkCard instead')
  static const Color bgSecondary = darkCard;
  @Deprecated('Use primary instead')
  // static const Color neonGreen = primary; // Renamed to actual constant above
  @Deprecated('Use accent instead')
  // static const Color neonPurple = accent; // Renamed to actual constant above
  @Deprecated('Use textLight instead')
  static const Color textPrimary = textLight;
  @Deprecated('Use textMutedLight instead')
  static const Color textSecondary = textMutedLight;
  
  // ========== TOAST / SNACKBAR HELPER ==========
  /// Muestra un mensaje toast profesional y sutil
  /// [type]: 'success', 'error', 'info', 'warning' o null para neutro
  static void showToast(BuildContext context, String message, {String? type}) {
    final isDarkMode = isDark(context);
    
    // Colores sutiles basados en el tipo
    Color bgColor;
    Color textColor = isDarkMode ? textLight : textLight; // Siempre claro en toast oscuro
    IconData? icon;
    
    switch (type) {
      case 'success':
        bgColor = primaryDark; // Verde oscuro elegante
        icon = Icons.check_circle_outline;
        break;
      case 'error':
        bgColor = const Color(0xFF7F1D1D); // Rojo oscuro (Red 900)
        icon = Icons.error_outline;
        break;
      case 'warning':
        bgColor = const Color(0xFF78350F); // Ambar oscuro (Amber 900)
        icon = Icons.warning_amber_outlined;
        break;
      case 'info':
        bgColor = const Color(0xFF1E3A8A); // Azul oscuro (Blue 900)
        icon = Icons.info_outline;
        break;
      default:
        bgColor = isDarkMode ? darkCardAlt : const Color(0xFF1F2937); // Dark Gray
        icon = null;
    }
    
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            if (icon != null) ...[
              Icon(icon, color: Colors.white70, size: 20),
              const SizedBox(width: 12),
            ],
            Expanded(
              child: Text(
                message,
                style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        backgroundColor: bgColor,
        duration: const Duration(milliseconds: 2000),
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 80), // Elevar un poco
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        elevation: 4,
      ),
    );
  }
}

/// Estilos de texto globales estandarizados
class AppTextStyles {
  // H1: Títulos grandes de pantalla
  static const TextStyle h1 = TextStyle(fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: -0.5);
  
  // H2: Subtítulos de sección
  static const TextStyle h2 = TextStyle(fontSize: 20, fontWeight: FontWeight.w600, letterSpacing: -0.5);
  
  // H3: Títulos de tarjetas
  static const TextStyle h3 = TextStyle(fontSize: 16, fontWeight: FontWeight.w600);
  
  // Body: Texto normal
  static const TextStyle body = TextStyle(fontSize: 14, fontWeight: FontWeight.normal);
  
  // Small: Texto secundario / captions
  static const TextStyle small = TextStyle(fontSize: 12, fontWeight: FontWeight.normal);
  
  // Button: Texto de botones
  static const TextStyle button = TextStyle(fontSize: 14, fontWeight: FontWeight.w600, letterSpacing: 0.5);
}