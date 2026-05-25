import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { clearAuthToken, getAccessToken } from "@/lib/auth";
import { apiRequest } from "@/lib/api";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        const token = await getAccessToken();
        if (!token) throw new Error("No token");

        await apiRequest("/token/verify/", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ token }),
        });

        setLoading(false);
      } catch {
        await clearAuthToken();
        router.replace("/login");
      }
    };

    verify();
  }, []);

  const handleLogout = async () => {
    await clearAuthToken();
    router.replace("/login");
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>You are logged in.</Text>
      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  title: { fontSize: 28, fontWeight: "800", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6b7280", fontWeight: "600" },
  logoutBtn: {
    marginTop: 8,
    backgroundColor: "#dc2626",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  logoutText: { color: "#fff", fontWeight: "700" },
});
