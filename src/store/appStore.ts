import { create } from 'zustand';
import { BluetoothPeer } from '../services/bluetooth.service';
import { MeshMessage } from '../types/mesh';
import { ldkService, LDKNodeInfo, LDKBalance } from '../services/ldk.service';

interface Transaction {
  id: string;
  invoice: string;
  status: 'pending' | 'confirmed' | 'failed';
  transmissionStatus?: 'transmitting' | 'transmitted' | null;
  timestamp: number;
  messageId?: string;
}

interface AppState {
  peers: BluetoothPeer[];
  transactions: Transaction[];
  balance: number;
  ldkNodeStarted: boolean;
  ldkNodeInfo: LDKNodeInfo | null;
  ldkBalance: LDKBalance | null;
  addPeer: (peer: BluetoothPeer) => void;
  removePeer: (peerId: string) => void;
  clearPeers: () => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, status: 'pending' | 'confirmed' | 'failed', transmissionStatus?: 'transmitting' | 'transmitted' | null) => void;
  updateBalance: (amount: number) => void;
  clearTransactions: () => void;
  initializeLDK: (mnemonic?: string) => Promise<boolean>;
  updateLDKBalance: () => Promise<void>;
  setLDKNodeInfo: (nodeInfo: LDKNodeInfo | null) => void;
  getLDKBalance: () => Promise<LDKBalance | null>;
}

export const useAppStore = create<AppState>((set, get) => ({
  peers: [],
  transactions: [],
  balance: 0,
  ldkNodeStarted: false,
  ldkNodeInfo: null,
  ldkBalance: null,

  addPeer: (peer: BluetoothPeer) =>
    set((state) => {
      const existingPeerIndex = state.peers.findIndex((p) => p.id === peer.id);

      if (existingPeerIndex >= 0) {
        const updatedPeers = [...state.peers];
        updatedPeers[existingPeerIndex] = peer;
        return { peers: updatedPeers };
      } else {
        return { peers: [...state.peers, peer] };
      }
    }),

  removePeer: (peerId: string) =>
    set((state) => ({
      peers: state.peers.filter((peer) => peer.id !== peerId),
    })),

  clearPeers: () => set(() => ({ peers: [] })),

  addTransaction: (transaction: Transaction) =>
    set((state) => ({
      transactions: [...state.transactions, transaction],
    })),

  updateTransaction: (id: string, status: 'pending' | 'confirmed' | 'failed', transmissionStatus?: 'transmitting' | 'transmitted' | null) =>
    set((state) => ({
      transactions: state.transactions.map((t) => (t.id === id ? { ...t, status, transmissionStatus } : t)),
    })),

  updateBalance: (amount: number) =>
    set((state) => ({
      balance: state.balance + amount,
    })),

  clearTransactions: () => set(() => ({ transactions: [] })),

  initializeLDK: async (mnemonic?: string) => {
    try {
      const success = await ldkService.initializeNode(mnemonic);
      if (success) {
        const nodeInfo = ldkService.getNodeInfo();
        set({
          ldkNodeStarted: true,
          ldkNodeInfo: nodeInfo,
        });
        // Update balance after initialization
        await get().updateLDKBalance();
      }
      return success;
    } catch (error) {
      console.error('Error initializing LDK in store:', error);
      return false;
    }
  },

  updateLDKBalance: async () => {
    try {
      const balance = await ldkService.getBalance();
      set({ ldkBalance: balance });
    } catch (error) {
      console.error('Error updating LDK balance in store:', error);
    }
  },

  setLDKNodeInfo: (nodeInfo: LDKNodeInfo | null) => {
    set({ ldkNodeInfo: nodeInfo });
  },

  getLDKBalance: async () => {
    try {
      const balance = await ldkService.getBalance();
      set({ ldkBalance: balance });
      return balance;
    } catch (error) {
      console.error('Error getting LDK balance in store:', error);
      return null;
    }
  },
}));
