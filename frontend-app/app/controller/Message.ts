import { sha3Hash, signMessage, encryptMessage, decryptMessage } from "../helpers/crypto";


export interface EncryptedMessageMap {
  [username: string]: string; // username -> encrypted message (base64)
}


export interface Message {
  sender: string;                           // Username
  receiver: string;                         // Username
  room_id: string;                          // Room ID
  encrypted_message: string;                // Single encrypted message (both users can decrypt)
  message_hash: string;                     // SHA-3 hash of plaintext
  signature: string;                        // ECDSA signature of hash
  timestamp: string;                        // Timestamp
}

/**
 * Message class for handling E2E encrypted messaging
 */
export class MessageController {
  /**
   * Create and encrypt a new message
   * 
   * @param plaintext - The original message text
   * @param sender - Sender's username
   * @param receiver - Receiver's username
   * @param roomId - Conversation room ID
   * @param senderPrivateKey - Sender's private key (hex) for signing and encrypting
   * @param receiverPublicKey - Receiver's public key (hex) for encrypting
   * @returns Complete Message object ready to send
   */
  static async createMessage(
    plaintext: string,
    sender: string,
    receiver: string,
    roomId: string,
    senderPrivateKey: string,
    receiverPublicKey: string
  ): Promise<Message> {
    // 1. Create timestamp
    const timestamp = new Date().toISOString();

    // 2. Hash the plaintext + timestamp + sender + receiver using SHA-3
    const dataToHash = `${plaintext}|${timestamp}|${sender}|${receiver}`;
    const messageHash = await sha3Hash(dataToHash);

    // 3. Sign the hash using sender's private key
    const signature = await signMessage(messageHash, senderPrivateKey);

    // 4. Encrypt message using ECDH (both sender and receiver can decrypt with same shared secret)
    const encryptedMessage = await encryptMessage(plaintext, senderPrivateKey, receiverPublicKey);

    // 5. Return complete message
    return {
      sender,
      receiver,
      room_id: roomId,
      encrypted_message: encryptedMessage,
      message_hash: messageHash,
      signature,
      timestamp
    };
  }

  /**
   * Decrypt a received message
   * 
   * @param message - The received encrypted message
   * @param myPrivateKey - Current user's private key (hex)
   * @param otherPublicKey - Other user's public key (hex) - sender's public key if I'm receiver, receiver's public key if I'm sender
   * @returns Decrypted plaintext message
   */
  static async decryptMessage(
    message: Message,
    myPrivateKey: string,
    otherPublicKey: string
  ): Promise<string> {
    // Decrypt using ECDH shared secret
    const plaintext = await decryptMessage(message.encrypted_message, myPrivateKey, otherPublicKey);

    return plaintext;
  }

  /**
   * Verify message signature and integrity
   * 
   * @param message - The message to verify
   * @param plaintext - The decrypted plaintext
   * @param senderPublicKey - Sender's public key (hex) for verification
   * @returns true if signature is valid and hash matches
   */
  static async verifyMessage(
    message: Message,
    plaintext: string,
    senderPublicKey: string
  ): Promise<boolean> {
    try {
      // 1. Hash the plaintext + timestamp + sender + receiver
      const dataToHash = `${plaintext}|${message.timestamp}|${message.sender}|${message.receiver}`;
      const computedHash = await sha3Hash(dataToHash);

      // 2. Check if hash matches
      if (computedHash !== message.message_hash) {
        console.error('Message hash mismatch!');
        return false;
      }

      // 3. Verify signature using sender's public key
      const { verifySignature } = await import('../helpers/crypto');
      const isValidSignature = await verifySignature(
        message.message_hash,
        message.signature,
        senderPublicKey
      );

      if (!isValidSignature) {
        console.error('Invalid signature!');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Message verification failed:', error);
      return false;
    }
  }

  static fromJSON(json: any): Message {
    return {
      sender: json.sender,
      receiver: json.receiver,
      room_id: json.room_id,
      encrypted_message: json.encrypted_message,
      message_hash: json.message_hash,
      signature: json.signature,
      timestamp: json.timestamp
    };
  }

  static toJSON(message: Message): string {
    return JSON.stringify(message);
  }

  /**
   * Fetch messages from backend for a specific room
   * 
   * @param roomId - The chatroom ID
   * @param limit - Maximum number of messages to fetch
   * @param skip - Number of messages to skip (for pagination)
   * @returns Array of messages
   */
  static async getMessages(
    roomId: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<Message[]> {
    try {
      const { apiClient } = await import('../helpers/api-client');
      const { API_ROUTES } = await import('../../config/api');
      
      const url = `${API_ROUTES.GET_MESSAGES.replace(':roomId', roomId)}?limit=${limit}&skip=${skip}`;
      const response = await apiClient.get<{
        success: boolean;
        messages: Message[];
        totalMessages: number;
        roomId: string;
      }>(url);
      
      if (!response.success) {
        throw new Error('Failed to fetch messages');
      }
      
      return response.messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  /**
   * Save message to backend
   * 
   * @param message - The message to save
   * @returns Saved message with ID
   */
  static async saveMessage(message: Message): Promise<Message> {
    try {
      const { apiClient } = await import('../helpers/api-client');
      const { API_ROUTES } = await import('../../config/api');
      
      const response = await apiClient.post<{
        success: boolean;
        data: Message;
      }>(API_ROUTES.SAVE_MESSAGE, message);
      
      if (!response.success) {
        throw new Error('Failed to save message');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }
}

export function isValidMessage(obj: any): obj is Message {
  return (
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
