import { BleManager, Device, State, Characteristic } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import { base64Encode, base64Decode } from '../utils/base64';

export interface BluetoothPeer {
  id: string;
  name: string;
  rssi: number;
}

const MESH_SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
const MESH_CHARACTERISTIC_UUID = '12345678-1234-1234-1234-123456789abd';

class BluetoothService {
  private scanning = false;
  private initialized = false;
  private listeners: Array<(peer: BluetoothPeer) => void> = [];
  private messageListeners: Array<(deviceId: string, data: string) => void> = [];
  private connectedDevices: Map<string, Device> = new Map();
  public discoveredDevices: Map<string, Device> = new Map();
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
      const apiLevel = Platform.constants?.Version || 0;

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
    if (!device || !device.id) return;

    this.discoveredDevices.set(device.id, device);

    const peer: BluetoothPeer = {
      id: device.id,
      name: device.name || device.localName || `Device ${device.id.slice(-4)}`,
      rssi: device.rssi || -100,
    };

    this.listeners.forEach((listener) => {
      try {
        listener(peer);
      } catch (error) {
        console.error('Error in peer discovered listener:', error);
      }
    });
  }

  public getDiscoveredDevice(deviceId: string): Device | undefined {
    return this.discoveredDevices.get(deviceId);
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

  public async connectToDevice(device: Device): Promise<boolean> {
    if (!device || !device.id) {
      return false;
    }

    try {
      if (this.connectedDevices.has(device.id)) {
        return true;
      }

      const connectedDevice = await device.connect();
      if (!connectedDevice) {
        return false;
      }

      await connectedDevice.discoverAllServicesAndCharacteristics();

      this.connectedDevices.set(device.id, connectedDevice);

      try {
        const characteristic = await connectedDevice.readCharacteristicForService(
          MESH_SERVICE_UUID,
          MESH_CHARACTERISTIC_UUID
        );

        if (characteristic) {
          characteristic.monitor((error, char) => {
            if (error || !char?.value) return;

            const data = char.value;
            if (data && typeof data === 'string') {
              try {
                const decoded = base64Decode(data);
                if (decoded) {
                  this.messageListeners.forEach((listener) => {
                    try {
                      listener(device.id, decoded);
                    } catch (e) {
                      console.error('Error in message listener:', e);
                    }
                  });
                }
              } catch (e) {
                console.error('Failed to decode message:', e);
              }
            }
          });
        }
      } catch (charError) {
        console.error('Characteristic not found, continuing without monitoring:', charError);
      }

      return true;
    } catch (error) {
      console.error('Failed to connect to device:', error);
      return false;
    }
  }

  public async disconnectDevice(deviceId: string): Promise<void> {
    const device = this.connectedDevices.get(deviceId);
    if (device) {
      try {
        await device.cancelConnection();
      } catch (error) {
        console.error('Error disconnecting device:', error);
      }
      this.connectedDevices.delete(deviceId);
    }
  }

  public async sendMessage(device: Device, message: string): Promise<void> {
    const connectedDevice = this.connectedDevices.get(device.id);
    if (!connectedDevice) {
      throw new Error('Device not connected');
    }

    try {
      const data = base64Encode(message);
      if (!data) {
        throw new Error('Failed to encode message');
      }
      await connectedDevice.writeCharacteristicWithResponseForService(
        MESH_SERVICE_UUID,
        MESH_CHARACTERISTIC_UUID,
        data
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  public onMessageReceived(callback: (deviceId: string, data: string) => void): () => void {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter((l) => l !== callback);
    };
  }

  public async startAdvertising(): Promise<void> {
    try {
      const state = await this.checkBluetoothState();
      if (state !== 'PoweredOn') {
        throw new Error('Bluetooth is not enabled');
      }

      const hasPerms = await this.requestAndroidPermissions();
      if (!hasPerms) {
        throw new Error('Bluetooth permissions not granted');
      }
    } catch (error) {
      console.error('Failed to start advertising:', error);
      throw error;
    }
  }
}

export const bluetoothService = new BluetoothService();
