/**
 * Google Drive Sync Service for GasApp
 * Saves and restores `gasapp_backup.json` to/from the user's Google Drive.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { AppData } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App & Auth
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

export interface GoogleDriveUser {
  email?: string;
  name?: string;
  picture?: string;
}

export interface GoogleDriveSyncState {
  isConnected: boolean;
  accessToken: string | null;
  tokenExpiry: number | null;
  user: GoogleDriveUser | null;
  lastSyncedAt: string | null;
  backupFileId: string | null;
}

const BACKUP_FILE_NAME = 'gasapp_backup.json';
const DRIVE_STORAGE_KEY = 'gasapp_drive_auth';

export class GoogleDriveService {
  public static getSavedState(): GoogleDriveSyncState {
    try {
      const saved = localStorage.getItem(DRIVE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const isStillValid = parsed.tokenExpiry && Date.now() < parsed.tokenExpiry;
        return {
          isConnected: isStillValid,
          accessToken: isStillValid ? parsed.accessToken : null,
          tokenExpiry: parsed.tokenExpiry || null,
          user: parsed.user || null,
          lastSyncedAt: parsed.lastSyncedAt || null,
          backupFileId: parsed.backupFileId || null,
        };
      }
    } catch (e) {
      console.error('Error reading drive auth state', e);
    }
    return {
      isConnected: false,
      accessToken: null,
      tokenExpiry: null,
      user: null,
      lastSyncedAt: null,
      backupFileId: null,
    };
  }

  public static saveState(state: Partial<GoogleDriveSyncState>) {
    try {
      const current = this.getSavedState();
      const updated = { ...current, ...state };
      localStorage.setItem(DRIVE_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving drive auth state', e);
    }
  }

  public static clearState() {
    localStorage.removeItem(DRIVE_STORAGE_KEY);
  }

  /**
   * Primary Auth Flow: Firebase Auth Google Popup with Drive Scopes.
   * Directly opens the official Google authorization window.
   */
  public static async signInWithFirebaseGoogle(loginHint?: string): Promise<{ accessToken: string; user: GoogleDriveUser }> {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
    provider.addScope('https://www.googleapis.com/auth/userinfo.email');

    const customParams: Record<string, string> = {
      prompt: 'select_account',
    };
    if (loginHint && loginHint.trim()) {
      customParams.login_hint = loginHint.trim();
    }
    provider.setCustomParameters(customParams);

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;

    if (!accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google Drive.');
    }

    const driveUser: GoogleDriveUser = {
      email: result.user.email || undefined,
      name: result.user.displayName || undefined,
      picture: result.user.photoURL || undefined,
    };

    return { accessToken, user: driveUser };
  }

  /**
   * Fallback Auth Flow using Google Identity Services (GIS) if needed
   */
  public static async requestTokenGIS(clientId: string, loginHint?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        return reject(new Error('El script de Google Identity Services aún no se ha cargado.'));
      }

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: (resp: { access_token?: string; error?: string }) => {
          if (resp.error || !resp.access_token) {
            return reject(new Error(resp.error || 'No se pudo obtener el token'));
          }
          resolve(resp.access_token);
        },
      });

      client.requestAccessToken({ prompt: loginHint ? '' : 'select_account' });
    });
  }

  /**
   * Fetch user profile info (name, email, avatar)
   */
  public static async fetchUserInfo(accessToken: string): Promise<GoogleDriveUser> {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        return {
          email: data.email,
          name: data.name,
          picture: data.picture,
        };
      }
    } catch (e) {
      console.warn('Could not fetch user info', e);
    }
    return {};
  }

  public static async signOutUser() {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Error during signOut', e);
    }
    this.clearState();
  }

  /**
   * Find existing backup file in Google Drive
   */
  public static async findBackupFile(accessToken: string): Promise<{ id: string; modifiedTime?: string } | null> {
    const query = encodeURIComponent(`name = '${BACKUP_FILE_NAME}' and trashed = false`);
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,size)&spaces=drive`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error al buscar archivo en Drive: ${errText}`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return { id: data.files[0].id, modifiedTime: data.files[0].modifiedTime };
    }
    return null;
  }

  /**
   * Save / Backup AppData to Google Drive
   */
  public static async saveToDrive(
    accessToken: string,
    appData: AppData
  ): Promise<{ fileId: string; modifiedTime: string }> {
    // Check if file already exists
    const existing = await this.findBackupFile(accessToken);
    const content = JSON.stringify(appData, null, 2);
    const metadata = {
      name: BACKUP_FILE_NAME,
      mimeType: 'application/json',
      description: `GasApp - Respaldo de ${appData.carName} (${appData.fuels.length} cargas, ${appData.services.length} servicios)`,
    };

    if (existing) {
      // Update existing file content
      const res = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: content,
        }
      );

      if (!res.ok) {
        throw new Error('Error al actualizar el respaldo en Google Drive');
      }

      const fileData = await res.json();
      return {
        fileId: existing.id,
        modifiedTime: fileData.modifiedTime || new Date().toISOString(),
      };
    } else {
      // Create multipart upload
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        content +
        closeDelimiter;

      const res = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );

      if (!res.ok) {
        throw new Error('Error al crear el archivo en Google Drive');
      }

      const fileData = await res.json();
      return {
        fileId: fileData.id,
        modifiedTime: fileData.modifiedTime || new Date().toISOString(),
      };
    }
  }

  /**
   * Load / Restore AppData from Google Drive
   */
  public static async loadFromDrive(accessToken: string): Promise<{ data: AppData; modifiedTime?: string }> {
    const existing = await this.findBackupFile(accessToken);
    if (!existing) {
      throw new Error('No se encontró ningún respaldo de GasApp en tu Google Drive');
    }

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${existing.id}?alt=media`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      throw new Error('Error al descargar el respaldo desde Google Drive');
    }

    const json = await res.json();
    if (!json || typeof json !== 'object') {
      throw new Error('El archivo de respaldo no tiene un formato válido');
    }

    return {
      data: json,
      modifiedTime: existing.modifiedTime,
    };
  }
}
