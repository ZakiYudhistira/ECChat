import elliptic from 'elliptic';
import { Share } from 'lucide-react';

const EC = elliptic.ec;
const ec = new EC('secp256k1');

/**
 * Singleton shared secret caching system for optimized message encrypt and decrypting
 */
class SharedSecretCache {
  private static instance: SharedSecretCache;
  private cache: Map<string, Uint8Array>;

  private constructor() {
      this.cache = new Map();
  }

  public static getInstance(): SharedSecretCache {
    if (!SharedSecretCache.instance) {
      SharedSecretCache.instance = new SharedSecretCache();
    }
    return SharedSecretCache.instance;
  }

  private getCacheKey(myPrivateKey: string, otherPublicKey: string): string {
    // Create deterministic key for cache lookup
    return `${myPrivateKey.slice(0, 16)}_${otherPublicKey.slice(0, 16)}`;
  }

  public getSharedSecret(myPrivateKey: string, otherPublicKey: string): Uint8Array {
    const cacheKey = this.getCacheKey(myPrivateKey, otherPublicKey);
    const cached = this.cache.get(cacheKey);

    if(cached){
      return cached;
    }

    const myKey = ec.keyFromPrivate(myPrivateKey, 'hex');
      const otherKey = ec.keyFromPublic(otherPublicKey, 'hex');
    const sharedSecret = myKey.derive(otherKey.getPublic());
    const sharedSecretBytes = new Uint8Array(sharedSecret.toArray('be', 32));

    this.cache.set(cacheKey, sharedSecretBytes);

    return sharedSecretBytes;
  }
}

export const sharedSecret = SharedSecretCache.getInstance();