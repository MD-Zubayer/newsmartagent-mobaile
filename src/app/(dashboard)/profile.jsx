import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { getAccessToken } from "@/lib/auth";
import { apiRequest, getApiBaseUrl } from "@/lib/api";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchingExtras, setFetchingExtras] = useState(true);
  const [isEmailConfirmed, setEmailConfirmed] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isPhotoMenuOpen, setPhotoMenuOpen] = useState(false);
  const [isCropOpen, setCropOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [cropScale, setCropScale] = useState(0.8);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    division: "",
    district: "",
    upazila: "",
    gender: "",
  });

  const { width } = useWindowDimensions();
  const isWide = width > 760;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");

      const user = await apiRequest("/users/me/", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      setProfile(user);
      setEmailConfirmed(Boolean(user?.profile?.is_email_verified || user?.is_email_verified || user?.profile?.email_verified || user?.email_verified));
      setFormData({
        name: user?.full_name || user?.name || "",
        phone_number: user?.phone_number || user?.mobile || "",
        division: user?.division || user?.profile?.division || "",
        district: user?.district || user?.profile?.district || "",
        upazila: user?.upazila || user?.profile?.upazila || "",
        gender: user?.gender || user?.profile?.gender || "",
      });
      loadExtras();
    } catch (err) {
      console.error("Profile load failed", err);
    } finally {
      setLoading(false);
    }
  };

  const loadExtras = async () => {
    setFetchingExtras(true);
    try {
      const token = await getAccessToken();
      if (!token) return;

      const subs = await apiRequest("/subscriptions/", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const analyticsResponse = await apiRequest("/AgentAI/tokens/analytics/", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubscriptions(Array.isArray(subs) ? subs : subs?.results || []);
      setAnalytics(analyticsResponse);
    } catch (err) {
      console.warn("Could not fetch profile extras", err);
    } finally {
      setFetchingExtras(false);
    }
  };

  const displayName = profile?.full_name || profile?.name || profile?.username || "Your Name";
  const email = profile?.email || "user@example.com";
  const phone = profile?.phone_number || profile?.mobile || "Not set";
  const company = profile?.company || profile?.organization || "New Smart Agent";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const activeSubs = subscriptions.filter((sub) => sub.is_active);
  const totalInitialTokens = activeSubs.reduce((acc, sub) => acc + (sub.offer?.tokens || 0), 0);
  const totalUsedTokens = analytics?.summary?.total_tokens || 0;
  const usagePercentage = totalInitialTokens > 0
    ? Math.min(Math.round((totalUsedTokens / (totalUsedTokens + (profile?.profile?.word_balance || 0))) * 100), 100)
    : 0;
  const totalScheduleSlots = activeSubs.reduce((acc, sub) => acc + (sub.offer?.schedule_messages || 0), 0);
  const remainingSchedules = profile?.profile?.schedule_balance || 0;
  const usedSchedules = Math.max(totalScheduleSlots - remainingSchedules, 0);
  const scheduleUsage = totalScheduleSlots > 0 ? Math.min(Math.round((usedSchedules / totalScheduleSlots) * 100), 100) : 0;

  const pickImage = async (source) => {
    try {
      let granted = false;
      if (source === "camera") {
        const { granted: cameraGranted } = await ImagePicker.requestCameraPermissionsAsync();
        granted = cameraGranted;
      } else {
        const { granted: mediaGranted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        granted = mediaGranted;
      }
      if (!granted) return;

      const result = source === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      setSelectedImage({ uri: asset.uri, width: asset.width, height: asset.height });
      setCropScale(0.8);
      setCropOpen(true);
      setPhotoMenuOpen(false);
    } catch (err) {
      console.error("Image pick failed", err);
    }
  };

  const uploadCroppedPhoto = async () => {
    if (!selectedImage) return;

    setPhotoUploading(true);
    try {
      const sourceWidth = selectedImage.width;
      const sourceHeight = selectedImage.height;
      const squareSize = Math.floor(Math.min(sourceWidth, sourceHeight) * cropScale);
      const originX = Math.max(0, Math.floor((sourceWidth - squareSize) / 2));
      const originY = Math.max(0, Math.floor((sourceHeight - squareSize) / 2));

      const cropped = await ImageManipulator.manipulateAsync(
        selectedImage.uri,
        [
          { crop: { originX, originY, width: squareSize, height: squareSize } },
          { resize: { width: 600, height: 600 } },
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      const token = await getAccessToken();
      if (!token) throw new Error("Missing auth token");

      const form = new FormData();
      form.append("profile_photo", {
        uri: cropped.uri,
        name: "profile.jpg",
        type: "image/jpeg",
      });

      const response = await fetch(`${getApiBaseUrl()}/users/update-me/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || "Upload failed");
      }

      const data = await response.json();
      setProfile(data);
      setSelectedImage(null);
      setCropOpen(false);
    } catch (err) {
      console.error("Photo upload failed", err);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Missing auth token");

      const updated = await apiRequest("/users/update-me/", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });

      setProfile(updated);
      setIsEditOpen(false);
    } catch (err) {
      console.error("Save profile failed", err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!profile?.profile?.profile_photo && !profile?.profile_photo) return;
    setPhotoUploading(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Missing auth token");

      const response = await fetch(`${getApiBaseUrl()}/users/update-me/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ profile_photo: null }),
      });

      if (!response.ok) throw new Error("Could not remove photo");
      const data = await response.json();
      setProfile(data);
    } catch (err) {
      console.error("Remove photo failed", err);
    } finally {
      setPhotoUploading(false);
    }
  };

  const profilePhoto = profile?.profile?.profile_photo || profile?.profile_photo;
  const accountName = profile?.profile?.name || profile?.name || displayName;
  const accountId = profile?.profile?.unique_id || profile?.unique_id || "—";
  const accountBalance = profile?.profile?.acount_balance ?? profile?.profile?.account_balance ?? 0;
  const commission = profile?.profile?.commission_balance ?? 0;

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
        <Text style={styles.pageTitle}>Profile</Text>
        <Text style={styles.pageSubtitle}>Your account overview, subscriptions, and security details.</Text>
      </View>

      <View style={[styles.section, isWide && styles.sectionRow]}>
        <View style={styles.profileHeroCard}>
          <View style={styles.profileAvatarWrapper}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.profileAvatar} />
            ) : (
              <View style={styles.profileAvatarFallback}>
                <Text style={styles.profileAvatarInitials}>{initials}</Text>
              </View>
            )}
            <Pressable style={styles.avatarAction} onPress={() => setPhotoMenuOpen(true)}>
              <Text style={styles.avatarActionText}>Change</Text>
            </Pressable>
          </View>
          <Text style={styles.profileName}>{accountName}</Text>
          <Text style={styles.profileRole}>{profile?.role || "Account Holder"}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>Active Member</Text>
            </View>
            <View style={styles.badgePillSecondary}>
              <Text style={styles.badgePillSecondaryText}>ID {accountId}</Text>
            </View>
          </View>

          <View style={styles.heroStatRow}>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatLabel}>Account Balance</Text>
              <Text style={styles.heroStatValue}>৳{accountBalance.toLocaleString()}</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatLabel}>Commission</Text>
              <Text style={styles.heroStatValue}>৳{commission.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.heroActionsRow}>
            <Pressable style={styles.secondaryButton} onPress={() => setIsEditOpen(true)}>
              <Text style={styles.secondaryButtonText}>Edit Profile</Text>
            </Pressable>
            {profilePhoto ? (
              <Pressable style={styles.outlineButton} onPress={handleRemovePhoto}>
                <Text style={styles.outlineButtonText}>Remove Photo</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.quickStatsCard}>
          <Text style={styles.cardTitle}>Performance Snapshot</Text>
          <View style={styles.metricGrid}>
            <Metric label="Tokens Remaining" value={`${profile?.profile?.word_balance?.toLocaleString() || "0"}`} color="#4f46e5" />
            <Metric label="Total Used" value={`${analytics?.summary?.total_tokens?.toLocaleString() || "0"}`} color="#10b981" />
            <Metric label="Schedules Left" value={`${remainingSchedules.toLocaleString()}`} color="#059669" />
          </View>
          <View style={styles.progressSection}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${usagePercentage}%` }]} />
            </View>
            <Text style={styles.progressLabel}>Usage Capacity · {usagePercentage}%</Text>
            <Text style={styles.progressDetail}>{usedSchedules.toLocaleString()} of {totalScheduleSlots.toLocaleString() || "0"} scheduled contacts used</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Identity Details</Text>
        <View style={styles.detailGrid}>
          <DetailRow label="Registered Email" value={email} />
          <DetailRow label="Primary Phone" value={phone} />
          <DetailRow label="Gender" value={profile?.gender || profile?.profile?.gender || "Not set"} />
          <DetailRow label="Division" value={profile?.division || profile?.profile?.division || "Not set"} />
          <DetailRow label="Region" value={profile?.upazila || profile?.profile?.upazila ? `${profile?.upazila || profile?.profile?.upazila}, ${profile?.district || profile?.profile?.district}` : "Not set"} />
          <DetailRow label="Joined" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown"} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Subscription & Security</Text>
        <View style={styles.subscriptionsList}>
          {subscriptions.length > 0 ? (
            subscriptions.map((sub, idx) => (
              <View key={idx} style={styles.subscriptionRow}>
                <View>
                  <Text style={styles.subscriptionTitle}>{sub.offer?.name || sub.offer_tokens}</Text>
                  <Text style={styles.subscriptionMeta}>Expires {new Date(sub.end_date || sub.expiration_date).toLocaleDateString()}</Text>
                </View>
                <View style={styles.subscriptionBadge}>
                  <Text style={styles.subscriptionBadgeText}>{sub.is_active ? "Active" : "Inactive"}</Text>
                  <Text style={styles.subscriptionTokens}>{sub.remaining_tokens?.toLocaleString()} tokens</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateText}>
                {fetchingExtras ? "Syncing subscriptions..." : "No active subscriptions found."}
              </Text>
            </View>
          )}
        </View>
      </View>

      {isPhotoMenuOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <Text style={styles.modalTitle}>Upload Profile Photo</Text>
            <Pressable style={styles.modalButton} onPress={() => pickImage("gallery")}>
              <Text style={styles.modalButtonText}>Choose from Gallery</Text>
            </Pressable>
            <Pressable style={styles.modalButton} onPress={() => pickImage("camera")}>
              <Text style={styles.modalButtonText}>Take a Photo</Text>
            </Pressable>
            <Pressable style={styles.modalCancel} onPress={() => setPhotoMenuOpen(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}

      {isCropOpen && selectedImage && (
        <View style={styles.modalOverlay}>
          <View style={styles.cropModal}>
            <Text style={styles.modalTitle}>Crop & Resize Photo</Text>
            <Image source={{ uri: selectedImage.uri }} style={styles.cropPreview} resizeMode="cover" />
            <View style={styles.cropControls}>
              <Pressable
                style={styles.cropButton}
                onPress={() => setCropScale((prev) => Math.max(0.4, prev - 0.1))}
              >
                <Text style={styles.cropButtonText}>Zoom -</Text>
              </Pressable>
              <Text style={styles.cropScaleLabel}>{Math.round(cropScale * 100)}%</Text>
              <Pressable
                style={styles.cropButton}
                onPress={() => setCropScale((prev) => Math.min(1, prev + 0.1))}
              >
                <Text style={styles.cropButtonText}>Zoom +</Text>
              </Pressable>
            </View>
            <View style={styles.cropActions}>
              <Pressable style={styles.modalCancel} onPress={() => setCropOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalButtonPrimary} onPress={uploadCroppedPhoto} disabled={photoUploading}>
                <Text style={styles.modalButtonPrimaryText}>{photoUploading ? "Uploading..." : "Apply Crop"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {isEditOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.cropModal}>
            <Text style={styles.modalTitle}>Edit Profile Details</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ width: "100%" }}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={formData.name}
                  onChangeText={(value) => setFormData((prev) => ({ ...prev, name: value }))}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={formData.phone_number}
                  onChangeText={(value) => setFormData((prev) => ({ ...prev, phone_number: value }))}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.rowInputs}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Division</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={formData.division}
                    onChangeText={(value) => setFormData((prev) => ({ ...prev, division: value }))}
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>District</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={formData.district}
                    onChangeText={(value) => setFormData((prev) => ({ ...prev, district: value }))}
                  />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Upazila</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={formData.upazila}
                    onChangeText={(value) => setFormData((prev) => ({ ...prev, upazila: value }))}
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Gender</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={formData.gender}
                    onChangeText={(value) => setFormData((prev) => ({ ...prev, gender: value }))}
                  />
                </View>
              </View>
            </ScrollView>
            <View style={styles.cropActions}>
              <Pressable style={styles.modalCancel} onPress={() => setEditOpen(false)}>
                <Text style={styles.modalCancelText}>Discard</Text>
              </Pressable>
              <Pressable style={styles.modalButtonPrimary} onPress={handleSaveProfile} disabled={savingProfile}>
                <Text style={styles.modalButtonPrimaryText}>{savingProfile ? "Saving..." : "Save Changes"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function Metric({ label, value, color }) {
  return (
    <View style={[styles.metricCard, { borderColor: color }]}> 
      <Text style={[styles.metricLabel, { color }]}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRowCard}>
      <Text style={styles.detailRowLabel}>{label}</Text>
      <Text style={styles.detailRowValue}>{value || "Not synchronized"}</Text>
    </View>
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
    fontSize: 30,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 15,
    color: "#6b7280",
    lineHeight: 22,
    maxWidth: 700,
  },
  section: {
    marginBottom: 24,
  },
  sectionRow: {
    flexDirection: "row",
    gap: 18,
    flexWrap: "wrap",
  },
  profileHeroCard: {
    flex: 1,
    minWidth: 320,
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 18,
  },
  profileAvatarWrapper: {
    alignItems: "center",
    marginBottom: 18,
  },
  profileAvatar: {
    width: 110,
    height: 110,
    borderRadius: 110,
    marginBottom: 16,
    backgroundColor: "#e5e7eb",
  },
  profileAvatarFallback: {
    width: 110,
    height: 110,
    borderRadius: 110,
    backgroundColor: "#c7d2fe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  profileAvatarInitials: {
    color: "#1e293b",
    fontSize: 36,
    fontWeight: "900",
  },
  avatarAction: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: "#4f46e5",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  avatarActionText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  profileName: {
    fontSize: 26,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
  },
  profileRole: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 6,
    textAlign: "center",
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
  },
  badgePill: {
    backgroundColor: "#111827",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  badgePillText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  badgePillSecondary: {
    backgroundColor: "#eef2ff",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  badgePillSecondaryText: {
    color: "#4338ca",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  heroStatRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 22,
  },
  heroStatCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  heroStatLabel: {
    color: "#4f46e5",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  heroStatValue: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "900",
  },
  heroActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 24,
    justifyContent: "center",
  },
  secondaryButton: {
    backgroundColor: "#4338ca",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 13,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  outlineButtonText: {
    color: "#4338ca",
    fontWeight: "900",
    fontSize: 13,
  },
  quickStatsCard: {
    flex: 1,
    minWidth: 320,
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 18,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: 140,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    backgroundColor: "#ffffff",
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  metricValue: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
  },
  progressSection: {
    marginTop: 22,
  },
  progressBarBackground: {
    width: "100%",
    height: 10,
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#4f46e5",
  },
  progressLabel: {
    marginTop: 12,
    color: "#334155",
    fontSize: 12,
    fontWeight: "900",
  },
  progressDetail: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 12,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 16,
  },
  detailGrid: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 4,
  },
  detailRowCard: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 16,
  },
  detailRowLabel: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 6,
  },
  detailRowValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "800",
  },
  subscriptionsList: {
    marginTop: 8,
  },
  subscriptionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#f8fafc",
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  subscriptionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 4,
  },
  subscriptionMeta: {
    fontSize: 12,
    color: "#64748b",
  },
  subscriptionBadge: {
    alignItems: "flex-end",
  },
  subscriptionBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#047857",
    marginBottom: 6,
  },
  subscriptionTokens: {
    fontSize: 11,
    color: "#334155",
    fontWeight: "700",
  },
  emptyStateCard: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    borderRadius: 24,
    padding: 24,
    backgroundColor: "#f8fafc",
  },
  emptyStateText: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
  },
  modalOverlay: {
    position: "absolute",
    inset: 0,
    zIndex: 999,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
    padding: 20,
  },
  bottomSheet: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 22,
    gap: 12,
  },
  cropModal: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 22,
    gap: 14,
    maxHeight: "90%",
    width: "100%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 10,
  },
  modalButton: {
    backgroundColor: "#eef2ff",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#4338ca",
    fontWeight: "900",
  },
  modalButtonPrimary: {
    backgroundColor: "#4338ca",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    flex: 1,
  },
  modalButtonPrimaryText: {
    color: "#ffffff",
    fontWeight: "900",
  },
  modalCancel: {
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    flex: 1,
  },
  modalCancelText: {
    color: "#64748b",
    fontWeight: "900",
  },
  cropPreview: {
    width: "100%",
    height: 260,
    borderRadius: 24,
    backgroundColor: "#f8fafc",
  },
  cropControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cropButton: {
    backgroundColor: "#eef2ff",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  cropButtonText: {
    color: "#4338ca",
    fontWeight: "900",
  },
  cropScaleLabel: {
    color: "#111827",
    fontWeight: "900",
  },
  cropActions: {
    flexDirection: "row",
    gap: 12,
  },
  rowInputs: {
    flexDirection: "row",
    gap: 14,
  },
  fieldHalf: {
    flex: 1,
  },
});
