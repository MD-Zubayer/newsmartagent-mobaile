import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { clearAuthToken, getAccessToken } from "@/lib/auth";
import { apiRequest } from "@/lib/api";

export default function NotFoundRedirect() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          router.replace("/login");
          return;
        }

        await apiRequest("/token/verify/", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ token }),
        });

        router.replace("/user");
      } catch (err) {
        console.error("NotFound redirect failed", err);
        await clearAuthToken();
        router.replace("/login");
      }
    };

    redirect();
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4f46e5" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
});
