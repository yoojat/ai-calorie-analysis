import { Text, View } from "react-native";

/**
 * AdBanner - 플랫폼별로 분리됨
 * - AdBanner.web.tsx: 웹 (빈 View)
 * - AdBanner.native.tsx: iOS/Android (배너 광고)
 */
export default function AdBanner() {
  return (
    <View>
      <Text style={{ fontSize: 12, color: "#666" }}>AdBanner</Text>
    </View>
  );
}
