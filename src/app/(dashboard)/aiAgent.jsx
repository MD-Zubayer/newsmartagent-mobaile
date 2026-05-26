import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Switch,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // SafeAreaView ফিক্স
import {
  CpuChipIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "react-native-heroicons/outline";
import { apiRequest } from "../../lib/api"; 
import { useAuth } from "../../context/AuthContext";

export default function AIAgentPage() {
  const { user: authUser } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);

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
    is_active: true,
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchAgents();
    fetchAvailableModels();
  }, []);

  // ১. এজেন্ট লিস্ট আনার জন্য ফিক্স
  const fetchAgents = async () => {
    try {
      const res = await apiRequest("/AgentAI/agents/");
      setAgents(res || []); // সরাসরি res
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
          setFormData(prev => ({
            ...prev,
            selected_model: res.models[0].id,
            ai_model: res.models[0].model_id
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
      history_limit: parseInt(formData.history_limit)
    };

    try {
      let res;
      if (editingAgent) {
        if (!payload.access_token) delete payload.access_token;
        res = await apiRequest(`/AgentAI/agents/${editingAgent.id}/`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
        setAgents(prev => prev.map(a => a.id === editingAgent.id ? res : a));
      } else {
        res = await apiRequest("/AgentAI/agents/", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        setAgents(prev => [res, ...prev]);
      }
      setModalOpen(false);
      Alert.alert("Success", "Agent Saved Successfully!");
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to save agent.");
    }
  };

  // ৪. ডিলিট করার জন্য ফিক্স
  const handleDelete = (id) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this agent?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await apiRequest(`/AgentAI/agents/${id}/`, { method: "DELETE" });
          setAgents(prev => prev.filter(a => a.id !== id));
        } catch (err) { Alert.alert("Error", "Could not delete."); }
      }}
    ]);
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
        webhook_secret: ""
      });
    } else {
      setEditingAgent(null);
      setFormData({ ...initialFormState, name: authUser?.name || "" });
    }
    setModalOpen(true);
  };

  if (loading) return <ActivityIndicator size="large" color="#4f46e5" style={{ flex: 1 }} />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>AI <Text style={{ color: "#4f46e5" }}>Agents</Text></Text>
          <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
            <PlusIcon color="white" size={24} />
            <Text style={styles.addButtonText}>Add New Agent</Text>
          </TouchableOpacity>
        </View>

        {agents.map((agent) => (
          <View key={agent.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <CpuChipIcon color="#4f46e5" size={30} />
              </View>
              <View style={styles.actionIcons}>
                <TouchableOpacity onPress={() => openModal(agent)} style={styles.p2}>
                  <PencilSquareIcon color="#64748b" size={24} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(agent.id)} style={styles.p2}>
                  <TrashIcon color="#ef4444" size={24} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.cardTitle}>{agent.name}</Text>
            <Text style={styles.cardSub}>{agent.ai_model} • {agent.platform}</Text>
            <View style={styles.statusBadge}>
               <View style={[styles.dot, { backgroundColor: agent.is_active ? "#10b981" : "#cbd5e1" }]} />
               <Text style={styles.statusText}>{agent.is_active ? "LIVE" : "DISABLED"}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Modal - Form */}
      <Modal visible={modalOpen} animationType="slide">
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingAgent ? "EDIT AGENT" : "NEW AGENT"}</Text>
            <TouchableOpacity onPress={() => setModalOpen(false)}>
              <XMarkIcon color="black" size={30} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.formPadding}>
            <Text style={styles.label}>Agent Name</Text>
            <TextInput style={styles.input} value={formData.name} onChangeText={(t) => setFormData({...formData, name: t})} placeholder="Name" />
            <Text style={styles.label}>System Instructions</Text>
            <TextInput style={[styles.input, { height: 100 }]} multiline value={formData.system_prompt} onChangeText={(t) => setFormData({...formData, system_prompt: t})} placeholder="Prompt..." />
            <View style={styles.switchRow}>
              <Text style={styles.label}>Active Status</Text>
              <Switch value={formData.is_active} onValueChange={(v) => setFormData({...formData, is_active: v})} />
            </View>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Save Intelligence</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { padding: 20 },
  header: { marginBottom: 30 },
  title: { fontSize: 32, fontWeight: "900", color: "#1e293b" },
  addButton: { backgroundColor: "#4f46e5", flexDirection: "row", padding: 15, borderRadius: 15, marginTop: 15, justifyContent: "center", alignItems: "center" },
  addButtonText: { color: "white", fontWeight: "bold", marginLeft: 10 },
  card: { backgroundColor: "#f8fafc", padding: 20, borderRadius: 30, marginBottom: 20, borderWidth: 1, borderColor: "#f1f5f9" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  iconContainer: { backgroundColor: "#eef2ff", padding: 10, borderRadius: 12 },
  actionIcons: { flexDirection: "row" },
  p2: { padding: 5, marginLeft: 10 },
  cardTitle: { fontSize: 20, fontWeight: "bold", marginTop: 10 },
  cardSub: { color: "#64748b", fontSize: 12, marginVertical: 5 },
  statusBadge: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 10, fontWeight: "900", color: "#64748b" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", padding: 20, alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#eee" },
  modalTitle: { fontSize: 20, fontWeight: "900" },
  formPadding: { padding: 20 },
  label: { fontSize: 14, fontWeight: "bold", marginBottom: 8, color: "#475569" },
  input: { backgroundColor: "#f1f5f9", padding: 15, borderRadius: 12, marginBottom: 20 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30 },
  submitButton: { backgroundColor: "#4f46e5", padding: 20, borderRadius: 15, alignItems: "center" },
  submitButtonText: { color: "white", fontWeight: "bold", fontSize: 16 }
});