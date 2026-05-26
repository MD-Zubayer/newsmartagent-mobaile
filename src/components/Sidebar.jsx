import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";

export default function Sidebar(props) {
  const currentRoute = props.state.routeNames[props.state.index];

  // To mirror the "viewMode" functionality from the web, we'll assume "user" mode by default.
  // In a real implementation, you'd pull this from a Context or props.
  const [viewMode] = useState("user");

  const topLinks = [
    { name: "Overview", route: "user", icon: "home", roles: ["user"] },
    { name: "Saving", route: "saving", icon: "briefcase", roles: ["user"] }, // fallback icons
    { name: "Orders", route: "orders", icon: "shopping-cart", roles: ["user"] },
    { name: "Connect", route: "connect", icon: "link", roles: ["user"] },
    { name: "Sheet", route: "sheet", icon: "grid", roles: ["user"] },
    { name: "Docs", route: "docs", icon: "file-text", roles: ["user"] },
    { name: "Offers", route: "offers", icon: "tag", roles: ["user"] },
    {
      name: "Payments",
      route: "payment",
      icon: "credit-card",
      roles: ["user"],
    },
    { name: "History", route: "history", icon: "clock", roles: ["user"] },

    { name: "Overview", route: "agent", icon: "home", roles: ["agent"] },
    {
      name: "My Referrals",
      route: "referrals",
      icon: "users",
      roles: ["agent"],
    },
    { name: "OTP Settings", route: "otp", icon: "key", roles: ["agent"] },
    {
      name: "Accounts",
      route: "accounts",
      icon: "bar-chart-2",
      roles: ["agent"],
    },

    {
      name: "Notifications",
      route: "notifications",
      icon: "bell",
      roles: ["user", "agent"],
    },
    {
      name: "Contacts",
      route: "contacts",
      icon: "users",
      roles: ["user", "agent"],
    },
    {
      name: "Smart CRM",
      route: "crm",
      icon: "filter",
      roles: ["user", "agent"],
    },
    {
      name: "AI Agent",
      route: "aiAgent",
      icon: "cpu",
      roles: ["user", "agent"],
      highlight: true,
    },
  ];

  const bottomLinks = [
    { name: "Settings", route: "settings", icon: "settings" },
    { name: "Profile", route: "profile", icon: "user" },
    { name: "Logout", route: "logout", icon: "log-out" },
  ];

  const filteredTopLinks = topLinks.filter((link) =>
    link.roles.includes(viewMode),
  );

  const NavItem = ({ name, route, icon, highlight, isLogout }) => {
    const isActive = currentRoute === route;

    return (
      <Pressable
        style={[
          styles.navItem,
          isActive && styles.navItemActive,
          highlight && !isActive && styles.navItemSpecial,
          isLogout && styles.navItemLogout,
        ]}
        onPress={() => {
          if (isLogout) {
            // handle logout
          } else {
            router.navigate(`/(dashboard)/${route}`);
          }
        }}
      >
        {name === "Profile" ? (
          <View
            style={[
              styles.profileIconBg,
              isActive && styles.profileIconBgActive,
            ]}
          >
            <Feather
              name={icon}
              size={14}
              color={isActive ? "#fff" : "#4b5563"}
            />
          </View>
        ) : (
          <Feather
            name={icon}
            size={20}
            color={
              isActive
                ? "#ffffff"
                : isLogout
                  ? "#ef4444"
                  : highlight
                    ? "#9333ea"
                    : "#4b5563"
            }
          />
        )}
        <Text
          style={[
            styles.navLabel,
            isActive && styles.navLabelActive,
            highlight && !isActive && styles.navLabelSpecial,
            isLogout && styles.navLabelLogout,
          ]}
        >
          {name}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          {/* We'll use a placeholder colored box if the image doesn't exist yet */}
          <View style={styles.logoImageFallback}>
            <Text style={styles.logoText}>SA</Text>
          </View>
        </View>

        {/* Dynamic Top Links */}
        <View style={styles.linksContainer}>
          {filteredTopLinks.map((link) => (
            <NavItem key={link.name} {...link} />
          ))}
        </View>
      </ScrollView>

      {/* Bottom Links */}
      <View style={styles.footer}>
        {bottomLinks.map((link) => (
          <NavItem
            key={link.name}
            {...link}
            isLogout={link.name === "Logout"}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    paddingTop: 0,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 48, // matching mt-12 in web app
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  logoImageFallback: {
    width: 75,
    height: 75,
    backgroundColor: "#4f46e5",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
  },
  linksContainer: {
    paddingHorizontal: 12,
    marginTop: 8,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 4,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: "#2563eb", // blue-600
    shadowColor: "#dbeafe", // blue-100 shadow equivalent
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  navItemSpecial: {
    backgroundColor: "#faf5ff", // purple-50
  },
  navItemLogout: {
    // no special bg by default, but red text
  },
  navLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4b5563", // gray-600
    marginLeft: 12,
  },
  navLabelActive: {
    color: "#ffffff",
  },
  navLabelSpecial: {
    color: "#9333ea", // purple-600
    fontWeight: "600",
  },
  navLabelLogout: {
    color: "#ef4444", // red-500
  },
  profileIconBg: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: "#f3f4f6", // gray-100
    alignItems: "center",
    justifyContent: "center",
  },
  profileIconBgActive: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  footer: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
});
