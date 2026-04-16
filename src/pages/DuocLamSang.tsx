import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Header, Footer, Breadcrumb } from '../components/SharedLayout';
import { ArrowRight, AlertTriangle, Activity, Pill, BookOpen, Phone, ClipboardList, ChevronRight } from 'lucide-react';

const services = [
  {
    id: 'tu-van',
    icon: <ClipboardList className="w-7 h-7" />,
    title: 'Tư vấn phác đồ điều trị',
    short: 'Hỗ trợ bác sĩ lựa chọn phác đồ tối ưu cho từng bệnh nhân',
    desc: 'Dược sĩ lâm sàng phối hợp chặt chẽ với bác sĩ để xây dựng và hiệu chỉnh phác đồ điều trị cá thể hóa, đảm bảo phù hợp với tình trạng bệnh nhân, chức năng thận-gan và các bệnh đồng mắc.',
    color: 'from-blue-600 to-blue-800',
    bg: 'bg-blue-50 border-blue-100',
    tag: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'giam-sat',
    icon: <Activity className="w-7 h-7" />,
    title: 'Giám sát sử dụng thuốc',
    short: 'Theo dõi liên tục việc sử dụng thuốc trên bệnh nhân nội trú',
    desc: 'Thực hiện duyệt đơn thuốc hàng ngày, phát hiện và xử lý các vấn đề liên quan đến thuốc (DRP), tư vấn điều chỉnh liều lượng theo đặc điểm sinh lý bệnh nhân.',
    color: 'from-green-600 to-green-800',
    bg: 'bg-green-50 border-green-100',
    tag: 'bg-green-100 text-green-700',
  },
  {
    id: 'tuong-tac',
    icon: <Pill className="w-7 h-7" />,
    title: 'Tương tác thuốc',
    short: 'Cảnh báo và xử lý các tương tác thuốc có hại',
    desc: 'Sử dụng các công cụ tra cứu chuyên nghiệp để phát hiện tương tác thuốc-thuốc, thuốc-thức ăn, thuốc-bệnh lý; đưa ra khuyến nghị xử trí kịp thời và an toàn.',
    color: 'from-orange-500 to-orange-700',
    bg: 'bg-orange-50 border-orange-100',
    tag: 'bg-orange-100 text-orange-700',
  },
  {
    id: 'adr',
    icon: <AlertTriangle className="w-7 h-7" />,
    title: 'Phản ứng có hại (ADR)',
    short: 'Phát hiện, báo cáo và xử lý phản ứng có hại của thuốc',
    desc: 'Triển khai hệ thống giám sát ADR, thu thập báo cáo từ cán bộ y tế, phân tích nguyên nhân và gửi báo cáo theo quy định của Trung tâm DI&ADR Quốc gia.',
    color: 'from-red-600 to-red-800',
    bg: 'bg-red-50 border-red-100',
    tag: 'bg-red-100 text-red-700',
  },
];

const clinicalStats = [
  { n: '1,200+', l: 'Đơn thuốc duyệt/tháng', c: 'text-blue-700' },
  { n: '98%', l: 'Tỷ lệ kê đơn hợp lý', c: 'text-green-700' },
  { n: '24/7', l: 'Hỗ trợ cấp cứu', c: 'text-red-600' },
  { n: '100%', l: 'Báo cáo ADR đúng hạn', c: 'text-purple-700' },
];

