import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { Link } from "expo-router";
import AuthShell from "@/components/auth/AuthShell";
import Field from "@/components/auth/Field";
import PrimaryButton from "@/components/auth/PrimaryButton";
import { apiRequest } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const handleSubmit = async () => {
    setLoading(true);
    setMessage("");

    try {
      const data = await apiRequest("/forgot-password/", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      setMessage(data.message || "Password reset link sent! Check your email.");
      setMessageType("success");
    } catch (err) {
      setMessage(err.message || "Unable to send reset link.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <View style={styles.header}>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>Type your email and we&apos;ll send a reset link.</Text>
      </View>

      <Field
        icon="envelope"
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {!!message && (
        <Text style={[styles.message, messageType === "success" ? styles.messageSuccess : styles.messageError]}>
          {message}
        </Text>
      )}

      <PrimaryButton
        title={loading ? "Sending..." : "Send Reset Link"}
        onPress={handleSubmit}
        disabled={loading || !email.trim()}
      />

      <Link href="/login" style={styles.switchLink}>Back to Login</Link>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", marginBottom: 20 },
  title: { fontSize: 30, fontWeight: "800", color: "#111827", textAlign: "center" },
  subtitle: { marginTop: 6, fontSize: 14, color: "#6b7280", fontWeight: "600", textAlign: "center" },
  switchLink: { marginTop: 18, textAlign: "center", color: "#4f46e5", fontWeight: "800" },
  message: { marginTop: 12, textAlign: "center", fontWeight: "700", fontSize: 13, paddingHorizontal: 4 },
  messageSuccess: { color: "#16a34a" },
  messageError: { color: "#dc2626" },
});
