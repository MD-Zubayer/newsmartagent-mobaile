import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import AuthShell from "@/components/auth/AuthShell";
import Field from "@/components/auth/Field";
import PrimaryButton from "@/components/auth/PrimaryButton";
import { apiRequest } from "@/lib/api";
import { saveAuthTokens } from "@/lib/auth";

export default function LoginPage() {
  const [viewState, setViewState] = useState("password");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setField = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  const obtainJwtFromCredentials = async () => {
    const tokenData = await apiRequest("/token/", {
      method: "POST",
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
      }),
    });

    return {
      access: tokenData?.access || tokenData?.access_token,
      refresh: tokenData?.refresh || tokenData?.refresh_token,
    };
  };

  const saveTokensFromResponse = async (data) => {
    const access = data?.access || data?.token || data?.access_token;
    const refresh = data?.refresh || data?.refresh_token;
    if (access) {
      await saveAuthTokens({ access, refresh });
      router.replace("/user");
      return true;
    }
    return false;
  };

  const handleInitialLogin = async (method = "mobile_approval") => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/login/", {
        method: "POST",
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          auth_method: method,
        }),
      });

      const loggedIn = await saveTokensFromResponse(data);
      if (loggedIn) return;

      if (data?.two_factor_required || data?.status === "2fa_required") {
        if (data?.auth_method === "mobile_approval" || method === "mobile_approval") setViewState("mobile_approval");
        else setViewState("email_otp");
      } else {
        const jwt = await obtainJwtFromCredentials();
        if (jwt?.access) {
          await saveAuthTokens(jwt);
          router.replace("/user");
        } else {
          setError("Login response did not contain token.");
        }
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (method) => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/auth/2fa/verify/", {
        method: "POST",
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          auth_method: method,
          otp_code: otpCode,
          code: otpCode,
        }),
      });

      const loggedIn = await saveTokensFromResponse(data);
      if (!loggedIn) {
        const jwt = await obtainJwtFromCredentials();
        if (jwt?.access) {
          await saveAuthTokens(jwt);
          router.replace("/user");
        } else {
          setError("Verification succeeded but token missing.");
        }
      }
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <View style={styles.header}>
        <Text style={styles.title}>
          {viewState === "password" ? "Welcome Back" : viewState === "try_another_way" ? "Choose how to sign in" : "2-Step Verification"}
        </Text>
        <Text style={styles.subtitle}>
          {viewState === "password" && "Log in securely to your dashboard"}
          {viewState === "email_otp" && "Enter the 6-digit code sent to your email."}
          {viewState === "mobile_approval" && "Check your Mobile and tap Yes, it's me."}
          {viewState === "recovery_code" && "Enter one of your 8-digit backup codes."}
        </Text>
      </View>

      {viewState === "password" && (
        <>
          <Field icon="envelope" placeholder="Email Address" value={formData.email} onChangeText={(v) => setField("email", v)} />
          <Field
            icon="lock"
            placeholder="Password"
            value={formData.password}
            onChangeText={(v) => setField("password", v)}
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? "eye-slash" : "eye"}
            onRightPress={() => setShowPassword((p) => !p)}
          />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <PrimaryButton title={loading ? "Please wait..." : "Login"} onPress={() => handleInitialLogin("mobile_approval")} />
          <Pressable onPress={() => setViewState("try_another_way")}>
            <Text style={styles.switchLink}>Try another way</Text>
          </Pressable>
          <Link href="/forgot-password" style={styles.switchLink}>Forgot password?</Link>
        </>
      )}

      {viewState === "mobile_approval" && (
        <View style={styles.centerBox}>
          <View style={styles.approvalCircle}><FontAwesome name="mobile" size={34} color="#2563eb" /></View>
          <Text style={styles.approvalTitle}>Check your device</Text>
          <Text style={styles.approvalSub}>Approve from your trusted device, or choose another method.</Text>
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Pressable onPress={() => setViewState("try_another_way")}><Text style={styles.switchLink}>Try another way</Text></Pressable>
        </View>
      )}

      {(viewState === "email_otp" || viewState === "recovery_code") && (
        <>
          <Field
            icon="key"
            placeholder={viewState === "email_otp" ? "000000" : "8-DIGIT-CODE"}
            value={otpCode}
            onChangeText={setOtpCode}
          />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <PrimaryButton title={loading ? "Verifying..." : "Verify & Login"} onPress={() => handleVerify2FA(viewState)} />
          <Pressable onPress={() => setViewState("try_another_way")}><Text style={styles.switchLink}>Try another way</Text></Pressable>
        </>
      )}

      {viewState === "try_another_way" && (
        <View style={styles.methods}>
          <MethodItem icon="mobile" title="Check your phone" desc='Tap "Yes" on the prompt sent to you' onPress={() => handleInitialLogin("mobile_approval")} />
          <MethodItem icon="envelope" title="Get a verification code" desc="Code will be sent to your Email/WhatsApp" onPress={() => setViewState("email_otp")} />
          <MethodItem icon="key" title="Enter 8-digit backup code" desc="Use one of your saved recovery codes" onPress={() => setViewState("recovery_code")} />
        </View>
      )}

      <Link href="/signup" style={styles.bottomLink}>New here? Create Account</Link>
    </AuthShell>
  );
}

function MethodItem({ icon, title, desc, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.methodItem}>
      <FontAwesome name={icon} size={22} color="#4b5563" />
      <View>
        <Text style={styles.methodTitle}>{title}</Text>
        <Text style={styles.methodDesc}>{desc}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", marginBottom: 12 },
  title: { fontSize: 30, fontWeight: "800", color: "#111827", textAlign: "center" },
  subtitle: { marginTop: 6, fontSize: 13, color: "#6b7280", fontWeight: "600", textAlign: "center" },
  switchLink: { marginTop: 12, textAlign: "center", color: "#2563eb", fontWeight: "800" },
  centerBox: { alignItems: "center", paddingVertical: 20 },
  approvalCircle: { width: 80, height: 80, borderRadius: 999, backgroundColor: "#eff6ff", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  approvalTitle: { fontSize: 21, fontWeight: "800", color: "#111827" },
  approvalSub: { marginTop: 4, marginBottom: 10, textAlign: "center", color: "#6b7280", fontWeight: "600" },
  methods: { gap: 10 },
  methodItem: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, padding: 12, flexDirection: "row", gap: 10, alignItems: "center" },
  methodTitle: { fontSize: 14, fontWeight: "800", color: "#111827" },
  methodDesc: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  bottomLink: { marginTop: 14, textAlign: "center", color: "#4f46e5", fontWeight: "800" },
  error: { color: "#dc2626", fontWeight: "700", textAlign: "center", marginBottom: 8 },
});
