import elliptic from "elliptic";

const EC = elliptic.ec;
const ec = new EC("secp256k1"); // atau secp256r1

export async function signMessage(message: string, privateKeyHex: string): Promise<string> {
  const messageBytes = new TextEncoder().encode(message);
  const key = ec.keyFromPrivate(privateKeyHex);
  const signature = key.sign(messageBytes);
  
  const r = signature.r.toString('hex').padStart(64, '0');
  const s = signature.s.toString('hex').padStart(64, '0');
  return r + s;
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
