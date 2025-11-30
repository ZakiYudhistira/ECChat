import { encryptMessage, signMessage, hashMessage } from "./crypto";
import type { Message } from "../Model/Message";

export async function generateMessage(
  plaintext: string,
  sender: string,
  receiver: string,
  room_id: string,
  senderPrivateKey: string
): Promise<Message> {
  // Generate timestamp
  const timestamp = new Date();

  // Encrypt the message for the receiver
  const encrypted_message = await encryptMessage(plaintext, receiver);

  // Generate hash of plaintext|timestamp|sender|receiver
  const message_hash = await hashMessage(plaintext, timestamp.toISOString(), sender, receiver);

  // Sign the hash with sender's private key
  const signature = await signMessage(message_hash, senderPrivateKey);

  // Return complete Message object
  return {
    sender,
    receiver,
    room_id,
    encrypted_message,
    message_hash,
    signature,
    timestamp,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}