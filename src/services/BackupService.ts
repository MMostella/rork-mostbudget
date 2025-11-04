import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageKeys } from '@/src/utils/storageKeys';
import { Platform, Alert, Share } from 'react-native';
import * as FileSystem from 'expo-file-system';

type BackupData = {
  version: string;
  timestamp: string;
  data: Record<string, any>;
};

export const BackupService = {
  async exportAllData(): Promise<string> {
    try {
      const allKeys = Object.values(storageKeys);
      const allData: Record<string, any> = {};

      for (const key of allKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value !== null) {
          try {
            allData[key] = JSON.parse(value);
          } catch {
            allData[key] = value;
          }
        }
      }

      const backup: BackupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: allData,
      };

      return JSON.stringify(backup, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  },

  async importAllData(jsonString: string): Promise<void> {
    try {
      const backup: BackupData = JSON.parse(jsonString);

      if (!backup.data) {
        throw new Error('Invalid backup format');
      }

      const entries = Object.entries(backup.data);
      
      for (const [key, value] of entries) {
        const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
        await AsyncStorage.setItem(key, valueToStore);
      }

      console.log('Data import successful');
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Failed to import data. Please check the file format.');
    }
  },

  async shareBackup(): Promise<void> {
    try {
      const exportedData = await this.exportAllData();
      
      if (Platform.OS === 'web') {
        const blob = new Blob([exportedData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `mostbudget-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        Alert.alert('Success', 'Backup file has been downloaded');
      } else {
        const fileName = `mostbudget-backup-${new Date().toISOString().split('T')[0]}.json`;
        const filePath = `${FileSystem.documentDirectory}${fileName}`;
        
        await FileSystem.writeAsStringAsync(filePath, exportedData, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        
        await Share.share({
          url: filePath,
          title: 'MostBudget Backup',
          message: 'MostBudget data backup',
        });
      }
    } catch (error) {
      console.error('Error sharing backup:', error);
      Alert.alert('Error', 'Failed to create backup file');
    }
  },

  async loadBackupFromFile(fileUri: string): Promise<void> {
    try {
      let fileContent: string;

      if (Platform.OS === 'web') {
        const response = await fetch(fileUri);
        fileContent = await response.text();
      } else {
        fileContent = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }

      await this.importAllData(fileContent);
      Alert.alert('Success', 'Data has been restored from backup');
    } catch (error) {
      console.error('Error loading backup from file:', error);
      Alert.alert('Error', 'Failed to load backup file');
      throw error;
    }
  },
};

export default BackupService;
