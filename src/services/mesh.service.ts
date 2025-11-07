import {
  MeshMessage,
  MessageType,
  PaymentRequest,
  PaymentConfirmation,
  PaymentFailed,
} from '../types/mesh';
import { bluetoothService } from './bluetooth.service';
import { lightningService } from './lightning.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const DEVICE_ID_KEY = 'mesh_device_id';
const MESH_SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
const MESH_CHARACTERISTIC_UUID = '12345678-1234-1234-1234-123456789abd';

class MeshService {
  private deviceId: string | null = null;
  private connectedPeers: Map<string, any> = new Map();
  private messageListeners: Array<(message: MeshMessage) => void> = [];
  private processedMessages: Set<string> = new Set();
  private isInternetNode: boolean = false;

  async initialize(): Promise<void> {
    const storedId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (storedId) {
      this.deviceId = storedId;
    } else {
      this.deviceId = this.generateDeviceId();
      await AsyncStorage.setItem(DEVICE_ID_KEY, this.deviceId);
    }

    const netInfo = await NetInfo.fetch();
    this.isInternetNode = netInfo.isConnected === true && netInfo.isInternetReachable === true;

    NetInfo.addEventListener((state) => {
      const wasInternetNode = this.isInternetNode;
      this.isInternetNode = state.isConnected === true && state.isInternetReachable === true;

      if (this.isInternetNode && !wasInternetNode) {
        lightningService.initialize().catch((error) => {
          console.error('Failed to initialize Lightning node after internet connection:', error);
        });
      }
    });

    if (this.isInternetNode) {
      await lightningService.initialize();
    }

    bluetoothService.onMessageReceived((deviceId: string, data: string) => {
      this.handleReceivedMessage(deviceId, data);
    });
  }

  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getDeviceId(): string {
    return this.deviceId || '';
  }

  setIsInternetNode(isInternet: boolean): void {
    this.isInternetNode = isInternet;
  }

  isInternetConnected(): boolean {
    return this.isInternetNode;
  }

  async sendPaymentRequest(invoice: string, amount?: number, memo?: string): Promise<string> {
    if (!invoice || invoice.trim().length === 0) {
      throw new Error('Invoice is required');
    }

    const deviceId = this.getDeviceId();
    if (!deviceId) {
      throw new Error('Device not initialized');
    }

    const message: MeshMessage = {
      id: this.generateMessageId(),
      type: MessageType.PAYMENT_REQUEST,
      timestamp: Date.now(),
      senderId: deviceId,
      payload: {
        invoice: invoice.trim(),
        amount,
        memo,
      } as PaymentRequest,
      hops: [deviceId],
      ttl: 10,
    };

    return this.broadcastMessage(message);
  }

  async forwardMessage(message: MeshMessage): Promise<void> {
    if (!message || !message.id) {
      return;
    }

    const deviceId = this.getDeviceId();
    if (!deviceId) {
      return;
    }

    if (message.hops && message.hops.includes(deviceId)) {
      return;
    }

    if (message.ttl <= 0) {
      return;
    }

    if (this.processedMessages.has(message.id)) {
      return;
    }

    this.processedMessages.add(message.id);

    if (message.type === MessageType.PAYMENT_REQUEST && this.isInternetNode) {
      await this.processPaymentRequest(message).catch((error) => {
        console.error('Error processing payment request:', error);
      });
    } else {
      if (!message.hops) {
        message.hops = [];
      }
      message.hops.push(deviceId);
      message.ttl -= 1;
      await this.broadcastMessage(message).catch((error) => {
        console.error('Error broadcasting message:', error);
      });
    }
  }

