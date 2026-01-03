# 🎙️ Dilo App

> **Tu asistente financiero por voz para Venezuela**

Una aplicación de finanzas personales con registro por comandos de voz, referencia automática a tasa BCV, y soporte multimoneda.

![React Native](https://img.shields.io/badge/React_Native-0.81-blue)
![Expo](https://img.shields.io/badge/Expo-54-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![License](https://img.shields.io/badge/License-Private-red)

---

## ✨ Características

- 🎤 **Registro por Voz** - Di "Gasté 15 dólares en comida" y la app lo registra automáticamente
- 💱 **Tasa BCV en Tiempo Real** - Conversión automática USD ↔ VES
- 📊 **Dashboard Inteligente** - Visualiza tus finanzas consolidadas
- 🏦 **Multi-cuenta** - Gestiona efectivo, bancos y criptomonedas
- 📱 **Dark Mode Premium** - Diseño elegante estilo fintech
- 📤 **Exportación** - Genera reportes en PDF y CSV
- 🔐 **Backup Seguro** - Sincronización con Google Drive

---

## 🚀 Quick Start

### Prerrequisitos

- Node.js 18+
- npm o yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app (para testing en móvil)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/Dilo-App.git
cd Dilo-App

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tus API keys

# Iniciar en desarrollo
npx expo start --clear
```

### Variables de Entorno

Crea un archivo `.env` con:

```env
EXPO_PUBLIC_DEEPSEEK_API_KEY=tu_api_key_aqui
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=tu_google_client_id
```

---

## 📁 Estructura del Proyecto

```
Dilo_App/
├── app/                    # Rutas (Expo Router)
│   ├── (auth)/            # Pantallas de autenticación
│   ├── (tabs)/            # Tabs principales
│   ├── _layout.tsx        # Layout raíz
│   ├── accounts.tsx       # Gestión de cuentas
│   ├── transactions.tsx   # Historial
│   ├── settings.tsx       # Configuración
│   └── reports.tsx        # Reportes
├── components/            # Componentes UI
│   ├── dashboard/         # Dashboard components
│   ├── voice/             # Voice input components
│   ├── transactions/      # Transaction components
│   └── charts/            # Gráficas
├── services/              # Lógica de negocio
│   ├── aiParser.ts        # Parsing AI con DeepSeek
│   ├── bcv.ts             # API tasa BCV
│   ├── googleAuthService.ts
│   └── exportService.ts
├── stores/                # Estado global (Zustand)
│   └── useAppStore.ts
├── types/                 # TypeScript interfaces
├── constants/             # Configuración y categorías
└── utils/                 # Utilidades
```

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| Framework | React Native 0.81 + Expo 54 |
| Navegación | Expo Router |
| Estado | Zustand + AsyncStorage |
| Estilos | NativeWind (Tailwind CSS) |
| AI | DeepSeek API |
| Auth | Google Sign-In |
| Icons | Lucide React Native |
| Charts | react-native-gifted-charts |

---

## 📱 Comandos de Voz Soportados

```
"Gasté 20 dólares en comida"
"Recibí 1000 bolívares por ventas"
"Pagué 50 dólares de gasolina"
"Me pagaron 100 dólares de salario"
"Transferí 200 bolívares al Banesco"
```

---

## 🔧 Scripts Disponibles

```bash
npm start          # Inicia Expo dev server
npm run android    # Compila para Android
npm run ios        # Compila para iOS
npm run web        # Inicia versión web
npm run lint       # Ejecuta ESLint
npm run test       # Ejecuta tests
```

---

## 📄 Documentación

- [PRD - Product Requirements Document](./docs/PRD.md)

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Licencia

Uso privado - Todos los derechos reservados.

---

## 👨‍💻 Autor

Desarrollado con ❤️ para la comunidad venezolana.
