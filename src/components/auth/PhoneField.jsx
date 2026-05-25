import { useState } from "react";
import { View, Text, TextInput, Pressable, Modal, FlatList, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const COUNTRIES = [
  { code: "BD", name: "Bangladesh", dial: "+880", flag: "🇧🇩" },
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
  { code: "AE", name: "UAE", dial: "+971", flag: "🇦🇪" },
  { code: "MY", name: "Malaysia", dial: "+60", flag: "🇲🇾" },
  { code: "SG", name: "Singapore", dial: "+65", flag: "🇸🇬" },
  { code: "PK", name: "Pakistan", dial: "+92", flag: "🇵🇰" },
  { code: "LK", name: "Sri Lanka", dial: "+94", flag: "🇱🇰" },
  { code: "NP", name: "Nepal", dial: "+977", flag: "🇳🇵" },
  { code: "MM", name: "Myanmar", dial: "+95", flag: "🇲🇲" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
  { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
  { code: "TR", name: "Turkey", dial: "+90", flag: "🇹🇷" },
  { code: "QA", name: "Qatar", dial: "+974", flag: "🇶🇦" },
  { code: "KW", name: "Kuwait", dial: "+965", flag: "🇰🇼" },
  { code: "OM", name: "Oman", dial: "+968", flag: "🇴🇲" },
  { code: "BH", name: "Bahrain", dial: "+973", flag: "🇧🇭" },
  { code: "JO", name: "Jordan", dial: "+962", flag: "🇯🇴" },
  { code: "IT", name: "Italy", dial: "+39", flag: "🇮🇹" },
  { code: "ES", name: "Spain", dial: "+34", flag: "🇪🇸" },
  { code: "JP", name: "Japan", dial: "+81", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", dial: "+82", flag: "🇰🇷" },
  { code: "CN", name: "China", dial: "+86", flag: "🇨🇳" },
  { code: "ID", name: "Indonesia", dial: "+62", flag: "🇮🇩" },
  { code: "PH", name: "Philippines", dial: "+63", flag: "🇵🇭" },
  { code: "TH", name: "Thailand", dial: "+66", flag: "🇹🇭" },
  { code: "VN", name: "Vietnam", dial: "+84", flag: "🇻🇳" },
  { code: "NG", name: "Nigeria", dial: "+234", flag: "🇳🇬" },
  { code: "GH", name: "Ghana", dial: "+233", flag: "🇬🇭" },
  { code: "ZA", name: "South Africa", dial: "+27", flag: "🇿🇦" },
  { code: "EG", name: "Egypt", dial: "+20", flag: "🇪🇬" },
  { code: "RU", name: "Russia", dial: "+7", flag: "🇷🇺" },
  { code: "BR", name: "Brazil", dial: "+55", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", dial: "+52", flag: "🇲🇽" },
  { code: "AR", name: "Argentina", dial: "+54", flag: "🇦🇷" },
];

export default function PhoneField({ value, onChangeFormattedText, style }) {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  const number = (() => {
    if (!value) return "";
    if (value.startsWith(selectedCountry.dial)) {
      return value.slice(selectedCountry.dial.length);
    }
    return value;
  })();

  const handleNumberChange = (text) => {
    onChangeFormattedText?.(selectedCountry.dial + text);
  };

  const handleSelect = (country) => {
    setSelectedCountry(country);
    setShowModal(false);
    setSearch("");
    onChangeFormattedText?.(country.dial + number);
  };

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dial.includes(search)
  );

  return (
    <>
      <View style={[styles.container, style]}>
        {/* Country Picker Button */}
        <Pressable style={styles.countryBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.flag}>{selectedCountry.flag}</Text>
          <Text style={styles.dialCode}>{selectedCountry.dial}</Text>
          <FontAwesome name="chevron-down" size={10} color="#9ca3af" />
        </Pressable>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Number Input */}
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#9ca3af"
            value={number}
            onChangeText={handleNumberChange}
            keyboardType="phone-pad"
            cursorColor="#4f46e5"
            selectionColor="#4f46e5"
            autoCorrect={false}
            autoCapitalize="none"
            blurOnSubmit={false}
          />
        </View>
      </View>

      {/* Country Picker Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <Pressable onPress={() => setShowModal(false)} style={styles.closeBtn}>
                <FontAwesome name="times" size={18} color="#374151" />
              </Pressable>
            </View>

            {/* Search */}
            <View style={styles.searchBox}>
              <FontAwesome name="search" size={14} color="#9ca3af" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search country..."
                placeholderTextColor="#9ca3af"
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
            </View>

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.countryItem, item.code === selectedCountry.code && styles.countryItemActive]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.itemFlag}>{item.flag}</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDial}>{item.dial}</Text>
                  {item.code === selectedCountry.code && (
                    <FontAwesome name="check" size={14} color="#6366f1" />
                  )}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    backgroundColor: "rgba(249,250,251,0.5)",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  countryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: 116,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    flexShrink: 0,
  },
  flag: {
    fontSize: 20,
  },
  dialCode: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: "#e5e7eb",
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
    paddingRight: 10,
    paddingLeft: 4,
    minHeight: 44,
  },
  inputWrap: {
    flex: 1,
    justifyContent: "center",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  closeBtn: {
    padding: 4,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: "#374151",
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
  },
  countryItemActive: {
    backgroundColor: "#eef2ff",
  },
  itemFlag: {
    fontSize: 22,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
  },
  itemDial: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
});
