import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../constants/Colors';
import { useAppStore } from '../src/store/appStore';
import { bluetoothService, BluetoothPeer } from '../src/services/bluetooth.service';
import { meshService } from '../src/services/mesh.service';

type PeersScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Peers'>;

export default function PeersScreen() {
  const navigation = useNavigation<PeersScreenNavigationProp>();
  const { peers, addPeer, clearPeers } = useAppStore();
  const [isScanning, setIsScanning] = useState(false);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const isScanningRef = useRef(false);

  const updateScanningState = useCallback((value: boolean) => {
    if (!isMountedRef.current) return;
    isScanningRef.current = value;
    setIsScanning(value);
  }, []);

  const stopScanning = useCallback(async () => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    try {
      await bluetoothService.stopScanning();
    } catch (error) {
      console.error('Error stopping scan:', error);
    } finally {
      updateScanningState(false);
    }
  }, [updateScanningState]);

  const startScanning = useCallback(
    async (shouldClearPeers: boolean = true) => {
      if (!isMountedRef.current || isScanningRef.current) {
        return;
      }

      try {
        updateScanningState(true);
        if (shouldClearPeers) {
          clearPeers();
        }

        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
        }

        await bluetoothService.startScanning();

        scanTimeoutRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          updateScanningState(false);
        }, 30000);
      } catch (error: any) {
        console.error('Error starting scan:', error);
        updateScanningState(false);

        let errorMessage = 'Could not start device scanning.';

        if (error.message?.includes('not enabled')) {
          errorMessage = 'Bluetooth is disabled. Enable Bluetooth in device settings.';
        } else if (error.message?.includes('permissions')) {
          errorMessage = 'Bluetooth permissions required. Grant the requested permissions.';
        } else if (error.message?.includes('not initialized')) {
          errorMessage = 'Bluetooth initialization error. Try restarting the app.';
        }

        Alert.alert('Bluetooth Error', errorMessage, [{ text: 'OK' }]);
      }
    },
    [clearPeers, updateScanningState]
  );

  useEffect(() => {
    isMountedRef.current = true;

    startScanning(true).catch((error) => {
      console.error('Failed to start scanning:', error);
    });

    const unsubscribe = bluetoothService.onPeerDiscovered(async (peer: BluetoothPeer) => {
      if (!isMountedRef.current) return;

      try {
        addPeer(peer);

        const device = bluetoothService.getDiscoveredDevice(peer.id);
        if (device) {
          try {
            const connected = await bluetoothService.connectToDevice(device);
            if (connected && isMountedRef.current) {
              meshService.addConnectedPeer(peer.id, device);
            }
          } catch (error) {
            console.error('Failed to auto-connect to peer:', error);
          }
        }
      } catch (error) {
        console.error('Error handling peer discovery:', error);
      }
    });

    return () => {
      isMountedRef.current = false;
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }
      stopScanning().catch(console.error);
      unsubscribe();
    };
  }, [addPeer, startScanning, stopScanning]);

  const refreshScan = async () => {
    await stopScanning();
    setTimeout(() => {
      if (isMountedRef.current) {
        startScanning(true);
      }
    }, 600);
  };

  const renderPeerItem = ({ item }: { item: BluetoothPeer }) => {
    const getRssiColor = (rssi: number) => {
      if (rssi > -50) return colors.success;
      if (rssi > -70) return colors.warning;
      return colors.error;
    };

    const getRssiIcon = (rssi: number) => {
      if (rssi > -50) return 'wifi';
      if (rssi > -70) return 'wifi-strength-2';
      return 'wifi-strength-1';
    };

    return (
      <View style={styles.peerItem}>
        <View style={styles.peerInfo}>
          <MaterialCommunityIcons name="bluetooth" size={24} color={colors.primary} />
          <View style={styles.peerDetails}>
            <Text style={styles.peerName}>{item.name || 'Unknown device'}</Text>
            <Text style={styles.peerId}>{item.id}</Text>
          </View>
        </View>
        <View style={styles.rssiContainer}>
          <MaterialCommunityIcons
            name={getRssiIcon(item.rssi)}
            size={20}
            color={getRssiColor(item.rssi)}
          />
          <Text style={[styles.rssiText, { color: getRssiColor(item.rssi) }]}>{item.rssi} dBm</Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name={isScanning ? 'bluetooth-audio' : 'bluetooth-off'}
        size={64}
        color={colors.textSecondary}
      />
      <Text style={styles.emptyStateTitle}>
        {isScanning ? 'Scanning for devices...' : 'No devices found'}
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {isScanning
          ? 'Please wait while we search for nearby devices.'
          : 'Tap "Refresh" to search again.'}
      </Text>
    </View>
  );

  return (
    <ImageBackground
      source={require('../assets/estrela.jpg')}
      resizeMode="cover"
      style={styles.background}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>BLE Devices</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={refreshScan}
              disabled={isScanning}
            >
              <Feather
                name="refresh-cw"
                size={24}
                color={isScanning ? colors.textSecondary : colors.primary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.statusContainer}>
            <MaterialCommunityIcons
              name={isScanning ? 'bluetooth-audio' : 'bluetooth'}
              size={20}
              color={isScanning ? colors.primary : colors.textSecondary}
            />
            <Text style={styles.statusText}>
              {isScanning ? 'Scanning...' : `${peers.length} devices found`}
            </Text>
          </View>

          <FlatList
            data={peers}
            renderItem={renderPeerItem}
            keyExtractor={(item) => item.id}
            style={styles.peersList}
            contentContainerStyle={peers.length === 0 ? styles.emptyContainer : undefined}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  statusText: {
    color: colors.text,
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '500',
  },
  peersList: {
    flex: 1,
  },
  peerItem: {
    backgroundColor: colors.accent,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  peerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  peerDetails: {
    marginLeft: 15,
    flex: 1,
  },
  peerName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  peerId: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  rssiContainer: {
    alignItems: 'center',
  },
  rssiText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
});
