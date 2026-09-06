# Hệ Thống Tạo Đề Ôn Tập Lý Thuyết Hóa Học (50 MCQ - 25 Đúng/Sai)

Ứng dụng web tạo đề ôn tập Hóa học theo chương trình GDPT 2018 với 50 câu trắc nghiệm nhiều phương án lựa chọn (Phần I) và 25 câu đúng/sai (Phần II), hỗ trợ xuất file Word (.docx) chuyên nghiệp.

## Tính năng chính
- **Khối lớp 10, 11, 12**: Bám sát chương trình Giáo dục phổ thông 2018.
- **Cấu trúc chuẩn**: 
  - Phần I: 50 câu trắc nghiệm (MCQ) tỉ lệ 40% Biết - 30% Hiểu - 30% Vận dụng.
  - Phần II: 25 câu trắc nghiệm Đúng/Sai (tổng cộng 100 mệnh đề a, b, c, d).
- **Hỗ trợ công thức hóa học chính xác**: Chỉ số dưới ($H_2SO_4$) và chỉ số trên/điện tích ($Fe^{3+}$, $SO_4^{2-}$).
- **Tải file PDF tham khảo**: Trích xuất và tạo câu hỏi trực tiếp từ tài liệu người dùng.
- **Xuất file Word (.docx)**:
  - Bản đề thi dành cho học sinh.
  - Bản đáp án dành cho giáo viên.

## Công nghệ sử dụng
- **React 19**, **TypeScript**, **Vite**
- **Google GenAI SDK** (`@google/genai` - Gemini 3.1 Pro)
- **docx**: Xuất tài liệu Microsoft Word
- **Tailwind CSS**

## Cài đặt & Chạy cục bộ

1. Clone repository:
```bash
git clone https://github.com/TMT-2025/de50-25.git
cd de50-25
```

2. Cài đặt thư viện:
```bash
npm install
```

3. Tạo file cấu hình `.env` dựa trên `.env.example`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Chạy ứng dụng ở chế độ phát triển:
```bash
npm run dev
```

## Triển khai lên Vercel

1. Import repository `TMT-2025/de50-25` vào Vercel.
2. Thiết lập Environment Variable:
   - Key: `GEMINI_API_KEY`
   - Value: `<API Key Google Gemini của bạn>`
3. Nhấn **Deploy**.
