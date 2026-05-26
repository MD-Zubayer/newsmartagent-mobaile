import { LinearGradient } from "expo-linear-gradient";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthShell({ children }) {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <LinearGradient
          colors={["#eef2ff", "#ffffff", "#f3e8ff"]}
          style={styles.page}
        >
          <View style={styles.orbTop} />
          <View style={styles.orbBottom} />
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>{children}</View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: "#eef2ff" },
  page: { flex: 1 },
  scroll: { flex: 1 },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 30,
    paddingBottom: 200,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    padding: 18,
    width: "100%",
    maxWidth: 420,
  },
  orbTop: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(99,102,241,0.2)",
    top: -60,
    left: -60,
  },
  orbBottom: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(168,85,247,0.18)",
    right: -70,
    bottom: -70,
  },
});
