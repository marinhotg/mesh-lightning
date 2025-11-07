import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../src/store/appStore';
import { ldkService } from '../src/services/ldk.service';
import * as Haptics from 'expo-haptics';

interface LDKInitScreenProps {
  onInitialized: () => void;
}

export default function LDKInitScreen({ onInitialized }: LDKInitScreenProps) {
  const { initializeLDK } = useAppStore();
  const [mnemonic, setMnemonic] = useState(ldkService.generateDemoMnemonic());
  const [isInitializing, setIsInitializing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleInitialize = async () => {
    if (!mnemonic.trim()) {
      Alert.alert('Error', 'Please enter a valid mnemonic phrase');
      return;
    }

    setIsInitializing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const success = await initializeLDK(mnemonic.trim());

      if (success) {
        Alert.alert(
          'Lightning Node Started!',
          'Your Lightning node is now running and ready to receive payments.',
          [{ text: 'OK', onPress: onInitialized }]
        );
      } else {
        Alert.alert('Error', 'Failed to start Lightning node. Please check your mnemonic and try again.');
      }
    } catch (error) {
      console.error('Error initializing LDK:', error);
      Alert.alert('Error', 'Failed to initialize Lightning node. Please try again.');
    } finally {
      setIsInitializing(false);
    }
  };

  const generateNewMnemonic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMnemonic(ldkService.generateDemoMnemonic());
  };

  return (
    <ImageBackground
      source={require('../assets/estrela.jpg')}
      resizeMode="cover"
      style={styles.background}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <MaterialCommunityIcons name="lightning-bolt" size={80} color={colors.primary} />
            <Text style={styles.title}>Lightning Development Kit</Text>
            <Text style={styles.subtitle}>Initialize your Lightning Network node</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.label}>Mnemonic Seed Phrase</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  isFocused && { borderColor: colors.primary },
                ]}
                placeholder="Enter your 12-word mnemonic phrase..."
                placeholderTextColor={colors.textSecondary}
                value={mnemonic}
                onChangeText={setMnemonic}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                multiline
                textAlignVertical="top"
                editable={!isInitializing}
              />
            </View>

            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateNewMnemonic}
              disabled={isInitializing}
            >
              <MaterialCommunityIcons name="dice-6" size={20} color={colors.primary} />
              <Text style={styles.generateButtonText}>Use Demo Mnemonic</Text>
            </TouchableOpacity>

            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="information" size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                This will create a Lightning node on the Bitcoin Signet test network.
                Your node will be able to create invoices and receive payments via Lightning Network.
              </Text>
            </View>
          </View>

          <View style={styles.featuresCard}>
            <View style={styles.featureRow}>
              <MaterialCommunityIcons name="shield-check" size={24} color={colors.primary} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Non-Custodial</Text>
                <Text style={styles.featureDescription}>You control your private keys</Text>
              </View>
            </View>

            <View style={styles.featureRow}>
              <MaterialCommunityIcons name="network" size={24} color={colors.primary} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Signet Network</Text>
                <Text style={styles.featureDescription}>Safe test environment for development</Text>
              </View>
            </View>

            <View style={styles.featureRow}>
              <MaterialCommunityIcons name="cog" size={24} color={colors.primary} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Lightning Development Kit</Text>
                <Text style={styles.featureDescription}>Powered by Rust-based LDK library</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.initButton,
              (!mnemonic.trim() || isInitializing) && styles.disabledButton,
            ]}
            disabled={!mnemonic.trim() || isInitializing}
            onPress={handleInitialize}
          >
            {isInitializing ? (
              <ActivityIndicator size="small" color={colors.background} style={{ marginRight: 10 }} />
            ) : (
              <MaterialCommunityIcons name="rocket-launch" size={20} color={colors.background} />
            )}
            <Text style={styles.initButtonText}>
              {isInitializing ? 'Starting Lightning Node...' : 'Start Lightning Node'}
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
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 5,
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
    fontSize: 14,
    minHeight: 100,
    fontWeight: '500',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(1, 199, 242, 0.15)',
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
  },
  generateButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(1, 199, 242, 0.1)',
    borderRadius: 10,
    padding: 15,
    alignItems: 'flex-start',
    marginTop: 15,
  },
  infoText: {
    color: colors.text,
    fontSize: 13,
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
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
  buttonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.accent,
  },
  initButton: {
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
  initButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});