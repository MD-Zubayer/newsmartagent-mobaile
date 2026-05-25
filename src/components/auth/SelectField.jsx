import { useState } from "react";
import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

export default function SelectField({ icon, placeholder, value, options, onSelect, style }) {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <>
      <Pressable style={[styles.group, style]} onPress={() => setModalVisible(true)}>
        {!!icon && <FontAwesome name={icon} size={16} color="#9ca3af" style={styles.leftIcon} />}
        <Text style={[styles.input, !selectedOption && styles.placeholderText]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <FontAwesome name="chevron-down" size={12} color="#9ca3af" style={styles.rightIcon} />
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{placeholder}</Text>
            {options.map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.optionBtn, value === opt.value && styles.optionBtnActive]}
                onPress={() => {
                  onSelect(opt.value);
                  setModalVisible(false);
                }}
              >
                <Text style={[styles.optionText, value === opt.value && styles.optionTextActive]}>
                  {opt.label}
                </Text>
                {value === opt.value && <FontAwesome name="check" size={14} color="#6366f1" />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
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
  leftIcon: { position: "absolute", left: 16, zIndex: 2 },
  rightIcon: { position: "absolute", right: 16, zIndex: 2 },
  input: { paddingLeft: 48, paddingRight: 32, fontSize: 15, fontWeight: "500", color: "#374151" },
  placeholderText: { color: "#9ca3af" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "#fff", borderRadius: 20, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 16, textAlign: "center" },
  optionBtn: { flexDirection: "row", justifyContent: "space-between", padding: 16, borderRadius: 12, marginBottom: 8, backgroundColor: "#f9fafb" },
  optionBtnActive: { backgroundColor: "#eef2ff", borderWidth: 1, borderColor: "#c7d2fe" },
  optionText: { fontSize: 15, fontWeight: "600", color: "#4b5563" },
  optionTextActive: { color: "#6366f1", fontWeight: "700" },
});
