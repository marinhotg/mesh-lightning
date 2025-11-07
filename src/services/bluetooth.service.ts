import { BleManager, Device, State } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';

export interface BluetoothPeer {
  id: string;
  name: string;
  rssi: number;
}

class BluetoothService {
  private scanning = false;
  private initialized = false;
  private listeners: Array<(peer: BluetoothPeer) => void> = [];
  private manager: BleManager;

  constructor() {
    this.manager = new BleManager();
    this.initializeBLE();
  }

  private async initializeBLE() {
    try {
      await this.manager.state();
      this.initialized = true;
    } catch (error) {
      this.initialized = false;
    }
  }

  private async requestAndroidPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const apiLevel = Platform.constants.Version;

      if (apiLevel < 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        return (
          granted['android.permission.ACCESS_FINE_LOCATION'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.ACCESS_COARSE_LOCATION'] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return (
          granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
        );
      }
    } catch (err) {
      return false;
    }
  }

  private handleDiscoverDevice(device: Device) {
    const peer: BluetoothPeer = {
      id: device.id,
      name: device.name || device.localName || `Device ${device.id.slice(-4)}`,
      rssi: device.rssi || -100,
    };

    this.listeners.forEach((listener) => listener(peer));
  }

  public async startScanning(): Promise<void> {
    if (this.scanning) {
      return;
    }

    if (!this.initialized) {
      throw new Error('BLE Manager not initialized');
    }

    const hasPerms = await this.requestAndroidPermissions();
    if (!hasPerms) {
      throw new Error('Bluetooth permissions not granted');
    }

    const state = await this.checkBluetoothState();
    if (state !== 'PoweredOn') {
      throw new Error('Bluetooth is not enabled');
    }

    try {
      this.scanning = true;
      this.manager.stopDeviceScan();

      this.manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          this.scanning = false;
          return;
        }

        if (device) {
          this.handleDiscoverDevice(device);
        }
      });

      setTimeout(() => {
        if (this.scanning) {
          this.stopScanning();
        }
      }, 30000);
    } catch (error) {
      this.scanning = false;
      throw error;
    }
  }

  public async stopScanning(): Promise<void> {
    if (!this.scanning) {
      return;
    }

    try {
      this.manager.stopDeviceScan();
      this.scanning = false;
    } catch (error) {
      console.error('Failed to stop scanning:', error);
    }
  }

  public isScanning(): boolean {
    return this.scanning;
  }

  public onPeerDiscovered(callback: (peer: BluetoothPeer) => void) {
    this.listeners.push(callback);

    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback);
    };
  }

  public async checkBluetoothState(): Promise<string> {
    try {
      const state = await this.manager.state();
      return state;
    } catch (error) {
      return 'Unknown';
    }
  }
}

export const bluetoothService = new BluetoothService();
