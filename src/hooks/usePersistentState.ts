import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UsePersistentStateOptions = {
  debounceMs?: number;
  version?: number;
};

export function usePersistentState<T>(
  key: string,
  initialValue: T,
  options: UsePersistentStateOptions = {}
): [T, (value: T | ((prev: T) => T)) => void] {
  const { debounceMs = 0, version = 1 } = options;
  const versionedKey = `${key}_v${version}`;

  const [state, setState] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem(versionedKey);
        if (stored !== null) {
          setState(JSON.parse(stored));
        }
      } catch (error) {
        console.error(`Error loading persisted state for key ${versionedKey}:`, error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadData();
  }, [versionedKey]);

  const updateState = (value: T | ((prev: T) => T)) => {
    setState((prev) => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      if (isLoaded) {
        debounceTimeoutRef.current = setTimeout(() => {
          AsyncStorage.setItem(versionedKey, JSON.stringify(newValue)).catch((error) => {
            console.error(`Error persisting state for key ${versionedKey}:`, error);
          });
        }, debounceMs);
      }

      return newValue;
    });
  };

  return [state, updateState];
}

export default usePersistentState;
