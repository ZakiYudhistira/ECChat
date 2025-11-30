import elliptic from "elliptic";
import { sharedSecret } from './sharedsecret'

const EC = elliptic.ec;
const ec = new EC("secp256k1"); // atau secp256r1

const iv_length = 12;

export async function signMessage(message: string, privateKeyHex: string): Promise<string> {
  const messageBytes = new TextEncoder().encode(message);
  const key = ec.keyFromPrivate(privateKeyHex);
  const signature = key.sign(messageBytes);
  
  const r = signature.r.toString('hex').padStart(64, '0');
  const s = signature.s.toString('hex').padStart(64, '0');
  return r + s;
}

export async function hashMessage(
  plaintext: string,
  timestamp: string,
  sender: string,
  receiver: string
): Promise<string> {
  const data = `${plaintext}|${timestamp}|${sender}|${receiver}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function generateKeyPair(password: string, username: string) {
  const encoder = new TextEncoder();

  // 1. Derive seed using PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const seedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(username),
      iterations: 600000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const seed = new Uint8Array(seedBits);

  // 2. Convert seed to hex (ECC private key must be hex)
  const privateKeyHex = Array.from(seed)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  // 3. Generate ECC keypair from private key
  const key = ec.keyFromPrivate(privateKeyHex);

  const publicKeyHex = key.getPublic("hex"); // uncompressed

  return {
    privateKey: privateKeyHex,
    publicKey: publicKeyHex,
  };
}

export async function encryptMessage(
  plaintext: string,
  recipientUsername: string // Changed from public key to username
): Promise<string> {
  try {
    // Get cached shared secret by username
    const sharedSecretBytes = await sharedSecret.getSharedSecret(recipientUsername);

    const keyMaterialBuffer = await crypto.subtle.digest('SHA-256', sharedSecretBytes);
    const keyMaterial = new Uint8Array(keyMaterialBuffer);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(iv_length));
    const encodedText = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedText
    );

    const combined = new Uint8Array(iv_length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv_length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
}

export async function decryptMessage(
  encryptedBase64: string,
  senderUsername: string // Changed from public key to username
): Promise<string> {
  try {
    // Get cached shared secret by username
    const sharedSecretBytes = await sharedSecret.getSharedSecret(senderUsername);

    const keyMaterialBuffer = await crypto.subtle.digest('SHA-256', sharedSecretBytes);
    const keyMaterial = new Uint8Array(keyMaterialBuffer);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const iv = combined.slice(0, iv_length);
    const ciphertext = combined.slice(iv_length);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
}