import { type Message } from "~/Model/Message";
import { decryptMessage, hashMessage } from "./crypto";
import { getAuthData } from "./storage";
import { sharedSecret } from "./sharedsecret";
import elliptic from "elliptic";

const EC = elliptic.ec;
const ec = new EC("secp256k1");

/**
 * Process a single message by decrypting and verifying it
 * Returns the message with plaintext and verification label
 */
export async function processIndividualMessage(message: Message): Promise<Message> {
  try {
    // 1. Decrypt the message
    const authData = getAuthData();
    const decrypted = await decryptMessage(
      message.encrypted_message,
      message.sender === authData?.username ? message.receiver : message.sender
    );

    // 2. Regenerate the hash using decrypted plaintext
    const regeneratedHash = await hashMessage(
      decrypted,
      message.timestamp.toString(),
      message.sender,
      message.receiver
    );

    // 3. Verify hash matches
    const hashValid = regeneratedHash === message.message_hash;

    // 4. Verify signature using sender's public key
    let signatureValid = false;
    if (hashValid) {
      try {
        // Get sender's public key from cache
        const senderPublicKey = await sharedSecret.getPublicKey(message.sender);
        const key = ec.keyFromPublic(senderPublicKey, 'hex');
        
        // Parse signature (r and s from hex)
        const r = message.signature.slice(0, 64);
        const s = message.signature.slice(64, 128);
        const parsedSignature = { r, s };
        
        const messageBytes = new TextEncoder().encode(message.message_hash);
        signatureValid = key.verify(messageBytes, parsedSignature);
      } catch (error) {
        console.error('Signature verification error:', error);
        signatureValid = false;
      }
    }

    // 5. Determine verification status and label
    let verificationLabel = '';
    let plaintext = '';

    if (hashValid && signatureValid) {
      verificationLabel = '✓ Verified';
      plaintext = `${decrypted} [${verificationLabel}]`;
    } else if (!hashValid) {
      verificationLabel = '⚠ Hash Failed';
      plaintext = `${decrypted} [${verificationLabel}]`;
    } else {
      verificationLabel = '⚠ Signature Failed';
      plaintext = `${decrypted} [${verificationLabel}]`;
    }

    return {
      ...message,
      plaintext,
      content: plaintext,
    };
  } catch (error) {
    console.error('Message processing error:', error);
    return {
      ...message,
      plaintext: '[❌ Decryption Failed]',
      content: '[❌ Decryption Failed]',
    };
  }
}

/**
 * Process messages by decrypting and verifying each one
 * Adds verified/unverified labels based on hash and signature verification
 */
export async function processMessages(messages: Message[]): Promise<Message[]> {
  const processedMessages = await Promise.all(
    messages.map((message) => processIndividualMessage(message))
  );

  return processedMessages;
}