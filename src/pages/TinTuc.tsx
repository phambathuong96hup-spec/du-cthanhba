import React from 'react';
import { motion } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { Header, Footer, Breadcrumb } from '../components/SharedLayout';
import { ArrowRight, Calendar, Tag } from 'lucide-react';

const allNews = [
  { id: 1, title: 'Hội nghị tập huấn sử dụng thuốc an toàn, hợp lý năm 2024', date: '15 tháng 3, 2024', category: 'dao-tao', summary: 'Khoa Dược tổ chức buổi tập huấn cho đội ngũ y bác sĩ về các quy định mới trong kê đơn và sử dụng thuốc an toàn theo hướng dẫn của Bộ Y tế.', image: `${import.meta.env.BASE_URL}images/news_training.png` },
  { id: 2, title: 'Triển khai quy trình cấp phát thuốc nội trú mới', date: '10 tháng 3, 2024', category: 'hoat-dong', summary: 'Nhằm nâng cao hiệu quả và giảm thời gian chờ đợi, Khoa Dược áp dụng quy trình số hóa trong cấp phát thuốc nội trú.', image: `${import.meta.env.BASE_URL}images/news_dispensing.png` },
  { id: 3, title: 'Đoàn kiểm tra Sở Y tế đánh giá cao công tác bảo quản thuốc', date: '5 tháng 3, 2024', category: 'hoat-dong', summary: 'Hệ thống kho thuốc đạt chuẩn GSP của TTYT Thanh Ba được đánh giá là một trong những đơn vị dẫn đầu khu vực Phú Thọ.', image: `${import.meta.env.BASE_URL}images/news_inspection.png` },
  { id: 4, title: 'Cập nhật Dược thư Quốc gia phiên bản mới nhất 2024', date: '28 tháng 2, 2024', category: 'chuyen-mon', summary: 'Khoa Dược đã cập nhật và phổ biến nội dung chính của Dược thư Quốc gia phiên bản 2024 đến toàn thể cán bộ.', image: `${import.meta.env.BASE_URL}images/news_training.png` },
  { id: 5, title: 'Ký kết hợp đồng cung ứng thuốc đấu thầu năm 2024', date: '20 tháng 2, 2024', category: 'van-ban', summary: 'TTYT Thanh Ba hoàn thành đấu thầu thuốc năm 2024 với danh mục thuốc đầy đủ 500+ hoạt chất đảm bảo cho công tác khám chữa bệnh.', image: `${import.meta.env.BASE_URL}images/banner_warehouse.png` },
  { id: 6, title: 'Tập huấn quy trình báo cáo phản ứng có hại (ADR)', date: '15 tháng 2, 2024', category: 'dao-tao', summary: 'Toàn thể cán bộ y tế được tập huấn về nhận diện, xử trí và báo cáo phản ứng có hại của thuốc theo quy định mới.', image: `${import.meta.env.BASE_URL}images/news_training.png` },
  { id: 7, title: 'Triển khai chương trình quản lý sử dụng kháng sinh (ASP) tại TTYT', date: '10 tháng 2, 2024', category: 'chuyen-mon', summary: 'Khoa Dược phối hợp khoa Nội, khoa Ngoại xây dựng và triển khai Chương trình Quản lý sử dụng Kháng sinh nhằm giảm tình trạng đề kháng kháng sinh.', image: `${import.meta.env.BASE_URL}images/news_dispensing.png` },
  { id: 8, title: 'Kiểm kê thuốc và vật tư y tế quý I/2024', date: '1 tháng 2, 2024', category: 'hoat-dong', summary: 'Khoa Dược hoàn thành kiểm kê toàn bộ kho thuốc quý I/2024. Tổng giá trị tồn kho đảm bảo cung ứng đủ cho 3 tháng hoạt động.', image: `${import.meta.env.BASE_URL}images/banner_warehouse.png` },
  { id: 9, title: 'Tiếp nhận và bảo quản vaccine phòng COVID-19 đợt mới', date: '25 tháng 1, 2024', category: 'hoat-dong', summary: 'Khoa Dược tiếp nhận lô vaccine phòng COVID-19 mới, đảm bảo dây chuyền lạnh 2-8°C theo đúng quy trình bảo quản nghiêm ngặt.', image: `${import.meta.env.BASE_URL}images/banner_warehouse.png` },
  { id: 10, title: 'Hội nghị giao ban Dược bệnh viện toàn tỉnh Phú Thọ', date: '18 tháng 1, 2024', category: 'hoat-dong', summary: 'Trưởng Khoa Dược tham dự và trình bày báo cáo kinh nghiệm triển khai hoạt động Dược lâm sàng tại Hội nghị giao ban Dược bệnh viện toàn tỉnh.', image: `${import.meta.env.BASE_URL}images/news_training.png` },
  { id: 11, title: 'Thông tư 07/2024/TT-BYT: Quy định mới về kê đơn thuốc', date: '10 tháng 1, 2024', category: 'van-ban', summary: 'Bộ Y tế ban hành Thông tư 07/2024 sửa đổi quy định về kê đơn thuốc ngoại trú. Khoa Dược phổ biến nội dung chính đến toàn thể cán bộ y tế.', image: `${import.meta.env.BASE_URL}images/news_inspection.png` },
  { id: 12, title: 'Báo cáo tổng kết hoạt động Dược lâm sàng năm 2023', date: '5 tháng 1, 2024', category: 'chuyen-mon', summary: 'Năm 2023, Khoa Dược đã duyệt hơn 14.000 đơn thuốc nội trú, phát hiện 320 trường hợp tương tác thuốc cần can thiệp và báo cáo 15 ca ADR.', image: `${import.meta.env.BASE_URL}images/news_dispensing.png` },
];

