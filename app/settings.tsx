// Dilo App - Settings Screen (Native Google Auth)
import { Colors } from '@/constants/Colors';
import { fetchBcvRate } from '@/services/bcv';
import { downloadBackup, getCurrentUser, isGoogleSignInAvailable, signIn, signOut, uploadBackup } from '@/services/googleAuthService';
import * as BackupService from '@/services/localBackupService';
import { getOpenRouterApiKey, setOpenRouterApiKey } from '@/services/openRouterService';
import { useAppStore } from '@/stores/useAppStore';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import { ArrowLeft, Check, Cloud, CloudOff, DollarSign, Download, Edit3, Fingerprint, LogOut, Mic, RefreshCw, Shield, User, Wifi, WifiOff, Zap } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const {
        currentBcvRate,
        manualBcvRate,
        useManualRate,
        lastBcvUpdate,
        setBcvRate,
        setManualBcvRate,
        setUseManualRate,
        getEffectiveBcvRate,
        biometricEnabled,
        setBiometricEnabled,
        googleUser,
        setGoogleUser,
        cloudSyncEnabled,
        setCloudSyncEnabled,
        lastCloudBackup,
        setLastCloudBackup,
        setLocked,
        transactions,
        accounts,
        categories,
        resetStore
    } = useAppStore();

    const [rateInput, setRateInput] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricType, setBiometricType] = useState('Biometría');
    const [googleSupported, setGoogleSupported] = useState(true);

    // OpenRouter AI state
    const [aiApiKey, setAiApiKey] = useState('');
    const [aiConfigured, setAiConfigured] = useState(false);
    const [savingAiKey, setSavingAiKey] = useState(false);

    // Initialize input with manual rate if available
    useEffect(() => {
        if (manualBcvRate > 0) {
            setRateInput(manualBcvRate.toString());
        } else if (currentBcvRate > 0) {
            setRateInput(currentBcvRate.toString());
        }
    }, []);

    // Check biometric availability
    useEffect(() => {
        const checkBiometric = async () => {
            try {
                const compatible = await LocalAuthentication.hasHardwareAsync();
                const enrolled = await LocalAuthentication.isEnrolledAsync();
                setBiometricAvailable(compatible && enrolled);

                if (compatible && enrolled) {
                    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
                    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
                        setBiometricType('Face ID');
                    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
                        setBiometricType('Huella digital');
                    }
                }
            } catch (error) {
                console.log('Error checking biometric:', error);
            }
        };
        checkBiometric();
    }, []);

    // Load OpenRouter API key on mount
    useEffect(() => {
        const loadAiKey = async () => {
            const key = await getOpenRouterApiKey();
            if (key) {
                setAiApiKey(key.substring(0, 20) + '...' + key.substring(key.length - 8));
                setAiConfigured(true);
            }
        };
        loadAiKey();
    }, []);

    const handleSaveAiKey = async () => {
        if (!aiApiKey || aiApiKey.length < 10) {
            Alert.alert('Error', 'Ingresa una API key válida');
            return;
        }
        setSavingAiKey(true);
        try {
            await setOpenRouterApiKey(aiApiKey);
            setAiConfigured(true);
            Alert.alert('✓ Guardado', 'OpenRouter AI configurado correctamente');
        } catch (error) {
            Alert.alert('Error', 'No se pudo guardar la API key');
        }
        setSavingAiKey(false);
    };

    const handleToggleBiometric = async (value: boolean) => {
        if (value && !biometricAvailable) {
            Alert.alert('No disponible', 'Tu dispositivo no tiene biometría configurada.');
            return;
        }

        if (value) {
            // Test authentication before enabling
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Verificar identidad para activar',
                fallbackLabel: 'Usar PIN',
            });

            if (result.success) {
                setBiometricEnabled(true);
                Alert.alert('✓ Activado', `${biometricType} activado para desbloquear la app.`);
            } else {
                Alert.alert('Error', 'No se pudo verificar tu identidad.');
            }
        } else {
            // Turn off without authentication (security preference)
            setBiometricEnabled(false);
            setLocked(false);
            Alert.alert('✓ Desactivado', 'El bloqueo por huella ha sido desactivado.');
        }
    };

    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [supabaseUser, setSupabaseUser] = useState<any>(null);

    // Check auth state on mount using native Google auth
    useEffect(() => {
        // IMPORTANT: Configure Google Sign-In before any auth operations
        configureGoogleSignIn();

        const checkAuth = async () => {
            const user = await getCurrentUser();
            if (user) {
                setSupabaseUser(user); // Reusing state variable name
                setGoogleUser({
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        photo: user.photo,
                        familyName: null,
                        givenName: null
                    }
                } as any);
            }
            setGoogleSupported(isGoogleSignInAvailable());
        };
        checkAuth();
    }, []);

    const handleGoogleLogin = async () => {
        const result = await signIn();
        if (result.success && result.user) {
            setSupabaseUser(result.user);
            setGoogleUser({
                user: {
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                    photo: result.user.photo,
                    familyName: null,
                    givenName: null
                }
            } as any);
            Alert.alert('✓ Sesión Iniciada', 'Bienvenido, ' + result.user.name);
        } else {
            Alert.alert('Error', result.error || 'No se pudo iniciar sesión');
        }
    };

    const handleGoogleLogout = async () => {
        Alert.alert(
            "Cerrar Sesión",
            "¿Estás seguro de que quieres cerrar sesión?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Cerrar Sesión",
                    onPress: async () => {
                        const result = await signOut();
                        if (result.success) {
                            setSupabaseUser(null);
                            setGoogleUser(null);
                            setCloudSyncEnabled(false);
                            Alert.alert('✓', 'Sesión cerrada');
                        }
                    }
                }
            ]
        );
    };

    const handleManualBackup = async () => {
        setIsBackingUp(true);
        const result = await uploadBackup({ transactions, accounts, categories });
        if (result.success) {
            setLastCloudBackup(new Date().toISOString());
            Alert.alert('✓ Éxito', 'Respaldo guardado en Google Drive');
        } else {
            Alert.alert('Error', result.error || 'No se pudo guardar el respaldo');
        }
        setIsBackingUp(false);
    };

    const handleRestore = async () => {
        Alert.alert(
            "Restaurar Datos",
            "¿Desde dónde quieres restaurar?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Google Drive",
                    onPress: async () => {
                        setIsRestoring(true);
                        const result = await downloadBackup();
                        if (result.success && result.data?.data) {
                            const { setAccounts, setTransactions, setCategories } = useAppStore.getState();
                            if (result.data.data.accounts) setAccounts(result.data.data.accounts);
                            if (result.data.data.transactions) setTransactions(result.data.data.transactions);
                            if (result.data.data.categories) setCategories(result.data.data.categories);
                            Alert.alert('✓ Restaurado', 'Datos restaurados desde Google Drive');
                        } else {
                            Alert.alert('Error', result.error || 'No se encontró respaldo');
                        }
                        setIsRestoring(false);
                    }
                },
                {
                    text: "Archivo Local",
                    onPress: async () => {
                        setIsRestoring(true);
                        const result = await BackupService.importBackup();
                        if (result.success) {
                            Alert.alert('✓ Restaurado', result.message);
                        } else {
                            Alert.alert('Error', result.message);
                        }
                        setIsRestoring(false);
                    }
                }
            ]
        );
    };

    const effectiveRate = getEffectiveBcvRate();

    const handleRefreshBcv = async () => {
        if (useManualRate) {
            Alert.alert('Modo manual activo', 'Desactiva el modo manual para actualizar desde la API');
            return;
        }

        setIsRefreshing(true);
        try {
            const rate = await fetchBcvRate();
            setBcvRate(rate);
            setRateInput(rate.toFixed(2));
            Alert.alert('✓ Actualizado', `Tasa BCV: Bs. ${rate.toFixed(2)}`);
        } catch (error) {
            Alert.alert('Error de conexión', 'No se pudo obtener la tasa BCV.\n\nActiva el modo manual e ingresa la tasa.');
        }
        setIsRefreshing(false);
    };

    const handleToggleManual = (value: boolean) => {
        setUseManualRate(value);
        if (value && (!rateInput || parseFloat(rateInput) <= 0)) {
            Alert.alert('Ingresa la tasa', 'Escribe la tasa BCV actual y presiona Guardar');
        }
    };

    const handleSaveManualRate = () => {
        const rate = parseFloat(rateInput);
        if (isNaN(rate) || rate <= 0) {
            Alert.alert('Tasa inválida', 'Ingresa un valor mayor a cero');
            return;
        }
        setManualBcvRate(rate);
        setUseManualRate(true);
        Alert.alert('✓ Tasa guardada', `Tasa manual: Bs. ${rate.toFixed(2)}\n\nEsta tasa se usará para todos los cálculos.`);
    };

    // Local Backup Handlers
    const handleLocalExport = async () => {
        console.log('Starting local export...');
        const result = await BackupService.exportBackup();
        if (result.success) {
            Alert.alert('✓ Éxito', result.message);
        } else {
            Alert.alert('Error', result.message);
        }
    };

    const handleLocalImport = async () => {
        Alert.alert(
            "Importar Respaldo Local",
            "Esto reemplazará todos tus datos actuales con los del archivo. ¿Deseas continuar?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Importar",
                    onPress: async () => {
                        console.log('Starting local import...');
                        const result = await BackupService.importBackup();
                        if (result.success) {
                            Alert.alert('✓ Éxito', result.message);
                        } else {
                            Alert.alert('Error', result.message);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background.primary} />

            {/* Header with Back Arrow */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Configuración</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* BCV Rate Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <DollarSign size={20} color={Colors.accent.primary} />
                            <Text style={styles.sectionTitle}>Tasa BCV</Text>
                        </View>

                        {/* Current Rate Display */}
                        <View style={[styles.rateCard, useManualRate && styles.rateCardManual]}>
                            <View style={styles.rateInfo}>
                                <Text style={styles.rateLabel}>
                                    {useManualRate ? 'TASA MANUAL' : 'TASA AUTOMÁTICA'}
                                </Text>
                                <Text style={styles.rateValue}>Bs. {effectiveRate.toFixed(2)}</Text>
                                {lastBcvUpdate && (
                                    <Text style={styles.rateDate}>
                                        Actualizado: {new Date(lastBcvUpdate).toLocaleString('es-VE')}
                                    </Text>
                                )}
                            </View>
                            {!useManualRate && (
                                <TouchableOpacity
                                    style={[styles.refreshButton, isRefreshing && styles.refreshButtonDisabled]}
                                    onPress={handleRefreshBcv}
                                    disabled={isRefreshing}
                                >
                                    <RefreshCw size={20} color="#FFF" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Manual Rate Toggle */}
                        <View style={styles.toggleRow}>
                            <View style={styles.toggleInfo}>
                                {useManualRate ? (
                                    <WifiOff size={18} color={Colors.status.expense} />
                                ) : (
                                    <Wifi size={18} color={Colors.accent.primary} />
                                )}
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.toggleLabel}>Usar tasa manual</Text>
                                    <Text style={styles.toggleHint}>
                                        {useManualRate
                                            ? 'La tasa no se actualiza automáticamente'
                                            : 'La app intenta obtener la tasa de internet'
                                        }
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={useManualRate}
                                onValueChange={handleToggleManual}
                                trackColor={{ false: Colors.border.default, true: Colors.accent.primary }}
                                thumbColor="#FFF"
                            />
                        </View>

                        {/* Manual Rate Input - Always visible */}
                        <View style={[styles.manualRateBox, useManualRate && styles.manualRateBoxActive]}>
                            <View style={styles.inputTitleRow}>
                                <Edit3 size={16} color={Colors.text.secondary} />
                                <Text style={styles.inputLabel}>
                                    {useManualRate ? 'Ingresa la tasa BCV' : 'O ingresa manualmente:'}
                                </Text>
                            </View>
                            <View style={styles.inputRow}>
                                <Text style={styles.inputPrefix}>Bs.</Text>
                                <TextInput
                                    style={styles.rateInput}
                                    value={rateInput}
                                    onChangeText={setRateInput}
                                    keyboardType="decimal-pad"
                                    placeholder="295.00"
                                    placeholderTextColor={Colors.text.muted}
                                />
                            </View>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveManualRate}>
                                <Text style={styles.saveButtonText}>Guardar y Usar Esta Tasa</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Security Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Shield size={20} color={Colors.accent.primary} />
                            <Text style={styles.sectionTitle}>Seguridad</Text>
                        </View>

                        <View style={styles.toggleRow}>
                            <View style={styles.toggleInfo}>
                                <Fingerprint size={18} color={biometricEnabled ? Colors.accent.primary : Colors.text.muted} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.toggleLabel}>Bloqueo con {biometricType}</Text>
                                    <Text style={styles.toggleHint}>
                                        {biometricAvailable
                                            ? (biometricEnabled ? 'Se solicitará al abrir la app' : 'Protege tu información financiera')
                                            : 'No disponible en este dispositivo'}
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={biometricEnabled}
                                onValueChange={handleToggleBiometric}
                                trackColor={{ false: Colors.border.default, true: Colors.accent.primary }}
                                thumbColor="#FFF"
                                disabled={!biometricAvailable}
                            />
                        </View>
                    </View>

                    {/* AI Voice Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Zap size={20} color={Colors.accent.primary} />
                            <Text style={styles.sectionTitle}>Voz con IA</Text>
                            {aiConfigured && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                                    <Check size={14} color={Colors.accent.emerald} />
                                    <Text style={{ color: Colors.accent.emerald, fontSize: 12, marginLeft: 4 }}>Activo</Text>
                                </View>
                            )}
                        </View>

                        <Text style={styles.toggleHint}>
                            Usa modelos de IA avanzados (DeepSeek, Llama, Gemini) para entender mejor tus comandos de voz.
                        </Text>

                        <View style={[styles.manualRateBox, { marginTop: 12 }]}>
                            <View style={styles.inputTitleRow}>
                                <Zap size={16} color={Colors.text.secondary} />
                                <Text style={styles.inputLabel}>OpenRouter API Key</Text>
                            </View>
                            <TextInput
                                style={styles.rateInput}
                                placeholder="sk-or-v1-..."
                                placeholderTextColor={Colors.text.muted}
                                value={aiApiKey}
                                onChangeText={setAiApiKey}
                                autoCapitalize="none"
                                autoCorrect={false}
                                secureTextEntry={aiConfigured}
                            />
                            <TouchableOpacity
                                style={[styles.saveButton, savingAiKey && styles.saveButtonDisabled]}
                                onPress={handleSaveAiKey}
                                disabled={savingAiKey}
                            >
                                <Text style={styles.saveButtonText}>
                                    {savingAiKey ? 'Guardando...' : (aiConfigured ? 'Actualizar' : 'Guardar')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.toggleHint, { marginTop: 8 }]}>
                            Obtén tu key gratis en openrouter.ai
                        </Text>
                    </View>

                    {/* Voice Keywords Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Mic size={20} color={Colors.accent.primary} />
                            <Text style={styles.sectionTitle}>Palabras Clave de Voz</Text>
                        </View>

                        <Text style={styles.keywordsHint}>
                            Estas palabras detectan automáticamente la cuenta cuando usas comandos de voz.
                            Ejemplo: "35 de Banesco" → detecta cuenta Banesco
                        </Text>

                        <TouchableOpacity
                            style={styles.manageKeywordsBtn}
                            onPress={() => router.push('/voice-keywords')}
                        >
                            <Text style={styles.manageKeywordsBtnText}>Editar Palabras Clave →</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Cloud Backup Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Cloud size={20} color={googleSupported ? Colors.accent.primary : Colors.text.muted} />
                            <Text style={styles.sectionTitle}>Respaldo en la Nube</Text>
                        </View>

                        {!googleSupported ? (
                            <View style={styles.unsupportedCard}>
                                <CloudOff size={32} color={Colors.status.expense} style={{ marginBottom: 12 }} />
                                <Text style={styles.unsupportedTitle}>Módulo no disponible</Text>
                                <Text style={styles.unsupportedText}>
                                    Esta función requiere el instalador (.apk) oficial. En Expo Go no está disponible.
                                </Text>
                            </View>
                        ) : googleUser ? (
                            <View style={styles.cloudIdentityCard}>
                                <View style={styles.userInfoRow}>
                                    {googleUser.user.photo ? (
                                        <Image source={{ uri: googleUser.user.photo }} style={styles.userPhoto} />
                                    ) : (
                                        <View style={styles.userPhotoPlaceholder}>
                                            <User size={24} color={Colors.text.muted} />
                                        </View>
                                    )}
                                    <View style={styles.userDetails}>
                                        <Text style={styles.userName}>{googleUser.user.name}</Text>
                                        <Text style={styles.userEmail}>{googleUser.user.email}</Text>
                                    </View>
                                    <TouchableOpacity onPress={handleGoogleLogout} style={styles.logoutBtn}>
                                        <LogOut size={18} color={Colors.status.expense} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.cloudStats}>
                                    <View style={styles.cloudStatItem}>
                                        <Text style={styles.cloudStatLabel}>Último respaldo</Text>
                                        <Text style={styles.cloudStatValue}>
                                            {lastCloudBackup ? new Date(lastCloudBackup).toLocaleString('es-VE') : 'Nunca'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.cloudActions}>
                                    <TouchableOpacity
                                        style={[styles.cloudActionBtn, isBackingUp && styles.btnDisabled]}
                                        onPress={handleManualBackup}
                                        disabled={isBackingUp}
                                    >
                                        {isBackingUp ? (
                                            <ActivityIndicator size="small" color="#FFF" />
                                        ) : (
                                            <>
                                                <RefreshCw size={16} color="#FFF" />
                                                <Text style={styles.cloudActionText}>Respaldar</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.cloudActionBtn, styles.restoreBtn, isRestoring && styles.btnDisabled]}
                                        onPress={handleRestore}
                                        disabled={isRestoring}
                                    >
                                        {isRestoring ? (
                                            <ActivityIndicator size="small" color="#FFF" />
                                        ) : (
                                            <>
                                                <Download size={16} color="#FFF" />
                                                <Text style={styles.cloudActionText}>Restaurar</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.autoSyncRow}>
                                    <View style={styles.toggleInfo}>
                                        <RefreshCw size={18} color={cloudSyncEnabled ? Colors.accent.primary : Colors.text.muted} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.toggleLabel}>Sincronización Automática</Text>
                                            <Text style={styles.toggleHint}>Actualiza la nube con cada cambio</Text>
                                        </View>
                                    </View>
                                    <Switch
                                        value={cloudSyncEnabled}
                                        onValueChange={setCloudSyncEnabled}
                                        trackColor={{ false: Colors.border.default, true: Colors.accent.primary }}
                                        thumbColor="#FFF"
                                    />
                                </View>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.googleLoginBtn} onPress={handleGoogleLogin}>
                                <Image
                                    source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' }}
                                    style={styles.googleIcon}
                                />
                                <Text style={styles.googleLoginText}>Vincular Cuenta de Google</Text>
                            </TouchableOpacity>
                        )}

                        {!googleUser && (
                            <Text style={styles.cloudIntro}>
                                Vincula tu cuenta de Google para guardar tus datos automáticamente y restaurarlos en cualquier dispositivo.
                            </Text>
                        )}
                    </View>

                    {/* Local Backup Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Download size={20} color={Colors.accent.primary} />
                            <Text style={styles.sectionTitle}>Respaldo Local</Text>
                        </View>

                        <Text style={styles.localBackupHint}>
                            Exporta tus datos a un archivo JSON que puedes guardar en tu dispositivo o compartir.
                        </Text>

                        <View style={styles.localBackupActions}>
                            <TouchableOpacity
                                style={[styles.localBackupBtn, styles.exportBtn]}
                                onPress={handleLocalExport}
                            >
                                <Download size={18} color="#FFF" />
                                <Text style={styles.localBackupBtnText}>Exportar Datos</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.localBackupBtn, styles.importBtn]}
                                onPress={handleLocalImport}
                            >
                                <Download size={18} color="#FFF" style={{ transform: [{ rotate: '180deg' }] }} />
                                <Text style={styles.localBackupBtnText}>Importar Datos</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Info */}
                    <View style={styles.infoCard}>
                        <Text style={styles.infoTitle}>💡 ¿Cuándo usar tasa manual?</Text>
                        <Text style={styles.infoText}>
                            • Si no tienes conexión a internet{'\n'}
                            • Si la tasa automática no se actualiza{'\n'}
                            • Si quieres usar una tasa específica{'\n\n'}
                            La tasa manual se guarda y no se pierde aunque cierres la app.
                        </Text>
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>


        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background.primary },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backBtn: { padding: 8 },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    menuBtn: { padding: 8 },

    content: { flex: 1, padding: 16 },

    section: { marginBottom: 24 },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text.primary
    },

    rateCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: Colors.background.secondary,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.premium.glassBorder,
        marginBottom: 16,
    },
    rateCardManual: {
        borderColor: Colors.accent.primary,
        backgroundColor: 'rgba(14, 165, 233, 0.08)',
    },
    rateInfo: { flex: 1 },
    rateLabel: { fontSize: 11, color: Colors.text.muted, marginBottom: 4, letterSpacing: 0.5 },
    rateValue: { fontSize: 32, fontWeight: '700', color: Colors.accent.primary },
    rateDate: { fontSize: 11, color: Colors.text.muted, marginTop: 6 },
    refreshButton: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: Colors.accent.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    refreshButtonDisabled: { opacity: 0.5 },

    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: Colors.background.secondary,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: Colors.premium.glassBorder,
        marginBottom: 16,
    },
    toggleInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    toggleLabel: { fontSize: 15, fontWeight: '600', color: Colors.text.primary },
    toggleHint: { fontSize: 12, color: Colors.text.muted, marginTop: 2 },

    manualRateBox: {
        padding: 20,
        backgroundColor: Colors.background.secondary,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.premium.glassBorder,
    },
    manualRateBoxActive: {
        borderColor: Colors.accent.primary,
        borderWidth: 2,
    },
    inputLabel: { fontSize: 14, fontWeight: '600', color: Colors.text.secondary, marginBottom: 12 },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    inputPrefix: { fontSize: 24, fontWeight: '600', color: Colors.text.secondary },
    rateInput: {
        flex: 1,
        fontSize: 36,
        fontWeight: '800',
        color: Colors.accent.primary,
        backgroundColor: Colors.background.tertiary,
        borderRadius: 18,
        padding: 16,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: Colors.premium.glassBorder,
    },
    saveButton: {
        backgroundColor: Colors.accent.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    saveButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

    infoCard: {
        padding: 16,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    infoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    infoTitle: { fontSize: 14, fontWeight: '600', color: Colors.accent.primary },
    infoText: { fontSize: 13, color: Colors.text.secondary, lineHeight: 22 },
    inputTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },

    // Voice Keywords
    keywordsHint: {
        fontSize: 13,
        color: Colors.text.muted,
        lineHeight: 20,
        marginBottom: 14,
    },
    manageKeywordsBtn: {
        backgroundColor: Colors.background.secondary,
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    manageKeywordsBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.accent.primary,
    },

    // Cloud Backup
    googleLoginBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 16,
        gap: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    googleIcon: { width: 24, height: 24 },
    googleLoginText: { fontSize: 16, fontWeight: '700', color: '#000' },
    cloudIntro: {
        fontSize: 13,
        color: Colors.text.muted,
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 20,
    },
    cloudIdentityCard: {
        backgroundColor: Colors.background.secondary,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.premium.glassBorder,
        overflow: 'hidden',
    },
    userInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    userPhoto: { width: 50, height: 50, borderRadius: 25 },
    userPhotoPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userDetails: { flex: 1, marginLeft: 14 },
    userName: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
    userEmail: { fontSize: 13, color: Colors.text.muted, marginTop: 2 },
    logoutBtn: { padding: 8 },
    cloudStats: {
        backgroundColor: Colors.background.tertiary,
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
    },
    cloudStatItem: { alignItems: 'center' },
    cloudStatLabel: { fontSize: 11, color: Colors.text.muted, marginBottom: 4 },
    cloudStatValue: { fontSize: 13, fontWeight: '600', color: Colors.text.primary },
    cloudActions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    cloudActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.accent.primary,
        paddingVertical: 12,
        borderRadius: 12,
    },
    restoreBtn: { backgroundColor: Colors.background.tertiary, borderWidth: 1, borderColor: Colors.border.default },
    cloudActionText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
    autoSyncRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: Colors.border.light,
    },
    btnDisabled: { opacity: 0.6 },
    // Unsupported
    unsupportedCard: {
        backgroundColor: Colors.background.secondary,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.premium.glassBorder,
        borderStyle: 'dashed',
    },
    unsupportedTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: 8,
    },
    unsupportedText: {
        fontSize: 13,
        color: Colors.text.muted,
        textAlign: 'center',
        lineHeight: 20,
    },

    // Local Backup Styles
    localBackupHint: {
        fontSize: 13,
        color: Colors.text.secondary,
        lineHeight: 20,
        marginBottom: 16,
    },
    localBackupActions: {
        flexDirection: 'row',
        gap: 12,
    },
    localBackupBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    exportBtn: {
        backgroundColor: Colors.accent.primary,
    },
    importBtn: {
        backgroundColor: Colors.accent.emerald,
    },
    localBackupBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
    // AI Section Styles
    saveButtonDisabled: {
        opacity: 0.5,
    },
});
