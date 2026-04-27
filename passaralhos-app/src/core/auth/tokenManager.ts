import * as SecureStore from "expo-secure-store";

const KEYS = {
  ACCESS: "passaralhos_access_token",
  REFRESH: "passaralhos_refresh_token",
} as const;

/**
 * Gerencia armazenamento seguro dos tokens JWT.
 * Usa expo-secure-store (Keychain no iOS, Keystore no Android).
 */
export const tokenManager = {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.ACCESS, accessToken),
      SecureStore.setItemAsync(KEYS.REFRESH, refreshToken),
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.ACCESS);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.REFRESH);
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS),
      SecureStore.deleteItemAsync(KEYS.REFRESH),
    ]);
  },

  async hasTokens(): Promise<boolean> {
    const token = await SecureStore.getItemAsync(KEYS.ACCESS);
    return !!token;
  },
};