const cats = [
  { id: '', label: 'Tất cả' },
  { id: 'hoat-dong', label: 'Hoạt động khoa' },
  { id: 'van-ban', label: 'Văn bản pháp luật' },
  { id: 'chuyen-mon', label: 'Chuyên môn nghiệp vụ' },
  { id: 'dao-tao', label: 'Tập huấn & Đào tạo' },
];

export default function TinTuc() {
  const [params] = useSearchParams();
  const activeCat = params.get('cat') || '';
  const filtered = activeCat ? allNews.filter(n => n.category === activeCat) : allNews;

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />

      {/* Hero */}
      <section className="relative pt-[120px] min-h-[300px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={`${import.meta.env.BASE_URL}images/news_training.png`} alt="Tin tức" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,rgba(15,23,42,0.86) 0%,rgba(29,78,216,0.45) 100%)' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-8 md:px-16 pb-14 pt-14 w-full">
          <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Tin tức' }]} />
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="font-serif text-white mt-4" style={{ fontSize: 'clamp(2.2rem,5vw,4rem)' }}>
            Tin tức <em style={{ background: 'linear-gradient(90deg,#86efac,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>& Sự kiện</em>
          </motion.h1>
        </div>
      </section>

      {/* Filter tabs */}
      <section className="bg-white border-b border-gray-100 py-5 sticky top-[120px] z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="flex gap-2 flex-wrap">
            {cats.map(c => (
              <Link key={c.id} to={c.id ? `/tin-tuc?cat=${c.id}` : '/tin-tuc'}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeCat === c.id
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* News Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filtered.map((n, i) => (
              <motion.article key={n.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100">
                <Link to={`/tin-tuc/${n.id}`}>
                  <div className="overflow-hidden h-52">
                    <img src={n.image} alt={n.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="flex items-center gap-1.5 text-[10px] text-green-700 font-bold uppercase tracking-widest">
                        <Calendar className="w-3 h-3" />{n.date}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                        <Tag className="w-2.5 h-2.5" />{cats.find(c => c.id === n.category)?.label || 'Tin tức'}
                      </span>
                    </div>
                    <h2 className="font-serif text-gray-900 text-lg font-bold leading-snug mb-3 group-hover:text-green-700 transition-colors line-clamp-2">{n.title}</h2>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3 font-medium">{n.summary}</p>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-green-700 group-hover:gap-3 transition-all">
                      Đọc tiếp <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg font-medium">Chưa có bài viết nào trong mục này.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
