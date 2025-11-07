import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import HomeScreen from '../screens/HomeScreen';
import SendPaymentScreen from '../screens/SendPaymentScreen';
import SendOnlineScreen from '../screens/SendOnlineScreen';
import ReceivePaymentScreen from '../screens/ReceivePaymentScreen';
import SendingStatusModal from '../screens/SendingStatusModal';
import PeersScreen from '../screens/PeersScreen';
import { colors } from '../constants/Colors';

export type RootStackParamList = {
  Home: undefined;
  SendPayment: undefined;
  SendOnline: undefined;
  ReceivePayment: undefined;
  SendingStatus: undefined;
  Peers: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            animation: 'fade',
          }}
        />

        <Stack.Screen name="SendPayment" component={SendPaymentScreen} />

        <Stack.Screen name="SendOnline" component={SendOnlineScreen} />

        <Stack.Screen name="ReceivePayment" component={ReceivePaymentScreen} />

        <Stack.Screen name="Peers" component={PeersScreen} />

        <Stack.Screen
          name="SendingStatus"
          component={SendingStatusModal}
          options={{
            presentation: 'modal',
            animation: 'fade',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
