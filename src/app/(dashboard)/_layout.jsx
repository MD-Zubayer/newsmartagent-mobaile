import React from "react";
import { Drawer } from "expo-router/drawer";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";

export default function DashboardLayout() {
  return (
    <Drawer
      drawerContent={(props) => <Sidebar {...props} />}
      screenOptions={{
        header: () => <TopNav />,
        drawerType: "front",
        drawerStyle: {
          width: 300,
        },
      }}
    >
      <Drawer.Screen
        name="user"
        options={{
          title: "Dashboard",
        }}
      />
      <Drawer.Screen
        name="agent"
        options={{
          title: "Agent Desk",
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />
      <Drawer.Screen
        name="notifications"
        options={{
          title: "Notifications",
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: "Settings",
        }}
      />
    </Drawer>
  );
}
