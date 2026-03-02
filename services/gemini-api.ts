import axios, { AxiosError } from "axios";

/** base64 문자열에서 data URI 접두사 제거 (Gemini API는 순수 base64만 허용) */
const stripBase64Prefix = (base64: string): string => {
  const match = base64.match(/^data:image\/\w+;base64,(.+)$/);
  return match ? match[1] : base64;
};

/** base64 시그니처로 MIME 타입 추론 (JPEG: /9j/, PNG: iVBOR) */
const getMimeType = (base64: string): string => {
  const clean = stripBase64Prefix(base64).slice(0, 10);
  if (clean.startsWith("/9j/")) return "image/jpeg";
  if (clean.startsWith("iVBOR")) return "image/png";
  return "image/jpeg"; // 기본값
};

export const analyzeImage = async (base64Image: string) => {
  const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!API_KEY) {
    throw new Error("EXPO_PUBLIC_GEMINI_API_KEY가 설정되지 않았습니다.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`;

  const cleanBase64 = stripBase64Prefix(base64Image);
  const mimeType = getMimeType(base64Image);

  const payload = {
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: "이 이미지 속 음식을 분석해서 칼로리와 탄단지 정보를 JSON으로 줘. 따로 제품에 대한 설명은 빼고 오직 JSON 형식으로 줘. 칼로리 정보는 calories 키에 있어. 칼로리 정보에 단위를 붙이지 말고 숫자값만 표시해줘. 음식이름 정보도 같이 표시해줘. 음식이름 정보는 name 키에 있어. 음식이름은 요청을 시도하는 국가를 기준으로 표시해줘. 여러개의 음식이 있을수도 있으니 배열로 줘.",
          },
        ],
      },
    ],
  };

  try {
    const response = await axios.post(url, payload);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ error?: { message?: string } }>;
    const message =
      axiosError.response?.data?.error?.message || axiosError.message;
    console.error("Gemini API 에러 상세:", message);
    throw new Error(message);
  }
};
