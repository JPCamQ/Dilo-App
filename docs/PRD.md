# PRD: Dilo App

## 1. Problema

El usuario carece de un sistema centralizado y ágil para gestionar sus finanzas personales y de negocio. El registro manual tradicional (libretas o notas) genera fricción, falta de reportes inmediatos y pérdida de la noción del valor real del dinero debido a la fluctuación cambiaria en Venezuela. **Dilo App elimina esta fricción mediante el registro por voz y la referencia automática a la tasa BCV.**

## 2. Usuarios

### Usuario Principal (Único)

- **Perfil**: Emprendedor/Persona que maneja múltiples cuentas (Bs, USD, Cripto) y necesita control total de su flujo de caja.
- **Situación Actual**: Registro manual en papel o notas del celular, lo cual es lento y propenso a errores u olvidos.

## 3. Flujo del Usuario (La "Joya de la Corona": Registro por Voz)

1. **Apertura y Vista**: El usuario abre la app y ve su Dashboard con saldos totales consolidados en USD (según tasa BCV).
2. **Activación de Voz**: El usuario presiona el botón principal de comando de voz.
3. **Captura de Datos**: El usuario dice: "Gasté 15 dólares en comida desde mi efectivo" o "Ingreso de 500 bolívares en Banesco por venta".
4. **Procesamiento**: El sistema interpreta el monto, la categoría, la cuenta de origen/destino y la moneda.
5. **Confirmación**: La app muestra un resumen rápido del registro para confirmar (o corregir manualmente si es necesario).
6. **Actualización**: El saldo de la cuenta afectada se actualiza y el movimiento se refleja en el historial y reportes.

## 4. Modelo de Datos (v1.0)

### Tasa de Cambio (BCV)
- `valor_bcv`: decimal
- `fecha_actualizacion`: timestamp
- `historico_tasas`: log de variaciones

### Cuentas (Billeteras)
- `nombre_cuenta`: string (ej. Efectivo, Banesco, Binance)
- `tipo_cuenta`: enum (Banco, Cash, Cripto)
- `moneda_base`: enum (VES, USD, BTC, ETH, etc.)
- `saldo_actual`: decimal

### Transacciones
- `monto_original`: decimal
- `moneda_original`: string
- `monto_referencial_usd`: decimal (calculado con tasa BCV del momento)
- `monto_referencial_ves`: decimal
- `categoria_id`: foreign key
- `cuenta_id`: foreign key
- `tipo`: enum (Ingreso, Egreso)
- `nota_voz_raw`: string (texto transcrito)

### Clientes (v2.0 - Preparación)
- `id_contacto_telefono`: string (link a agenda)
- `nombre`: string
- `estado_cuenta`: decimal (balance de deuda)

## 5. Roles & Permisos

**Propietario (Unipersonal)**: Acceso total a todas las funciones, configuración de tasas, borrado de datos y gestión de módulos.

## 6. Centro de Control (Panel Administrativo)

Funciones integradas para análisis profundo:

- **Gestor de Reportes**: Filtros por fecha para exportar movimientos a PDF o Excel.
- **Dashboard Estadístico**: Gráficas de torta (gastos por categoría) y gráficas de línea (evolución del saldo total vs tasa BCV).
- **Editor de Categorías**: Crear, ocultar o cambiar iconos de categorías de gastos/ingresos.
- **Auditoría de Tasas**: Ver el historial de cómo ha variado el dólar BCV y cómo ha afectado el patrimonio del usuario.

## 7. Roadmap de Desarrollo

### MVP (v1.0): Finanzas Personales ✅
- [x] Registro por comandos de voz y manual
- [x] Soporte multimoneda (VES, USD, USDT, USDC)
- [x] Sincronización/Referencia de tasa BCV
- [x] Visualización dual de saldos (Bs/USD)
- [x] Centro de control con reportes básicos
- [x] Exportación a PDF/CSV
- [x] Google Sign-In para backup

### Versión 2.0: Módulo de Negocio
- [ ] Módulo de Créditos: Gestión de deudas de clientes importados desde contactos
- [ ] POS Terminal: Teclado numérico para ventas rápidas con múltiples métodos de pago
- [ ] Recordatorios: Alertas para cobrar deudas pendientes

## 8. Branding

- **Nombre**: Dilo App
- **Tono**: Profesional, directo, inteligente y seguro.
- **Estilo Visual**:
  - Fondo: Dark Mode elegante (Negros profundos/Gris Oxford)
  - Acentos: Verde Esmeralda (Dinero/Acción) y Azul Corporativo (Confianza/Bancos)
  - Interfaz: Limpia (estilo Fintech) con un botón de voz prominente y siempre accesible

## 9. Stack Tecnológico

- **Framework**: React Native 0.81 + Expo 54
- **Navegación**: Expo Router
- **Estado**: Zustand con persistencia AsyncStorage
- **Estilos**: NativeWind (Tailwind CSS)
- **AI**: DeepSeek para parsing de voz
- **Tasa BCV**: API externa https://bcv-api.rafnixg.dev/rates
- **Auth**: Google Sign-In
- **Backup**: Google Drive (planeado)

## 10. API Endpoints Utilizados

| Servicio | Endpoint | Propósito |
|----------|----------|-----------|
| BCV Rate | `https://bcv-api.rafnixg.dev/rates` | Tasa de cambio oficial |
| DeepSeek | `https://api.deepseek.com/v1/chat/completions` | Parsing de voz a transacciones |
