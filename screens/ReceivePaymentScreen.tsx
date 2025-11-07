import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/Colors';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

type ReceivePaymentNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ReceivePayment'>;

const SATOSHI_IN_BTC = 100_000_000;

export default function ReceivePaymentScreen() {
  const navigation = useNavigation<ReceivePaymentNavigationProp>();
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [invoice, setInvoice] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [isFocusedAmount, setIsFocusedAmount] = useState(false);
  const [isFocusedMemo, setIsFocusedMemo] = useState(false);

  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [usdValue, setUsdValue] = useState('');

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
      }
    };

    fetchBtcPrice();
  }, []);

  const generateInvoice = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (btcPrice) {
      const btcValue = parseFloat(amount) / SATOSHI_IN_BTC;
      const calculatedUsd = btcValue * btcPrice;
      setUsdValue(calculatedUsd.toFixed(2));
    } else {
      setUsdValue('...');
    }
    //mocado
    const mockInvoice = `lnbc${amount}000n1pj9x7ztpp5qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqsdqqcqzpgxqyz5vqsp5qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq9qyyssqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqxqq`;
    setInvoice(mockInvoice);
    setShowQR(true);
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(invoice);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', 'Invoice copied to clipboard');
  };

  const shareInvoice = async () => {
    try {
      await Share.share({
        message: invoice,
        title: 'Lightning Invoice',
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAmount('');
    setMemo('');
    setInvoice('');
    setShowQR(false);
    setUsdValue('');
  };

  if (showQR && invoice) {
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
            <Text style={styles.headerTitle}>Receive Payment</Text>
            <TouchableOpacity onPress={resetForm} style={styles.resetButton}>
              <Feather name="refresh-cw" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.qrContainer}>
            <View style={styles.qrCard}>
              <View style={styles.qrCodeWrapper}>
                <QRCode
                  value={invoice}
                  size={250}
                  backgroundColor="white"
                  color={colors.background}
                />
              </View>

              <View style={styles.amountDisplayContainer}>
                <Text style={styles.amountLabel}>Amount</Text>
                <Text style={styles.amountDisplay}>
                  {parseInt(amount).toLocaleString('en-US')} sats
                </Text>
                <Text style={styles.amountDisplaySubtitle}>≈ ${usdValue} USD</Text>
                {memo ? (
                  <>
                    <Text style={styles.memoLabel}>Memo</Text>
                    <Text style={styles.memoDisplay}>{memo}</Text>
                  </>
                ) : null}
              </View>

              <View style={styles.invoiceContainer}>
                <Text style={styles.invoiceLabel}>Lightning Invoice</Text>
                <Text style={styles.invoiceText} numberOfLines={2} ellipsizeMode="middle">
                  {invoice}
                </Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={copyToClipboard}>
                  <Feather name="copy" size={20} color={colors.primary} />
                  <Text style={styles.actionButtonText}>Copy</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={shareInvoice}>
                  <Feather name="share-2" size={20} color={colors.primary} />
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoCard}>
                <MaterialCommunityIcons name="information" size={20} color={colors.primary} />
                <Text style={styles.infoText}>
                  This invoice expires in 24 hours. Payment can be received via the mesh network or
                  Lightning Network.
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    );
  }

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
          <Text style={styles.headerTitle}>Receive Payment</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.formCard}>
            <Text style={styles.label}>Amount (sats)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, isFocusedAmount && { borderColor: colors.primary }]}
                placeholder="1000"
                placeholderTextColor={colors.textSecondary}
                value={amount}
                onChangeText={setAmount}
                onFocus={() => setIsFocusedAmount(true)}
                onBlur={() => setIsFocusedAmount(false)}
                keyboardType="numeric"
              />
              <Text style={styles.inputSuffix}>sats</Text>
            </View>

            {/* Automated USD conversion */}
            {amount && parseFloat(amount) > 0 && (
              <View style={styles.conversionContainer}>
                <Text style={styles.conversionText}>
                  {btcPrice
                    ? `≈ $${((parseFloat(amount) / SATOSHI_IN_BTC) * btcPrice).toFixed(2)} USD`
                    : 'Loading price...'}
                </Text>
              </View>
            )}

            <Text style={[styles.label, { marginTop: 20 }]}>Memo (optional)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  isFocusedMemo && { borderColor: colors.primary },
                  { minHeight: 80 },
                ]}
                placeholder="Ex: Payment for coffee"
                placeholderTextColor={colors.textSecondary}
                value={memo}
                onChangeText={setMemo}
                onFocus={() => setIsFocusedMemo(true)}
                onBlur={() => setIsFocusedMemo(false)}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.quickAmounts}>
              <Text style={styles.quickAmountsLabel}>Quick amounts:</Text>
              <View style={styles.quickAmountsRow}>
                {['1000', '5000', '10000', '50000'].map((quickAmount) => (
                  <TouchableOpacity
                    key={quickAmount}
                    style={[
                      styles.quickAmountButton,
                      amount === quickAmount && styles.quickAmountButtonActive,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setAmount(quickAmount);
                    }}
                  >
                    <Text
                      style={[
                        styles.quickAmountText,
                        amount === quickAmount && styles.quickAmountTextActive,
                      ]}
                    >
                      {parseInt(quickAmount).toLocaleString('en-US')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.featuresCard}>
            <View style={styles.featureRow}>
              <MaterialCommunityIcons name="shield-check" size={24} color={colors.primary} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Secure & Private</Text>
                <Text style={styles.featureDescription}>End-to-end encrypted payments</Text>
              </View>
            </View>

            <View style={styles.featureRow}>
              <MaterialCommunityIcons name="lightning-bolt" size={24} color={colors.primary} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Lightning Network</Text>
                <Text style={styles.featureDescription}>Instant and cheap transactions</Text>
              </View>
            </View>

            <View style={styles.featureRow}>
              <MaterialCommunityIcons name="wifi" size={24} color={colors.primary} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Mesh Network</Text>
                <Text style={styles.featureDescription}>Works without internet via Bluetooth</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.confirmButtonContainer}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!amount || parseFloat(amount) <= 0) && styles.disabledButton,
            ]}
            disabled={!amount || parseFloat(amount) <= 0}
            onPress={generateInvoice}
          >
            <MaterialCommunityIcons name="qrcode" size={20} color={colors.background} />
            <Text style={styles.confirmButtonText}>Generate QR Code</Text>
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
  resetButton: {
    padding: 5,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  formCard: {
    backgroundColor: 'rgba(57, 122, 138, 0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: 'rgba(7, 20, 36, 0.5)',
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    fontWeight: '600',
  },
  inputSuffix: {
    position: 'absolute',
    right: 15,
    top: 15,
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
  },
  conversionContainer: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  conversionText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  quickAmounts: {
    marginTop: 20,
  },
  quickAmountsLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 10,
  },
  quickAmountsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickAmountButton: {
    backgroundColor: 'rgba(7, 20, 36, 0.5)',
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  quickAmountButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickAmountText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  quickAmountTextActive: {
    color: colors.background,
  },
  featuresCard: {
    backgroundColor: 'rgba(57, 122, 138, 0.15)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  featureTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  featureDescription: {
    color: colors.textSecondary,
    fontSize: 14,
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
    opacity: 0.5,
  },
  confirmButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  qrContainer: {
    padding: 20,
    alignItems: 'center',
  },
  qrCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  qrCodeWrapper: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  amountDisplayContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 5,
  },
  amountDisplay: {
    color: colors.background,
    fontSize: 32,
    fontWeight: 'bold',
  },
  amountDisplaySubtitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 2,
  },
  memoLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 10,
    marginBottom: 5,
  },
  memoDisplay: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  invoiceContainer: {
    backgroundColor: 'rgba(7, 20, 36, 0.05)',
    borderRadius: 10,
    padding: 15,
    width: '100%',
    marginBottom: 20,
  },
  invoiceLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
  invoiceText: {
    color: colors.background,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(1, 199, 242, 0.15)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(1, 199, 242, 0.1)',
    borderRadius: 10,
    padding: 15,
    alignItems: 'flex-start',
  },
  infoText: {
    color: colors.background,
    fontSize: 13,
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
});
