# 🐱 Nihongo Neko — Học tiếng Nhật cùng mèo

Ứng dụng học tiếng Nhật kiểu Duolingo, giao diện tiếng Việt, đi từ bảng chữ cái Hiragana/Katakana đến từ vựng, ngữ pháp và Kanji N5. Làm bài xong nhận **xu** để mua đồ cho chú mèo ở cửa hàng.

## 1. Cài đặt (chỉ làm 1 lần)

1. Vào https://nodejs.org và tải bản **LTS** (nút màu xanh), cài đặt như phần mềm bình thường (bấm Next đến hết).
2. Giải nén thư mục `nihongo-neko` ở đâu cũng được (ví dụ: Desktop).

## 2. Chạy ứng dụng

- **Windows:** bấm đúp vào file `CHAY-APP.bat`.
- **Mac:** bấm đúp vào file `CHAY-APP.command` (lần đầu có thể phải bấm chuột phải → Open).
- **Cách khác:** mở Terminal/Command Prompt trong thư mục, gõ `npm start`.

Khi thấy dòng `Nihongo Neko đang chạy!`, mở trình duyệt và vào địa chỉ **http://localhost:3000**. Để tắt ứng dụng, đóng cửa sổ đen hoặc bấm Ctrl+C.

Để điện thoại trong cùng mạng Wi-Fi vào được: dùng địa chỉ `http://<IP máy tính>:3000` (xem IP trong cài đặt mạng của máy tính).

## 3. Cách chơi

- Tạo tài khoản → bấm vào bài học tròn trên lộ trình → học và làm bài.
- Sai một câu mất 1 ❤️ (tối đa 5 tim, hồi 1 tim mỗi 20 phút, hoặc mua bằng xu). Hết tim thì tạm dừng.
- Mỗi bài xong nhận **10 xu**, cộng thêm xu thưởng khi trả lời đúng liên tiếp. Học lại bài cũ chỉ nhận 50% xu.
- Cửa hàng: mũ, áo, kính, phụ kiện, hình nền, giao diện màu, bình hồi tim, khiên giữ chuỗi, bùa nhân đôi xu. Chạm vào món đồ để thử lên mèo trước khi mua.
- Nhiệm vụ mỗi ngày, chuỗi ngày học 🔥, bảng xếp hạng tuần, kết bạn bằng mã 6 ký tự, ôn lại những mục hay sai.

## 4. Âm thanh và giọng nói

- Dùng **Chrome hoặc Edge** để có đủ tính năng (nghe phát âm tiếng Nhật, bài tập nói bằng micro).
- Nếu máy không có giọng đọc tiếng Nhật (hoặc bạn tắt tiếng đọc), các bài "nghe chọn" tự chuyển thành bài đọc chọn để không bị mất tim oan.
- Nghe phát âm cần máy có giọng đọc tiếng Nhật (Windows: Settings → Time & Language → Language → thêm Japanese). Nếu không có, bài vẫn làm được nhưng không có tiếng.
- Bài tập nói cần cho phép dùng micro. Không có micro thì bấm "Bỏ qua".
- Phông chữ đẹp được tải từ Google nên cần có Internet; không có mạng thì vẫn chạy, chỉ khác phông chữ.

## 5. Dữ liệu nằm ở đâu?

Tất cả tài khoản và tiến độ nằm trong file `data/db.json` (tự tạo lần chạy đầu). **Sao chép file này để sao lưu.** Mật khẩu được mã hóa, không lưu dạng chữ thường.

## 6. Muốn chỉnh sửa?

- `config.js`: số tim, thời gian hồi tim, số xu mỗi bài, thưởng chuỗi đúng, xu khởi đầu…
- `content/shop.js`: danh sách đồ trong cửa hàng và giá.
- `content/kana.js`, `vocab*.js`, `kanji*.js`, `grammar*.js`: nội dung từ vựng, Kanji, ngữ pháp. `content/curriculum.js`: thứ tự các chương và bài.
- Sau khi sửa, tắt rồi chạy lại ứng dụng. Kiểm tra nội dung có lỗi không: `node test/check-content.js`.
- Kiểm tra toàn bộ API: `npm test`.

## 7. Thay icon bằng ảnh của bạn

Mọi icon (xu, tim, chuỗi ngày, khiên, bùa, đồ trong cửa hàng…) hiện là hình vẽ sẵn trong `public/js/icons.js`. Muốn dùng ảnh riêng:

1. Chép ảnh (PNG nền trong suốt hoặc SVG, hình vuông) vào thư mục `public/img/icons/`.
2. Mở `public/js/icons.js`, tìm dòng `const CUSTOM = {};` và khai báo, ví dụ:
   `const CUSTOM = { coin: 'img/icons/coin.png', heart: 'img/icons/heart.png', hat_crown: 'img/icons/vuongmien.png' };`
3. Tải lại trang. Món nào không khai báo vẫn dùng hình mặc định.

Tên dùng được: `coin`, `heart`, `flame`, `star`, `shield`, `charm`, `target`, `lock`; và mã các món trong `content/shop.js` (ví dụ `hat_ribbon`, `outfit_kimono`, `heart_1`, `freeze`, `coin_boost`).

## 8. Đưa lên web (ví dụ Render) và giữ dữ liệu không bị mất

Các máy chủ miễn phí như Render **xóa file mỗi lần khởi động lại**, nên `data/db.json` sẽ mất. Cách giữ dữ liệu: dùng MongoDB miễn phí (MongoDB Atlas). App đã hỗ trợ sẵn, chỉ cần đặt một biến môi trường.

1. Tạo tài khoản và một cluster miễn phí (M0) tại https://www.mongodb.com/atlas. Tạo người dùng database (tên + mật khẩu). Ở mục Network Access chọn "Allow access from anywhere" (0.0.0.0/0).
2. Bấm Connect → Drivers, chép chuỗi kết nối dạng `mongodb+srv://tên:matkhau@cluster0.xxxxx.mongodb.net/nihongoneko?retryWrites=true&w=majority` (thay tên, mật khẩu thật; nhớ có `/nihongoneko` trước dấu `?`).
3. Trên Render, tạo Web Service từ GitHub của bạn với:
   - **Root Directory:** `nihongo-neko` (nếu repo của bạn chứa thư mục này; nếu file nằm ngay gốc repo thì để trống)
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment → thêm biến:** `MONGODB_URI` = chuỗi ở bước 2
4. Mỗi lần sửa code: đưa file mới lên GitHub (ghi đè), Render tự triển khai lại.

Nếu không đặt `MONGODB_URI`, app lưu vào file như trên máy bạn (dữ liệu sẽ mất khi Render khởi động lại). Gói miễn phí của Render còn tự "ngủ" sau ~15 phút không ai vào, lần mở đầu tiên sẽ chậm khoảng 1 phút.

Khi nhiều người dùng, hãy dùng HTTPS (Render đã có sẵn) và đặt tên miền riêng nếu muốn.

## Cấu trúc thư mục

```
server.js        máy chủ (không cần cài thêm thư viện nào)
config.js        luật chơi
lib/             tài khoản, game, tạo bài tập, cơ sở dữ liệu (file JSON hoặc MongoDB)
content/         nội dung học và cửa hàng
public/          giao diện web (HTML/CSS/JS)
test/            kiểm tra tự động
data/db.json     dữ liệu người dùng (tự tạo)
```
