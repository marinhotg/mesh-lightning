import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '../constants/Colors';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type SendingStatusNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SendingStatus'>;

export default function SendingStatusModal() {
  const navigation = useNavigation<SendingStatusNavigationProp>();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />

      <Text style={styles.title}>Enviando Pagamento...</Text>

      <Text style={styles.subtitle}>
        Sua transação está sendo enviada de forma segura pela rede mesh. Isso pode levar alguns
        instantes.
      </Text>

      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.closeButtonText}>Fechar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 15,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  closeButton: {
    backgroundColor: colors.accent,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  closeButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
