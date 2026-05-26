import React from "react";
import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Sidebar from "../../components/Sidebar";
import TopNav from "../../components/TopNav";

export default function DashboardLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <Sidebar {...props} />}
        screenOptions={{
          header: () => <TopNav />,
          drawerType: "front",
          drawerStyle: {
            width: 300,
            backgroundColor: "#fff",
          },
          overlayColor: "rgba(0,0,0,0.5)",
        }}
      >
        <Drawer.Screen
          name="user"
          options={{ title: "Dashboard", drawerLabel: "Dashboard" }}
        />
        <Drawer.Screen
          name="agent"
          options={{ title: "Agent Desk", drawerLabel: "Agent Desk" }}
        />
        <Drawer.Screen
          name="profile"
          options={{ title: "Profile", drawerLabel: "Profile" }}
        />
        <Drawer.Screen
          name="notifications"
          options={{ title: "Notifications", drawerLabel: "Notifications" }}
        />
        <Drawer.Screen
          name="settings"
          options={{ title: "Settings", drawerLabel: "Settings" }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}