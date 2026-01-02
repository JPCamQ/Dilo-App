// Dilo App - Unified Google Authentication Service
// Native Google Sign-In + Google Drive Backup
// Replaces Supabase OAuth with native experience

import ENV from '@/constants/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Dynamic import to avoid crashes in Expo Go
let GoogleSignin: any = null;
let statusCodes: any = {};

try {
    const GSigninModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = GSigninModule.GoogleSignin;
    statusCodes = GSigninModule.statusCodes;
} catch (e) {
    console.warn('[Auth] Google Sign-In native module not available');
}

const STORAGE_KEY = 'dilo_google_user';

// User type for the app
export interface GoogleUser {
    id: string;
    email: string;
    name: string;
    photo: string | null;
    accessToken?: string;
}

// ============================================
// Configuration
// ============================================

export const configureGoogleSignIn = () => {
    if (!GoogleSignin) {
        console.warn('[Auth] Cannot configure - native module not available');
        return;
    }

    try {
        const webClientId = ENV.GOOGLE_WEB_CLIENT_ID;
        console.log('[Auth] Configuring with webClientId:', webClientId?.substring(0, 20) + '...');

        GoogleSignin.configure({
            // Web Client ID from Google Cloud Console (via .env)
            webClientId: webClientId,
            // Request offline access for Google Drive
            offlineAccess: true,
            // Scopes for Google Drive file access
            scopes: [
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/drive.appdata',
            ],
        });
        console.log('[Auth] Google Sign-In configured successfully');
    } catch (error) {
        console.error('[Auth] Configuration error:', error);
    }
};

// ============================================
// Authentication Functions
// ============================================

export const isGoogleSignInAvailable = (): boolean => {
    return !!GoogleSignin;
};

export const signIn = async (): Promise<{ success: boolean; user?: GoogleUser; error?: string }> => {
    if (!GoogleSignin) {
        return {
            success: false,
            error: 'Google Sign-In no disponible. Necesitas instalar el APK de desarrollo.'
        };
    }

    try {
        // Check if Play Services are available
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

        // Perform sign in
        const response = await GoogleSignin.signIn();

        // Handle different response formats (library versions differ)
        const userInfo = response.data || response;

        if (!userInfo?.user) {
            return { success: false, error: 'No se pudo obtener información del usuario' };
        }

        // Get access token for Drive API
        const tokens = await GoogleSignin.getTokens();

        const user: GoogleUser = {
            id: userInfo.user.id,
            email: userInfo.user.email,
            name: userInfo.user.name || userInfo.user.email.split('@')[0],
            photo: userInfo.user.photo || null,
            accessToken: tokens.accessToken,
        };

        // Persist user
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));

        console.log('[Auth] Sign in successful:', user.email);
        return { success: true, user };

    } catch (error: any) {
        console.error('[Auth] Sign in error:', error);

        // Handle specific error codes
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            return { success: false, error: 'Inicio de sesión cancelado' };
        }
        if (error.code === statusCodes.IN_PROGRESS) {
            return { success: false, error: 'Inicio de sesión en progreso' };
        }
        if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            return { success: false, error: 'Google Play Services no disponible' };
        }

        return { success: false, error: error.message || 'Error desconocido' };
    }
};

export const signOut = async (): Promise<{ success: boolean; error?: string }> => {
    if (!GoogleSignin) {
        return { success: false, error: 'Google Sign-In no disponible' };
    }

    try {
        await GoogleSignin.signOut();
        await AsyncStorage.removeItem(STORAGE_KEY);
        console.log('[Auth] Sign out successful');
        return { success: true };
    } catch (error: any) {
        console.error('[Auth] Sign out error:', error);
        return { success: false, error: error.message };
    }
};

export const getCurrentUser = async (): Promise<GoogleUser | null> => {
    try {
        // First check AsyncStorage
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }

        // Then check if signed in with Google (with safety checks)
        if (GoogleSignin && typeof GoogleSignin.isSignedIn === 'function') {
            const isSignedIn = await GoogleSignin.isSignedIn();
            if (isSignedIn) {
                const userInfo = await GoogleSignin.getCurrentUser();
                if (userInfo?.user) {
                    const tokens = await GoogleSignin.getTokens();
                    const user: GoogleUser = {
                        id: userInfo.user.id,
                        email: userInfo.user.email,
                        name: userInfo.user.name || userInfo.user.email.split('@')[0],
                        photo: userInfo.user.photo || null,
                        accessToken: tokens.accessToken,
                    };
                    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
                    return user;
                }
            }
        }

        return null;
    } catch (error) {
        console.error('[Auth] Get current user error:', error);
        return null;
    }
};

