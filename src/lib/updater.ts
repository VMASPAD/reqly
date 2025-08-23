// Sistema de detección de actualizaciones
import { useState, useEffect } from 'preact/hooks';

interface UpdateInfo {
  available: boolean;
  version?: string;
  releaseNotes?: string;
  downloadUrl?: string;
}

const CURRENT_VERSION = '1.0.0';
const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas
const GITHUB_API_URL = 'https://api.github.com/repos/VMASPAD/reqly/releases/latest';

export const useUpdateChecker = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({ available: false });
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkForUpdates = async () => {
    setIsChecking(true);
    
    try {
      const response = await fetch(GITHUB_API_URL);
      
      if (!response.ok) {
        throw new Error('Failed to check for updates');
      }
      
      const data = await response.json();
      const latestVersion = data.tag_name?.replace('v', '') || data.name;
      
      if (latestVersion && isNewerVersion(latestVersion, CURRENT_VERSION)) {
        setUpdateInfo({
          available: true,
          version: latestVersion,
          releaseNotes: data.body || 'New version available',
          downloadUrl: data.html_url
        });
      } else {
        setUpdateInfo({ available: false });
      }
      
      setLastChecked(new Date());
      localStorage.setItem('lastUpdateCheck', new Date().toISOString());
    } catch (error) {
      console.error('Error checking for updates:', error);
      setUpdateInfo({ available: false });
    } finally {
      setIsChecking(false);
    }
  };

  const isNewerVersion = (latest: string, current: string): boolean => {
    const parseVersion = (version: string) => {
      return version.split('.').map(num => parseInt(num, 10));
    };
    
    const latestParts = parseVersion(latest);
    const currentParts = parseVersion(current);
    
    for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
      const latestPart = latestParts[i] || 0;
      const currentPart = currentParts[i] || 0;
      
      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }
    
    return false;
  };

  const shouldCheckForUpdates = (): boolean => {
    const lastCheck = localStorage.getItem('lastUpdateCheck');
    if (!lastCheck) return true;
    
    const lastCheckDate = new Date(lastCheck);
    const now = new Date();
    
    return (now.getTime() - lastCheckDate.getTime()) > UPDATE_CHECK_INTERVAL;
  };

  useEffect(() => {
    // Verificar automáticamente al cargar la app
    if (shouldCheckForUpdates()) {
      checkForUpdates();
    } else {
      const lastCheck = localStorage.getItem('lastUpdateCheck');
      if (lastCheck) {
        setLastChecked(new Date(lastCheck));
      }
    }
  }, []);

  const dismissUpdate = () => {
    setUpdateInfo({ available: false });
  };

  return {
    updateInfo,
    isChecking,
    lastChecked,
    checkForUpdates,
    dismissUpdate,
    currentVersion: CURRENT_VERSION
  };
};