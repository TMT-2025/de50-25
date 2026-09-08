
import { ExamData } from "./types";

// Gọi qua API route nội bộ (/api/generate-exam) thay vì gọi thẳng Gemini từ
// trình duyệt. API Key giờ chỉ tồn tại trên server (Vercel Serverless Function),
// không còn bị nhúng vào JavaScript bundle gửi cho người dùng.
export const generateExam = async (
  grade: number,
  chapter: string,
  extraNotes: string,
  unitName: string | null,
  pdfBase64: string | null,
  onProgress: (msg: string) => void
): Promise<ExamData> => {
  const progressLabel = pdfBase64
    ? "Đang đọc tài liệu PDF và phân tích kiến thức theo tỉ lệ 40-30-30..."
    : "Đang chuẩn bị đề ôn tập 50 câu MCQ & 25 câu Đúng/Sai (40% Biết, 30% Hiểu, 30% Vận dụng)...";

  onProgress(progressLabel);

  let response: Response;
  try {
    response = await fetch("/api/generate-exam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grade, chapter, extraNotes, unitName, pdfBase64 }),
    });
  } catch (networkError) {
    console.error("Network Error:", networkError);
    throw new Error("Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.");
  }

  if (!response.ok) {
    let message = `Yêu cầu thất bại (mã lỗi ${response.status}).`;
    try {
      const errData = await response.json();
      if (errData?.error) message = errData.error;
    } catch {
      // Không parse được JSON lỗi, dùng thông điệp mặc định ở trên.
    }
    console.error("Gemini Error:", message);
    throw new Error(message);
  }

  const data = await response.json();
  return { ...data, grade, chapter, unitName };
};