export default function DuocLamSang() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />

      {/* Hero */}
      <section className="relative pt-[120px] min-h-[380px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={`${import.meta.env.BASE_URL}images/news_dispensing.png`} alt="Dược lâm sàng" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,rgba(15,23,42,0.85) 0%,rgba(16,163,74,0.4) 100%)' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-8 md:px-16 pb-16 pt-16 w-full">
          <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Dược lâm sàng' }]} />
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="font-serif text-white mt-4 leading-tight" style={{ fontSize: 'clamp(2.2rem,5vw,4rem)' }}>
            Dược <em style={{ background: 'linear-gradient(90deg,#86efac,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Lâm sàng</em>
          </motion.h1>
          <p className="text-white/85 text-base md:text-lg mt-3 max-w-xl font-sans font-semibold">
            Tư vấn sử dụng thuốc an toàn, hợp lý — đồng hành cùng bác sĩ và người bệnh
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {clinicalStats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="text-center p-6 rounded-2xl bg-gray-50 border border-gray-100">
                <p className={`font-black text-3xl md:text-4xl ${s.c}`}>{s.n}</p>
                <p className="text-gray-600 text-xs uppercase tracking-wide mt-2 font-semibold">{s.l}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-200 mb-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-green-700 font-bold">Hoạt động chuyên môn</p>
            </div>
            <h2 className="font-serif text-gray-900 text-3xl md:text-5xl mb-6">4 lĩnh vực <em className="text-green-700">cốt lõi</em></h2>
            <p className="text-gray-600 text-base leading-relaxed font-medium">
              Bộ phận Dược lâm sàng của Khoa thực hiện các hoạt động chuyên môn sâu, đảm bảo việc sử dụng thuốc tại
              TTYT Thanh Ba đạt tiêu chuẩn an toàn – hợp lý – hiệu quả theo hướng dẫn của Bộ Y tế.
            </p>
          </div>

          <div className="space-y-8">
            {services.map((s, i) => (
              <motion.div key={s.id} id={s.id}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
                className={`rounded-2xl border p-8 md:p-10 ${s.bg} hover:shadow-xl transition-shadow`}>
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shrink-0 shadow-lg`}>
                    {s.icon}
                  </div>
                  <div className="flex-1">
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full ${s.tag} mb-3 inline-block`}>
                      Dược lâm sàng
                    </span>
                    <h3 className="font-serif text-gray-900 text-2xl md:text-3xl mb-3 font-bold">{s.title}</h3>
                    <p className="text-gray-800 font-semibold text-base mb-4">{s.short}</p>
                    <p className="text-gray-600 text-sm leading-relaxed font-medium">{s.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tham khảo tài liệu */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 mb-6">
                <p className="text-[11px] uppercase tracking-[0.2em] text-blue-700 font-bold">Tài liệu tham khảo</p>
              </div>
              <h2 className="font-serif text-gray-900 text-3xl md:text-4xl mb-6">Nguồn dữ liệu <em className="text-blue-700">đáng tin cậy</em></h2>
              <p className="text-gray-600 text-base leading-relaxed font-medium mb-6">
                Đội ngũ dược sĩ lâm sàng sử dụng các nguồn tài liệu quốc tế và trong nước được cập nhật thường xuyên:
              </p>
              {[
                'Dược thư Quốc gia Việt Nam (DTNQG)',
                'WHO Model Formulary & Essential Medicines List',
                'Stockley\'s Drug Interactions (Phiên bản cập nhật)',
                'PubMed / UpToDate cho các ca lâm sàng phức tạp',
                'Hướng dẫn chẩn đoán và điều trị của Bộ Y tế',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                  <ChevronRight className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="text-gray-700 font-semibold text-sm">{item}</span>
                </div>
              ))}
            </div>
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img src={`${import.meta.env.BASE_URL}images/news_training.png`} alt="Tài liệu dược lâm sàng" className="w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-800 to-green-700 text-center">
        <div className="max-w-3xl mx-auto px-8">
          <BookOpen className="w-12 h-12 text-white/60 mx-auto mb-6" />
          <h2 className="font-serif text-white text-3xl md:text-4xl mb-5">Cần tư vấn dược lâm sàng?</h2>
          <p className="text-white/80 text-base mb-10 font-sans font-medium">Liên hệ trực tiếp với đội ngũ dược sĩ lâm sàng qua các kênh hỗ trợ</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/lien-he" className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm bg-white text-blue-700 hover:bg-gray-100 transition-colors shadow-2xl">
              <Phone className="w-4 h-4" /> Liên hệ ngay
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
