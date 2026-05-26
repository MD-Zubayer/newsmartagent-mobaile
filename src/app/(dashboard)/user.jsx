import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { clearAuthToken, getAccessToken } from "@/lib/auth";
import { apiRequest } from "@/lib/api";

const formatDateTime = (dateStr) => {
  if (!dateStr) return { date: "Unknown", time: "--:--" };
  const date = new Date(dateStr);
  return {
    date: date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  };
};

const calculateTimeLeft = (endDate) => {
  if (!endDate) return "N/A";
  const end = new Date(endDate);
  const now = new Date();
  const diffMs = end - now;
  if (diffMs <= 0) return "Expired";
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return `${days} Days ${hours} Hours`;
};

const Card = ({ title, value, subtitle, style }) => (
  <View style={[styles.card, style]}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardValue}>{value}</Text>
    {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
  </View>
);

const StatCard = ({ title, value, icon, color, subValue }) => {
  const colorMap = {
    blue: { bg: "#dbeafe", text: "#1e40af" },
    purple: { bg: "#e9d5ff", text: "#6b21a8" },
    orange: { bg: "#fed7aa", text: "#b45309" },
    red: { bg: "#fecaca", text: "#b91c1c" },
    green: { bg: "#dcfce7", text: "#15803d" },
    pink: { bg: "#fbcfe8", text: "#be185d" },
  };
  const colors = colorMap[color] || colorMap.blue;

  return (
    <View style={[styles.statCard, { borderLeftColor: colors.text }]}>
      <Text style={styles.statCardTitle}>{title}</Text>
      <Text style={[styles.statCardValue, { color: colors.text }]}>{value}</Text>
      {subValue ? <Text style={styles.statCardSub}>{subValue}</Text> : null}
    </View>
  );
};

const ModelDistributionRow = ({ model, count, totalMessages }) => {
  const percentage = totalMessages > 0 ? Math.round((count / totalMessages) * 100) : 0;
  
  return (
    <View style={styles.distributionRow}>
      <View style={styles.distributionLeft}>
        <Text style={styles.distributionLabel}>{model}</Text>
        <Text style={styles.distributionCount}>{count} Req</Text>
      </View>
      <View style={styles.distributionBarContainer}>
        <View style={[styles.distributionBar, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.distributionPercent}>{percentage}%</Text>
    </View>
  );
};

const PlatformRow = ({ platform, tokens, percentage, inputTokens, outputTokens }) => {
  return (
    <View style={styles.platformRow}>
      <View style={styles.platformLeft}>
        <Text style={styles.platformName}>{platform}</Text>
        <Text style={styles.platformTokens}>
          In: {inputTokens?.toLocaleString() || 0} | Out: {outputTokens?.toLocaleString() || 0}
        </Text>
      </View>
      <View style={styles.platformRight}>
        <View style={styles.platformBarContainer}>
          <View style={[styles.platformBar, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.platformPercent}>{percentage}%</Text>
      </View>
    </View>
  );
};

const TrendChart = ({ trendData }) => {
  if (!trendData || trendData.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>No trend data available</Text>
      </View>
    );
  }

  const maxTokens = Math.max(...trendData.map(d => Math.max(d.input_tokens || 0, d.output_tokens || 0)), 1);
  const displayData = trendData.slice(-7); // Show last 7 days
  const chartHeight = 150;

  return (
    <View style={styles.trendChartContainer}>
      <View style={styles.trendChartWrapper}>
        {/* Y-axis labels */}
        <View style={styles.yAxisLabels}>
          <Text style={styles.yAxisLabel}>{Math.round(maxTokens)}</Text>
          <Text style={styles.yAxisLabel}>{Math.round(maxTokens / 2)}</Text>
          <Text style={styles.yAxisLabel}>0</Text>
        </View>

        {/* Chart bars */}
        <View style={[styles.trendChart, { height: chartHeight }]}>
          <View style={styles.chartBarsContainer}>
            {displayData.map((day, idx) => {
              const inputHeight = (day.input_tokens / maxTokens) * chartHeight;
              const outputHeight = (day.output_tokens / maxTokens) * chartHeight;
              const date = new Date(day.date);
              const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });

              return (
                <View key={idx} style={styles.barGroup}>
                  <View style={styles.barColumn}>
                    <View style={[styles.bar, styles.inputBar, { height: `${(inputHeight / chartHeight) * 100}%` }]} />
                    <View style={[styles.bar, styles.outputBar, { height: `${(outputHeight / chartHeight) * 100}%` }]} />
                  </View>
                  <Text style={styles.dayLabel}>{dayLabel}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.trendLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.inputBar]} />
          <Text style={styles.legendText}>Input Tokens</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.outputBar]} />
          <Text style={styles.legendText}>Output Tokens</Text>
        </View>
      </View>
    </View>
  );
};

