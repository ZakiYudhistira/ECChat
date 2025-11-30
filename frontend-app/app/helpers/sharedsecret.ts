import elliptic from 'elliptic';
import { API_ROUTES } from 'config/api';
import { apiClient } from './api-client';

const EC = elliptic.ec;
const ec = new EC('secp256k1');

/**
 * Singleton shared secret caching system
 */
class SharedSecretCache {
  private static instance: SharedSecretCache;
  private cache: Map<string, Uint8Array>; // Cache for shared secrets
  private publicKeyCache: Map<string, string>; // Cache for username -> public key
  private myPrivateKey: string | null; // Current user's private key

  private constructor() {
    this.cache = new Map();
    this.publicKeyCache = new Map();
    this.myPrivateKey = null;
  }

  public static getInstance(): SharedSecretCache {
    if (!SharedSecretCache.instance) {
      SharedSecretCache.instance = new SharedSecretCache();
    }
    return SharedSecretCache.instance;
  }

  /**
   * Set the current user's private key
   */
  public setMyPrivateKey(privateKey: string): void {
    this.myPrivateKey = privateKey;
  }

  /**
   * Get the current user's private key
   */
  public getMyPrivateKey(): string {
    if (!this.myPrivateKey) {
      throw new Error('Private key not set. Call setMyPrivateKey() first.');
    }
    return this.myPrivateKey;
  }

  /**
   * Fetch and cache a user's public key from API
   */
  private async fetchPublicKey(username: string): Promise<string> {
    try {
      const url = API_ROUTES.GET_PUBLIC_KEY.replace(':username', username);
      const response = await apiClient.get<{ success: boolean; publicKey: string }>(url);
      
      if (response.success && response.publicKey) {
        this.publicKeyCache.set(username, response.publicKey);
        return response.publicKey;
      }
      
      throw new Error('Failed to fetch public key');
    } catch (error) {
      console.error(`Error fetching public key for ${username}:`, error);
      throw new Error(`Failed to fetch public key for ${username}`);
    }
  }

  /**
   * Get a user's public key (from cache or fetch from API)
   */
  private async getPublicKey(username: string): Promise<string> {
    const cached = this.publicKeyCache.get(username);
    if (cached) {
      console.log(`Using cached public key for ${username}`);
      return cached;
    }
    
    console.log(`Fetching public key for ${username} from API`);
    return await this.fetchPublicKey(username);
  }

  /**
   * Check if a public key is cached
   */
  public hasPublicKey(username: string): boolean {
    return this.publicKeyCache.has(username);
  }

  /**
   * Generate cache key for shared secret
   */
  private getCacheKey(otherUsername: string): string {
    return `secret_${otherUsername}`;
  }

  /**
   * Get shared secret with another user (by username)
   * Automatically fetches public key from API if not cached
   */
  public async getSharedSecret(otherUsername: string): Promise<Uint8Array> {
    if (!this.myPrivateKey) {
      throw new Error('Private key not set. Call setMyPrivateKey() first.');
    }

    // Check if shared secret is already cached
    const cacheKey = this.getCacheKey(otherUsername);
    const cached = this.cache.get(cacheKey);

    if (cached) {
      console.log(`Using cached shared secret for ${otherUsername}`);
      return cached;
    }

    // Get public key (from cache or fetch from API)
    const otherPublicKey = await this.getPublicKey(otherUsername);

    // Generate new shared secret
    console.log(`Generating new shared secret for ${otherUsername}`);
    const myKey = ec.keyFromPrivate(this.myPrivateKey, 'hex');
    const otherKey = ec.keyFromPublic(otherPublicKey, 'hex');
    const sharedSecret = myKey.derive(otherKey.getPublic());
    const sharedSecretBytes = new Uint8Array(sharedSecret.toArray('be', 32));

    // Cache it
    this.cache.set(cacheKey, sharedSecretBytes);
    this.publicKeyCache.set(otherUsername, otherPublicKey);

    return sharedSecretBytes;
  }

  /**
   * Clear all caches (call on logout)
   */
  public clearAll(): void {
    this.cache.clear();
    this.publicKeyCache.clear();
    this.myPrivateKey = null;
  }

  /**
   * Clear caches for a specific user
   */
  public clearUser(username: string): void {
    this.publicKeyCache.delete(username);
    this.cache.delete(this.getCacheKey(username));
  }
}

export const sharedSecret = SharedSecretCache.getInstance();