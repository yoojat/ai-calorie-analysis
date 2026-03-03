import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { saveDietRecord, type DietItem } from "@/services/diet-storage";

export default function ResultScreen() {
  const params = useLocalSearchParams<{ data: string }>();
  const [saved, setSaved] = useState(false);

  let items: DietItem[] = [];
  try {
    const parsed = JSON.parse(params.data ?? "[]");
    items = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    items = [];
  }

  const totalCalories = items.reduce(
    (acc, item) => acc + (item.calories ?? 0),
    0,
  );
  const getFoodName = (item: DietItem) =>
    item.food_name ?? item.name ?? "알 수 없음";

  const handleRecord = async () => {
    if (items.length === 0) {
      Alert.alert("오류", "기록할 데이터가 없습니다.");
      return;
    }
    try {
      await saveDietRecord(items);
      setSaved(true);
      Alert.alert(
        "저장 완료",
        "식단이 기록되었습니다. 차후 캘린더에서 확인할 수 있습니다.",
      );
    } catch (error) {
      Alert.alert("저장 실패", "기록 중 문제가 발생했습니다.");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>식단 분석 결과</Text>

        {items.map((item, index) => (
          <View key={index} style={styles.itemCard}>
            <Text style={styles.foodName}>{getFoodName(item)}</Text>
            <Text style={styles.detail}>
              칼로리: {item.calories ?? 0}kcal
              {item.carbohydrates != null &&
                ` | 탄수화물: ${item.carbohydrates}g`}
              {item.protein != null && ` | 단백질: ${item.protein}g`}
              {item.fat != null && ` | 지방: ${item.fat}g`}
            </Text>
          </View>
        ))}

        <View style={styles.totalCard}>
          <Text style={styles.totalText}>총 칼로리: {totalCalories}kcal</Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.recordButton,
            saved && styles.buttonDisabled,
          ]}
          onPress={handleRecord}
          disabled={saved}
        >
          <Text style={styles.buttonText}>
            {saved ? "기록 완료" : "기록하기"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  itemCard: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  foodName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  detail: {
    fontSize: 14,
    color: "#666",
  },
  totalCard: {
    backgroundColor: "#e3f2fd",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1976d2",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 20,
    gap: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    marginBottom: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  recordButton: {
    backgroundColor: "#4caf50",
  },
  backButton: {
    backgroundColor: "#757575",
  },
  buttonDisabled: {
    backgroundColor: "#9e9e9e",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
