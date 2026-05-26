import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { clearAuthToken, getAccessToken } from "@/lib/auth";
import { apiRequest } from "@/lib/api";

const formatDateTime = (dateStr) => {
  if (!dateStr) return "Unknown";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Card = ({ title, value, subtitle, style }) => (
  <View style={[styles.card, style]}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardValue}>{value}</Text>
    {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
  </View>
);

const SubscriptionCard = ({ subscription }) => {
  const totalTokens = subscription.offer?.tokens ?? 0;
  const remainingTokens = subscription.remaining_tokens ?? 0;
  const percentRemaining = totalTokens > 0 ? Math.round((remainingTokens / totalTokens) * 100) : 0;
  const statusColor = percentRemaining <= 15 ? styles.subscriptionLow : styles.subscriptionHigh;

  return (
    <View style={styles.subscriptionCard}>
      <View style={styles.subscriptionHeader}>
        <View>
          <Text style={styles.subscriptionName}>{subscription.offer?.name || "Subscription"}</Text>
          <Text style={styles.subscriptionMeta}>
            Ends {formatDateTime(subscription.end_date)}
          </Text>
        </View>
        <View style={[styles.statusBadge, statusColor]}>
          <Text style={styles.statusText}>{percentRemaining <= 15 ? "Low" : "Active"}</Text>
        </View>
      </View>

      <View style={styles.subscriptionStats}>
        <View>
          <Text style={styles.subscriptionLabel}>Remaining</Text>
          <Text style={styles.subscriptionValue}>{remainingTokens.toLocaleString()}</Text>
        </View>
        <View>
          <Text style={styles.subscriptionLabel}>Total</Text>
          <Text style={styles.subscriptionValue}>{totalTokens.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percentRemaining}%` }]} />
        </View>
        <Text style={styles.subscriptionPercent}>{percentRemaining}% left</Text>
      </View>
    </View>
  );
};

const ActivityRow = ({ item }) => {
  const date = formatDateTime(item.created_at);
  const label = item.request_type ? item.request_type.replace(/_/g, " ") : "Activity";
  const status = item.success === false ? "Failed" : "Success";

  return (
    <View style={styles.activityItem}>
      <View style={styles.activityItemLeft}>
        <Text style={styles.activityLabel}>{label}</Text>
        <Text style={styles.activityDetail}>{item.platform || "Unknown platform"}</Text>
      </View>
      <View style={styles.activityItemRight}>
        <Text style={styles.activityStatus}>{status}</Text>
        <Text style={styles.activityDate}>{date}</Text>
      </View>
    </View>
  );
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [user, setUser] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);

  const handleLogout = async () => {
    await clearAuthToken();
    router.replace("/login");
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token = await getAccessToken();
        if (!token) throw new Error("No token found");

        await apiRequest("/token/verify/", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ token }),
        });

        const [analyticsRes, userRes, subscriptionsRes] = await Promise.all([
          apiRequest("/AgentAI/tokens/analytics/", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }),
          apiRequest("/users/me/", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }),
          apiRequest("/subscriptions/", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setAnalytics(analyticsRes);
        setUser(userRes);
        setSubscriptions(Array.isArray(subscriptionsRes) ? subscriptionsRes : subscriptionsRes.results || []);
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError(err.message || "Unable to load dashboard");
        await clearAuthToken();
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const activeSubscriptions = useMemo(
    () => subscriptions.filter((sub) => sub.is_active),
    [subscriptions]
  );
  const currentSubscription = activeSubscriptions[0] || subscriptions[0] || null;
  const totalScheduleSlots = activeSubscriptions.reduce(
    (acc, sub) => acc + (sub.offer?.schedule_messages || 0),
    0
  );
  const remainingSchedules = user?.profile?.schedule_balance || 0;
  const usedSchedules = Math.max(totalScheduleSlots - remainingSchedules, 0);

  if (loading) {
    return (
      <View style={styles.containerCenter}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.containerCenter}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.button} onPress={() => router.replace("/login")}> 
          <Text style={styles.buttonText}>Go to Login</Text>
        </Pressable>
      </View>
    );
  }

  const summary = analytics?.summary || {};
  const totalTokens = user?.profile?.word_balance ?? 0;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Dashboard Overview</Text>
          <Text style={styles.pageSubtitle}>Quick view of tokens, subscriptions, and recent activity.</Text>
        </View>
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Available Token Balance</Text>
        <Text style={styles.heroValue}>{Number(totalTokens).toLocaleString()}</Text>
        <Text style={styles.heroSub}>{user?.email || "User"}</Text>
        <View style={styles.heroRow}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Success Rate</Text>
            <Text style={styles.heroStatValue}>{summary.success_rate ?? 0}%</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Recent Requests</Text>
            <Text style={styles.heroStatValue}>{summary.total_messages ?? 0}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardGrid}>
        <Card
          title="Total Tokens"
          value={summary.total_tokens?.toLocaleString() ?? "0"}
          subtitle={`In ${summary.input_tokens?.toLocaleString() ?? 0} • Out ${summary.output_tokens?.toLocaleString() ?? 0}`}
        />
        <Card title="Total Requests" value={(summary.total_messages ?? 0).toString()} />
        <Card title="Avg Latency" value={`${summary.avg_response_ms ?? 0} ms`} />
        <Card title="Failed" value={(summary.failed_count ?? 0).toString()} />
        <Card
          title="Schedule Contacts"
          value={`${remainingSchedules ?? 0}/${totalScheduleSlots ?? 0}`}
          subtitle={`Used ${usedSchedules ?? 0}`}
        />
        <Card title="Memory Cost" value={(summary.memory_extraction_tokens ?? 0).toLocaleString()} />
      </View>

      {currentSubscription && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Subscription</Text>
          <SubscriptionCard subscription={currentSubscription} />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {analytics?.recent_logs?.length ? (
          analytics.recent_logs.slice(0, 5).map((item) => (
            <ActivityRow key={item.id || `${item.created_at}-${item.request_type}`} item={item} />
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No recent activity available yet.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "#f8fafc",
  },
  containerCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 20,
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },
  pageSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
    maxWidth: "72%",
  },
  logoutBtn: {
    backgroundColor: "#4f46e5",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignSelf: "flex-start",
  },
  logoutText: {
    color: "#ffffff",
    fontWeight: "800",
  },
  heroCard: {
    backgroundColor: "#1f2937",
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 6,
  },
  heroLabel: {
    color: "#c7d2fe",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  heroValue: {
    color: "#fff",
    fontSize: 42,
    fontWeight: "900",
    marginBottom: 6,
  },
  heroSub: {
    color: "#cbd5e1",
    fontSize: 14,
    marginBottom: 16,
  },
  heroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  heroStat: {
    flex: 1,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
  },
  heroStatLabel: {
    color: "#9ca3af",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  heroStatValue: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  },
  card: {
    width: "48%",
    minWidth: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 12,
  },
  cardTitle: {
    color: "#6b7280",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    fontWeight: "800",
  },
  cardValue: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 6,
  },
  cardSubtitle: {
    color: "#6b7280",
    fontSize: 11,
    lineHeight: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 14,
  },
  subscriptionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  subscriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  subscriptionName: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
  },
  subscriptionMeta: {
    color: "#6b7280",
    fontSize: 12,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  subscriptionHigh: {
    backgroundColor: "#dbeafe",
  },
  subscriptionLow: {
    backgroundColor: "#fee2e2",
  },
  statusText: {
    textTransform: "uppercase",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: "#111827",
  },
  subscriptionStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 24,
    marginBottom: 16,
  },
  subscriptionLabel: {
    color: "#6b7280",
    fontSize: 11,
    textTransform: "uppercase",
    marginBottom: 4,
    fontWeight: "800",
  },
  subscriptionValue: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "900",
  },
  progressRow: {
    gap: 10,
  },
  progressTrack: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4f46e5",
  },
  subscriptionPercent: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "800",
    color: "#4f46e5",
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 22,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  activityItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  activityLabel: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 4,
  },
  activityDetail: {
    fontSize: 12,
    color: "#6b7280",
  },
  activityItemRight: {
    alignItems: "flex-end",
  },
  activityStatus: {
    fontSize: 12,
    fontWeight: "900",
    color: "#10b981",
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 11,
    color: "#6b7280",
  },
  emptyBox: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 22,
    alignItems: "center",
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 13,
    textAlign: "center",
  },
  button: {
    marginTop: 16,
    backgroundColor: "#4f46e5",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "900",
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 16,
  },
});
