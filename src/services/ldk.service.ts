import { Builder, ChannelConfig, Config, Node } from 'ldk-node-rn';
import { NetAddress, ChannelDetails } from 'ldk-node-rn/lib/classes/Bindings';
import { Platform } from 'react-native';

let RNFS: any;
try {
  RNFS = require('react-native-fs');
} catch (error) {
  console.warn('react-native-fs not available, using fallback paths');
}
import { addressToString } from 'ldk-node-rn/lib/utils';

export interface LDKNodeInfo {
  nodeId: string;
  listeningAddress: string;
}

export interface LDKBalance {
  totalOnchain: number;
  spendableOnchain: number;
  totalLightning: number;
}

export interface LDKInvoice {
  bolt11: string;
  paymentHash: string;
}

class LDKService {
  private node: Node | null = null;
  private started: boolean = false;
  private nodeInfo: LDKNodeInfo | null = null;
  private readonly docDir: string;
  private readonly esploraServer: string;

  constructor() {
    const basePath = RNFS?.DocumentDirectoryPath || '/tmp';
    this.docDir = basePath + '/MESH_LDK_NODE/' + `${Platform.Version}/`;
    this.esploraServer = 'https://mutinynet.com/api/';
  }

  public async initializeNode(mnemonic?: string): Promise<boolean> {
    try {
      const storagePath = this.docDir;
      const ldkPort = Platform.OS === 'ios' && parseFloat(Platform.Version) >= 17 ? 2000 : 2001;
      const host = '0.0.0.0';

      const config = await new Config().create(
        storagePath,
        this.docDir + 'logs',
        'signet',
        [new NetAddress(host, ldkPort)],
      );

      const builder = await new Builder().fromConfig(config);

      await builder.setNetwork('signet');
      await builder.setEsploraServer(this.esploraServer);
      await builder.setGossipSourceRgs('https://mutinynet.ltbl.io/snapshot');

      if (mnemonic) {
        await builder.setEntropyBip39Mnemonic(mnemonic);
      }

      const lspNodeAddress = '44.219.111.31:39735';
      const lspNodePubkey = '0371d6fd7d75de2d0372d03ea00e8bacdacb50c27d0eaea0a76a0622eff1f5ef2b';
      const lspToken = 'JZWN9YLW';

      await builder.setLiquiditySourceLsps2(lspNodeAddress, lspNodePubkey, lspToken);

      this.node = await builder.build();
      this.started = await this.node.start();

      if (this.started) {
        await this.updateNodeInfo();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error initializing LDK node:', error);
      return false;
    }
  }

  private async updateNodeInfo(): Promise<void> {
    if (!this.node) return;

    try {
      const nodeId = await this.node.nodeId();
      const listeningAddr = await this.node.listeningAddresses();

      this.nodeInfo = {
        nodeId: nodeId.keyHex,
        listeningAddress: listeningAddr?.map(addr => addressToString(addr)).join(', ') || '',
      };
    } catch (error) {
      console.error('Error updating node info:', error);
    }
  }

  public async getBalance(): Promise<LDKBalance | null> {
    if (!this.node || !this.started) return null;

    try {
      await this.node.syncWallets();
      const totalOnchain = await this.node.totalOnchainBalanceSats() || 0;
      const spendableOnchain = await this.node.spendableOnchainBalanceSats() || 0;

      const channels = await this.listChannels();
      const totalLightning = channels?.reduce((sum, channel) => {
        return sum + (channel.outboundCapacityMsat || 0) / 1000;
      }, 0) || 0;

      return {
        totalOnchain,
        spendableOnchain,
        totalLightning,
      };
    } catch (error) {
      console.error('Error getting LDK balance:', error);
      return null;
    }
  }

  public async generateOnchainAddress(): Promise<string | null> {
    if (!this.node || !this.started) return null;

    try {
      const address = await this.node.newOnchainAddress();
      return address?.addressHex || null;
    } catch (error) {
      console.error('Error generating onchain address:', error);
      return null;
    }
  }

  public async createInvoice(amountSats: number, description: string = '', expirySeconds: number = 3600): Promise<LDKInvoice | null> {
    if (!this.node || !this.started) return null;

    try {
      const amountMsats = amountSats * 1000;

      let invoice;
      try {
        invoice = await this.node.receiveViaJitChannel(amountMsats, description, expirySeconds);
      } catch (jitError) {
        invoice = await this.node.receivePayment(amountMsats, description, expirySeconds);
      }

      if (invoice) {
        return {
          bolt11: invoice,
          paymentHash: '',
        };
      }

      return null;
    } catch (error) {
      console.error('Error creating LDK invoice:', error);
      return null;
    }
  }

  public async sendPayment(bolt11Invoice: string): Promise<boolean> {
    if (!this.node || !this.started) return false;

    try {
      const result = await this.node.sendPayment(bolt11Invoice);
      return true;
    } catch (error) {
      console.error('Error sending LDK payment:', error);
      return false;
    }
  }

  public async listChannels(): Promise<ChannelDetails[] | null> {
    if (!this.node || !this.started) return null;

    try {
      const channels = await this.node.listChannels();
      return channels || [];
    } catch (error) {
      console.error('Error listing LDK channels:', error);
      return null;
    }
  }

  public async openChannel(
    nodeId: string,
    address: string,
    port: number,
    channelAmountSats: number,
    pushAmountMsats: number = 0
  ): Promise<boolean> {
    if (!this.node || !this.started) return false;

    try {
      const netAddr = new NetAddress(address, port);
      const result = await this.node.connectOpenChannel(
        nodeId,
        netAddr,
        channelAmountSats,
        pushAmountMsats,
        null,
        true
      );
      return true;
    } catch (error) {
      console.error('Error opening LDK channel:', error);
      return false;
    }
  }

  public async closeChannel(channelId: string, counterpartyNodeId: string): Promise<boolean> {
    if (!this.node || !this.started) return false;

    try {
      const result = await this.node.closeChannel(
        { channelIdHex: channelId },
        counterpartyNodeId
      );
      return true;
    } catch (error) {
      console.error('Error closing LDK channel:', error);
      return false;
    }
  }

  public getNodeInfo(): LDKNodeInfo | null {
    return this.nodeInfo;
  }

  public isStarted(): boolean {
    return this.started;
  }

  public async stop(): Promise<void> {
    if (this.node && this.started) {
      try {
        await this.node.stop();
        this.started = false;
      } catch (error) {
        console.error('Error stopping LDK node:', error);
      }
    }
  }

  public static generateDemoMnemonic(): string {
    const demoMnemonics = [
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      'legal winner thank year wave sausage worth useful legal winner thank yellow',
      'letter advice cage absurd amount doctor acoustic avoid letter advice cage above',
    ];

    const index = Platform.OS === 'android' ? 0 : 1;
    return demoMnemonics[index];
  }
}

export const ldkService = new LDKService();