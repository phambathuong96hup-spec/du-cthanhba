/* ═══════════════════════════════════════════
   Config — Constants & Data
   ═══════════════════════════════════════════ */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw_TN4re6dbW-jvmz7fmsnxPwJmdNdwT7u2Bs7Fdbu5CjBFfeEi9NJhmE-wzcCwm2AV/exec";

const STAFF_GROUPS = {
    "Ban Lãnh Đạo": [
        "Nguyễn Thị Hương Giang - Trưởng Khoa",
        "Trần Thị Huyền Trang - Phó Khoa"
    ],
    "Dược sĩ": [
        "Phạm Bá Thương", "Lê Thị Thanh Nhàn", "Chu Đài Trang",
        "Nguyễn Duy Tiến - Tổ trưởng 5S", "Nguyễn Thị Hằng",
        "Kiều Mạnh Toàn - Tổ trưởng TTB",
        "Đỗ Thị Nhật Lệ - Tổ trưởng Tổ kho",
        "Nguyễn Thị Thu Hà", "Hà Thị Thảo",
        "Nguyễn Ngọc Vân - CBHĐ", "Vũ Thị Hồng Hạnh",
        "Hà Thu Trang", "Đỗ Thị Mai - CBHĐ", "Triệu Thị Vỵ"
    ]
};

const GROUP_LIST = [
    "Tổ kho", "Tổ Dược lâm sàng", "Tổ Trang thiết bị",
    "Tổ Thống kê và nghiệp vụ dược", "Tổ Truyền thông",
    "Tổ 5S", "Tổ Cung ứng"
];

// Flatten all staff names
const ALL_STAFF = [...new Set(
    Object.values(STAFF_GROUPS).flat()
)];
