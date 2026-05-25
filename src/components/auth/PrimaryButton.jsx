import { Pressable, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function PrimaryButton({ title, onPress, disabled }) {
  return (
    <Pressable 
      onPress={onPress} 
      disabled={disabled}
      style={({ pressed }) => [
        styles.wrap,
        pressed && styles.pressed,
        disabled && styles.disabled
      ]}
    >
      <LinearGradient colors={["#4f46e5", "#4338ca"]} style={styles.inner}>
        <Text style={styles.text}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { 
    borderRadius: 16, 
    overflow: "hidden", 
    marginTop: 8,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.7,
  },
  inner: { 
    minHeight: 56, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  text: { 
    color: "#ffffff", 
    fontSize: 16, 
    fontWeight: "800" 
  },
});
