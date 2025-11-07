import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ImageBackground,
} from 'react-native';
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
          <View style={[styles.statusCard, { backgroundColor: colors.accent }]}>
            <MaterialCommunityIcons name="bluetooth-off" size={20} color={colors.warning} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>STATUS: Bluetooth desconectado</Text>
              <Text style={styles.statusSubtitle}>Conecte para iniciar a rede mesh.</Text>
            </View>
          </View>
        );
      case 'internetDisconnected':
        return (
          <View style={[styles.statusCard, { backgroundColor: colors.accent }]}>
            <MaterialCommunityIcons name="bluetooth" size={20} color={colors.primary} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>STATUS: Bluetooth conectado</Text>
              <Text style={styles.statusSubtitle}>internet desconectada</Text>
            </View>
          </View>
        );
      case 'internetConnected':
        return (
          <View style={[styles.statusCard, { backgroundColor: colors.success }]}>
            <Feather name="globe" size={20} color={colors.background} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>STATUS: Internet conectada</Text>
              <Text style={styles.statusSubtitle}>Conectado a internet: roteando transações</Text>
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
          <Text style={styles.actionButtonText}>Conectar Bluetooth</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity style={styles.singleActionButton} onPress={handleSendPress}>
        <Feather name="arrow-up-right" size={20} color={colors.background} />
        <Text style={styles.actionButtonText}>ENVIAR</Text>
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
              source={require('../assets/MeshLightning.jpg')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Wrapper para centralizar o conteúdo principal */}
          <View style={styles.mainContent}>
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceTitle}>Saldo Disponível</Text>
              <Text style={styles.balanceAmount}>18.000 sats</Text>
            </View>

            {renderNetworkStatusCard()}

            {renderActionButton()}
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

// Estilos atualizados
const styles = StyleSheet.create({
  // 3. Novo estilo para o background
  background: {
    flex: 1,
  },
  // 4. Estilo safeArea agora é transparente
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent', // Remover o fundo sólido
  },
  container: {
    flex: 1,
    padding: 20,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 28,
  },
  logoImage: {
    width: '100%',
    height: 100,
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
