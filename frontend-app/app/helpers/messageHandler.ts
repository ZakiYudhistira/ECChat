import { MessageController, type Message } from "../controller/Message";

export interface WebSocketMessage {
  type: 'new_message' | 'typing' | 'read_receipt' | 'error';
  data: any;
}

export interface ProcessedMessage {
  message: Message;
  plaintext: string;
}

/**
 * Parse incoming WebSocket message
 */
export function parseWebSocketMessage(rawData: any): WebSocketMessage | null {
  try {
    // If already parsed
    if (rawData.type) {
      return rawData as WebSocketMessage;
    }

    // Try to parse if string
    if (typeof rawData === 'string') {
      const parsed = JSON.parse(rawData);
      return parsed as WebSocketMessage;
    }

    return null;
  } catch (error) {
    console.error('Failed to parse WebSocket message:', error);
    return null;
  }
}

/**
 * Validate message structure
 */
export function isValidMessage(obj: any): boolean {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.sender === 'string' &&
    typeof obj.receiver === 'string' &&
    typeof obj.room_id === 'string' &&
    typeof obj.encrypted_message === 'string' &&
    typeof obj.message_hash === 'string' &&
    typeof obj.signature === 'string' &&
    typeof obj.timestamp === 'string'
  );
}

/**
 * Decrypt and verify incoming message
 */
export async function processIncomingMessage(
  message: Message,
  myPrivateKey: string,
  otherPublicKey: string,
  senderPublicKey: string
): Promise<ProcessedMessage> {
  try {
    // 1. Decrypt message
    const plaintext = await MessageController.decryptMessage(
      message,
      myPrivateKey,
      otherPublicKey
    );

    // 2. Verify signature and integrity
    const isValid = await MessageController.verifyMessage(
      message,
      plaintext,
      senderPublicKey
    );

    if (!isValid) {
      console.warn('Message verification failed for:', message);
      throw new Error('Message verification failed');
    }

    return {
      message,
      plaintext
    };
  } catch (error) {
    console.error('Failed to process incoming message:', error);
    throw error;
  }
}

/**
 * Format message for sending via WebSocket
 */
export function formatOutgoingMessage(message: Message): WebSocketMessage {
  return {
    type: 'new_message',
    data: message
  };
}
