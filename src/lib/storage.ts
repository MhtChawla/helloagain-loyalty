import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

export const storage = {
  getToken: (): Promise<string | null> => SecureStore.getItemAsync(TOKEN_KEY),
  setToken: (token: string): Promise<void> => SecureStore.setItemAsync(TOKEN_KEY, token),
  deleteToken: (): Promise<void> => SecureStore.deleteItemAsync(TOKEN_KEY),
};
