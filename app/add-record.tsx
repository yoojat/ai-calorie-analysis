import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  saveDietRecord,
  type DietItem,
} from "@/services/diet-storage";
import { notifyRefreshNeeded } from "@/utils/refresh-events";

function getTodayDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function AddRecordScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(params.date ?? getTodayDateString());
  const [items, setItems] = useState<DietItem[]>([
    { food_name: "", calories: 0 },
  ]);

  const updateItem = (
    index: number,
    field: keyof DietItem,
    value: string | number,
  ) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    setItems(next);
  };

  const addItem = () => {
    setItems([...items, { food_name: "", calories: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const validItems = items
      .map((item) => ({
        ...item,
        food_name: item.food_name ?? item.name ?? "",
        calories: Number(item.calories) || 0,
      }))
      .filter((item) => (item.food_name || item.name || "").trim() !== "");

    if (validItems.length === 0) {
      Alert.alert("오류", "최소 하나의 음식을 입력해주세요.");
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      Alert.alert("오류", "날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)");
      return;
    }

    setSaving(true);
    setTimeout(async () => {
      try {
        await saveDietRecord(validItems, date);
        notifyRefreshNeeded();
        router.back();
        Alert.alert("기록 완료", "식단이 기록되었습니다.");
      } catch (error) {
        console.error("기록 실패:", error);
        setSaving(false);
        Alert.alert("기록 실패", "기록 중 문제가 발생했습니다.");
      }
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.label}>날짜</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>음식 목록</Text>
            <TouchableOpacity onPress={addItem} style={styles.addButton}>
              <Text style={styles.addButtonText}>+ 추가</Text>
            </TouchableOpacity>
          </View>

          {items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemIndex}>음식 {index + 1}</Text>
                <TouchableOpacity
                  onPress={() => removeItem(index)}
                  disabled={items.length <= 1}
                  style={[
                    styles.removeButton,
                    items.length <= 1 && styles.removeButtonDisabled,
                  ]}
                >
                  <Text style={styles.removeButtonText}>삭제</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                value={item.food_name ?? item.name ?? ""}
                onChangeText={(v) => updateItem(index, "food_name", v)}
                placeholder="음식명"
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                value={String(item.calories ?? 0)}
                onChangeText={(v) =>
                  updateItem(index, "calories", Number(v) || 0)
                }
                placeholder="칼로리 (kcal)"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  value={String(item.carbohydrates ?? "")}
                  onChangeText={(v) =>
                    updateItem(index, "carbohydrates", v ? Number(v) : 0)
                  }
                  placeholder="탄수화물(g)"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  value={String(item.protein ?? "")}
                  onChangeText={(v) =>
                    updateItem(index, "protein", v ? Number(v) : 0)
                  }
                  placeholder="단백질(g)"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  value={String(item.fat ?? "")}
                  onChangeText={(v) =>
                    updateItem(index, "fat", v ? Number(v) : 0)
                  }
                  placeholder="지방(g)"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>취소</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving ? "저장 중..." : "기록하기"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: "#fafafa",
  },
  inputHalf: {
    flex: 1,
    marginHorizontal: 4,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  addButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#4caf50",
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  itemCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  itemIndex: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  removeButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#f44336",
    borderRadius: 6,
  },
  removeButtonDisabled: {
    backgroundColor: "#ccc",
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 12,
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#757575",
  },
  saveButton: {
    backgroundColor: "#4caf50",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
