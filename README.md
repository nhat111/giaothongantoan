# Bé Đi Học An Toàn (3D)

Game 3D giúp học sinh tiểu học luyện đi bộ an toàn từ nhà đến trường trên một con phố Việt Nam:
vỉa hè, nhà ống, xe máy, đèn tín hiệu có đếm ngược, vạch kẻ đường cho người đi bộ.

## Nội dung các bài

| Bài | Tình huống | Bé học được |
| --- | --- | --- |
| 1 | Qua đường có đèn tín hiệu | Đi trên vỉa hè, sang đường ở vạch kẻ, chờ đèn người đi bộ màu xanh, không đi khi đèn xanh nhấp nháy |
| 2 | Qua đường không có đèn | Dừng ở mép vỉa hè, nhìn trái, nhìn phải, chỉ đi khi không có xe tới gần |
| 3 | Cả đoạn đường đến trường | Kết hợp cả hai, và vẫn phải quan sát khi đèn xanh vì có xe vượt đèn đỏ |
| 4 | Đi xe đạp: sát lề phải, dừng đèn đỏ | Chuẩn bị trước khi đi (mũ bảo hiểm, kiểm tra phanh, không đeo tai nghe, không chở quá một người), đi sát lề phải, dừng trước vạch khi đèn đỏ hoặc vàng |
| 5 | Đi xe đạp: tránh xe đỗ, xin đường rẽ | Quan sát phía sau trước khi ra giữa làn tránh xe đỗ, vào lại sát lề, không sang làn ngược chiều, giơ tay xin rẽ và đi chậm trước khi rẽ |

Nút **Quan sát** chuyển camera sang góc mắt của bé và quay trái, rồi quay phải, để bé tập thói quen nhìn hai bên như ngoài đường thật.
Bé sai luật thì bị trừ sao và nhận lời nhắc; không có cảnh tai nạn.

## Điều khiển

- Máy tính: phím mũi tên (hoặc W A S D) để đi, phím cách (Space) để quan sát.
- Điện thoại / máy tính bảng: nút mũi tên ở góc trái dưới, nút **Quan sát** ở góc phải dưới.
- Bài xe đạp: → đạp, ← bóp phanh, ↑ ra giữa làn, ↓ vào sát lề (hoặc rẽ vào cổng), Space quan sát phía sau, X xin rẽ phải.

Ghi chú về luật: theo Luật Trật tự, an toàn giao thông đường bộ 2024, người đi xe đạp chỉ được chở một người
(thêm một trẻ dưới 7 tuổi thì tối đa hai), phải đi hàng một, đi bên phải, không buông cả hai tay, không dùng điện thoại khi đang đi.
Mũ bảo hiểm chỉ bắt buộc với xe đạp máy, nên trong game mũ bảo hiểm được dạy như một thói quen an toàn, không phải luật.

## Đọc to cho bé chưa biết chữ

Game đọc to bằng giọng tiếng Việt có sẵn trên máy (Web Speech API), không cần mạng hay file âm thanh:
hướng dẫn mỗi bài, mọi lời nhắc trong lúc chơi, các thẻ chuẩn bị trước khi đi xe đạp, và màn hình kết quả.

- Nút 🔊 trên thanh trên cùng để bật / tắt đọc to (máy nhớ lựa chọn).
- Nút **Nghe hướng dẫn** trên màn hình đầu bài, chạm vào lời nhắc để nghe lại.
- iPhone / iPad có sẵn giọng Linh. Android dùng giọng Google tiếng Việt. Máy tính Windows / Mac có thể phải cài thêm giọng tiếng Việt;
  nếu máy chưa có, game hiện hướng dẫn cài.
- Trình duyệt chỉ cho đọc sau khi bé chạm màn hình lần đầu, nên màn hình đầu tiên cần chạm nút **Nghe hướng dẫn**.

## Chạy trên máy

```bash
npm install
npm run dev
```

Mở địa chỉ mà Vite in ra (thường là http://localhost:5173).

## Deploy lên Vercel

1. Vào https://vercel.com/new và chọn **Import** repo `giaothongantoan`.
2. Vercel tự nhận ra đây là project **Vite**: Build Command `npm run build`, Output Directory `dist`. Giữ nguyên và bấm **Deploy**.
3. Mỗi lần push lên nhánh `main`, Vercel tự build và cập nhật.

## Cấu trúc code

```
src/
  game/levels.js     Bản đồ các bài (dạng lưới chữ cái) + luật hiển thị cho bé
  game/engine.js     Luật chơi: xe cộ, đèn tín hiệu, kiểm tra lỗi, chấm sao. Không phụ thuộc vào đồ hoạ.
  game/bike.js       Luật riêng cho các bài đi xe đạp
  scene/             Đồ hoạ 3D (React Three Fiber): nhà phố, đường, xe, bé, camera
  ui/                Giao diện: thanh trên cùng, nút điều khiển, thông báo, màn hình bắt đầu/kết thúc
```

Thêm bài mới: thêm một phần tử vào `LEVELS` trong `src/game/levels.js`. Ký hiệu bản đồ:

| Ký hiệu | Ý nghĩa |
| --- | --- |
| `B` | Dãy nhà phố (chỉ đặt ở hàng đầu hoặc hàng cuối) |
| `.` | Vỉa hè |
| `r` | Lòng đường (2 hàng liền nhau = 1 con đường, hàng trên xe chạy sang trái, hàng dưới sang phải) |
| `z` | Vạch kẻ đường cho người đi bộ |
| `H` | Cửa nhà bé (điểm xuất phát) |
| `S` | Cổng trường (đích) |
| `p` | Dải cây xanh |

Toàn bộ mô hình 3D (nhà, xe, bé) được dựng bằng code, không dùng file mô hình bên ngoài,
nên có thể thay bằng mô hình .glb chi tiết hơn sau này.
