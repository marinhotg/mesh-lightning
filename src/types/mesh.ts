export enum MessageType {
  PAYMENT_REQUEST = 'PAYMENT_REQUEST',
  PAYMENT_CONFIRMATION = 'PAYMENT_CONFIRMATION',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
}

export interface MeshMessage {
  id: string;
  type: MessageType;
  timestamp: number;
  senderId: string;
  recipientId?: string;
  payload: PaymentRequest | PaymentConfirmation | PaymentFailed;
  hops: string[];
  ttl: number;
}

export interface PaymentRequest {
  invoice: string;
  amount?: number;
  memo?: string;
}

export interface PaymentConfirmation {
  paymentHash: string;
  invoice: string;
  preimage: string;
}

export interface PaymentFailed {
  invoice: string;
  reason: string;
}

export interface ConnectedPeer {
  id: string;
  name: string;
  device: any;
  connected: boolean;
}
