import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useNetworkState = () => {
  const [isInternetConnected, setIsInternetConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsInternetConnected(!!state.isConnected && !!state.isInternetReachable);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return { isInternetConnected, isLoading };
};
