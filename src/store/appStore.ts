import { create } from 'zustand';
import { BluetoothPeer } from '../services/bluetooth.service';

interface AppState {
  peers: BluetoothPeer[];
  addPeer: (peer: BluetoothPeer) => void;
  removePeer: (peerId: string) => void;
  clearPeers: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  peers: [],

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
}));