export const refreshAccessToken = async (): Promise<string | null> => {
    if (!GoogleSignin) return null;

    try {
        const tokens = await GoogleSignin.getTokens();

        // Update stored user with new token
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
            const user = JSON.parse(stored);
            user.accessToken = tokens.accessToken;
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        }

        return tokens.accessToken;
    } catch (error) {
        console.error('[Auth] Token refresh error:', error);
        return null;
    }
};

// ============================================
// Google Drive Backup Functions
// ============================================

const BACKUP_FILENAME = 'dilo_backup.json';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

export const uploadBackup = async (data: any): Promise<{ success: boolean; error?: string }> => {
    try {
        const user = await getCurrentUser();
        if (!user?.accessToken) {
            // Try to refresh token
            const newToken = await refreshAccessToken();
            if (!newToken) {
                return { success: false, error: 'No hay sesión activa. Inicia sesión con Google.' };
            }
            user!.accessToken = newToken;
        }

        const accessToken = user!.accessToken;

        // Search for existing backup file
        const searchResponse = await axios.get(
            `${DRIVE_API_BASE}/files?q=name='${BACKUP_FILENAME}' and trashed=false&spaces=appDataFolder`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const files = searchResponse.data.files || [];
        const existingFile = files.length > 0 ? files[0] : null;

        // Prepare backup data with metadata
        const backupData = {
            app: 'DiloApp',
            version: '1.0',
            exportDate: new Date().toISOString(),
            data,
        };

        const content = JSON.stringify(backupData, null, 2);

        if (existingFile) {
            // Update existing file
            await axios.patch(
                `${DRIVE_UPLOAD_BASE}/files/${existingFile.id}?uploadType=media`,
                content,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
        } else {
            // Create new file in appDataFolder (hidden from user's Drive)
            const metadata = {
                name: BACKUP_FILENAME,
                parents: ['appDataFolder'],
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', new Blob([content], { type: 'application/json' }));

            await axios.post(
                `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`,
                form,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
        }

        console.log('[Drive] Backup uploaded successfully');
        return { success: true };

    } catch (error: any) {
        console.error('[Drive] Upload error:', error.response?.data || error.message);

        if (error.response?.status === 401) {
            return { success: false, error: 'Sesión expirada. Vuelve a iniciar sesión.' };
        }

        return { success: false, error: 'Error al subir respaldo: ' + (error.message || 'desconocido') };
    }
};

export const downloadBackup = async (): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
        const user = await getCurrentUser();
        if (!user?.accessToken) {
            const newToken = await refreshAccessToken();
            if (!newToken) {
                return { success: false, error: 'No hay sesión activa' };
            }
            user!.accessToken = newToken;
        }

        const accessToken = user!.accessToken;

        // Search for backup file
        const searchResponse = await axios.get(
            `${DRIVE_API_BASE}/files?q=name='${BACKUP_FILENAME}' and trashed=false&spaces=appDataFolder`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const files = searchResponse.data.files || [];
        if (files.length === 0) {
            return { success: false, error: 'No se encontró ningún respaldo' };
        }

        // Download file content
        const fileId = files[0].id;
        const downloadResponse = await axios.get(
            `${DRIVE_API_BASE}/files/${fileId}?alt=media`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        console.log('[Drive] Backup downloaded successfully');
        return { success: true, data: downloadResponse.data };

    } catch (error: any) {
        console.error('[Drive] Download error:', error.response?.data || error.message);
        return { success: false, error: 'Error al descargar respaldo' };
    }
};

export const getBackupInfo = async (): Promise<{ exists: boolean; lastModified?: string }> => {
    try {
        const user = await getCurrentUser();
        if (!user?.accessToken) return { exists: false };

        const searchResponse = await axios.get(
            `${DRIVE_API_BASE}/files?q=name='${BACKUP_FILENAME}' and trashed=false&spaces=appDataFolder&fields=files(id,modifiedTime)`,
            { headers: { Authorization: `Bearer ${user.accessToken}` } }
        );

        const files = searchResponse.data.files || [];
        if (files.length === 0) {
            return { exists: false };
        }

        return { exists: true, lastModified: files[0].modifiedTime };
    } catch (error) {
        return { exists: false };
    }
};
