import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import HomeScreen from '../screens/HomeScreen';
import SendPaymentScreen from '../screens/SendPaymentScreen';
import SendOnlineScreen from '../screens/SendOnlineScreen';
import SendingStatusModal from '../screens/SendingStatusModal';
import { colors } from '../constants/Colors';

export type RootStackParamList = {
  Home: undefined;
  SendPayment: undefined;
  SendOnline: undefined;
  SendingStatus: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="SendPayment" component={SendPaymentScreen} />
        <Stack.Screen name="SendOnline" component={SendOnlineScreen} />

        <Stack.Screen
          name="SendingStatus"
          component={SendingStatusModal}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
