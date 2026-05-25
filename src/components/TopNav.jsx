import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation, Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TopNav() {
  const [viewMode, setViewMode] = useState("user");
  const navigation = useNavigation();

  const insets = useSafeAreaInsets();

  const toggleView = () => setViewMode((prev) => (prev === "user" ? "agent" : "user"));

  return (
    <View style={[styles.container, { paddingTop: insets.top, height: 70 + insets.top }]}>
      {/* LEFT SIDE: Menu */}
      <View style={styles.leftSection}>
        <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={styles.menuButton}>
          <Feather name="menu" size={20} color="#4b5563" />
        </Pressable>
      </View>

      {/* RIGHT SIDE: Actions & Profile */}
      <View style={styles.rightSection}>
        
        {/* Switch Button */}
        <Pressable 
          onPress={toggleView} 
          style={[
            styles.switchBtn,
            viewMode === "agent" ? styles.switchBtnAgent : styles.switchBtnUser
          ]}
        >
          <Feather name="refresh-cw" size={15} color="#fff" />
          <Text style={styles.switchBtnText}>
            {viewMode === "agent" ? "USER" : "AGENT"}
          </Text>
        </Pressable>


        {/* Profile Section */}
        <Link href="/profile" asChild>
          <Pressable style={styles.profileSection}>
            <View style={[
              styles.profileAvatar,
              viewMode === "agent" ? styles.avatarAgent : styles.avatarUser
            ]}>
              <Text style={styles.avatarText}>JD</Text>
            </View>
            <View style={styles.onlineStatus}>
              <View style={styles.onlineDot} />
            </View>
          </Pressable>
        </Link>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuButton: {
    padding: 8,
    borderRadius: 12,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  switchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  switchBtnUser: {
    backgroundColor: "#4f46e5", // indigo-600
    shadowColor: "#4f46e5",
  },
  switchBtnAgent: {
    backgroundColor: "#f59e0b", // amber-500
    shadowColor: "#f59e0b",
  },
  switchBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  profileSection: {
    marginLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: "#f3f4f6",
    paddingLeft: 12,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  avatarUser: {
    backgroundColor: "#6366f1", // indigo-500 roughly
    shadowColor: "#4f46e5",
  },
  avatarAgent: {
    backgroundColor: "#fbbf24", // amber-400 roughly
    shadowColor: "#f59e0b",
  },
  avatarText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 14,
  },
  onlineStatus: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    backgroundColor: "#10b981", // emerald-500
    borderRadius: 4,
  },
});
