import AsyncStorage from '@react-native-async-storage/async-storage';

/** Access token of the signed-in user (saved with the login data), or null. */
export async function getAccessToken(): Promise<any> {
  try {
    const raw = await AsyncStorage.getItem('userData');
    const data = raw ? JSON.parse(raw) : null;
    return data?.accessToken ?? null;
  } catch {
    return null;
  }
}
