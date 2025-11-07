import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '../constants/Colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppStore } from '../src/store/appStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type SendingStatusNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SendingStatus'>;
type SendingStatusRouteProp = RouteProp<RootStackParamList, 'SendingStatus'>;

export default function SendingStatusModal() {
  const navigation = useNavigation<SendingStatusNavigationProp>();
  const route = useRoute<SendingStatusRouteProp>();
  const { transactions } = useAppStore();
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'failed'>('pending');

  const transactionId = route.params?.transactionId;
  const transaction = transactionId ? transactions.find((t) => t.id === transactionId) : null;

  useEffect(() => {
    if (transaction && transaction.status) {
      setStatus(transaction.status);
    }
  }, [transaction, transactions]);

  useEffect(() => {
    if (!transactionId) return;

    const interval = setInterval(() => {
      try {
        const currentTransaction = useAppStore
          .getState()
          .transactions.find((t) => t.id === transactionId);
        if (currentTransaction && currentTransaction.status) {
          setStatus(currentTransaction.status);
          if (currentTransaction.status !== 'pending') {
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Error checking transaction status:', error);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [transactionId]);

  const getStatusContent = () => {
    switch (status) {
      case 'confirmed':
        return {
          icon: 'check-circle',
          title: 'Payment Confirmed',
          subtitle: 'Your payment has been successfully processed through the mesh network.',
          color: colors.success,
        };
      case 'failed':
        return {
          icon: 'close-circle',
          title: 'Payment Failed',
          subtitle: 'The payment could not be processed. Please try again.',
          color: colors.error,
        };
      default:
        return {
          icon: 'loading',
          title: 'Sending Payment...',
          subtitle:
            'Your transaction is being securely sent over the mesh network. This may take a few moments.',
          color: colors.primary,
        };
    }
  };

  const statusContent = getStatusContent();

  return (
    <View style={styles.container}>
      {status === 'pending' ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <MaterialCommunityIcons
          name={statusContent.icon as any}
          size={64}
          color={statusContent.color}
        />
      )}

      <Text style={styles.title}>{statusContent.title}</Text>

      <Text style={styles.subtitle}>{statusContent.subtitle}</Text>

      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.closeButtonText}>Close</Text>
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
