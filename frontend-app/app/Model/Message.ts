export interface Message {
  _id?: string;
  id?: string;
  sender: string;
  receiver: string;
  room_id: string;
  encrypted_message: string;
  message_hash: string;
  signature: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
  // UI properties
  plaintext?: string;
  isCurrentUser?: boolean;
  senderName?: string;
  senderAvatar?: string;
  content?: string;
  type?: string;
  imageUrl?: string;
}