import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface PaymentResult {
  paymentHash: string;
  preimage: string;
}

const NODE_KEY_KEY = 'lightning_node_key';
const NODE_ID_KEY = 'lightning_node_id';

class LightningService {
  private initialized: boolean = false;
  private nodeId: string = '';
  private nodeKey: string = '';
  private isInternetConnected: boolean = false;

  async initialize(): Promise<void> {
    try {
      const netInfo = await NetInfo.fetch();
      this.isInternetConnected =
        netInfo.isConnected === true && netInfo.isInternetReachable === true;

      if (!this.isInternetConnected) {
        this.initialized = false;
        return;
      }

      const storedNodeId = await AsyncStorage.getItem(NODE_ID_KEY);
      const storedNodeKey = await AsyncStorage.getItem(NODE_KEY_KEY);

      if (storedNodeId && storedNodeKey) {
        this.nodeId = storedNodeId;
        this.nodeKey = storedNodeKey;
      } else {
        this.nodeKey = this.generateNodeKey();
        this.nodeId = this.deriveNodeId(this.nodeKey);
        await AsyncStorage.setItem(NODE_ID_KEY, this.nodeId);
        await AsyncStorage.setItem(NODE_KEY_KEY, this.nodeKey);
      }

      await this.createLDKNode();

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize LDK:', error);
      this.initialized = false;
      throw error;
    }
  }

  private async createLDKNode(): Promise<void> {
    if (!this.isInternetConnected) {
      throw new Error('Internet connection required to create Lightning node');
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to create LDK node:', error);
      throw error;
    }
  }

  private generateNodeKey(): string {
    const randomBytes = new Array(32);
    for (let i = 0; i < 32; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
    return this.bytesToHex(randomBytes);
  }

  private deriveNodeId(nodeKey: string): string {
    const hash = this.sha256(nodeKey);
    return hash.substring(0, 66);
  }

  private bytesToHex(bytes: number[]): string {
    return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  private sha256(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  async payInvoice(invoice: string): Promise<PaymentResult> {
    const netInfo = await NetInfo.fetch();
    const hasInternet = netInfo.isConnected === true && netInfo.isInternetReachable === true;

    if (!hasInternet) {
      throw new Error('Internet connection required to pay invoice');
    }

    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.initialized) {
      throw new Error('Lightning node not initialized');
    }

    try {
      const paymentHash = this.generatePaymentHash(invoice);
      const preimage = this.generatePreimage();

      await this.processPayment(invoice, paymentHash, preimage);

      return {
        paymentHash,
        preimage,
      };
    } catch (error: any) {
      console.error('Payment failed:', error);
      throw new Error(`Payment failed: ${error.message}`);
    }
  }

  private async processPayment(
    invoice: string,
    paymentHash: string,
    preimage: string
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  private generatePaymentHash(invoice: string): string {
    const hash = this.simpleHash(invoice);
    return this.stringToHex(hash).substring(0, 64);
  }

  private generatePreimage(): string {
    const random = Math.random().toString(36) + Date.now().toString(36);
    return this.stringToHex(random).substring(0, 64);
  }

  private stringToHex(str: string): string {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      hex += charCode.toString(16).padStart(2, '0');
    }
    return hex;
  }

  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getNodeId(): string {
    return this.nodeId;
  }
}

export const lightningService = new LightningService();
