import SocketConnection from './websocket';
import { generateMessage } from './create-message';
import { processIndividualMessage } from './chathelper';
import { getAuthData } from './storage';
import type { Message } from '../Model/Message';

export interface ChatSocketConfig {
  onMessageReceived: (message: Message) => void;
  onMessageSent: (message: Message) => void;
  onError: (error: string) => void;
}

export class ChatSocket {
  private socket: SocketConnection;
  private config: ChatSocketConfig;

  constructor(wsUrl: string, token: string, config: ChatSocketConfig) {
    this.config = config;
    this.socket = new SocketConnection(wsUrl, token);
    this.setupListeners();
  }

  private setupListeners() {
    this.socket.onMessage(async (data) => {
      try {
        switch (data.type) {
          case 'new_message':
            await this.handleIncomingMessage(data.message);
            break;
          
          case 'message_sent':
            this.handleMessageSentConfirmation(data);
            break;
          
          case 'typing':
            // Handle typing indicator
            break;
          
          case 'error':
            this.config.onError(data.message);
            break;
          
          default:
            console.warn('[ChatSocket] Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('[ChatSocket] Error handling message:', error);
        this.config.onError('Failed to process message');
      }
    });
  }

  private async handleIncomingMessage(message: Message) {
    try {
      // Process message (decrypt, verify)
      const processedMessage = await processIndividualMessage(message);
      this.config.onMessageReceived(processedMessage);
    } catch (error) {
      console.error('[ChatSocket] Failed to process incoming message:', error);
      this.config.onError('Failed to decrypt message');
    }
  }

  private handleMessageSentConfirmation(data: any) {
    console.log('[ChatSocket] Message sent confirmation:', data);
    // Optionally update message status in UI
  }

  async sendMessage(
    plaintext: string,
    receiver: string,
    roomId: string
  ): Promise<void> {
    try {
      const authData = getAuthData();
      if (!authData) {
        throw new Error('Not authenticated');
      }

      // Generate encrypted message
      const message = await generateMessage(
        plaintext,
        authData.username,
        receiver,
        roomId,
        authData.privateKey
      );

      // Send via WebSocket
      this.socket.send({
        type: 'new_message',
        message: {
          sender: message.sender,
          receiver: message.receiver,
          room_id: message.room_id,
          encrypted_message: message.encrypted_message,
          message_hash: message.message_hash,
          signature: message.signature,
          timestamp: message.timestamp.toISOString()
        }
      });

      // Optimistically add to UI
      this.config.onMessageSent({
      ...message,
      plaintext: plaintext,  // Use the original plaintext
      content: `${plaintext}`,  // Show as sent
      isCurrentUser: true
    });
    } catch (error) {
      console.error('[ChatSocket] Failed to send message:', error);
      this.config.onError('Failed to send message');
      throw error;
    }
  }

  sendTypingIndicator(receiver: string, roomId: string) {
    this.socket.send({
      type: 'typing',
      receiver,
      room_id: roomId
    });
  }

  close() {
    this.socket.close();
  }
}