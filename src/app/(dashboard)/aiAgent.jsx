import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import {
    CpuChipIcon,
    PencilSquareIcon,
    PlusIcon,
    XMarkIcon,
    TrashIcon,
    EyeIcon,
    EyeSlashIcon
} from "react-native-heroicons/outline";
import { SafeAreaView } from "react-native-safe-area-context"; // SafeAreaView ফিক্স
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../lib/api";

export default function AIAgentPage() {
  const { user: authUser } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [showToken, setShowToken] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [messages, setMessages] = useState([]);

  const initialFormState = {
    name: "",
    platform: "messenger",
    page_id: "",
    access_token: "",
    webhook_secret: "",
    system_prompt: "You are a helpful assistant.",
    greeting_message: "Hi there 👋",
    ai_model: "",
    selected_model: "",
    temperature: "0.7",
    max_tokens: "300",
    history_limit: "3",
    skip_history: false,
    history_skip_keywords: "",
    is_active: true,
  };

  const [formData, setFormData] = useState(initialFormState);

  const { width } = useWindowDimensions();
  const containerPadding = 40; // padding 20 left + 20 right from ScrollView
  const gap = 12;
  const availableWidth = width > 0 ? Math.max(width - containerPadding, 0) : width;
  const columns = width > 768 ? 3 : width > 480 ? 2 : 1;
  const cardWidth = availableWidth > 0 ? Math.floor((availableWidth - Math.max(0, (columns - 1) * gap)) / columns) : width / columns;
  const [iconRotation, setIconRotation] = useState({});

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    fetchAgents();
    fetchAvailableModels();
  }, []);

  // ১. এজেন্ট লিস্ট আনার জন্য ফিক্স
  const fetchAgents = async () => {
    try {
      const res = await apiRequest("/AgentAI/agents/");
      setAgents(res || []); // সরাসরি res
      if (res && res.length > 0) {
        setSelectedAgent(res[0]);
        setMessages(res[0].conversation || []);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to load agents.");
    } finally {
      setLoading(false);
    }
  };

  // ২. মডেল লিস্ট আনার জন্য ফিক্স
  const fetchAvailableModels = async () => {
    try {
      const res = await apiRequest("/AgentAI/available-models/");
      if (res && res.status === "success") {
        setAvailableModels(res.models || []);
        if (!editingAgent && res.models.length > 0) {
          setFormData((prev) => ({
            ...prev,
            selected_model: res.models[0].id,
            ai_model: res.models[0].model_id,
          }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ৩. ডাটা সেভ করার জন্য ফিক্স (POST/PATCH)
  const handleSubmit = async () => {
    const payload = {
      ...formData,
      temperature: parseFloat(formData.temperature),
      max_tokens: parseInt(formData.max_tokens),
      history_limit: parseInt(formData.history_limit),
    };

    try {
      let res;
      if (editingAgent) {
        if (!payload.access_token) delete payload.access_token;
        res = await apiRequest(`/AgentAI/agents/${editingAgent.id}/`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setAgents((prev) =>
          prev.map((a) => (a.id === editingAgent.id ? res : a)),
        );
      } else {
        res = await apiRequest("/AgentAI/agents/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setAgents((prev) => [res, ...prev]);
      }
      setModalOpen(false);
      Alert.alert("Success", "Agent Saved Successfully!");
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to save agent.");
    }
  };

  // ৪. ডিলিট করার জন্য ফিক্স
  const handleDelete = (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this agent?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiRequest(`/AgentAI/agents/${id}/`, { method: "DELETE" });
              setAgents((prev) => prev.filter((a) => a.id !== id));
            } catch (err) {
              Alert.alert("Error", "Could not delete.");
            }
          },
        },
      ],
    );
  };

  const openModal = (agent = null) => {
    if (agent) {
      setEditingAgent(agent);
      setFormData({
        ...agent,
        selected_model: agent.selected_model?.id || agent.selected_model || "",
        temperature: String(agent.temperature),
        max_tokens: String(agent.max_tokens),
        history_limit: String(agent.history_limit),
        access_token: "",
        webhook_secret: "",
      });
      setSelectedAgent(agent);
    } else {
      setEditingAgent(null);
      setFormData({ ...initialFormState, name: authUser?.name || "" });
    }
    setModalOpen(true);
  };

  const sendMessage = async (text) => {
    if (!selectedAgent) return;
    const userMsg = { id: Date.now(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    // optimistic UI: append assistant placeholder then call backend
    const assistantPlaceholder = {
      id: `a-${Date.now()}`,
      role: "assistant",
      text: "...",
    };
    setMessages((prev) => [...prev, assistantPlaceholder]);
    try {
      // try calling a chat endpoint if available
      const payload = { agent_id: selectedAgent.id, message: text };
      const res = await apiRequest(
        `/AgentAI/agents/${selectedAgent.id}/chat/`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
      if (res && res.reply) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantPlaceholder.id ? { ...m, text: res.reply } : m,
          ),
        );
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantPlaceholder.id
              ? { ...m, text: "No response" }
              : m,
          ),
        );
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantPlaceholder.id
            ? { ...m, text: "Error: could not get reply" }
            : m,
        ),
      );
    }
  };

  if (loading)
    return (
      <ActivityIndicator size="large" color="#4f46e5" style={{ flex: 1 }} />
    );

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        {/* Background decor */}
        <View style={styles.bgDecor} pointerEvents="none" />

        {/* Header */}
        <View style={{ padding: 20, paddingBottom: 10 }}>
          <View style={{ marginBottom: 12 }}>
            <View style={styles.kicker}><CpuChipIcon color="#4f46e5" size={14} /></View>
            <Text style={styles.heroTitle}>Manage Your <Text style={{ color: '#4f46e5' }}>AI Agents</Text></Text>
          </View>
          <TouchableOpacity onPress={() => openModal()} style={[styles.addButtonLarge, { width: '100%' }]}>
            <PlusIcon color="white" size={18} />
            <Text style={styles.addButtonText}>Add New Agent</Text>
          </TouchableOpacity>
        </View>

        {/* Agents grid */}
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            {agents.map((agent) => (
              <View key={agent.id} style={[styles.card, { width: cardWidth }]}>
                {/* Card Header - Icon and Actions */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <View style={[styles.iconContainerLarge, { transform: [{ rotate: iconRotation[agent.id] || '0deg' }] }]}>
                    <CpuChipIcon color="#4f46e5" size={24} />
                  </View>
                  <View style={styles.iconGroup}>
                    <TouchableOpacity onPress={() => openModal(agent)} style={styles.actionIconBtn}><PencilSquareIcon color="#64748b" size={16} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(agent.id)} style={styles.actionIconBtn}><TrashIcon color="#ef4444" size={16} /></TouchableOpacity>
                  </View>
                </View>

                {/* Card Title and Meta */}
                <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">{agent.name}</Text>
                <View style={{ flexDirection: 'row', marginVertical: 12 }}>
                  <View style={styles.badge}><Text style={styles.badgeText}>{agent.ai_model}</Text></View>
                  <View style={[styles.badge, { backgroundColor: '#f2f4f7', marginLeft: 8 }]}><Text style={[styles.badgeText, { color: '#64748b' }]}>{agent.platform}</Text></View>
                </View>

                {/* Card Footer - Status and ID */}
                <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.dot, { backgroundColor: agent.is_active ? '#10b981' : '#cbd5e1' }]} />
                    <Text style={[styles.statusText, { color: agent.is_active ? '#059669' : '#64748b' }]}>{agent.is_active ? 'Live' : 'Disabled'}</Text>
                  </View>
                  <Text style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>ID: {agent.id}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Chat Panel - keep small composer preview for mobile */}
        <View style={styles.chatPanel}>
          {!selectedAgent ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 18, color: "#64748b" }}>
                Select an agent to start chatting
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.chatHeader}>
                <Text style={{ fontSize: 18, fontWeight: "900" }}>
                  {selectedAgent.name}
                </Text>
                <Text style={{ color: "#64748b", fontSize: 12 }}>
                  {selectedAgent.ai_model}
                </Text>
              </View>
              <ScrollView
                style={styles.messages}
                contentContainerStyle={{ padding: 20 }}
              >
                {messages.map((msg) => (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageBubble,
                      msg.role === "user"
                        ? styles.userBubble
                        : styles.assistantBubble,
                    ]}
                  >
                    <Text
                      style={{
                        color: msg.role === "user" ? "#0f172a" : "#0f172a",
                      }}
                    >
                      {msg.text}
                    </Text>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.composer}>
                <TextInput
                  placeholder="Type a message..."
                  style={styles.composerInput}
                  onSubmitEditing={(e) => {
                    sendMessage(e.nativeEvent.text);
                    e.currentTarget.clear && e.currentTarget.clear();
                  }}
                />
                <TouchableOpacity
                  style={styles.sendBtn}
                  onPress={() => {
                    /* press handled by input submit for now */
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "700" }}>
                    Send
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Modal - Form */}
      <Modal visible={modalOpen} animationType="slide">
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingAgent ? "EDIT AGENT" : "NEW AGENT"}
            </Text>
            <TouchableOpacity onPress={() => setModalOpen(false)}>
              <XMarkIcon color="black" size={30} />
            </TouchableOpacity>
          </View>
          <ScrollView style={[styles.formPadding, { paddingHorizontal: width > 480 ? 16 : 12, paddingVertical: width > 480 ? 16 : 12 }]}>
            {/* Name and Platform Row */}
            <View style={{ flexDirection: width > 480 ? 'row' : 'column', marginBottom: 16, gap: width > 480 ? 8 : 0 }}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: width > 480 ? 8 : 0, marginBottom: width > 480 ? 0 : 8 }]}
                value={formData.name}
                onChangeText={(t) => handleChange('name', t)}
                placeholder="Agent Name"
              />
              <View style={[styles.input, { flex: 1, paddingHorizontal: 12, marginBottom: 0 }]}>
                <Text style={{ color: '#64748b', fontSize: 12 }}>Platform</Text>
                <Text style={{ fontWeight: '700', color: '#0f172a' }}>{formData.platform}</Text>
              </View>
            </View>

            {/* Token Section */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTitle}>Platform Credentials</Text>
              <TextInput
                style={[styles.input, { marginBottom: 12 }]}
                value={formData.page_id}
                onChangeText={(t) => handleChange('page_id', t)}
                placeholder="Page / Business ID"
              />
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={[styles.input, { paddingRight: 50 }]}
                  value={formData.access_token}
                  onChangeText={(t) => handleChange('access_token', t)}
                  placeholder={editingAgent ? 'Leave blank to keep current' : 'Access Token'}
                  secureTextEntry={!showToken}
                />
                <TouchableOpacity
                  onPress={() => setShowToken((s) => !s)}
                  style={{ position: 'absolute', right: 12, top: 12 }}
                >
                  {showToken ? <EyeSlashIcon color="#64748b" size={18} /> : <EyeIcon color="#64748b" size={18} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Model and History */}
            <View style={{ marginVertical: 12, marginBottom: 16 }}>
              <Text style={styles.label}>Select Model</Text>
              <View style={{ backgroundColor: '#f1f5f9', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                <TouchableOpacity
                  onPress={() => setShowModelPicker(true)}
                  style={{ padding: 12 }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontWeight: '700', color: '#0f172a', fontSize: 14 }}>
                    {availableModels.find(m => m.id === formData.selected_model)?.name || 'Select a model'}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    {availableModels.find(m => m.id === formData.selected_model)?.provider || ''}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Model Selection Modal */}
            <Modal visible={showModelPicker} animationType="slide" transparent>
              <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                  <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, maxHeight: '80%' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: '#0f172a' }}>Select Model</Text>
                      <TouchableOpacity onPress={() => setShowModelPicker(false)}>
                        <XMarkIcon color="#64748b" size={24} />
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={{ maxHeight: 300 }}>
                      {availableModels.map((m) => (
                        <TouchableOpacity
                          key={m.id}
                          onPress={() => {
                            handleChange('selected_model', m.id);
                            setShowModelPicker(false);
                          }}
                          style={[styles.modelOption, { backgroundColor: formData.selected_model === m.id ? '#eef2ff' : '#f8fafc' }]}
                        >
                          <View>
                            <Text style={{ fontWeight: '700', color: '#0f172a', fontSize: 14 }}>{m.name}</Text>
                            <Text style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{m.provider}</Text>
                          </View>
                          {formData.selected_model === m.id && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4f46e5' }} />}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </SafeAreaView>
            </Modal>

            {/* History Limit and Temperature */}
            <View style={{ flexDirection: width > 480 ? 'row' : 'column', marginBottom: 12, gap: width > 480 ? 8 : 0 }}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: width > 480 ? 8 : 0, marginBottom: width > 480 ? 0 : 8 }]}
                value={String(formData.history_limit)}
                onChangeText={(t) => handleChange('history_limit', t)}
                placeholder="History Limit"
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={String(formData.temperature)}
                onChangeText={(t) => handleChange('temperature', t)}
                placeholder="Temperature"
                keyboardType="numeric"
              />
            </View>

            <TextInput
              style={[styles.input, { marginBottom: 12 }]}
              value={String(formData.max_tokens)}
              onChangeText={(t) => handleChange('max_tokens', t)}
              placeholder="Max Tokens"
              keyboardType="numeric"
            />

            {/* Skip History Section */}
            <View style={styles.sectionBoxWarning}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Skip History in Messages</Text>
                <Switch
                  value={!!formData.skip_history}
                  onValueChange={(v) => handleChange('skip_history', v)}
                />
              </View>
              {formData.skip_history && (
                <TextInput
                  style={[styles.input, { marginTop: 12 }]}
                  value={formData.history_skip_keywords}
                  onChangeText={(t) => handleChange('history_skip_keywords', t)}
                  placeholder="Skip Keywords (comma separated)"
                />
              )}
            </View>

            {/* System Prompt */}
            <Text style={[styles.label, { marginTop: 12 }]}>System Instructions</Text>
            <TextInput
              style={[styles.input, { height: width > 480 ? 140 : 100, marginBottom: 12 }]}
              multiline
              value={formData.system_prompt}
              onChangeText={(t) => handleChange('system_prompt', t)}
              placeholder="System prompt..."
            />

            {/* Active Status */}
            <View style={[styles.sectionBoxSuccess, { marginBottom: 16 }]}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Activate Agent</Text>
                <Switch
                  value={!!formData.is_active}
                  onValueChange={(v) => handleChange('is_active', v)}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { marginBottom: 20 }]}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>{editingAgent ? 'Update Intelligence' : 'Deploy Agent'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  scrollContent: { padding: 16 },
  addButton: {
    backgroundColor: "#4f46e5",
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: { color: "white", fontWeight: "900", marginLeft: 8, fontSize: 14 },
  card: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  actionIcons: { flexDirection: "row" },
  p2: { padding: 5, marginLeft: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  statusText: { fontSize: 10, fontWeight: "800", color: "#059669", textTransform: 'uppercase', marginLeft: 4 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: { fontSize: 16, fontWeight: "900", color: '#0f172a' },
  formPadding: { paddingHorizontal: 16, paddingVertical: 16 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    color: "#475569",
  },
  input: {
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingRight: 4,
  },
  submitButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: { color: "white", fontWeight: "900", fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.3 },
  hubuContainer: { flex: 1, flexDirection: "row" },
  addButtonSmall: { backgroundColor: "#4f46e5", padding: 8, borderRadius: 8 },
  iconGroup: { flexDirection: 'row', alignItems: 'center', flexShrink: 0, marginLeft: 8 },
  bgDecor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#eef2ff',
    opacity: 0.08,
  },
  headerRow: { padding: 20, paddingBottom: 10, flexDirection: 'column' },
  kicker: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, alignSelf: 'flex-start' },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginBottom: 12 },
  heroSubtitle: { color: '#64748b', marginTop: 6 },
  addButtonLarge: { backgroundColor: '#4f46e5', flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 16, marginTop: 0, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  iconContainerLarge: { width: 48, height: 48, backgroundColor: '#eef2ff', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionIconBtn: { padding: 6, marginLeft: 4 },
  cardTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
  badge: { backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 0.3 },
  sectionBox: { backgroundColor: '#eef2ff', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#c7d2fe' },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: '#4f46e5', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.2 },
  sectionBoxWarning: { backgroundColor: '#fef3c7', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#fde68a' },
  sectionBoxSuccess: { backgroundColor: '#d1fae5', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#6ee7b7' },
  chatPanel: { flex: 0.3, backgroundColor: "#ffffff", borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  chatHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  messages: { flex: 1, maxHeight: 150 },
  messageBubble: { padding: 10, borderRadius: 10, marginBottom: 8 },
  userBubble: { backgroundColor: "#eef2ff", alignSelf: "flex-end", maxWidth: '85%' },
  assistantBubble: { backgroundColor: "#f1f5f9", alignSelf: "flex-start", maxWidth: '85%' },
  composer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    alignItems: "center",    gap: 8,  },
  composerInput: { flex: 1, backgroundColor: "#f1f5f9", padding: 10, borderRadius: 10, marginRight: 8, fontSize: 13 },
  sendBtn: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modelOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
});
