import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  Calendar,
  DateData,
} from "react-native-calendars";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getDietRecords,
  type DietItem,
  type DietRecord,
} from "@/services/diet-storage";

const CALENDAR_THEME = {
  backgroundColor: "#ffffff",
  calendarBackground: "#ffffff",
  textSectionTitleColor: "#666",
  selectedDayBackgroundColor: "#4caf50",
  selectedDayTextColor: "#ffffff",
  todayTextColor: "#4caf50",
  dayTextColor: "#333",
  textDisabledColor: "#ccc",
  dotColor: "#4caf50",
  selectedDotColor: "#ffffff",
  arrowColor: "#4caf50",
  monthTextColor: "#333",
  textDayFontSize: 16,
  textMonthFontSize: 18,
  textDayHeaderFontSize: 12,
};

function getFoodName(item: DietItem) {
  return item.food_name ?? item.name ?? "알 수 없음";
}

function formatTime(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TabTwoScreen() {
  const [records, setRecords] = useState<DietRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getDietRecords();
      setRecords(all);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [loadRecords])
  );

  const buildMarkedDates = useCallback(() => {
    const marks: Record<string, object> = {};
    const dateSet = new Set(records.map((r) => r.date));
    dateSet.forEach((date) => {
      marks[date] = {
        marked: true,
        dotColor: "#4caf50",
        ...(selectedDate === date && {
          selected: true,
          selectedColor: "#4caf50",
        }),
      };
    });
    if (selectedDate && !marks[selectedDate]) {
      marks[selectedDate] = { selected: true, selectedColor: "#4caf50" };
    }
    return marks;
  }, [records, selectedDate]);

  const markedDates = buildMarkedDates();

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const dayRecords = selectedDate
    ? records.filter((r) => r.date === selectedDate)
    : [];

  const totalCalories = dayRecords.reduce(
    (acc, r) =>
      acc + r.items.reduce((sum, item) => sum + (item.calories ?? 0), 0),
    0
  );

  const monthlyTotalCalories = records
    .filter((r) => r.date.startsWith(currentMonth))
    .reduce(
      (acc, r) =>
        acc + r.items.reduce((sum, item) => sum + (item.calories ?? 0), 0),
      0
    );

  const monthHeaderLabel = `${currentMonth.slice(0, 4)}년 ${parseInt(currentMonth.slice(5), 10)}월`;

  return (
    <View style={styles.container}>
      <View style={styles.monthlySummary}>
        <Text style={styles.monthlySummaryLabel}>{monthHeaderLabel} 총 칼로리</Text>
        <Text style={styles.monthlySummaryValue}>{monthlyTotalCalories.toLocaleString()}kcal</Text>
      </View>

      <Calendar
        style={styles.calendar}
        theme={CALENDAR_THEME}
        markedDates={markedDates}
        onDayPress={handleDayPress}
        onMonthChange={(month) => setCurrentMonth(month.dateString.slice(0, 7))}
        monthFormat="yyyy년 M월"
        enableSwipeMonths
        firstDay={0}
      />

      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#4caf50" style={styles.loader} />
        ) : selectedDate ? (
          <>
            <View style={styles.dateHeader}>
              <Text style={styles.dateTitle}>
                {selectedDate.replace(/-/g, ". ")} 기록
              </Text>
              <Text style={styles.totalCalories}>
                총 {totalCalories}kcal
              </Text>
            </View>

            {dayRecords.length === 0 ? (
              <Text style={styles.emptyText}>이 날짜에 기록이 없습니다.</Text>
            ) : (
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {dayRecords.map((record) => (
                  <View key={record.id} style={styles.recordCard}>
                    <Text style={styles.recordTime}>
                      {formatTime(record.recordedAt)}
                    </Text>
                    {record.items.map((item, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemName}>
                          {getFoodName(item)}
                        </Text>
                        <Text style={styles.itemCalories}>
                          {item.calories ?? 0}kcal
                          {item.carbohydrates != null &&
                            ` · 탄${item.carbohydrates}g`}
                          {item.protein != null && ` · 단${item.protein}g`}
                          {item.fat != null && ` · 지${item.fat}g`}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            )}
          </>
        ) : (
          <Text style={styles.hintText}>날짜를 선택하면 기록을 볼 수 있습니다.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  monthlySummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  monthlySummaryLabel: {
    fontSize: 16,
    color: "#666",
  },
  monthlySummaryValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4caf50",
  },
  calendar: {
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  listContainer: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loader: {
    marginTop: 40,
  },
  dateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  totalCalories: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4caf50",
  },
  emptyText: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    marginTop: 24,
  },
  hintText: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    marginTop: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  recordCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  recordTime: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  itemRow: {
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  itemCalories: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
});
