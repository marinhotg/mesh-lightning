# ⚡ MeshLightning

**Bitcoin Lightning payments over Bluetooth mesh when internet fails**

Lightning Network requires constant internet connectivity. This fails in rural areas, disasters, or unreliable infrastructure.

**Mesh networking** allows devices to connect and communicate directly with each other, forming a decentralized network where each device can relay messages. Mesh Lightning uses this to route payment information through nearby phones via Bluetooth until reaching an internet-connected node.

```
[Vendor OFFLINE] --Bluetooth--> [Customer OFFLINE] --Bluetooth--> [Gateway ONLINE] --> Lightning Network
```

## Architecture

- **Lightning Node:** LDK-based Lightning implementation
- **Mesh Network:** Multi-hop Bluetooth relay system
- **Payment Queue:** Offline transaction storage with auto-sync

## Tech Stack

- React Native + Expo + TypeScript
- Lightning Development Kit (LDK Node RN v0.3.1)
- Bitcoin Signet testnet
- Bluetooth LE mesh networking

## LDK Integration

**Core Classes:** `Builder`, `Config`, `Node`, `NetAddress`, `ChannelDetails`

**Lightning Operations:**
- `node.receiveViaJitChannel()` - Invoice generation with JIT channels
- `node.sendPayment()` - Lightning payments
- `node.connectOpenChannel()` - Channel management
- `node.syncWallets()` - Wallet synchronization

**Network:** Bitcoin Signet with LSPS2 liquidity provider

## Quick Start

```bash
npm install
npm start
```

**Demo:** Two phones, one offline creates invoice → travels via Bluetooth → other phone pays online

---
*Built with Lightning Development Kit for unstoppable Bitcoin payments*