const SubscriptionCard = ({ subscription }) => {
  const totalTokens = subscription.offer?.tokens ?? 0;
  const remainingTokens = subscription.remaining_tokens ?? 0;
  const percentRemaining = totalTokens > 0 ? Math.round((remainingTokens / totalTokens) * 100) : 0;
  const statusColor = percentRemaining <= 15 ? styles.subscriptionLow : styles.subscriptionHigh;
  const { date: endDate } = formatDateTime(subscription.end_date);
  const timeLeft = calculateTimeLeft(subscription.end_date);
  const schedTotal = subscription.offer?.schedule_messages || 0;
  const schedRemaining = subscription.remaining_schedule_messages ?? 0;
  const isLow = percentRemaining <= 15;

  return (
    <View style={styles.subscriptionCard}>
      <View style={styles.subscriptionHeader}>
        <View style={styles.subscriptionHeaderLeft}>
          <Text style={styles.subscriptionName}>{subscription.offer?.name || "Subscription"}</Text>
          <Text style={styles.subscriptionMeta}>
            Ends {endDate}
          </Text>
          {subscription.offer?.allowed_models && subscription.offer.allowed_models.length > 0 && (
            <View style={styles.modelsContainer}>
              {subscription.offer.allowed_models.map((model, idx) => (
                <Text key={idx} style={styles.modelBadge}>{model.model_name}</Text>
              ))}
            </View>
          )}
        </View>
        <View style={[styles.statusBadge, statusColor]}>
          <Text style={styles.statusText}>{isLow ? "Low Fuel" : "Optimal"}</Text>
        </View>
      </View>

      <View style={styles.subscriptionStats}>
        <View>
          <Text style={styles.subscriptionLabel}>Remaining</Text>
          <Text style={styles.subscriptionValue}>{remainingTokens.toLocaleString()}</Text>
        </View>
        <View style={styles.statsDivider} />
        <View>
          <Text style={styles.subscriptionLabel}>Total</Text>
          <Text style={styles.subscriptionValue}>{totalTokens.toLocaleString()}</Text>
        </View>
        <View style={styles.statsDivider} />
        <View>
          <Text style={styles.subscriptionLabel}>Schedules</Text>
          <Text style={styles.subscriptionValue}>{schedRemaining}/{schedTotal}</Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percentRemaining}%` }]} />
        </View>
        <Text style={styles.subscriptionPercent}>{percentRemaining}% left</Text>
      </View>

      <View style={styles.expiryInfo}>
        <Text style={styles.expiryLabel}>Valid Until</Text>
        <Text style={styles.expiryTime}>{timeLeft}</Text>
      </View>
    </View>
  );
};

const ActivityRow = ({ item }) => {
  const { date, time } = formatDateTime(item.created_at);
  const label = item.request_type ? item.request_type.replace(/_/g, " ") : "Activity";
  const status = item.success === false ? "Failed" : "Success";
  const statusColor = status === "Success" ? "#10b981" : "#ef4444";
  const inputTokens = item.input_tokens || 0;
  const outputTokens = item.output_tokens || 0;

  return (
    <View style={styles.activityItem}>
      <View style={styles.activityItemLeft}>
        <Text style={styles.activityLabel}>{label}</Text>
        <Text style={styles.activityDetail}>{item.platform || "Unknown platform"}</Text>
        <Text style={styles.activityTokens}>
          In {inputTokens.toLocaleString()} • Out {outputTokens.toLocaleString()}
        </Text>
      </View>
      <View style={styles.activityItemRight}>
        <Text style={[styles.activityStatus, { color: statusColor }]}>{status}</Text>
        <Text style={styles.activityDate}>{date}</Text>
        <Text style={styles.activityTime}>{time}</Text>
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
      {/* Enhanced Header */}
      <View style={styles.pageHeaderWrapper}>
        <View style={styles.pageHeaderContent}>
          <View>
            <Text style={styles.pageTitle}>Agent Analytics</Text>
            <Text style={styles.pageSubtitle}>Real-time Performance Intelligence</Text>
          </View>
          <View style={styles.healthIndicator}>
            <Text style={styles.healthLabel}>System Health</Text>
            <Text style={styles.healthValue}>{summary.success_rate ?? 0}% Success</Text>
          </View>
        </View>
        <View style={styles.headerDivider} />
      </View>

      {/* Enhanced Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroContent}>
          <View>
            <Text style={styles.heroLabel}>Total Available Balance</Text>
            <View style={styles.heroValueWrapper}>
              <Text style={styles.heroValue}>{Number(totalTokens).toLocaleString()}</Text>
              <Text style={styles.heroTokenLabel}>Tokens</Text>
            </View>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Success Rate</Text>
              <Text style={styles.heroStatValue}>{summary.success_rate ?? 0}%</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Total Requests</Text>
              <Text style={styles.heroStatValue}>{summary.total_messages ?? 0}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.heroEmail}>{user?.email || "User"}</Text>
      </View>

      <View style={styles.cardGrid}>
        <StatCard
          title="Total Tokens"
          value={summary.total_tokens?.toLocaleString() ?? "0"}
          icon="⚡"
          color="blue"
          subValue={`In ${summary.input_tokens?.toLocaleString() ?? 0} • Out ${summary.output_tokens?.toLocaleString() ?? 0}`}
        />
        <StatCard
          title="Total Requests"
          value={(summary.total_messages ?? 0).toString()}
          icon="💬"
          color="purple"
        />
        <StatCard
          title="Memory Costs"
          value={(summary.memory_extraction_tokens ?? 0).toLocaleString()}
          icon="🔧"
          color="orange"
          subValue="Background Sync"
        />
        <StatCard
          title="Avg Latency"
          value={`${summary.avg_response_ms ?? 0}ms`}
          icon="⚙️"
          color="orange"
        />
        <StatCard
          title="Total Failed"
          value={(summary.failed_count ?? 0).toString()}
          icon="❌"
          color="red"
        />
        <StatCard
          title="Schedules"
          value={`${remainingSchedules ?? 0}/${totalScheduleSlots ?? 0}`}
          icon="📅"
          color="green"
          subValue={`Used ${usedSchedules ?? 0}`}
        />
      </View>

      {currentSubscription && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Subscription</Text>
          <SubscriptionCard subscription={currentSubscription} />
        </View>
      )}

      {/* Token Usage Trend Section */}
      {analytics?.charts?.usage_trend && analytics.charts.usage_trend.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📈 Token Usage Trend</Text>
            <Text style={styles.trendPeriod}>Last 7 Days</Text>
          </View>
          <View style={styles.trendCardContainer}>
            <TrendChart trendData={analytics.charts.usage_trend} />
          </View>
        </View>
      )}

      {/* Model Distribution Section */}
      {analytics?.charts?.model_distribution && analytics.charts.model_distribution.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 Engine Distribution</Text>
          <View style={styles.distributionContainer}>
            {analytics.charts.model_distribution.map((model, idx) => (
              <ModelDistributionRow
                key={idx}
                model={model.model_name}
                count={model.count}
                totalMessages={summary.total_messages ?? 1}
              />
            ))}
          </View>
        </View>
      )}

      {/* Platform Distribution Section */}
      {analytics?.charts?.platform_distribution && analytics.charts.platform_distribution.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 Platform Analytics</Text>
          <View style={styles.platformContainer}>
            {analytics.charts.platform_distribution.map((plat, idx) => {
              const totalTokens = analytics.charts.platform_distribution.reduce(
                (sum, p) => sum + ((p.input_tokens || 0) + (p.output_tokens || 0)),
                0
              );
              const platformTokens = (plat.input_tokens || 0) + (plat.output_tokens || 0);
              const percentage = totalTokens > 0 ? Math.round((platformTokens / totalTokens) * 100) : 0;
              
              return (
                <PlatformRow
                  key={idx}
                  platform={plat.platform}
                  tokens={platformTokens}
                  percentage={percentage}
                  inputTokens={plat.input_tokens}
                  outputTokens={plat.output_tokens}
                />
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.activityHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Text style={styles.activityCount}>{analytics?.recent_logs?.length ?? 0} Items</Text>
        </View>
        {analytics?.recent_logs?.length ? (
          analytics.recent_logs.slice(0, 10).map((item, idx) => (
            <ActivityRow key={item.id || `${item.created_at}-${idx}`} item={item} />
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
  pageHeaderWrapper: {
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#ec4899",
    paddingLeft: 16,
  },
  pageHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#9ca3af",
    fontWeight: "600",
  },
  healthIndicator: {
    alignItems: "flex-end",
  },
  healthLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  healthValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#10b981",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginTop: 14,
  },
  heroCard: {
    backgroundColor: "#1f2937",
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8,
  },
  heroContent: {
    marginBottom: 16,
  },
  heroLabel: {
    color: "#c7d2fe",
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  heroValueWrapper: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  heroValue: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "900",
  },
  heroTokenLabel: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 16,
  },
  heroStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  heroStat: {
    flex: 1,
  },
  heroStatLabel: {
    color: "#9ca3af",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    fontWeight: "800",
  },
  heroStatValue: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 20,
  },
  heroStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  heroEmail: {
    color: "#cbd5e1",
    fontSize: 13,
    textTransform: "lowercase",
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
  statCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statCardTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 4,
  },
  statCardSub: {
    fontSize: 10,
    color: "#9ca3af",
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  trendPeriod: {
    fontSize: 10,
    fontWeight: "800",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  trendCardContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  trendChartContainer: {
    width: "100%",
  },
  trendChartWrapper: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  yAxisLabels: {
    width: 45,
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  yAxisLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#9ca3af",
    textAlign: "right",
  },
  trendChart: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 10,
    justifyContent: "flex-end",
  },
  chartBarsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: "100%",
    gap: 4,
  },
  barGroup: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  barColumn: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    height: "100%",
  },
  bar: {
    flex: 1,
    borderRadius: 3,
    minWidth: 4,
  },
  inputBar: {
    backgroundColor: "#3b82f6",
  },
  outputBar: {
    backgroundColor: "#ec4899",
  },
  dayLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#6b7280",
    textAlign: "center",
  },
  trendLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6b7280",
  },
  distributionContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 10,
  },
  distributionLeft: {
    width: 100,
  },
  distributionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#111827",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  distributionCount: {
    fontSize: 10,
    color: "#6b7280",
  },
  distributionBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    overflow: "hidden",
  },
  distributionBar: {
    height: "100%",
    backgroundColor: "#8b5cf6",
    borderRadius: 999,
  },
  distributionPercent: {
    width: 35,
    textAlign: "right",
    fontSize: 10,
    fontWeight: "800",
    color: "#4f46e5",
  },
  platformContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  platformRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  platformLeft: {
    width: 90,
  },
  platformName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
    textTransform: "capitalize",
    marginBottom: 4,
  },
  platformTokens: {
    fontSize: 9,
    color: "#9ca3af",
  },
  platformRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  platformBarContainer: {
    width: "100%",
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 4,
  },
  platformBar: {
    height: "100%",
    backgroundColor: "#06b6d4",
    borderRadius: 999,
  },
  platformPercent: {
    fontSize: 10,
    fontWeight: "800",
    color: "#06b6d4",
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
    marginBottom: 16,
  },
  subscriptionHeaderLeft: {
    flex: 1,
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
    marginBottom: 8,
  },
  modelsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  modelBadge: {
    fontSize: 8,
    fontWeight: "900",
    color: "#6b7280",
    backgroundColor: "#f3f4f6",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    textTransform: "uppercase",
    letterSpacing: 0.3,
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
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 16,
  },
  statsDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e5e7eb",
  },
  subscriptionLabel: {
    color: "#6b7280",
    fontSize: 10,
    textTransform: "uppercase",
    marginBottom: 4,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  subscriptionValue: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
  },
  progressRow: {
    gap: 10,
    marginBottom: 12,
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
    marginTop: 6,
    fontSize: 11,
    fontWeight: "800",
    color: "#4f46e5",
  },
  expiryInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  expiryLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  expiryTime: {
    fontSize: 12,
    fontWeight: "900",
    color: "#ef4444",
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    minHeight: 80,
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
    textTransform: "capitalize",
  },
  activityDetail: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 6,
  },
  activityTokens: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "600",
  },
  activityItemRight: {
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },
  activityStatus: {
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  activityDate: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "600",
  },
  activityTime: {
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 2,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  activityCount: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
