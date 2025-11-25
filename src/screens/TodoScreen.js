import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "../config/firebaseConfig";
import { signOut } from "firebase/auth";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

// ---------- styles factory (light / dark) ----------
const getStyles = (isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: isDark ? "#020617" : "#f5f7fb", // slate-950 vs light
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    heading: {
      fontSize: 24,
      fontWeight: "700",
      color: isDark ? "#e5e7eb" : "#222",
    },
    subHeading: {
      fontSize: 13,
      color: isDark ? "#9ca3af" : "#666",
      marginTop: 2,
    },
    rightHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    themeToggle: {
      padding: 6,
      borderRadius: 20,
      backgroundColor: isDark ? "#111827" : "#e5e7eb",
      marginRight: 8,
    },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDark ? "#38bdf833" : "#007bff33",
      backgroundColor: isDark ? "#0f172a" : "#e8f1ff",
    },
    logoutText: {
      marginLeft: 4,
      color: isDark ? "#38bdf8" : "#007bff",
      fontWeight: "600",
    },
    inputRow: {
      flexDirection: "row",
      marginBottom: 10,
      alignItems: "center",
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginRight: 8,
      backgroundColor: isDark ? "#020617" : "#ffffff",
      borderColor: isDark ? "#334155" : "#d0d0d0",
      color: isDark ? "#e5e7eb" : "#111827",
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#007bff",
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
    },
    addButtonText: {
      color: "#fff",
      fontWeight: "600",
      marginLeft: 4,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    filterRow: {
      flexDirection: "row",
      marginBottom: 12,
    },
    filterChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? "#334155" : "#d0d0d0",
      marginRight: 6,
      backgroundColor: isDark ? "#020617" : "#ffffff",
    },
    filterChipActive: {
      backgroundColor: "#007bff",
      borderColor: "#007bff",
    },
    filterText: {
      fontSize: 13,
      color: isDark ? "#e5e7eb" : "#444",
    },
    filterTextActive: {
      color: "#fff",
      fontWeight: "600",
    },
    todoCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 12,
      backgroundColor: isDark ? "#020617" : "#ffffff",
      marginBottom: 8,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? "#1f2937" : "transparent",
      shadowColor: isDark ? "transparent" : "#000",
      shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: isDark ? 0 : 4,
      elevation: isDark ? 0 : 2,
    },
    todoTextWrapper: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
    },
    itemText: {
      fontSize: 16,
      color: isDark ? "#e5e7eb" : "#222",
    },
    itemTextCompleted: {
      textDecorationLine: "line-through",
      opacity: 0.6,
    },
    actions: {
      flexDirection: "row",
      marginLeft: 8,
    },
    iconButton: {
      padding: 6,
      borderRadius: 20,
      backgroundColor: isDark ? "#020617" : "#f1f1f1",
    },
    emptyText: {
      textAlign: "center",
      marginTop: 20,
      fontStyle: "italic",
      color: isDark ? "#9ca3af" : "#666",
    },
  });

export default function TodoScreen({ user }) {
  const [text, setText] = useState("");
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("all"); // "all" | "active" | "completed"
  const [isDark, setIsDark] = useState(false); // 🌙 dark mode toggle

  const styles = useMemo(() => getStyles(isDark), [isDark]);
  const todosRef = collection(db, "todos");

  // READ – listen for THIS user's todos
  useEffect(() => {
    if (!user) {
      setTodos([]);
      return;
    }

    setLoading(true);

    const q = query(todosRef, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        list.sort((a, b) => {
          const aT = a.createdAt?.seconds || 0;
          const bT = b.createdAt?.seconds || 0;
          return bT - aT;
        });

        setTodos(list);
        setLoading(false);
      },
      (error) => {
        console.log("Firestore listener error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // FILTERED todos for UI
  const filteredTodos = useMemo(() => {
    if (filter === "active") return todos.filter((t) => !t.completed);
    if (filter === "completed") return todos.filter((t) => t.completed);
    return todos;
  }, [todos, filter]);

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user) return;

    try {
      if (editingId) {
        const docRef = doc(db, "todos", editingId);
        await updateDoc(docRef, {
          text: trimmed,
          updatedAt: serverTimestamp(),
        });
        setEditingId(null);
      } else {
        await addDoc(todosRef, {
          text: trimmed,
          completed: false,
          createdAt: serverTimestamp(),
          userId: user.uid,
        });
      }
      setText("");
    } catch (error) {
      console.log("Error saving todo:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const docRef = doc(db, "todos", id);
      await deleteDoc(docRef);
    } catch (error) {
      console.log("Error deleting todo:", error);
    }
  };

  const confirmDelete = (id) => {
    Alert.alert("Delete todo", "Are you sure you want to delete this?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => handleDelete(id) },
    ]);
  };

  const toggleComplete = async (item) => {
    try {
      const docRef = doc(db, "todos", item.id);
      await updateDoc(docRef, {
        completed: !item.completed,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.log("Error updating todo:", error);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setText(item.text);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log("Error signing out:", error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.todoCard}>
      <TouchableOpacity
        style={styles.todoTextWrapper}
        onPress={() => toggleComplete(item)}
      >
        <Ionicons
          name={item.completed ? "checkbox" : "square-outline"}
          size={22}
          color={item.completed ? "#22c55e" : isDark ? "#64748b" : "#999"}
          style={{ marginRight: 8 }}
        />
        <Text
          style={[
            styles.itemText,
            item.completed && styles.itemTextCompleted,
          ]}
        >
          {item.text}
        </Text>
      </TouchableOpacity>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => startEdit(item)}
        >
          <MaterialIcons
            name="edit"
            size={20}
            color={isDark ? "#38bdf8" : "#007bff"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, { marginLeft: 4 }]}
          onPress={() => confirmDelete(item.id)}
        >
          <MaterialIcons
            name="delete-outline"
            size={20}
            color={isDark ? "#fca5a5" : "#dc3545"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const disabledAdd = !text.trim();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>My Todos</Text>
          <Text style={styles.subHeading}>{user?.email}</Text>
        </View>

        <View style={styles.rightHeaderRow}>
          {/* 🌙/☀️ theme toggle */}
          <TouchableOpacity
            style={styles.themeToggle}
            onPress={() => setIsDark((prev) => !prev)}
          >
            <Ionicons
              name={isDark ? "sunny-outline" : "moon-outline"}
              size={20}
              color={isDark ? "#fde68a" : "#0f172a"}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons
              name="log-out-outline"
              size={20}
              color={isDark ? "#38bdf8" : "#007bff"}
            />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Input + Add/Update */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="What do you want to do?"
          placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity
          style={[styles.addButton, disabledAdd && styles.buttonDisabled]}
          disabled={disabledAdd}
          onPress={handleSave}
        >
          <Ionicons
            name={editingId ? "refresh" : "add"}
            size={22}
            color="#fff"
          />
          <Text style={styles.addButtonText}>
            {editingId ? "Update" : "Add"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {["all", "active", "completed"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              filter === f && styles.filterChipActive,
            ]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f === "all"
                ? "All"
                : f === "active"
                ? "Active"
                : "Completed"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color={isDark ? "#e5e7eb" : "#000"} />
      ) : (
        <FlatList
          data={filteredTodos}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No todos yet. Add one above 👆</Text>
          }
          contentContainerStyle={
            filteredTodos.length === 0 && { flexGrow: 1, justifyContent: "center" }
          }
        />
      )}
    </SafeAreaView>
  );
}
