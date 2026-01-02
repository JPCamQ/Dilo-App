// Dilo App - Local Backup Service
// Export and import all app data without Google dependency
// Simplified version that works reliably in Expo Go

import { useAppStore } from '@/stores/useAppStore';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export interface BackupData {
    version: string;
    exportDate: string;
    app: string;
    data: {
        accounts: any[];
        transactions: any[];
        categories: any[];
        bankKeywords: Record<string, string[]>;
        currentBcvRate: number;
        useManualRate: boolean;
        manualBcvRate: number;
    };
}

const BACKUP_VERSION = '1.0';

/**
 * Export all app data to a JSON file and save it (using SAF on Android)
 */
export async function exportBackup(): Promise<{ success: boolean; message: string }> {
    try {
        console.log('[Backup] Starting export...');

        const state = useAppStore.getState();

        const backupData: BackupData = {
            version: BACKUP_VERSION,
            exportDate: new Date().toISOString(),
            app: 'DiloApp',
            data: {
                accounts: state.accounts,
                transactions: state.transactions,
                categories: state.categories,
                bankKeywords: state.bankKeywords,
                currentBcvRate: state.currentBcvRate,
                useManualRate: state.useManualRate,
                manualBcvRate: state.manualBcvRate,
            },
        };

        const jsonString = JSON.stringify(backupData, null, 2);
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const fileName = `dilo_backup_${dateStr}.json`;
        const mimeType = 'application/json';

        // Android: Use Storage Access Framework (SAF) for direct "Save as" - SAME AS REPORTS
        const { Platform } = require('react-native');
        if (Platform.OS === 'android') {
            try {
                const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

                if (permissions.granted) {
                    const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
                        permissions.directoryUri,
                        fileName,
                        mimeType
                    );

                    await FileSystem.writeAsStringAsync(fileUri, jsonString, { encoding: FileSystem.EncodingType.UTF8 });

                    const { Alert } = require('react-native');
                    Alert.alert('✓ Guardado', `Respaldo guardado: ${fileName}`);
                    return { success: true, message: `Guardado: ${fileName}` };
                } else {
                    return { success: false, message: 'Permiso de carpeta denegado' };
                }
            } catch (safError) {
                console.error('[Backup] SAF Error:', safError);
                // Fall through to sharing as fallback
            }
        }

        // iOS or Fallback: Use sharing
        const baseDir = FileSystem.cacheDirectory;
        if (!baseDir) {
            throw new Error('No se pudo acceder al directorio temporal');
        }

        const filePath = baseDir + fileName;
        await FileSystem.writeAsStringAsync(filePath, jsonString, { encoding: FileSystem.EncodingType.UTF8 });

        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
            await Sharing.shareAsync(filePath, {
                mimeType: 'application/json',
                dialogTitle: 'Guardar Respaldo Dilo',
            });
            return { success: true, message: 'Se abrió el menú de compartir' };
        } else {
            return { success: false, message: 'Compartir no disponible en este dispositivo' };
        }
    } catch (error) {
        console.error('[Backup] Export error:', error);
        return { success: false, message: 'Error al exportar: ' + (error as Error).message };
    }
}

/**
 * Import app data from a JSON backup file
 */
export async function importBackup(): Promise<{ success: boolean; message: string }> {
    try {
        console.log('[Backup] Starting import...');

        // Pick a document
        const result = await DocumentPicker.getDocumentAsync({
            type: 'application/json',
            copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
            return { success: false, message: 'Importación cancelada' };
        }

        const fileUri = result.assets[0].uri;
        console.log('[Backup] Reading from:', fileUri);

        // Read file content without encoding option
        const jsonString = await FileSystem.readAsStringAsync(fileUri);
        console.log('[Backup] File read successfully');

        // Parse and validate
        const backupData = JSON.parse(jsonString) as BackupData;

        if (!validateBackup(backupData)) {
            return { success: false, message: 'Archivo de respaldo inválido o corrupto' };
        }

        // Restore data to store
        const store = useAppStore.getState();

        // Replace all data
        if (backupData.data.accounts) {
            store.setAccounts(backupData.data.accounts);
        }
        if (backupData.data.transactions) {
            store.setTransactions(backupData.data.transactions);
        }
        if (backupData.data.categories) {
            store.setCategories(backupData.data.categories);
        }
        if (backupData.data.bankKeywords) {
            store.setBankKeywords(backupData.data.bankKeywords);
        }
        if (backupData.data.currentBcvRate) {
            store.setBcvRate(backupData.data.currentBcvRate);
        }
        if (typeof backupData.data.useManualRate === 'boolean') {
            store.setUseManualRate(backupData.data.useManualRate);
        }
        if (backupData.data.manualBcvRate) {
            store.setManualBcvRate(backupData.data.manualBcvRate);
        }

        return {
            success: true,
            message: `Respaldo restaurado: ${backupData.data.accounts?.length || 0} cuentas, ${backupData.data.transactions?.length || 0} transacciones`
        };
    } catch (error) {
        console.error('[Backup] Import error:', error);
        return { success: false, message: 'Error al importar: ' + (error as Error).message };
    }
}

/**
 * Validate backup structure
 */
function validateBackup(data: any): data is BackupData {
    if (!data) return false;
    if (data.app !== 'DiloApp') return false;
    if (!data.version) return false;
    if (!data.data) return false;

    // Check required data fields exist (can be empty arrays)
    if (!Array.isArray(data.data.accounts)) return false;
    if (!Array.isArray(data.data.transactions)) return false;

    return true;
}
