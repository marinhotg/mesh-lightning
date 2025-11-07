import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/Colors';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useNetworkState } from '../hooks/useNetworkState';
import { useBluetoothState } from '../hooks/useBluetoothState';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

type DisplayStatus =
  | 'bluetoothDisconnected'
  | 'internetDisconnected'
  | 'internetConnected'
  | 'bothConnected';

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { isInternetConnected } = useNetworkState();
  const { isBluetoothConnected, toggleBluetooth } = useBluetoothState();
  const [displayStatus, setDisplayStatus] = useState<DisplayStatus>('bluetoothDisconnected');

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
    if (displayStatus === 'internetConnected' || displayStatus === 'bothConnected') {
      navigation.navigate('SendOnline');
    } else {
      navigation.navigate('SendPayment');
    }
  };

  const renderNetworkStatusCard = () => {
    switch (displayStatus) {
      case 'bluetoothDisconnected':
        return (
          <View style={[styles.statusCard, { backgroundColor: "#b86e14" }]}>
            <MaterialCommunityIcons name="bluetooth-off" size={20} color={"#ffff"} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>STATUS: Bluetooth disconnected</Text>
              <Text style={styles.statusSubtitle}>Connect to start the mesh network.</Text>
            </View>
          </View>
        );
      case 'internetDisconnected':
        return (
          <View style={[styles.statusCard, { backgroundColor: colors.accent }]}>
            <MaterialCommunityIcons name="bluetooth" size={20} color={colors.primary} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>STATUS: Bluetooth connected</Text>
              <Text style={styles.statusSubtitle}>Internet disconnected</Text>
            </View>
          </View>
        );
      case 'internetConnected':
        return (
          <View style={[styles.statusCard, { backgroundColor: colors.success }]}>
            <Feather name="globe" size={20} color={colors.background} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>STATUS: Internet connected</Text>
              <Text style={styles.statusSubtitle}>Connected to the internet: routing transactions</Text>
            </View>
          </View>
        );
      case 'bothConnected':
        return (
          <View style={[styles.statusCard, { backgroundColor: colors.success }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="bluetooth" size={18} color={colors.background} />
              <Feather name="globe" size={18} color={colors.background} style={{ marginLeft: 5 }} />
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>STATUS: Internet + Bluetooth</Text>
              <Text style={styles.statusSubtitle}>
                Bluetooth: {isBluetoothConnected ? 'ON' : 'OFF'} | Roteando transações
              </Text>
            </View>
          </View>
        );
    }
  };

  const renderActionButton = () => {
    if (displayStatus === 'bluetoothDisconnected') {
      return (
        <TouchableOpacity style={styles.singleActionButton} onPress={toggleBluetooth}>
          <MaterialCommunityIcons name="bluetooth" size={20} color={colors.background} />
          <Text style={styles.actionButtonText}>Connect Bluetooth</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity style={styles.singleActionButton} onPress={handleSendPress}>
        <Feather name="arrow-up-right" size={20} color={colors.background} />
        <Text style={styles.actionButtonText}>SEND</Text>
      </TouchableOpacity>
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
            <Image
              source={require('../assets/MeshLightning.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.mainContent}>
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceTitle}>Available Balance</Text>
              <Text style={styles.balanceAmount}>18,000 sats</Text>
            </View>

            {renderNetworkStatusCard()}

            {renderActionButton()}
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
    paddingTop: 30, 
    marginBottom: 120,  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    marginTop: 15,
  },
  logoImage: {
    width: '100%',
    height: 200,
  },
  balanceContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  balanceTitle: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  balanceAmount: {
    color: colors.text,
    fontSize: 40,
    fontWeight: 'bold',
  },
  statusCard: {
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusTextContainer: {
    marginLeft: 15,
  },
  statusTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  singleActionButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  actionButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});