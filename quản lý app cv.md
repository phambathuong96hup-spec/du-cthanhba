# Quản Lý App CV

## 1. Mục đích

File này dùng để:
- xem nhanh cấu trúc app quản lý công việc
- biết các phần đã làm đến đâu
- theo dõi các thay đổi đã có
- chốt kế hoạch chỉnh sửa hoàn thiện các phiên tiếp theo

App đang nằm tại:
- `public/webapp/quan-ly-cong-viec/`

Repo GitHub Pages đang publish tại:
- `https://phambathuong96hup-spec.github.io/du-cthanhba/webapp/quan-ly-cong-viec/index.html`

## 2. Cấu trúc app hiện tại

### 2.1. File giao diện

- `public/webapp/quan-ly-cong-viec/index.html`
  - layout chính của app
  - sidebar
  - header
  - tab danh sách công việc
  - tab báo cáo
  - tab giao việc mới cho admin
  - tab nội quy
  - các modal: login, đổi PIN, sửa task, duyệt báo cáo, chi tiết task
  - widget chat Lily AI

- `public/webapp/quan-ly-cong-viec/css/styles.css`
  - toàn bộ style chính của app
  - theme sáng/tối
  - table, kanban, stat card, modal, chat box
  - responsive mobile/tablet

### 2.2. File logic

- `public/webapp/quan-ly-cong-viec/js/config.js`
  - chứa `SCRIPT_URL`
  - khai báo danh sách nhân sự, tổ, nhóm

- `public/webapp/quan-ly-cong-viec/js/utils.js`
  - hàm dùng chung
  - `apiFetch`
  - `showToast`
  - `parseProgress`
  - `getToday`
  - `getEffectiveStatus`
  - helper avatar
  - helper kiểm tra quyền admin

- `public/webapp/quan-ly-cong-viec/js/auth.js`
  - đăng nhập
  - session
  - đổi PIN
  - ẩn/hiện vùng admin

- `public/webapp/quan-ly-cong-viec/js/app.js`
  - khởi tạo UI
  - đổi theme
  - toggle sidebar
  - switch tab
  - submit form giao việc
  - submit form nội quy

- `public/webapp/quan-ly-cong-viec/js/tasks.js`
  - tải dữ liệu công việc
  - filter
  - render table
  - phân trang
  - cập nhật tiến độ
  - upload báo cáo
  - duyệt/từ chối task
  - sửa task
  - gửi mail nhắc

- `public/webapp/quan-ly-cong-viec/js/kanban.js`
  - chuyển view table/kanban
  - render kanban
  - kéo thả đổi trạng thái
  - modal chi tiết task
  - checklist cục bộ

- `public/webapp/quan-ly-cong-viec/js/dashboard.js`
  - dashboard báo cáo
  - Google Charts
  - FullCalendar
  - export Excel

- `public/webapp/quan-ly-cong-viec/js/compliance.js`
  - đọc và render dữ liệu nội quy

- `public/webapp/quan-ly-cong-viec/js/chat.js`
  - UI chat Lily AI
  - gửi câu hỏi tới backend `ask_ai`

- `public/webapp/quan-ly-cong-viec/js/notifications.js`
  - polling
  - thông báo công việc

## 3. Các chức năng đang có

### 3.1. Công việc

- xem danh sách công việc dạng bảng
- lọc theo tháng, tổ, nhân sự, trạng thái, độ khó
- tìm kiếm nhanh
- phân trang
- xem badge hạn, ưu tiên, trạng thái
- cập nhật tiến độ
- nộp báo cáo file
- admin duyệt hoặc từ chối báo cáo
- admin sửa task

### 3.2. Kanban

- xem công việc theo cột
- kéo thả đổi trạng thái
- xem chi tiết task qua modal

### 3.3. Báo cáo

- thẻ thống kê
- biểu đồ trạng thái, độ khó, năng suất
- biểu đồ nội quy
- lịch công tác
- export Excel

### 3.4. Quản trị

- đăng nhập
- đổi PIN
- admin giao việc mới
- admin ghi nhận nội quy

### 3.5. AI

- chat Lily AI
- gửi câu hỏi về backend

## 4. Những thay đổi đã có gần đây

### 4.1. Đã có sẵn từ các phiên trước

- tách app thành nhiều file JS theo module
- nâng cấp UI sang kiểu card, badge, sidebar, dark mode
- thêm kanban board
- thêm dashboard với charts + calendar
- thêm modal chi tiết task
- thêm form giao việc mới bản nâng cấp

### 4.2. Đã sửa trong phiên gần nhất

- khôi phục logic nhận diện quyền admin theo hướng ổn định hơn
- không còn phụ thuộc cứng vào đúng chuỗi `Admin`
- áp dụng lại cho:
  - hiển thị vùng admin
  - giao việc mới
  - duyệt task
  - sửa task
  - thao tác admin trong bảng và kanban

## 5. Các vấn đề còn tồn tại

### 5.1. Ưu tiên cao

- phần `Giao việc mới` đã có trong HTML nhưng cần rà lại kỹ để chắc chắn layout và logic đều hoạt động ổn định sau khi publish
- file `index.html` đang có dấu hiệu sửa dở ở local, cần dọn sạch trước khi push tiếp
- cần kiểm tra lại tab `Báo cáo` để chắc phần lịch công tác không bị lệch cấu trúc HTML

