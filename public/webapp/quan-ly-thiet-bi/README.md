# Quản lý trang thiết bị - bản deploy

Thư mục này là bản build tĩnh được sinh từ source app React/Vite tại `Quản lý trang thiết bị/`.

Không sửa trực tiếp các file trong `assets/` hoặc `index.html` tại đây. Muốn thay đổi chức năng hoặc giao diện, sửa source trong `Quản lý trang thiết bị/src`, sau đó chạy:

```bash
npm run deploy:thiet-bi
```

Script deploy sẽ build app con và copy output vào thư mục này, đồng thời giữ lại các file hỗ trợ không thuộc bản build như `gas/`.
