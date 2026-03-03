import AsyncStorage from "@react-native-async-storage/async-storage";

const DIET_RECORDS_KEY = "diet_records";

export interface DietItem {
  food_name?: string;
  name?: string;
  calories: number;
  carbohydrates?: number;
  protein?: number;
  fat?: number;
  quantity?: number;
}

export interface DietRecord {
  id: string;
  recordedAt: string; // ISO 8601 (캘린더 일시별 조회용)
  date: string; // YYYY-MM-DD
  items: DietItem[];
}

export async function saveDietRecord(
  items: DietItem[],
  date?: string,
): Promise<DietRecord> {
  const now = new Date();
  const dateStr = date ?? now.toISOString().slice(0, 10);
  const timeStr = now.toISOString().slice(11, 19);
  const record: DietRecord = {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2)}`,
    recordedAt: `${dateStr}T${timeStr}Z`,
    date: dateStr,
    items,
  };

  const existing = await getDietRecords();
  const updated = [record, ...existing];
  await AsyncStorage.setItem(DIET_RECORDS_KEY, JSON.stringify(updated));

  return record;
}

export async function getDietRecords(): Promise<DietRecord[]> {
  try {
    const data = await AsyncStorage.getItem(DIET_RECORDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function getDietRecordsByDate(
  date: string,
): Promise<DietRecord[]> {
  const records = await getDietRecords();
  return records.filter((r) => r.date === date);
}

export async function deleteDietRecord(id: string): Promise<void> {
  const existing = await getDietRecords();
  const updated = existing.filter((r) => r.id !== id);
  await AsyncStorage.setItem(DIET_RECORDS_KEY, JSON.stringify(updated));
}

export async function updateDietRecord(record: DietRecord): Promise<void> {
  const existing = await getDietRecords();
  const updated = existing.map((r) => (r.id === record.id ? record : r));
  await AsyncStorage.setItem(DIET_RECORDS_KEY, JSON.stringify(updated));
}
