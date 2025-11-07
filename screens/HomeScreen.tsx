import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/Colors';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useNetworkState } from '../hooks/useNetworkState';
import { useBluetoothState } from '../hooks/useBluetoothState';
import * as Haptics from 'expo-haptics';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

type DisplayStatus =
  | 'bluetoothDisconnected'
  | 'internetDisconnected'
  | 'internetConnected'
  | 'bothConnected';

const SATOSHI_IN_BTC = 100_000_000;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { isInternetConnected } = useNetworkState();
  const { isBluetoothConnected, toggleBluetooth } = useBluetoothState();
  const [displayStatus, setDisplayStatus] = useState<DisplayStatus>('bluetoothDisconnected');

  const [satsBalance, setSatsBalance] = useState(18000);
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [usdBalance, setUsdBalance] = useState<string>('...');

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const fetchBtcPrice = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
        );
        if (!response.ok) {
          throw new Error('Failed to fetch price');
        }
        const data = await response.json();
        setBtcPrice(data.bitcoin.usd);
      } catch (error) {
        console.error('Error fetching BTC price:', error);
        setUsdBalance('Error');
      }
    };

    fetchBtcPrice();
  }, []);

  useEffect(() => {
    if (btcPrice !== null) {
      const btcValue = satsBalance / SATOSHI_IN_BTC;
      const calculatedUsd = btcValue * btcPrice;
      setUsdBalance(calculatedUsd.toFixed(2));
    }
  }, [btcPrice, satsBalance]);

  useEffect(() => {
    if (isInternetConnected && isBluetoothConnected) {
      setDisplayStatus('bothConnected');
    } else if (isInternetConnected) {
      setDisplayStatus('internetConnected');
    } else if (isBluetoothConnected) {
      setDisplayStatus('internetDisconnected');
    } else {
      setDisplayStatus('bluetoothDisconnected');
    }
  }, [isInternetConnected, isBluetoothConnected]);

  const handleSendPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (displayStatus === 'internetConnected' || displayStatus === 'bothConnected') {
      navigation.navigate('SendOnline');
    } else {
      navigation.navigate('SendPayment');
    }
  };

  const handleReceivePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('ReceivePayment');
  };

  const renderNetworkStatusCard = () => {
    switch (displayStatus) {
      case 'bluetoothDisconnected':
        return (
          <Animated.View
            style={[styles.statusCard, { backgroundColor: '#b86e14', opacity: fadeAnim }]}
          >
            <MaterialCommunityIcons name="bluetooth-off" size={24} color={'#ffff'} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>STATUS: Bluetooth Disconnected</Text>
              <Text style={styles.statusSubtitle}>Connect to start the mesh network</Text>
            </View>
          </Animated.View>
        );
      case 'internetDisconnected':
        return (
          <Animated.View
            style={[styles.statusCard, { backgroundColor: colors.accent, opacity: fadeAnim }]}
          >
            <MaterialCommunityIcons name="bluetooth" size={24} color={colors.primary} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>STATUS: Bluetooth Connected</Text>
              <Text style={styles.statusSubtitle}>Internet disconnected • Mesh mode active</Text>
            </View>
          </Animated.View>
        );
      case 'internetConnected':
        return (
          <Animated.View
            style={[styles.statusCard, { backgroundColor: colors.success, opacity: fadeAnim }]}
          >
            <Feather name="globe" size={24} color={colors.background} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>STATUS: Internet Connected</Text>
              <Text style={styles.statusSubtitle}>Routing Lightning Network transactions</Text>
            </View>
          </Animated.View>
        );
      case 'bothConnected':
        return (
          <Animated.View
            style={[
              styles.statusCard,
              {
                backgroundColor: colors.success,
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={styles.statusIconsContainer}>
              <MaterialCommunityIcons name="bluetooth" size={22} color={colors.background} />
              <Feather name="globe" size={22} color={colors.background} style={{ marginLeft: 5 }} />
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>STATUS: Fully Connected</Text>
              <Text style={styles.statusSubtitle}>Mesh + Internet • Routing transactions</Text>
            </View>
          </Animated.View>
        );
    }
  };

  const renderActionButtons = () => {
    if (displayStatus === 'bluetoothDisconnected') {
      return (
        <TouchableOpacity
          style={styles.singleActionButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            toggleBluetooth();
          }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="bluetooth" size={22} color={colors.background} />
          <Text style={styles.actionButtonText}>Connect Bluetooth</Text>
        </TouchableOpacity>
      );
    }

    return (
      <Animated.View style={[styles.doubleButtonContainer, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={[styles.actionButton, styles.receiveButton]}
          onPress={handleReceivePress}
          activeOpacity={0.8}
        >
          <Feather name="arrow-down-left" size={22} color={colors.primary} />
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>RECEIVE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.sendButton]}
          onPress={handleSendPress}
          activeOpacity={0.8}
        >
          <Feather name="arrow-up-right" size={22} color={colors.background} />
          <Text style={[styles.actionButtonText, { color: colors.background }]}>SEND</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <ImageBackground
      source={require('../assets/estrela.jpg')}
      resizeMode="cover"
      style={styles.background}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.peersButton}
              onPress={() => navigation.navigate('Peers')}
            >
              <MaterialCommunityIcons name="bluetooth" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Image
              source={require('../assets/MeshLightning.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View style={styles.placeholder} />
          </View>

          <View style={styles.mainContent}>
            <Animated.View style={[styles.balanceContainer, { opacity: fadeAnim }]}>
              <Text style={styles.balanceTitle}>Available Balance</Text>
              <Text style={styles.balanceAmount}>{satsBalance.toLocaleString('en-US')} sats</Text>
              <Text style={styles.balanceSubtitle}>≈ ${usdBalance} USD</Text>
            </Animated.View>

            {renderNetworkStatusCard()}

            {/* <Animated.View 
              style={[
                styles.statsContainer, 
                { opacity: fadeAnim }
              ]}
            >
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="network" size={20} color={colors.primary} />
                <Text style={styles.statLabel}>Nodes</Text>
                <Text style={styles.statValue}>12</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <MaterialCommunityIcons name="swap-horizontal" size={20} color={colors.primary} />
                <Text style={styles.statLabel}>Routes</Text>
                <Text style={styles.statValue}>84</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <MaterialCommunityIcons name="chart-line" size={20} color={colors.primary} />
                <Text style={styles.statLabel}>Today</Text>
                <Text style={styles.statValue}>3.2k</Text>
              </View>
            </Animated.View> */}

            {renderActionButtons()}
          </View>
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
  mainContent: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 20,
    marginBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 28,
  },
  peersButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 22,
  },
  placeholder: {
    width: 44,
    height: 44,
  },
  logoImage: {
    width: '100%',
    height: 180,
  },
  balanceContainer: {
    alignItems: 'center',
    marginVertical: 25,
  },
  balanceTitle: {
    color: colors.textSecondary,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  balanceAmount: {
    color: colors.text,
    fontSize: 48,
    fontWeight: 'bold',
    marginTop: 5,
  },
  balanceSubtitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 5,
  },
  statusCard: {
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  statusTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  statusSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(57, 122, 138, 0.2)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.accent,
    marginHorizontal: 10,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 5,
  },
  statValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  singleActionButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  doubleButtonContainer: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  receiveButton: {
    backgroundColor: 'rgba(57, 122, 138, 0.3)',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  sendButton: {
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
});
