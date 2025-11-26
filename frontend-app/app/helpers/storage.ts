export const StorageKeys = {
  USERNAME: 'ecchat_username',
  PUBLIC_KEY: 'ecchat_public_key',
  PRIVATE_KEY: 'ecchat_private_key',
  TOKEN: 'ecchat_token'
};

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

export const storeAuthData = (
  username: string,
  publicKey: string,
  privateKey: string,
  token: string
) => {
  if (!isBrowser) return;
  
  localStorage.setItem(StorageKeys.USERNAME, username);
  localStorage.setItem(StorageKeys.PUBLIC_KEY, publicKey);
  localStorage.setItem(StorageKeys.PRIVATE_KEY, btoa(privateKey));
  localStorage.setItem(StorageKeys.TOKEN, token);
};

export const getAuthData = () => {
  if (!isBrowser) return null;
  
  const username = localStorage.getItem(StorageKeys.USERNAME);
  const publicKey = localStorage.getItem(StorageKeys.PUBLIC_KEY);
  const privateKey = localStorage.getItem(StorageKeys.PRIVATE_KEY);
  const token = localStorage.getItem(StorageKeys.TOKEN);
  
  if (!username || !publicKey || !privateKey || !token) {
    return null;
  }
  
  return {
    username,
    publicKey,
    privateKey: atob(privateKey),
    token
  };
};

export const clearAuthData = () => {
  if (!isBrowser) return;
  
  localStorage.removeItem(StorageKeys.USERNAME);
  localStorage.removeItem(StorageKeys.PUBLIC_KEY);
  localStorage.removeItem(StorageKeys.PRIVATE_KEY);
  localStorage.removeItem(StorageKeys.TOKEN);
};

export const isAuthenticated = (): boolean => {
  if (!isBrowser) return false;
  return getAuthData() !== null;
};