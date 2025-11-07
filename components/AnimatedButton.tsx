import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, ViewStyle, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

interface AnimatedButtonProps {
  onPress: () => void;
  title: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function AnimatedButton({
  onPress,
  title,
  icon,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
}: AnimatedButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    }
  };

  const handlePress = () => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryButton;
      case 'secondary':
        return styles.secondaryButton;
      case 'success':
        return styles.successButton;
      case 'warning':
        return styles.warningButton;
      default:
        return styles.primaryButton;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.button,
          getVariantStyle(),
          disabled && styles.disabledButton,
          { transform: [{ scale: scaleAnim }] },
          style,
        ]}
      >
        {icon}
        <Text style={[styles.buttonText, disabled && styles.disabledText, textStyle]}>
          {title}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
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
  primaryButton: {
    backgroundColor: '#01c7f2',
  },
  secondaryButton: {
    backgroundColor: '#397a8a',
  },
  successButton: {
    backgroundColor: '#2d6223',
  },
  warningButton: {
    backgroundColor: '#FFA500',
  },
  disabledButton: {
    backgroundColor: '#397a8a',
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#071424',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  disabledText: {
    color: '#ffffff',
    opacity: 0.7,
  },
});