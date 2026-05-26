import { useEffect } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuth(); // আমাদের তৈরি করা AuthContext থেকে logout ফাংশন

  useEffect(() => {
    const performLogout = async () => {
      try {
        // ১. টোকেন মোছা এবং স্টেট আপডেট (AuthContext হ্যান্ডেল করবে)
        await logout();

        // ২. লগইন পেজে পাঠিয়ে দেওয়া
        // আপনার রুট যদি 'login' হয় তবে সেটি দিন
        router.replace("/login"); 
      } catch (error) {
        console.error("Logout failed", error);
        router.replace("/"); // কোনো ভুল হলেও মেইন পেজে পাঠিয়ে দিন
      }
    };

    performLogout();
  }, [logout, router]);

  return (
    <div style={styles.container}>
      <ActivityIndicator size="large" color="#4f46e5" />
      <Text style={styles.text}>Logging out from NSA...</Text>
    </div>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  text: {
    marginTop: 15,
    fontSize: 16,
    color: "#64748b",
    fontWeight: "600",
  },
});