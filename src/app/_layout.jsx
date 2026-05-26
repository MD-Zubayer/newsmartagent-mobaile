import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../context/AuthContext"; // আপনার তৈরি করা সেই কনটেক্সট

export default function RootLayout() {
  return (
    // এই AuthProvider-ই নিশ্চিত করবে যে useAuth() সব জায়গায় কাজ করবে
    <AuthProvider>
      <StatusBar style="dark" backgroundColor="#eef2ff" translucent={false} />
      <Stack>
        {/* রুট স্ক্রিনগুলো */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        
        {/* ড্যাশবোর্ড গ্রুপ */}
        <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
        
        {/* আপনার নতুন Forgot Password পেজটি যদি (auth) গ্রুপে না থাকে, তবে এখানে অ্যাড করুন */}
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}