
import { GoogleGenAI, Type } from "@google/genai";

// Serverless function (chạy trên server Vercel, KHÔNG chạy trong trình duyệt).
// GEMINI_API_KEY chỉ được đọc ở đây (process.env phía server) nên không bao giờ
// bị nhúng vào bundle JavaScript gửi cho trình duyệt người dùng.

const EXAM_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    mcqs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          question: { type: Type.STRING },
          options: {
            type: Type.OBJECT,
            properties: {
              A: { type: Type.STRING },
              B: { type: Type.STRING },
              C: { type: Type.STRING },
              D: { type: Type.STRING }
            },
            required: ["A", "B", "C", "D"]
          },
          correctAnswer: { type: Type.STRING, enum: ["A", "B", "C", "D"] }
        },
        required: ["id", "question", "options", "correctAnswer"]
      }
    },
    trueFalse: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          context: { type: Type.STRING },
          statements: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                isCorrect: { type: Type.BOOLEAN }
              },
              required: ["id", "text", "isCorrect"]
            }
          }
        },
        required: ["id", "context", "statements"]
      }
    }
  },
  required: ["title", "mcqs", "trueFalse"]
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server chưa cấu hình GEMINI_API_KEY (Environment Variable)." });
    return;
  }

  try {
    const body = req.body || {};
    const grade: number = body.grade;
    const chapter: string = body.chapter;
    const extraNotes: string = body.extraNotes;
    const unitName: string | null = body.unitName ?? null;
    const pdfBase64: string | null = body.pdfBase64 ?? null;

    if (!grade || !chapter) {
      res.status(400).json({ error: "Thiếu thông tin lớp học hoặc chương học." });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const rules = `
  2. PHẦN I (50 câu trắc nghiệm nhiều phương án lựa chọn - MCQ):
     - BẮT BUỘC TẠO ĐỦ 50 CÂU HỎI (mỗi câu có 4 phương án A, B, C, D).
     - Phần dẫn câu hỏi (question stem) phải chi tiết, rõ ràng, dài ít nhất 20 chữ.
     - Đánh số tuần tự từ Câu 1 đến Câu 50.
  3. PHẦN II (25 câu trắc nghiệm Đúng/Sai):
     - BẮT BUỘC TẠO ĐỦ CHÍNH XÁC 25 CÂU HỎI.
     - BỐI CẢNH THỰC TẾ: Mỗi câu PHẢI xây dựng một bối cảnh (context) gắn với tình huống thực tế, ứng dụng đời sống, sản xuất công nghiệp, môi trường, y tế, hoặc nghiên cứu khoa học... Bối cảnh cần có tham khảo/lấy cảm hứng từ các nguồn tài liệu, nghiên cứu, tạp chí khoa học nước ngoài uy tín (ví dụ: IUPAC, Royal Society of Chemistry, American Chemical Society (ACS), Nature, Journal of Chemical Education, PubChem, sách giáo khoa/tài liệu khoa học quốc tế...), có thể nêu ngắn gọn, tự nhiên tên nguồn/tổ chức tham khảo trong bối cảnh. Bối cảnh dài ít nhất 40 chữ, viết bằng tiếng Việt dễ hiểu.
     - Mỗi câu gồm 4 phát biểu độc lập có id là 'a', 'b', 'c', 'd'; các phát biểu PHẢI bám sát, phù hợp trực tiếp với bối cảnh đã nêu (không phát biểu chung chung, tách rời bối cảnh).
     - GIỚI HẠN KIẾN THỨC: Nội dung bối cảnh và phát biểu tuyệt đối KHÔNG được vượt quá chuẩn kiến thức, kĩ năng chương trình GDPT 2018 dành cho học sinh THPT (Lớp 10-12) tương ứng - không đưa vào kiến thức đại học, chuyên sâu, số liệu phức tạp hoặc thuật ngữ ngoài chương trình phổ thông.
     - Đánh giá tính đúng (true) hoặc sai (false) chính xác cho từng phát biểu.
  `;

    const systemPrompt = `Bạn là chuyên gia khảo thí Hóa học hàng đầu theo chương trình GDPT 2018. Nhiệm vụ của bạn là tạo đề ôn tập chương môn Hóa học cho Lớp ${grade}, Chương: ${chapter}${unitName ? `, Bài học/Module: ${unitName}` : ''}.

  QUY TẮC NỘI DUNG (CỰC KỲ QUAN TRỌNG):
  1. TỈ LỆ NHẬN THỨC: Đảm bảo 40% câu hỏi ở mức độ NHẬN BIẾT, 30% mức độ THÔNG HIỂU, 30% mức độ VẬN DỤNG.
  ${rules}

  ĐỊNH DẠNG HÓA HỌC (BẮT BUỘC):
  - Chỉ số dưới (công thức chất): dùng _{...}. Ví dụ: H_{2}SO_{4}, Al_{2}(SO_{4})_{3}, Fe_{3}O_{4}
  - Chỉ số trên/Điện tích ion: dùng ^{...}. Ví dụ: Fe^{3+}, SO_{4}^{2-}, NH_{4}^{+}
  - Phải hiển thị chính xác chỉ số dưới và chỉ số trên cho mọi công thức phân tử và ion.
  - Danh pháp hóa học luôn dùng theo quy chuẩn IUPAC mới nhất.

  ${pdfBase64 ? "Ưu tiên tối đa nội dung và dữ liệu từ file PDF đính kèm." : "Dựa trên chuẩn kiến thức, kĩ năng chương trình GDPT 2018 môn Hóa học."}
  Ghi chú bổ sung: ${extraNotes || "Không có"}`;

    const userMsg = "Hãy tạo đề ôn tập chương ngay bây giờ. BẮT BUỘC ĐẢM BẢO ĐỦ 50 CÂU MCQ Ở PHẦN I VÀ ĐỦ 25 CÂU ĐÚNG/SAI Ở PHẦN II (mỗi câu 4 ý a, b, c, d). Sử dụng đúng định dạng _{...} và ^{...} cho công thức hóa học.";

    const contents: any[] = [{ text: userMsg }];

    if (pdfBase64) {
      contents.push({
        inlineData: {
          mimeType: "application/pdf",
          data: pdfBase64
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: contents as any },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: EXAM_SCHEMA as any
      },
    });

    const data = JSON.parse(response.text);
    res.status(200).json(data);
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error?.message || "Lỗi không xác định khi gọi Gemini API." });
  }
}

// Cho phép hàm chạy tới 60 giây (Hobby plan) vì tạo 50 câu MCQ + 25 câu Đúng/Sai
// có thể mất nhiệu thời gian hơn mức mặc định 10 giây.
export const config = {
  maxDuration: 60,
};
