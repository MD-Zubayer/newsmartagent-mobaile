import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { getAccessToken } from "@/lib/auth";
import { apiRequest } from "@/lib/api";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    autoUpdates: true,
    emailAlerts: true,
  });
  const [profileName, setProfileName] = useState("User");
  const { width } = useWindowDimensions();
  const isWide = width > 760;

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = await getAccessToken();
        if (!token) throw new Error("No token");

        const user = await apiRequest("/users/me/", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        setProfileName(user?.full_name || user?.name || user?.username || "User");
      } catch (err) {
        console.error("Settings load failed", err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const toggleSetting = (key) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  };

  if (loading) {
    return (
      <View style={styles.loaderCenter}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.pageScroll}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Settings</Text>
        <Text style={styles.pageSubtitle}>Configure app behavior, notifications, and security.</Text>
      </View>

      <View style={[styles.section, isWide && styles.sectionRow]}>
        <View style={styles.settingsCard}>
          <Text style={styles.cardTitle}>Preferences</Text>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Enable Dark Mode</Text>
              <Text style={styles.settingHint}>Choose a comfortable interface.</Text>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={() => toggleSetting("darkMode")}
              trackColor={{ false: "#d1d5db", true: "#4f46e5" }}
              thumbColor={settings.darkMode ? "#ffffff" : "#ffffff"}
            />
          </View>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Auto Updates</Text>
              <Text style={styles.settingHint}>Keep app features current automatically.</Text>
            </View>
            <Switch
              value={settings.autoUpdates}
              onValueChange={() => toggleSetting("autoUpdates")}
              trackColor={{ false: "#d1d5db", true: "#4f46e5" }}
              thumbColor={settings.autoUpdates ? "#ffffff" : "#ffffff"}
            />
          </View>
        </View>

        <View style={styles.settingsCard}>
          <Text style={styles.cardTitle}>Notifications</Text>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Email Alerts</Text>
              <Text style={styles.settingHint}>Receive updates and account notices.</Text>
            </View>
            <Switch
              value={settings.emailAlerts}
              onValueChange={() => toggleSetting("emailAlerts")}
              trackColor={{ false: "#d1d5db", true: "#4f46e5" }}
              thumbColor={settings.emailAlerts ? "#ffffff" : "#ffffff"}
            />
          </View>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingHint}>Receive instant app notifications.</Text>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={() => toggleSetting("notifications")}
              trackColor={{ false: "#d1d5db", true: "#4f46e5" }}
              thumbColor={settings.notifications ? "#ffffff" : "#ffffff"}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.cardTitle}>Account Actions</Text>
        <Pressable style={styles.actionButton} onPress={() => null}>
          <Text style={styles.actionButtonText}>Change Password</Text>
        </Pressable>
        <Pressable style={styles.actionButtonSecondary} onPress={() => null}>
          <Text style={styles.actionButtonSecondaryText}>Manage Connected Apps</Text>
        </Pressable>
      </View>

      <View style={styles.footerCard}>
        <Text style={styles.footerTitle}>Personalized Settings</Text>
        <Text style={styles.footerSubtitle}>Your settings help us tailor the experience for {profileName}.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageScroll: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "#f8fafc",
  },
  loaderCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  pageHeader: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    maxWidth: 620,
  },
  section: {
    marginBottom: 24,
  },
  sectionRow: {
    flexDirection: "row",
    gap: 18,
    flexWrap: "wrap",
  },
  settingsCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
    marginBottom: 18,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2ff",
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  settingHint: {
    fontSize: 12,
    color: "#6b7280",
    maxWidth: 220,
  },
  actionButton: {
    marginTop: 16,
    backgroundColor: "#4f46e5",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 14,
  },
  actionButtonSecondary: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  actionButtonSecondaryText: {
    color: "#4338ca",
    fontWeight: "900",
    fontSize: 14,
  },
  footerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 8,
  },
  footerSubtitle: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 20,
  },
});
