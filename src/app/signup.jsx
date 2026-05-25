import { useMemo, useRef, useState } from "react";
import { Animated, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import AuthShell from "@/components/auth/AuthShell";
import Field from "@/components/auth/Field";
import PhoneField from "@/components/auth/PhoneField";
import PrimaryButton from "@/components/auth/PrimaryButton";
import SelectField from "@/components/auth/SelectField";
import { apiRequest } from "@/lib/api";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showBotModal, setShowBotModal] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [botPhoneInput, setBotPhoneInput] = useState("");
  const [messages, setMessages] = useState([
    { sender: "bot", text: "হ্যালো! 👋 আমি আপনার অ্যাকাউন্ট তৈরি করে দিবো।\n\nপ্রথমে, আপনার সম্পূর্ণ নাম লিখুন: " },
  ]);
  const [currentChatField, setCurrentChatField] = useState("name");
  const [chatInputType, setChatInputType] = useState("text");
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const createdByOptions = [
    { label: "Self", value: "self" },
    { label: "Agent", value: "agent" },
  ];

  const idTypeOptions = [
    { label: "Agent", value: "agent" },
    { label: "User", value: "user" },
  ];

  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    email: "",
    division: "",
    district: "",
    upazila: "",
    created_by: "self",
    id_type: "user",
    man_agent_unique_id: "",
    man_agent_otp_key: "",
    password: "",
    confirmPassword: "",
    country: "BD",
  });

  const passwordError = useMemo(() => {
    if (!formData.password || !formData.confirmPassword) return "";
    return formData.password === formData.confirmPassword ? "" : "Passwords do not match!";
  }, [formData.password, formData.confirmPassword]);

  const setField = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSignup = async () => {
    setError("");
    setSuccess("");
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/users/create_user/", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setSuccess("Account created! Verify email, then login.");
      setTimeout(() => router.replace("/login"), 700);
    } catch (err) {
      if (err?.data && typeof err.data === "object") {
        const values = Object.values(err.data).flat().join(", ");
        setError(values || err.message || "Signup failed");
      } else {
        setError(err.message || "Signup failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    let text = chatInput.trim();
    let inputValue = text;
    
    if (currentChatField === "phone_number") {
      inputValue = botPhoneInput.trim();
      text = inputValue;
      if (!inputValue) return;
    } else if (!text || currentChatField === "done") {
      return;
    }

    const displayText = currentChatField.includes("password") ? "********" : text;
    const newMessages = [...messages, { sender: "user", text: displayText }];
    let updatedFormData = { ...formData };
    let normalizedValue = text;
    let nextField = "";
    let nextType = "text";
    let nextMsg = "";

    if (currentChatField === "phone_number") {
      if (!inputValue || inputValue.length < 9) {
        setMessages([...newMessages, { sender: "bot", text: "দয়া করে একটি বৈধ ফোন নম্বর দিন!" }]);
        setBotPhoneInput("");
        return;
      }
      normalizedValue = inputValue;
    }

    if (currentChatField === "created_by") {
      const lower = text.toLowerCase();
      if (lower.includes("agent")) normalizedValue = "agent";
      else if (lower.includes("self")) normalizedValue = "self";
      else {
        setMessages([...newMessages, { sender: "bot", text: "Self বা Agent লিখুন।" }]);
        setChatInput("");
        return;
      }
    }

    if (currentChatField === "id_type") {
      const lower = text.toLowerCase();
      if (lower.includes("agent")) normalizedValue = "agent";
      else if (lower.includes("user")) normalizedValue = "user";
      else {
        setMessages([...newMessages, { sender: "bot", text: "User বা Agent লিখুন।" }]);
        setChatInput("");
        return;
      }
    }

    if (currentChatField === "confirmPassword" && text !== formData.password) {
      setMessages([...newMessages, { sender: "bot", text: "পাসওয়ার্ড মেলেনি! দয়া করে কনফার্ম পাসওয়ার্ডটি আবার লিখুন।" }]);
      setChatInput("");
      return;
    }

    updatedFormData[currentChatField] = normalizedValue;
    setFormData(updatedFormData);

    switch (currentChatField) {
      case "name":
        nextField = "phone_number";
        nextMsg = "দারুণ! 👍 এবার আপনার ফোন নম্বর দিন। প্রথমে দেশ সিলেক্ট করুন, তারপর নাম্বার লিখুন 📱";
        break;
      case "phone_number":
        nextField = "email";
        nextMsg = "পরবর্তী, আপনার ইমেইল অ্যাড্রেস লিখুন:\n\n(যেমন: yourname@gmail.com)";
        break;
      case "email":
        nextField = "division";
        nextMsg = "আপনি কোন বিভাগে থাকেন? লিখুন:\n\n(যেমন: Dhaka, Chittagong, Sylhet ইত্যাদি)";
        break;
      case "division":
        nextField = "district";
        nextMsg = "আপনার জেলার নাম কী?";
        break;
      case "district":
        nextField = "upazila";
        nextMsg = "আপনার উপজেলার নাম লিখুন:";
        break;
      case "upazila":
        nextField = "created_by";
        nextMsg = "আপনি কি Self বা Agent হিসেবে অ্যাকাউন্ট খুলছেন?\n\n(Self / Agent লিখুন)";
        break;
      case "created_by":
        nextField = "id_type";
        nextMsg = "আপনার ID Type লিখুন:\n\n(Agent অথবা User)";
        break;
      case "id_type":
        if (updatedFormData.created_by === "agent") {
          nextField = "man_agent_unique_id";
          nextMsg = "এজেন্টের ইউনিক ID দিন:";
        } else {
          nextField = "password";
          nextMsg = "অ্যাকাউন্টের জন্য একটি শক্তিশালী পাসওয়ার্ড তৈরি করুন:\n\n(কমপক্ষে ৮ অক্ষর, সংখ্যা এবং বিশেষ চিহ্ন যুক্ত করুন)";
          nextType = "password";
        }
        break;
      case "man_agent_unique_id":
        nextField = "man_agent_otp_key";
        nextMsg = "এজেন্ট OTP Key দিন:";
        break;
      case "man_agent_otp_key":
        nextField = "password";
        nextMsg = "অ্যাকাউন্টের জন্য একটি শক্তিশালী পাসওয়ার্ড তৈরি করুন:\n\n(কমপক্ষে ৮ অক্ষর, সংখ্যা এবং বিশেষ চিহ্ন যুক্ত করুন)";
        nextType = "password";
        break;
      case "password":
        nextField = "confirmPassword";
        nextMsg = "পাসওয়ার্ডটি আবার লিখে নিশ্চিত করুন:";
        nextType = "password";
        break;
      case "confirmPassword":
        setMessages([...newMessages, { sender: "bot", text: "✅ সব তথ্য পাওয়া গেছে!\n\nআপনার অ্যাকাউন্ট তৈরি করা হচ্ছে... দয়া করে অপেক্ষা করুন।" }]);
        setChatInput("");
        setCurrentChatField("done");
        setChatInputType("none");
        try {
          await apiRequest("/users/create_user/", {
            method: "POST",
            body: JSON.stringify(updatedFormData),
          });
          setSuccess("Account created! Verify email, then login.");
          setMessages((prev) => [...prev, { sender: "bot", text: "অভিনন্দন! 🎉 আপনার অ্যাকাউন্ট তৈরি হয়েছে। এখন লগইন করুন।" }]);
          setTimeout(() => {
            setShowBotModal(false);
            router.replace("/login");
          }, 900);
        } catch (err) {
          const values =
            err?.data && typeof err.data === "object"
              ? Object.values(err.data).flat().join(", ")
              : err.message || "Signup failed";
          setMessages((prev) => [...prev, { sender: "bot", text: `দুঃখিত, সমস্যা হয়েছে: ${values}` }]);
          setCurrentChatField("confirmPassword");
          setChatInputType("password");
        }
        return;
    }

    setMessages([...newMessages, { sender: "bot", text: nextMsg }]);
    setCurrentChatField(nextField);
    setChatInputType(nextType);
    setChatInput("");
    setBotPhoneInput("");
  };

  return (
    <AuthShell>
      <View style={styles.header}>
        <View style={styles.lock}><FontAwesome name="lock" size={24} color="#fff" /></View>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join our community today</Text>
      </View>

      <Field icon="user" placeholder="Full Name" value={formData.name} onChangeText={(v) => setField("name", v)} />
      <PhoneField
        value={formData.phone_number}
        onChangeFormattedText={(text) => setFormData(prev => ({ ...prev, phone_number: text }))}
      />

      <Field icon="envelope" placeholder="Email" value={formData.email} onChangeText={(v) => setField("email", v)} />

      <View style={styles.row3}>
        <Mini placeholder="Division" value={formData.division} onChangeText={(v) => setField("division", v)} />
        <Mini placeholder="District" value={formData.district} onChangeText={(v) => setField("district", v)} />
        <Mini placeholder="Upazila" value={formData.upazila} onChangeText={(v) => setField("upazila", v)} />
      </View>

      <View style={styles.row2}>
        <SelectField 
          icon="user" 
          placeholder="Created By" 
          value={formData.created_by} 
          options={createdByOptions}
          onSelect={(v) => setField("created_by", v)} 
          style={styles.flex1} 
        />
        <SelectField 
          icon="id-badge" 
          placeholder="ID Type" 
          value={formData.id_type} 
          options={idTypeOptions}
          onSelect={(v) => setField("id_type", v)} 
          style={styles.flex1} 
        />
      </View>

      {formData.created_by === "agent" && (
        <View style={styles.row2}>
          <Field icon="id-badge" placeholder="Agent ID" value={formData.man_agent_unique_id} onChangeText={(v) => setField("man_agent_unique_id", v)} style={styles.flex1} />
          <Field icon="key" placeholder="OTP Key" value={formData.man_agent_otp_key} onChangeText={(v) => setField("man_agent_otp_key", v)} style={styles.flex1} />
        </View>
      )}

      <Field
        icon="lock"
        placeholder="Create Password"
        value={formData.password}
        onChangeText={(v) => setField("password", v)}
        secureTextEntry={!showPassword}
        rightIcon={showPassword ? "eye-slash" : "eye"}
        onRightPress={() => setShowPassword((p) => !p)}
      />
      <Field
        icon="lock"
        placeholder="Confirm Password"
        value={formData.confirmPassword}
        onChangeText={(v) => setField("confirmPassword", v)}
        secureTextEntry={!showConfirmPassword}
        rightIcon={showConfirmPassword ? "eye-slash" : "eye"}
        onRightPress={() => setShowConfirmPassword((p) => !p)}
      />

      {!!passwordError && <Text style={styles.error}>{passwordError}</Text>}
      {!!error && <Text style={styles.error}>{error}</Text>}
      {!!success && <Text style={styles.success}>{success}</Text>}

      <PrimaryButton title={loading ? "Please wait..." : "Register Account"} onPress={handleSignup} />

      <Link href="/login" style={styles.loginLink}>Already have an account? Login</Link>

      <Animated.View style={[styles.floatingWrap, { transform: pan.getTranslateTransform() }]} {...panResponder.panHandlers}>
        <View style={styles.bubble}><Text style={styles.bubbleText}>আমি তোমার অ্যাকাউন্ট তৈরি করে দিবো! ✨</Text></View>
        <Pressable style={styles.botBtn} onPress={() => setShowBotModal(true)}>
          <View style={styles.botCircle}><FontAwesome name="android" size={25} color="#fff" /></View>
        </Pressable>
      </Animated.View>

      <Modal visible={showBotModal} transparent animationType="fade" onRequestClose={() => setShowBotModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Assistant</Text>
              <Pressable onPress={() => setShowBotModal(false)}><FontAwesome name="times" size={18} color="#fff" /></Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.chatBody}>
              {messages.map((m, i) => (
                <View key={i} style={[styles.msg, m.sender === "user" ? styles.msgUser : styles.msgBot]}>
                  <Text style={[styles.msgText, m.sender === "user" && styles.msgUserText]}>{m.text}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.chatInputRow}>
              {currentChatField === "phone_number" ? (
                <>
                  <PhoneField
                    value={botPhoneInput}
                    onChangeFormattedText={setBotPhoneInput}
                    style={styles.chatPhoneInput}
                  />
                  <Pressable style={styles.sendBtn} onPress={sendMessage}><FontAwesome name="send" size={14} color="#fff" /></Pressable>
                </>
              ) : (
                <>
                  <Mini placeholder="Type here..." value={chatInput} onChangeText={setChatInput} style={styles.chatInput} />
                  <Pressable style={styles.sendBtn} onPress={sendMessage}><FontAwesome name="send" size={14} color="#fff" /></Pressable>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </AuthShell>
  );
}

function Mini({ style, ...props }) {
  return <Field style={[styles.miniWrap, style]} {...props} />;
}

const styles = StyleSheet.create({
  header: { alignItems: "center", marginBottom: 16 },
  lock: { width: 64, height: 64, borderRadius: 20, backgroundColor: "#4f46e5", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  title: { fontSize: 30, fontWeight: "800", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6b7280", fontWeight: "600", marginTop: 4 },
  row3: { flexDirection: "row", gap: 8, marginVertical: 6 },
  row2: { flexDirection: "row", gap: 8, marginVertical: 6 },
  flex1: { flex: 1 },
  miniWrap: { flex: 1, minHeight: 46 },
  error: { color: "#ef4444", fontWeight: "700", fontSize: 12, textAlign: "center", marginBottom: 12, marginTop: 4 },
  success: { color: "#16a34a", fontWeight: "700", fontSize: 12, textAlign: "center", marginBottom: 12, marginTop: 4 },
  loginLink: { marginTop: 16, marginBottom: 20, textAlign: "center", color: "#4f46e5", fontWeight: "800" },
  floatingWrap: { position: "absolute", top: 0, right: 8, alignItems: "flex-end" },
  bubble: { backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  bubbleText: { color: "#312e81", fontSize: 12, fontWeight: "700" },
  botBtn: { borderRadius: 999, overflow: "hidden" },
  botCircle: { width: 60, height: 60, borderRadius: 999, backgroundColor: "#4f46e5", alignItems: "center", justifyContent: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(17,24,39,0.65)", justifyContent: "flex-end", padding: 0 },
  modalCard: { backgroundColor: "#fff", borderRadius: 26, height: "85%", overflow: "hidden", flexShrink: 0 },
  modalHeader: { backgroundColor: "#4f46e5", padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalTitle: { color: "#fff", fontWeight: "800", fontSize: 16 },
  chatBody: { flex: 1, padding: 12, gap: 10 },
  msg: { maxWidth: "84%", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  msgBot: { alignSelf: "flex-start", backgroundColor: "#f3f4f6" },
  msgUser: { alignSelf: "flex-end", backgroundColor: "#4f46e5" },
  msgText: { color: "#1f2937", fontWeight: "600", fontSize: 13 },
  msgUserText: { color: "#fff" },
  chatInputRow: { flexDirection: "row", alignItems: "stretch", gap: 8, borderTopWidth: 1, borderTopColor: "#f3f4f6", padding: 12 },
  chatInput: { flex: 1, marginBottom: 0 },
  chatPhoneInput: { flex: 1, marginBottom: 0 },
  sendBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#4f46e5", alignItems: "center", justifyContent: "center", flexShrink: 0 },
});
