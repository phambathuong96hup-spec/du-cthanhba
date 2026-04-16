import React from 'react';
import { motion } from 'motion/react';
import { Link, useParams } from 'react-router-dom';
import { Header, Footer, Breadcrumb } from '../components/SharedLayout';
import { ArrowRight, Calendar, Tag, ArrowLeft, Share2 } from 'lucide-react';

const allNews = [
  { id: 1, title: 'Hội nghị tập huấn sử dụng thuốc an toàn, hợp lý năm 2024', date: '15 tháng 3, 2024', category: 'Tập huấn & Đào tạo', summary: 'Khoa Dược tổ chức buổi tập huấn cho đội ngũ y bác sĩ về các quy định mới trong kê đơn và sử dụng thuốc an toàn theo hướng dẫn của Bộ Y tế.', image: `${import.meta.env.BASE_URL}images/news_training.png`,
    content: `
Ngày 15/3/2024, Khoa Dược – TTYT Khu vực Thanh Ba đã tổ chức thành công Hội nghị tập huấn sử dụng thuốc an toàn, hợp lý năm 2024 với sự tham gia của hơn 80 cán bộ y tế trong toàn đơn vị.

**Nội dung tập huấn**

Hội nghị tập trung vào các chủ đề trọng tâm:
- Cập nhật quy định kê đơn thuốc theo Thông tư 52/2017/TT-BYT
- Sử dụng kháng sinh hợp lý, phòng chống đề kháng kháng sinh
- Nhận diện và báo cáo phản ứng có hại của thuốc (ADR)
- Tương tác thuốc thường gặp trong thực hành lâm sàng

**Kết quả đạt được**

Toàn thể cán bộ tham dự đã được cập nhật kiến thức và kỹ năng cần thiết để đảm bảo an toàn thuốc trong công tác khám chữa bệnh. Qua kiểm tra cuối buổi, 95% học viên đạt yêu cầu.

Khoa Dược sẽ tiếp tục tổ chức các buổi tập huấn chuyên sâu theo từng chuyên khoa trong những tháng tiếp theo.
    `
  },
  { id: 2, title: 'Triển khai quy trình cấp phát thuốc nội trú mới', date: '10 tháng 3, 2024', category: 'Hoạt động khoa', summary: 'Nhằm nâng cao hiệu quả và giảm thời gian chờ đợi, Khoa Dược áp dụng quy trình số hóa trong cấp phát thuốc nội trú.', image: `${import.meta.env.BASE_URL}images/news_dispensing.png`,
    content: `
Bắt đầu từ ngày 10/3/2024, Khoa Dược chính thức triển khai quy trình cấp phát thuốc nội trú mới, áp dụng công nghệ số hóa vào toàn bộ chu trình từ kê đơn đến cấp phát.

**Điểm nổi bật của quy trình mới**

Quy trình mới tích hợp hệ thống quản lý đơn thuốc điện tử, giúp dược sĩ kiểm tra đơn thuốc nhanh chóng và chính xác hơn. Thời gian cấp phát thuốc trung bình giảm từ 45 phút xuống còn 15 phút.

**Lợi ích cho người bệnh**

Người bệnh nội trú sẽ nhận thuốc đúng giờ hơn, giảm thiểu nguy cơ sai sót trong cấp phát và đảm bảo dây chuyền lạnh cho thuốc cần bảo quản đặc biệt.
    `
  },
  { id: 3, title: 'Đoàn kiểm tra Sở Y tế đánh giá cao công tác bảo quản thuốc', date: '5 tháng 3, 2024', category: 'Hoạt động khoa', summary: 'Hệ thống kho thuốc đạt chuẩn GSP của TTYT Thanh Ba được đánh giá là một trong những đơn vị dẫn đầu khu vực Phú Thọ.', image: `${import.meta.env.BASE_URL}images/news_inspection.png`,
    content: `
Ngày 5/3/2024, Đoàn kiểm tra của Sở Y tế Phú Thọ đã tiến hành kiểm tra toàn diện công tác bảo quản thuốc tại Khoa Dược – TTYT Khu vực Thanh Ba.

**Kết quả kiểm tra**

Đoàn đánh giá cao hệ thống kho thuốc chuẩn GSP với các tiêu chí xuất sắc về nhiệt độ bảo quản, độ ẩm phòng kho, hệ thống theo dõi điều kiện bảo quản tự động và tổ chức sắp xếp thuốc theo phân khu hợp lý.

**Xếp hạng**

TTYT Thanh Ba được xếp hạng top 3 đơn vị dẫn đầu toàn tỉnh Phú Thọ về công tác bảo quản dược phẩm chuẩn GSP năm 2024.
    `
  },
  { id: 4, title: 'Cập nhật Dược thư Quốc gia phiên bản mới nhất 2024', date: '28 tháng 2, 2024', category: 'Chuyên môn nghiệp vụ', summary: 'Khoa Dược đã cập nhật và phổ biến nội dung chính của Dược thư Quốc gia phiên bản 2024 đến toàn thể cán bộ.', image: `${import.meta.env.BASE_URL}images/news_training.png`,
    content: `
Ngày 28/2/2024, Khoa Dược đã tổ chức buổi phổ biến nội dung cập nhật của Dược thư Quốc gia Việt Nam phiên bản 2024 đến toàn thể cán bộ y tế trong đơn vị.

**Nội dung cập nhật chính**

Phiên bản 2024 bổ sung và điều chỉnh thông tin cho hơn 120 hoạt chất, tập trung vào:
- Cập nhật chống chỉ định và thận trọng của nhóm kháng sinh Fluoroquinolone
- Bổ sung hướng dẫn sử dụng thuốc cho đối tượng phụ nữ mang thai và cho con bú
- Điều chỉnh liều dùng cho bệnh nhân suy thận, suy gan
- Thêm thông tin về các thuốc mới được cấp phép lưu hành

**Triển khai tại TTYT**

Khoa Dược đã cập nhật toàn bộ cơ sở dữ liệu tra cứu thuốc nội bộ theo Dược thư mới và phân phối tài liệu tóm tắt đến từng khoa phòng lâm sàng.
    `
  },
  { id: 5, title: 'Ký kết hợp đồng cung ứng thuốc đấu thầu năm 2024', date: '20 tháng 2, 2024', category: 'Văn bản pháp luật', summary: 'TTYT Thanh Ba hoàn thành đấu thầu thuốc năm 2024 với danh mục thuốc đầy đủ 500+ hoạt chất đảm bảo cho công tác khám chữa bệnh.', image: `${import.meta.env.BASE_URL}images/banner_warehouse.png`,
    content: `
TTYT Khu vực Thanh Ba đã hoàn thành công tác đấu thầu mua sắm thuốc năm 2024, ký kết hợp đồng cung ứng với các nhà thầu được lựa chọn.

**Kết quả đấu thầu**

Tổng danh mục trúng thầu gồm hơn 500 hoạt chất với đầy đủ các nhóm thuốc thiết yếu phục vụ công tác khám chữa bệnh. Tổng giá trị hợp đồng đảm bảo cung ứng đủ thuốc cho cả năm 2024.

**Ưu tiên thuốc sản xuất trong nước**

Theo chỉ đạo của Bộ Y tế, danh mục đấu thầu ưu tiên thuốc sản xuất trong nước đạt tiêu chuẩn GMP-WHO, chiếm 65% tổng giá trị gói thầu. Đây là bước tiến quan trọng trong việc đảm bảo an ninh dược phẩm.

**Cam kết chất lượng**

Tất cả thuốc trúng thầu đều đạt tiêu chuẩn chất lượng theo quy định, có đầy đủ hồ sơ đăng ký lưu hành và được kiểm tra bởi cơ quan quản lý.
    `
  },
  { id: 6, title: 'Tập huấn quy trình báo cáo phản ứng có hại (ADR)', date: '15 tháng 2, 2024', category: 'Tập huấn & Đào tạo', summary: 'Toàn thể cán bộ y tế được tập huấn về nhận diện, xử trí và báo cáo phản ứng có hại của thuốc theo quy định mới.', image: `${import.meta.env.BASE_URL}images/news_training.png`,
    content: `
Ngày 15/2/2024, Khoa Dược tổ chức buổi tập huấn chuyên đề "Nhận diện, xử trí và báo cáo phản ứng có hại của thuốc (ADR)" cho toàn thể cán bộ y tế tại TTYT Khu vực Thanh Ba.

**Nội dung tập huấn**

Buổi tập huấn do ThS.DS Trần Thị B – Phó Trưởng Khoa Dược trực tiếp giảng dạy, bao gồm:
- Khái niệm và phân loại phản ứng có hại của thuốc
- Cách nhận diện ADR trong thực hành lâm sàng
- Quy trình xử trí cấp cứu khi xảy ra ADR nghiêm trọng
- Hướng dẫn điền mẫu báo cáo ADR theo Thông tư 23/2021/TT-BYT

**Kết quả**

100% cán bộ y tế tham dự đều hoàn thành bài kiểm tra sau tập huấn. Khoa Dược đã phân phối bộ tài liệu hướng dẫn nhanh đến từng khoa phòng để hỗ trợ việc nhận diện và báo cáo ADR kịp thời.
    `
  },
  { id: 7, title: 'Triển khai chương trình quản lý sử dụng kháng sinh (ASP) tại TTYT', date: '10 tháng 2, 2024', category: 'Chuyên môn nghiệp vụ', summary: 'Khoa Dược phối hợp khoa Nội, khoa Ngoại xây dựng và triển khai Chương trình Quản lý sử dụng Kháng sinh nhằm giảm tình trạng đề kháng kháng sinh.', image: `${import.meta.env.BASE_URL}images/news_dispensing.png`,
    content: `
Từ tháng 2/2024, TTYT Khu vực Thanh Ba chính thức triển khai Chương trình Quản lý sử dụng Kháng sinh (Antimicrobial Stewardship Program – ASP) theo hướng dẫn của Bộ Y tế.

**Mục tiêu chương trình**

Chương trình ASP nhằm:
- Tối ưu hóa việc kê đơn kháng sinh: đúng thuốc, đúng liều, đúng thời gian
- Giảm tỷ lệ đề kháng kháng sinh tại đơn vị
- Giảm chi phí sử dụng kháng sinh không cần thiết
- Nâng cao nhận thức của cán bộ y tế về sử dụng kháng sinh hợp lý

**Quy trình triển khai**

Dược sĩ lâm sàng sẽ duyệt tất cả đơn kháng sinh hạn chế và đặc biệt trước khi cấp phát. Hội đồng thuốc và điều trị sẽ họp đánh giá hàng tháng để phân tích xu hướng sử dụng kháng sinh.

**Kết quả bước đầu**

Sau 1 tháng triển khai, tỷ lệ sử dụng kháng sinh phổ rộng giảm 12% so với cùng kỳ năm trước. Đây là tín hiệu tích cực cho thấy hiệu quả của chương trình.
    `
  },
  { id: 8, title: 'Kiểm kê thuốc và vật tư y tế quý I/2024', date: '1 tháng 2, 2024', category: 'Hoạt động khoa', summary: 'Khoa Dược hoàn thành kiểm kê toàn bộ kho thuốc quý I/2024. Tổng giá trị tồn kho đảm bảo cung ứng đủ cho 3 tháng hoạt động.', image: `${import.meta.env.BASE_URL}images/banner_warehouse.png`,
    content: `
Ngày 1/2/2024, Khoa Dược phối hợp phòng Tài chính – Kế toán hoàn thành công tác kiểm kê thuốc và vật tư y tế tiêu hao quý I/2024.

**Kết quả kiểm kê**

- Tổng số mặt hàng trong kho: 523 loại thuốc và 187 loại vật tư y tế
- Tỷ lệ chênh lệch giữa sổ sách và thực tế: 0.02% (trong giới hạn cho phép)
- Không phát hiện thuốc hết hạn sử dụng còn tồn kho
- 100% thuốc kiểm soát đặc biệt (gây nghiện, hướng thần) khớp số liệu chính xác

**Đánh giá chất lượng bảo quản**

Toàn bộ kho thuốc đảm bảo điều kiện bảo quản theo tiêu chuẩn GSP: nhiệt độ 15-25°C, độ ẩm dưới 75%, hệ thống thông gió hoạt động tốt. Khu vực bảo quản lạnh (2-8°C) vận hành ổn định với hệ thống theo dõi nhiệt độ 24/7.
    `
  },
  { id: 9, title: 'Tiếp nhận và bảo quản vaccine phòng COVID-19 đợt mới', date: '25 tháng 1, 2024', category: 'Hoạt động khoa', summary: 'Khoa Dược tiếp nhận lô vaccine phòng COVID-19 mới, đảm bảo dây chuyền lạnh 2-8°C theo đúng quy trình bảo quản nghiêm ngặt.', image: '/images/banner_warehouse.png',
    content: `
Ngày 25/1/2024, Khoa Dược – TTYT Khu vực Thanh Ba tiếp nhận lô vaccine phòng COVID-19 theo phân bổ của Sở Y tế Phú Thọ.

**Quy trình tiếp nhận**

Lô vaccine được vận chuyển bằng xe lạnh chuyên dụng với hệ thống theo dõi nhiệt độ liên tục. Ngay khi tiếp nhận, Khoa Dược đã kiểm tra nhiệt độ vận chuyển (2-8°C), số lô, hạn sử dụng và tình trạng bao bì.

**Bảo quản tại kho**

Vaccine được bảo quản trong tủ lạnh chuyên dụng tại kho Khoa Dược với hệ thống giám sát nhiệt độ tự động 24/7. Mọi biến động nhiệt độ đều được ghi nhận và cảnh báo tức thì.

**Triển khai tiêm chủng**

Phối hợp chặt chẽ với khoa Kiểm soát nhiễm khuẩn để lên kế hoạch tiêm chủng cho các đối tượng ưu tiên theo chỉ đạo của ngành Y tế.
    `
  },
  { id: 10, title: 'Hội nghị giao ban Dược bệnh viện toàn tỉnh Phú Thọ', date: '18 tháng 1, 2024', category: 'Hoạt động khoa', summary: 'Trưởng Khoa Dược tham dự và trình bày báo cáo kinh nghiệm triển khai hoạt động Dược lâm sàng tại Hội nghị giao ban Dược bệnh viện toàn tỉnh.', image: '/images/news_training.png',
    content: `
Ngày 18/1/2024, DSCK1. Nguyễn Văn A – Trưởng Khoa Dược TTYT Khu vực Thanh Ba tham dự Hội nghị giao ban Dược bệnh viện toàn tỉnh Phú Thọ do Sở Y tế tổ chức.

**Nội dung hội nghị**

Hội nghị tập trung đánh giá kết quả hoạt động Dược bệnh viện năm 2023 và triển khai kế hoạch năm 2024, bao gồm:
- Tổng kết công tác đấu thầu, cung ứng thuốc
- Đánh giá triển khai hoạt động Dược lâm sàng tại các cơ sở
- Chia sẻ kinh nghiệm quản lý kho thuốc chuẩn GSP
- Phương hướng hoạt động năm 2024

**Báo cáo của TTYT Thanh Ba**

DSCK1. Nguyễn Văn A trình bày báo cáo "Kinh nghiệm triển khai Dược lâm sàng tại bệnh viện hạng II" được đánh giá cao bởi Ban tổ chức và các đại biểu tham dự. Mô hình Dược lâm sàng của TTYT Thanh Ba được khuyến nghị nhân rộng toàn tỉnh.
    `
  },
  { id: 11, title: 'Thông tư 07/2024/TT-BYT: Quy định mới về kê đơn thuốc', date: '10 tháng 1, 2024', category: 'Văn bản pháp luật', summary: 'Bộ Y tế ban hành Thông tư 07/2024 sửa đổi quy định về kê đơn thuốc ngoại trú. Khoa Dược phổ biến nội dung chính đến toàn thể cán bộ y tế.', image: '/images/news_inspection.png',
    content: `
Bộ Y tế vừa ban hành Thông tư 07/2024/TT-BYT sửa đổi, bổ sung một số điều của Thông tư 52/2017/TT-BYT về đơn thuốc và kê đơn thuốc ngoại trú.

**Nội dung thay đổi chính**

- Bổ sung quy định kê đơn thuốc điện tử và chữ ký số
- Sửa đổi thời gian kê đơn thuốc ngoại trú tối đa 30 ngày cho bệnh mạn tính
- Bổ sung danh mục thuốc phải kê đơn riêng biệt
- Quy định mới về ghi nhận dị ứng thuốc trong đơn kê

**Triển khai tại TTYT Thanh Ba**

Khoa Dược đã tổ chức buổi phổ biến nội dung Thông tư mới cho toàn thể bác sĩ kê đơn vào ngày 15/1/2024. Đồng thời cập nhật phần mềm kê đơn nội bộ để phù hợp với quy định mới.

**Thời gian áp dụng**

Thông tư có hiệu lực từ ngày 1/3/2024. Khoa Dược sẽ giám sát và hỗ trợ các khoa phòng trong quá trình chuyển đổi.
    `
  },
  { id: 12, title: 'Báo cáo tổng kết hoạt động Dược lâm sàng năm 2023', date: '5 tháng 1, 2024', category: 'Chuyên môn nghiệp vụ', summary: 'Năm 2023, Khoa Dược đã duyệt hơn 14.000 đơn thuốc nội trú, phát hiện 320 trường hợp tương tác thuốc cần can thiệp và báo cáo 15 ca ADR.', image: '/images/news_dispensing.png',
    content: `
Ngày 5/1/2024, Khoa Dược trình bày Báo cáo tổng kết hoạt động Dược lâm sàng năm 2023 tại Hội nghị tổng kết của TTYT Khu vực Thanh Ba.

**Kết quả hoạt động năm 2023**

- Tổng số đơn thuốc nội trú được duyệt: 14.256 đơn
- Số trường hợp tương tác thuốc phát hiện: 320 ca (can thiệp thành công 98%)
- Số báo cáo ADR gửi Trung tâm DI&ADR Quốc gia: 15 báo cáo
- Tỷ lệ kê đơn ngoại trú hợp lý: 97.3%
- Số buổi tập huấn tổ chức: 12 buổi

**Điểm nổi bật**

Hoạt động tư vấn sử dụng thuốc cho bệnh nhân ngoại trú tăng 35% so với năm 2022. Đặc biệt, chương trình giám sát sử dụng kháng sinh đã góp phần giảm 18% chi phí kháng sinh toàn viện.

**Kế hoạch năm 2024**

Tiếp tục mở rộng hoạt động Dược lâm sàng sang các khoa Nhi, Sản và tăng cường giám sát sử dụng kháng sinh theo chương trình ASP quốc gia.
    `
  },
];

