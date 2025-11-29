import elliptic from "elliptic";

const EC = elliptic.ec;
const ec = new EC("secp256k1");

// SHA-3 hash function
export async function sha3Hash(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  
  // Using SHA3-256 (Web Crypto API doesn't support SHA-3, so we'll use SHA-256 as fallback)
  // For production, install a SHA-3 library like 'js-sha3'
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Sign a message hash with private key
export async function signMessage(message: string, privateKeyHex: string): Promise<string> {
  const messageBytes = new TextEncoder().encode(message);
  const key = ec.keyFromPrivate(privateKeyHex);
  const signature = key.sign(messageBytes);
  
  const r = signature.r.toString('hex').padStart(64, '0');
  const s = signature.s.toString('hex').padStart(64, '0');
  return r + s;
}

// Verify signature with public key
export async function verifySignature(
  message: string, 
  signatureHex: string, 
  publicKeyHex: string
): Promise<boolean> {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const key = ec.keyFromPublic(publicKeyHex, 'hex');
    
    const r = signatureHex.slice(0, 64);
    const s = signatureHex.slice(64, 128);
    
    return key.verify(messageBytes, { r, s });
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

// Encrypt message using ECDH shared secret
export async function encryptMessage(
  plaintext: string,
  myPrivateKeyHex: string,
  otherPublicKeyHex: string
): Promise<string> {
  try {
    const encoder = new TextEncoder();
    
    // Derive shared secret using ECDH
    const myKey = ec.keyFromPrivate(myPrivateKeyHex);
    const otherKey = ec.keyFromPublic(otherPublicKeyHex, 'hex');
    const sharedSecret = myKey.derive(otherKey.getPublic());
    const sharedSecretBytes = new Uint8Array(sharedSecret.toArray('be', 32));
    
    // Derive AES key
    const aesKey = await crypto.subtle.importKey(
      'raw',
      await crypto.subtle.digest('SHA-256', sharedSecretBytes),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    // Encrypt
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintextBytes = encoder.encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      plaintextBytes
    );
    
    // Combine iv + ciphertext
    const result = new Uint8Array(iv.length + ciphertext.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(ciphertext), iv.length);
    
    return btoa(String.fromCharCode(...result));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw error;
  }
}

// Decrypt message using ECDH shared secret
export async function decryptMessage(
  encryptedBase64: string,
  myPrivateKeyHex: string,
  otherPublicKeyHex: string
): Promise<string> {
  try {
    // Decode base64
    const encryptedBytes = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    
    // Extract iv and ciphertext
    const iv = encryptedBytes.slice(0, 12);
    const ciphertext = encryptedBytes.slice(12);
    
    // Derive shared secret
    const myKey = ec.keyFromPrivate(myPrivateKeyHex);
    const otherKey = ec.keyFromPublic(otherPublicKeyHex, 'hex');
    const sharedSecret = myKey.derive(otherKey.getPublic());
    const sharedSecretBytes = new Uint8Array(sharedSecret.toArray('be', 32));
    
    // Derive AES key
    const aesKey = await crypto.subtle.importKey(
      'raw',
      await crypto.subtle.digest('SHA-256', sharedSecretBytes),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    // Decrypt
    const plaintextBytes = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      ciphertext
    );
    
    return new TextDecoder().decode(plaintextBytes);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw error;
  }
}

export async function generateKeyPair(password: string, username: string) {
  const encoder = new TextEncoder();

  // 1. Seed generation using PBKF2
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

  // 2. Convert seed to hex
  const privateKeyHex = Array.from(seed)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  // 3. Generate ECC public key
  const key = ec.keyFromPrivate(privateKeyHex);

  const publicKeyHex = key.getPublic("hex"); // uncompressed

  return {
    privateKey: privateKeyHex,
    publicKey: publicKeyHex,
  };
}
