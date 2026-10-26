# Đấu Trường Phân Bón Hữu Cơ

Mở `index.html` bằng trình duyệt để chơi. Trình duyệt cần có Internet lần đầu để tải Three.js.

## Cấu trúc

- `index.html`: khung giao diện và các thành phần trò chơi.
- `css/styles.css`: bố cục, màu sắc, hiển thị thẻ câu hỏi ở giữa màn hình.
- `js/game.js`: mô hình 3D, lượt chơi, HP, tấn công và hồi máu.
- `js/questions.js`: ngân hàng câu hỏi; đây là nơi nên thay nội dung theo bài thuyết trình.

## Luật nhanh

Mỗi đội khởi đầu 100 HP. Trả lời đúng để chọn tấn công một đội khác (trừ 25 HP) hoặc hồi 15 HP, tối đa 100. Nếu trả lời sai, câu hỏi chuyển sang đội tiếp theo. Đội cuối cùng còn HP thắng.

## Chia sẻ bằng đường link

Dự án đã sẵn sàng để xuất bản bằng GitHub Pages. Sau khi đưa thư mục này lên một repository GitHub, vào **Settings → Pages**, chọn nhánh `main` và thư mục `/ (root)`. GitHub sẽ tạo một đường link để gửi cho cả tổ. Cần giữ nguyên thư mục `sound/` để âm thanh hoạt động.
