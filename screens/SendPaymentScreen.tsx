import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/Colors';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { meshService } from '../src/services/mesh.service';
import { useAppStore } from '../src/store/appStore';
import { ldkService } from '../src/services/ldk.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';

type SendPaymentNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SendPayment'>;

export default function SendPaymentScreen() {
  const navigation = useNavigation<SendPaymentNavigationProp>();
  const [invoice, setInvoice] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { addTransaction, ldkNodeStarted, updateBalance } = useAppStore();

  const decodedInvoice = invoice.length > 10 ? { amount: 1200, memo: 'Test payment' } : null;

  const handleSendPayment = async () => {
    if (!invoice.trim()) {
      Alert.alert('Error', 'Please enter a Lightning invoice');
      return;
    }

    if (!ldkNodeStarted) {
      Alert.alert('Error', 'Lightning node not started. Please initialize the node first.');
      return;
    }

    setIsSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const transactionId = `tx_${Date.now()}`;

      // Try to send payment with LDK
      const success = await ldkService.sendPayment(invoice.trim());

      if (success) {
        addTransaction({
          id: transactionId,
          invoice: invoice.trim(),
          status: 'confirmed',
          timestamp: Date.now(),
        });

        // Simulate deducting amount from balance (in a real app, this would be handled by LDK)
        const estimatedAmount = decodedInvoice?.amount || 1000;
        updateBalance(-estimatedAmount);

        Alert.alert(
          'Payment Sent!',
          `Lightning payment sent successfully`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Payment Failed', 'Could not send Lightning payment. Trying via mesh network...');

        // Fallback to mesh network
        const messageId = await meshService.sendPaymentRequest(
          invoice.trim(),
          decodedInvoice?.amount || 1000,
          decodedInvoice?.memo || 'Mesh payment'
        );

        addTransaction({
          id: transactionId,
          invoice: invoice.trim(),
          status: 'pending',
          timestamp: Date.now(),
          messageId,
        });

        navigation.navigate('SendingStatus', { transactionId });
      }
    } catch (error: any) {
      console.error('Failed to send payment:', error);
      Alert.alert('Error', 'Failed to send payment. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ImageBackground
      source={require('../assets/estrela.jpg')}
      resizeMode="cover"
      style={styles.background}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="chevron-left" size={28} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Send Payment</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.label}>Lightning Invoice</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, isFocused && { borderColor: colors.primary }]}
              placeholder="lnbc..."
              placeholderTextColor={colors.textSecondary}
              value={invoice}
              onChangeText={setInvoice}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              multiline
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.auxButtonsContainer}>
            <TouchableOpacity style={styles.auxButton}>
              <Feather name="clipboard" size={20} color={colors.primary} />
              <Text style={styles.auxButtonText}>Paste</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.auxButton}>
              <Feather name="camera" size={20} color={colors.primary} />
              <Text style={styles.auxButtonText}>Scan</Text>
            </TouchableOpacity>
          </View>

          {decodedInvoice && (
            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>Payment Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount</Text>
                <Text style={styles.detailValue}>
                  {decodedInvoice.amount.toLocaleString()} sats
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Memo</Text>
                <Text style={styles.detailValue}>{decodedInvoice.memo}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.confirmButtonContainer}>
          <TouchableOpacity
            style={[styles.confirmButton, (!invoice.trim() || isSending) && styles.disabledButton]}
            disabled={!invoice.trim() || isSending}
            onPress={handleSendPayment}
          >
            <MaterialCommunityIcons
              name={isSending ? "loading" : "lightning-bolt"}
              size={20}
              color="white"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.confirmButtonText}>
              {isSending ? 'Sending Payment...' : 'Send Lightning Payment'}
            </Text>
          </TouchableOpacity>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 40,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 35,
    paddingVertical: 20,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(57, 122, 138, 0.2)',
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  auxButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 30,
  },
  auxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginRight: 15,
  },
  auxButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  detailsCard: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  detailsTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  detailValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.accent,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 60,
  },
  disabledButton: {
    backgroundColor: colors.accent,
    opacity: 0.7,
  },
  confirmButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