### 5.2. Logic chưa khớp hoàn toàn

- checklist đang lưu bằng `localStorage`, chưa đồng bộ backend
- ghi chú có mô tả markdown checklist `- [ ]` nhưng code chưa parse thật từ `notes`
- filter table và dữ liệu kanban chưa đồng bộ chặt
- một số kiểm tra trạng thái còn phụ thuộc dữ liệu sheet chưa chuẩn hóa

### 5.3. UI/UX còn cần làm gọn

- còn nhiều inline style trong `index.html`
- khoảng cách, font-size, nút bấm chưa đồng đều giữa các khu vực
- giao diện đang dùng hơi nhiều hiệu ứng cùng lúc
- form admin đẹp hơn trước nhưng chưa được chuẩn hóa thành hệ component rõ ràng

### 5.4. Kỹ thuật

- `utils.js` còn helper trùng tên, cần dọn lại
- HTML hiện có dấu hiệu lỗi mã hóa tiếng Việt trong một số đoạn cũ
- cần kiểm tra lại responsive của form giao việc và kanban

## 6. Kế hoạch chỉnh sửa hoàn thiện

### Giai đoạn 1. Ổn định cấu trúc và quyền

Mục tiêu:
- đảm bảo app chạy ổn định
- không mất tab admin
- không vỡ tab báo cáo

Việc cần làm:
- rà lại toàn bộ `index.html`
- khóa lại cấu trúc tab `pills-list`, `pills-report`, `pills-input`, `pills-compliance`
- test lại login admin và non-admin
- test lại publish GitHub Pages

### Giai đoạn 2. Hoàn thiện phần Giao việc mới

Mục tiêu:
- khôi phục đầy đủ form giao việc đẹp và dùng ổn định

Việc cần làm:
- chuẩn hóa layout form admin
- bỏ bớt inline style lặp lại
- kiểm tra `taskForm` submit đúng field backend đang cần:
  - `taskName`
  - `type`
  - `deadline`
  - `group`
  - `difficulty`
  - `assignee`
  - `notes`
- kiểm tra validate khi chưa chọn người hoặc thiếu deadline
- kiểm tra hiển thị đúng sau submit thành công

### Giai đoạn 3. Đồng bộ table, kanban, detail

Mục tiêu:
- các view phải nói cùng một ngôn ngữ dữ liệu

Việc cần làm:
- cho kanban dùng cùng dữ liệu đã filter hoặc cùng hàm lọc
- chuẩn hóa cách tính `Todo`, `Doing`, `Waiting`, `Done`, `Overdue`
- sửa modal chi tiết task bám đúng dữ liệu backend

### Giai đoạn 4. Hoàn thiện checklist thật

Mục tiêu:
- checklist không còn là tính năng nửa vời

Việc cần làm:
- parse markdown checklist từ `notes`
- render checklist trong modal/task detail
- nếu backend cho phép, lưu trạng thái checklist về sheet
- nếu backend chưa cho phép, tách rõ là checklist local tạm thời

### Giai đoạn 5. Làm sạch UI

Mục tiêu:
- giao diện nhìn chuyên nghiệp, nhẹ mắt, đồng bộ

Việc cần làm:
- giảm inline style
- chuẩn hóa spacing
- chuẩn hóa button, badge, input
- giảm bớt hiệu ứng không cần thiết
- kiểm tra mobile/tablet

### Giai đoạn 6. Làm sạch code

Mục tiêu:
- dễ bảo trì và ít phát sinh lỗi ẩn

Việc cần làm:
- gộp helper trùng
- đổi tên field cho nhất quán
- thêm comment ngắn ở các đoạn dễ lỗi
- nếu cần, tách tiếp phần render admin form thành helper riêng

## 7. Thứ tự ưu tiên đề xuất

1. Ổn định `index.html` và các tab.
2. Hoàn thiện `Giao việc mới` của admin.
3. Kiểm tra lại publish GitHub Pages.
4. Đồng bộ table và kanban.
5. Xử lý checklist markdown đúng như mô tả.
6. Dọn UI và refactor code.

## 8. Cách làm việc cho các phiên sau

Mỗi lần sửa nên đi theo thứ tự:

1. chốt phạm vi sửa
2. sửa local tối thiểu để không vỡ app
3. kiểm tra tab liên quan
4. commit riêng từng cụm thay đổi
5. push lên GitHub Pages
6. cập nhật lại file này

## 9. Ghi chú hiện tại

- commit đã push để khôi phục quyền admin:
  - `5493880` - `fix: restore admin access checks in task app`

- thay đổi local chưa xử lý sạch:
  - `public/webapp/quan-ly-cong-viec/index.html`
  - `public/webapp/quan-ly-cong-viec/css/styles.css`
  - `public/webapp/quan-ly-cong-viec/Session_Summary.md`

## 10. Việc nên làm ngay tiếp theo

- rà sạch `index.html` để giữ đồng thời:
  - tab báo cáo đầy đủ
  - lịch công tác đầy đủ
  - tab giao việc mới đầy đủ
- sau đó push thêm một commit UI hoàn chỉnh cho admin form
