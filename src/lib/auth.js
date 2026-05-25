import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_TOKEN_KEY = "auth_access_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";

export async function saveAuthTokens({ access, refresh }) {
  if (access) await AsyncStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export async function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function clearAuthToken() {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
}

export async function isLoggedIn() {
  const token = await getAccessToken();
  return Boolean(token);
}