  private async processPaymentRequest(message: MeshMessage): Promise<void> {
    if (!message || !message.payload) {
      throw new Error('Invalid payment request message');
    }

    const paymentRequest = message.payload as PaymentRequest;
    if (!paymentRequest || !paymentRequest.invoice) {
      throw new Error('Invalid payment request payload');
    }

    try {
      const result = await lightningService.payInvoice(paymentRequest.invoice);

      if (!result || !result.paymentHash) {
        throw new Error('Invalid payment result');
      }

      const deviceId = this.getDeviceId();
      const confirmation: MeshMessage = {
        id: this.generateMessageId(),
        type: MessageType.PAYMENT_CONFIRMATION,
        timestamp: Date.now(),
        senderId: deviceId,
        recipientId: message.senderId,
        payload: {
          paymentHash: result.paymentHash,
          invoice: paymentRequest.invoice,
          preimage: result.preimage || '',
        } as PaymentConfirmation,
        hops: [deviceId],
        ttl: 10,
      };

      await this.sendMessageToPeer(message.senderId, confirmation).catch((error) => {
        console.error('Error sending confirmation:', error);
      });
    } catch (error: any) {
      const deviceId = this.getDeviceId();
      const failed: MeshMessage = {
        id: this.generateMessageId(),
        type: MessageType.PAYMENT_FAILED,
        timestamp: Date.now(),
        senderId: deviceId,
        recipientId: message.senderId,
        payload: {
          invoice: paymentRequest.invoice,
          reason: error?.message || 'Payment failed',
        } as PaymentFailed,
        hops: [deviceId],
        ttl: 10,
      };

      await this.sendMessageToPeer(message.senderId, failed).catch((error) => {
        console.error('Error sending failure message:', error);
      });
    }
  }

  private async broadcastMessage(message: MeshMessage): Promise<string> {
    const allPeers = Array.from(this.connectedPeers.keys());
    const discoveredDevices = bluetoothService.discoveredDevices;

    const peerIds = new Set([...allPeers, ...Array.from(discoveredDevices.keys())]);

    for (const peerId of peerIds) {
      if (!message.hops.includes(peerId)) {
        await this.sendMessageToPeer(peerId, message);
      }
    }

    return message.id;
  }

  private async sendMessageToPeer(peerId: string, message: MeshMessage): Promise<void> {
    const peer = this.connectedPeers.get(peerId);
    if (!peer || !peer.connected) {
      const device = bluetoothService.getDiscoveredDevice(peerId);
      if (device) {
        const connected = await bluetoothService.connectToDevice(device);
        if (connected) {
          this.addConnectedPeer(peerId, device);
          const data = JSON.stringify(message);
          await bluetoothService.sendMessage(device, data);
        }
      }
      return;
    }

    try {
      const data = JSON.stringify(message);
      await bluetoothService.sendMessage(peer.device, data);
    } catch (error) {
      console.error(`Failed to send message to ${peerId}:`, error);
    }
  }

  private async handleReceivedMessage(deviceId: string, data: string): Promise<void> {
    if (!data || !deviceId) {
      return;
    }

    try {
      const message: MeshMessage = JSON.parse(data);

      if (!message || !message.id || !message.type || !message.senderId) {
        console.error('Invalid message format');
        return;
      }

      if (this.processedMessages.has(message.id)) {
        return;
      }

      if (message.recipientId && message.recipientId !== this.getDeviceId()) {
        await this.forwardMessage(message).catch((error) => {
          console.error('Error forwarding message:', error);
        });
        return;
      }

      if (message.recipientId === this.getDeviceId() || !message.recipientId) {
        this.processedMessages.add(message.id);
        this.messageListeners.forEach((listener) => {
          try {
            listener(message);
          } catch (error) {
            console.error('Error in message listener:', error);
          }
        });

        if (message.type === MessageType.PAYMENT_REQUEST && !this.isInternetNode) {
          await this.forwardMessage(message).catch((error) => {
            console.error('Error forwarding payment request:', error);
          });
        }
      }
    } catch (error) {
      console.error('Error handling received message:', error);
    }
  }

  onMessage(callback: (message: MeshMessage) => void): () => void {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter((l) => l !== callback);
    };
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  addConnectedPeer(peerId: string, device: any): void {
    this.connectedPeers.set(peerId, { device, connected: true });
  }

  removeConnectedPeer(peerId: string): void {
    this.connectedPeers.delete(peerId);
  }
}

export const meshService = new MeshService();
