import { useState, useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';

let BluetoothClassic: any = null;
try {
  BluetoothClassic = require('react-native-bluetooth-classic').default;
} catch {}

export const useBluetoothState = () => {
  const [isBluetoothConnected, setIsBluetoothConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const requestPermission = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  };

  const checkBluetoothState = async () => {
    if (!BluetoothClassic || Platform.OS === 'web') {
      setIsLoading(false);
      return;
    }

    try {
      const hasPermission = await requestPermission();
      if (hasPermission) {
        const isEnabled = await BluetoothClassic.isBluetoothEnabled();
        setIsBluetoothConnected(isEnabled);
      }
    } catch {}
    setIsLoading(false);
  };

  const toggleBluetooth = async () => {
    if (!BluetoothClassic || Platform.OS === 'web') return false;

    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) return false;

      await BluetoothClassic.requestBluetoothEnabled(!isBluetoothConnected);
      checkBluetoothState();
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    checkBluetoothState();
    if (BluetoothClassic) {
      const interval = setInterval(checkBluetoothState, 3000);
      return () => clearInterval(interval);
    }
  }, []);

  return { isBluetoothConnected, isLoading, toggleBluetooth };
};