function renderContent(content: string) {
  return content.split('\n').map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <h3 key={i} className="text-gray-900 font-black text-xl mt-8 mb-4">{line.slice(2, -2)}</h3>;
    }
    if (line.startsWith('- ')) {
      return <li key={i} className="text-gray-700 font-medium text-base ml-6 mb-2 list-disc">{line.slice(2)}</li>;
    }
    if (line.trim()) {
      return <p key={i} className="text-gray-700 font-medium text-base leading-relaxed mb-4">{line}</p>;
    }
    return null;
  });
}

export default function TinTucDetail() {
  const { id } = useParams();
  const article = allNews.find(n => n.id === Number(id));

  if (!article) {
    return (
      <div className="min-h-screen bg-white font-sans">
        <Header />
        <div className="pt-[160px] text-center py-20">
          <h1 className="font-serif text-gray-900 text-4xl mb-4">Bài viết không tồn tại</h1>
          <Link to="/tin-tuc" className="text-green-700 font-bold flex items-center gap-2 justify-center">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách tin tức
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const others = allNews.filter(n => n.id !== article.id).slice(0, 2);

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />

      {/* Hero */}
      <section className="relative pt-[120px] min-h-[420px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.2) 100%)' }} />
        </div>
        <div className="relative max-w-4xl mx-auto px-8 md:px-16 pb-14 pt-10 w-full">
          <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Tin tức', href: '/tin-tuc' }, { label: article.title }]} />
          <div className="flex items-center gap-3 mt-5 mb-4">
            <span className="flex items-center gap-1.5 text-[11px] text-green-300 font-bold uppercase tracking-widest">
              <Calendar className="w-3 h-3" />{article.date}
            </span>
            <span className="flex items-center gap-1 text-[11px] bg-white/20 text-white font-bold px-3 py-1 rounded-full backdrop-blur-sm">
              <Tag className="w-2.5 h-2.5" />{article.category}
            </span>
          </div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="font-serif text-white leading-tight" style={{ fontSize: 'clamp(1.8rem,4vw,3rem)' }}>
            {article.title}
          </motion.h1>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-8 md:px-16">
          <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-100">
            <Link to="/tin-tuc" className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-green-700 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
            </Link>
            <button className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
              <Share2 className="w-4 h-4" /> Chia sẻ
            </button>
          </div>

          <div className="prose-custom">
            <p className="text-gray-800 font-semibold text-lg leading-relaxed mb-8 border-l-4 border-green-500 pl-5 bg-green-50 py-4 pr-4 rounded-r-xl">
              {article.summary}
            </p>
            <div>{renderContent(article.content)}</div>
          </div>
        </div>
      </section>

      {/* Related */}
      {others.length > 0 && (
        <section className="py-16 bg-gray-50 border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-8 md:px-16">
            <h2 className="font-serif text-gray-900 text-2xl md:text-3xl mb-8 font-bold">Bài viết <em className="text-green-700">liên quan</em></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {others.map(n => (
                <Link key={n.id} to={`/tin-tuc/${n.id}`}
                  className="group flex gap-4 bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all">
                  <div className="w-28 h-28 shrink-0 overflow-hidden">
                    <img src={n.image} alt={n.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex-1 p-4">
                    <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest mb-2">{n.date}</p>
                    <h3 className="font-serif text-gray-900 text-sm font-bold leading-snug group-hover:text-green-700 transition-colors line-clamp-3">{n.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
