/* ═══════════════════════════════════════════
   Config — Constants & Data
   ═══════════════════════════════════════════ */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxxXfxTRSkVV9bc2MRYQrmwVRd1Es9h3k-QlgsCAWt5hJ3uvaPeJvpm2b0aPo7H_Ee6Ig/exec";

const STAFF_GROUPS = {
    "Ban Lãnh Đạo": [
        "Nguyễn Thị Hương Giang - Trưởng Khoa",
        "Trần Thị Huyền Trang - Phó Khoa"
    ],
    "Dược sĩ": [
        "Phạm Bá Thương", "Lê Thị Thanh Nhàn", "Chu Đài Trang",
        "Nguyễn Duy Tiến", "Nguyễn Thị Hằng",
        "Kiều Mạnh Toàn",
        "Đỗ Thị Nhật Lệ",
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
