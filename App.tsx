import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './navigation/AppNavigator';
import { meshService } from './src/services/mesh.service';
import { useAppStore } from './src/store/appStore';
import { MeshMessage, MessageType } from './src/types/mesh';

export default function App() {
  const updateTransaction = useAppStore((state) => state.updateTransaction);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const initMesh = async () => {
      try {
        await meshService.initialize();

        if (!isMounted) return;

        unsubscribe = meshService.onMessage((message: MeshMessage) => {
          if (!isMounted) return;

          try {
            if (message.type === MessageType.PAYMENT_CONFIRMATION) {
              const payload = message.payload as any;
              if (payload && payload.invoice) {
                const transaction = useAppStore
                  .getState()
                  .transactions.find(
                    (t) => t.messageId === message.id || t.invoice === payload.invoice
                  );
                if (transaction) {
                  updateTransaction(transaction.id, 'confirmed');
                }
              }
            } else if (message.type === MessageType.PAYMENT_FAILED) {
              const payload = message.payload as any;
              if (payload && payload.invoice) {
                const transaction = useAppStore
                  .getState()
                  .transactions.find(
                    (t) => t.messageId === message.id || t.invoice === payload.invoice
                  );
                if (transaction) {
                  updateTransaction(transaction.id, 'failed');
                }
              }
            }
          } catch (error) {
            console.error('Error processing mesh message:', error);
          }
        });
      } catch (error) {
        console.error('Failed to initialize mesh:', error);
      }
    };

    initMesh();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [updateTransaction]);

  return (
    <>
      <AppNavigator />
      <StatusBar style="light" />
    </>
  );
}
