import React, { useRef, useState } from "react";
import {
  Alert,
  Button,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// 1. 필수 라이브러리 임포트
import { analyzeImage } from "@/services/gemini-api";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";

export default function TabOneScreen() {
  // --- 상태 관리 (State) ---
  const [permission, requestPermission] = useCameraPermissions(); // 카메라 권한 상태
  const [photo, setPhoto] = useState<string | null>(null); // 촬영된 사진 URI
  const [photoBase64, setPhotoBase64] = useState<string | null>(null); // API 전송용 base64
  const [isAnalyzing, setIsAnalyzing] = useState(false); // 분석 중 로딩 상태
  const cameraRef = useRef<CameraView>(null); // 카메라 객체에 접근하기 위한 Ref

  // --- 권한 확인 (Permissions) ---
  if (!permission) {
    // 권한 상태 로딩 중
    return <View />;
  }

  if (!permission.granted) {
    // 권한이 거부되었을 때 보여줄 화면
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center", marginBottom: 10 }}>
          식단 분석을 위해 카메라 권한이 필요합니다.
        </Text>
        <Button onPress={requestPermission} title="권한 허용하기" />
      </View>
    );
  }

  // --- 주요 기능 함수 (Functions) ---

  // 1. 사진 촬영 함수
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        // 사진 촬영 (품질 조절 가능)
        const options = { quality: 0.5, base64: true };
        const data = await cameraRef.current.takePictureAsync(options);
        if (data && data.uri) {
          console.log("촬영 성공:", data.uri);
          setPhoto(data.uri);
          setPhotoBase64(data.base64 ?? null);
        }
      } catch (error) {
        console.error("촬영 실패:", error);
        Alert.alert("에러", "사진을 촬영하는 중 문제가 발생했습니다.");
      }
    }
  };

  // 2. 갤러리에서 사진 선택 함수 (수익형 앱 필수 기능)
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true, // 사진 자르기 편집 허용
      aspect: [4, 3],
      quality: 0.5,
      base64: true, // Gemini API 전송을 위해 base64 필요
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      console.log("갤러리 선택 성공:", asset.uri);
      setPhoto(asset.uri);
      setPhotoBase64(asset.base64 ?? null);
    }
  };

  // 3. AI 분석 실행 함수
  const handleAnalyze = async () => {
    if (!photoBase64) {
      Alert.alert("오류", "분석할 이미지가 없습니다.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const analysisResult = await analyzeImage(photoBase64);
      const text = analysisResult?.candidates?.[0]?.content?.parts?.[0]?.text;

      // 마크다운 코드 블록(```json ... ```)에서 JSON만 추출
      const extractJson = (raw: string) => {
        const match = raw.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
        return match ? match[1].trim() : raw;
      };

      if (text) {
        const jsonStr = extractJson(text);
        const json = JSON.parse(jsonStr);
        const resultString = json.map((item: any) => {
          return `${item.name} - ${item.calories}kcal`;
        });
        const totalCalories = json.reduce((acc: number, item: any) => {
          return acc + item.calories;
        }, 0);
        Alert.alert(
          "칼로리 분석 결과",
          resultString.join("\n") + "\n총 칼로리: " + totalCalories + "kcal",
        );
      } else {
        Alert.alert("분석 완료", JSON.stringify(analysisResult));
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      console.error("AI 분석 실패:", error);
      Alert.alert(
        "분석 실패",
        `이미지 분석 중 문제가 발생했습니다.\n\n${message}`,
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- 화면 렌더링 (Rendering) ---

  // A. 사진 촬영 후 미리보기(Preview) 화면
  if (photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo }} style={styles.preview} />
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => {
              setPhoto(null);
              setPhotoBase64(null);
            }}
          >
            <Text style={styles.text}>다시 찍기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.analyzeButton]}
            onPress={handleAnalyze}
            disabled={isAnalyzing}
          >
            <Text style={styles.text}>
              {isAnalyzing ? "분석 중..." : "분석 시작"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // B. 실제 카메라 촬영 화면 (초기 화면)
  return (
    <View style={styles.container}>
      <View style={styles.cameraWrapper}>
        <CameraView style={styles.camera} ref={cameraRef} />
        <View style={styles.cameraOverlay} pointerEvents="box-none">
          {/* 가이드라인 등을 추가할 수 있는 영역 */}
        </View>
      </View>

      {/* 하단 컨트롤 바 */}
      <View style={styles.controllerBar}>
        <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
          <Text style={{ fontSize: 30 }}>🖼️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
        <View style={styles.iconButton} />
      </View>
    </View>
  );
}

// --- 스타일 (Styles) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
  },
  cameraWrapper: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  controllerBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff",
    borderWidth: 5,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ff6b6b", // 촬영 버튼 색상
  },
  iconButton: {
    width: 50,
    alignItems: "center",
  },
  preview: {
    flex: 1,
    resizeMode: "contain",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    backgroundColor: "#fff",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#888",
  },
  analyzeButton: {
    backgroundColor: "#4dabf7", // 분석 버튼 색상
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
