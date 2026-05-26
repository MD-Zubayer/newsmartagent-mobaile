import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSearchParams, Link, useRouter } from "expo-router";
import AuthShell from "@/components/auth/AuthShell";
import Field from "@/components/auth/Field";
import PrimaryButton from "@/components/auth/PrimaryButton";
import { apiRequest } from "@/lib/api";

export default function ResetPasswordPage() {
  const { token } = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(!!token);
  }, [token]);

  const handleReset = async () => {
    setMessage("");
    if (!token) {
      setMessageType("error");
      setMessage("Invalid reset link. Please request a new password reset.");
      return;
    }
    if (password.length < 8) {
      setMessageType("error");
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMessageType("error");
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/reset-password/", {
        method: "POST",
        body: JSON.stringify({ token, new_password: password }),
      });
      setMessageType("success");
      setMessage("Password reset successful. Please log in with your new password.");
      setTimeout(() => router.push("/login"), 1200);
    } catch (err) {
      setMessageType("error");
      setMessage(err.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <View style={styles.header}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Create a new password for your account.</Text>
      </View>

      {!ready ? (
        <Text style={styles.notice}>
          Invalid or missing reset token. Please request a new reset link from the login screen.
        </Text>
      ) : (
        <>
          <Field
            icon="lock"
            placeholder="New Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Field
            icon="lock"
            placeholder="Confirm Password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          {!!message && (
            <Text style={[styles.message, messageType === "success" ? styles.messageSuccess : styles.messageError]}>
              {message}
            </Text>
          )}

          <PrimaryButton
            title={loading ? "Resetting..." : "Reset Password"}
            onPress={handleReset}
            disabled={loading || !password || !confirmPassword}
          />
        </>
      )}

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
  notice: { marginTop: 20, textAlign: "center", color: "#dc2626", fontWeight: "700" },
});
