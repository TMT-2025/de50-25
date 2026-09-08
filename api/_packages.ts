// Danh mục gói lượt tải — ĐÂY LÀ NGUỒN SỰ THẬT DUY NHẤT về giá và số lượt của từng gói.
// Server luôn tra giá từ đây, KHÔNG BAO GIỜ tin số tiền do client gửi lên, để tránh
// trường hợp client (hoặc ai đó can thiệp request) tự sửa amount.
//
// Dùng CHUNG tài khoản payOS & bảng "orders" trên Supabase với dự án V3-KHBD (theo lựa
// chọn của người dùng), nên id/giá ở đây khớp với gói bên phía V3-KHBD.
// Nếu đổi giá/gói, chỉ cần sửa ở file này — cả create-payment và check-order-status đều dùng chung.

export const PACKAGES: Record<string, { id: string; name: string; price: number; credits: number }> = {
  goi1: { id: 'goi1', name: 'Gói 1 (Trải nghiệm)', price: 25000, credits: 5 },
  goi2: { id: 'goi2', name: 'Gói 2 (Tiết kiệm)', price: 60000, credits: 15 },
  goi3: { id: 'goi3', name: 'Gói 3 (Pro)', price: 140000, credits: 40 },
};
