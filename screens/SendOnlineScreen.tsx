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

type SendOnlineNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SendOnline'>;

export default function SendOnlineScreen() {
  const navigation = useNavigation<SendOnlineNavigationProp>();
  const [invoice, setInvoice] = useState('');
  const [isFocused, setIsFocused] = useState(false);

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
          <Text style={styles.headerTitle}>Send Online</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.label}>Lightning Network itens:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, isFocused && { borderColor: colors.primary }]}
              placeholder="invoice or node ID..."
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
        </ScrollView>

        <View style={styles.confirmButtonContainer}>
          <TouchableOpacity
            style={[styles.confirmButton, !invoice && styles.disabledButton]}
            disabled={!invoice}
            onPress={() => navigation.navigate('SendingStatus')}
          >
            <Text style={styles.confirmButtonText}>Send via Lightning Network</Text>
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