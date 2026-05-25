import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

export default function Field({ icon, rightIcon, onRightPress, style, ...props }) {
  const [isFocused, setIsFocused] = useState(false);
  const inputPaddingStyle = {
    paddingLeft: icon ? 48 : 14,
    paddingRight: rightIcon ? 42 : 14,
  };

  return (
    <View style={[styles.group, isFocused && styles.groupFocused, style]}>
      {!!icon && (
        <FontAwesome 
          name={icon} 
          size={16} 
          color={isFocused ? "#6366f1" : "#9ca3af"} 
          style={styles.leftIcon} 
        />
      )}
      <TextInput 
        style={[styles.input, inputPaddingStyle]} 
        placeholderTextColor="#9ca3af" 
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props} 
      />
      {!!rightIcon && (
        <Pressable onPress={onRightPress} style={styles.rightIcon}>
          <FontAwesome name={rightIcon} size={16} color="#9ca3af" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,  
    borderColor: "#f3f4f6",
    backgroundColor: "rgba(249,250,251,0.5)",
    justifyContent: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  groupFocused: {
    backgroundColor: "#ffffff",
    borderColor: "#6366f1",
  },
  leftIcon: { 
    position: "absolute", 
    left: 16, 
    zIndex: 2 
  },
  rightIcon: { 
    position: "absolute", 
    right: 16, 
    zIndex: 2 
  },
  input: { 
    flex: 1,
    color: "#374151", 
    fontWeight: "500", 
    fontSize: 15,
  },
});
