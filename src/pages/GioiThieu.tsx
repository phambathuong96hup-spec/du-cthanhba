import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Header, Footer, Breadcrumb } from '../components/SharedLayout';
import { ArrowRight, Truck, Stethoscope, ShieldCheck, FlaskConical, Microscope, BookOpen, Users, Award, Clock } from 'lucide-react';

const features = [
  { title: 'Tư vấn trong quá trình xây dựng danh mục thuốc', description: 'Thiết lập các tiêu chí lựa chọn thuốc, Tiếp nhận và xử lý các thông tin liên quan đến thuốc và phân tích kinh tế dược.', icon: <Truck className="w-6 h-6" /> },
  { title: 'Tư vấn, giám sát việc kê đơn và sử dụng thuốc', description: 'Theo dõi việc kê đơn và sử dụng thuốc, phát hiện sai sót, hội chẩn lâm sàng.', icon: <Stethoscope className="w-6 h-6" /> },
  { title: 'Thông tin và hướng dẫn sử dụng thuốc', description: 'Cung cấp, cập nhật thông tin về thuốc cho cán bộ y tế và hướng dẫn cho người bệnh về cách sử dụng thuốc.', icon: <ShieldCheck className="w-6 h-6" /> },
  { title: 'Xây dựng các quy trình và hướng dẫn chuyên môn', description: 'Chủ trì hoặc phối hợp với các khoa lâm sàng để soạn thảo các tài liệu, quy trình chuẩn.', icon: <FlaskConical className="w-6 h-6" /> },
  { title: 'Thực hiện công tác cảnh giác dược (Nhiệm vụ 5 & 6)', description: 'Trực tiếp theo dõi, giám sát, thu thập và báo cáo các phản ứng có hại của thuốc (ADR) xảy ra tại cơ sở. Phân tích và đề xuất giải pháp.', icon: <Microscope className="w-6 h-6" /> },
  { title: 'Nghiên cứu khoa học và đào tạo', description: 'Tham gia nghiên cứu thử nghiệm lâm sàng, thử nghiệm tương đương sinh học của thuốc tại cơ sở khám bệnh, chữa bệnh và các nghiên cứu khoa học khác về sử dụng thuốc hợp lý, an toàn và hiệu quả.', icon: <BookOpen className="w-6 h-6" /> },
];

const leaders = [
  { name: 'DSCKI. Nguyễn Thị Hương Giang', role: 'Trưởng Khoa Dược', exp: '20 năm kinh nghiệm', desc: 'Phụ trách chỉ đạo chuyên môn toàn khoa, triển khai quy trình GSP và đào tạo nhân lực.', img: `${import.meta.env.BASE_URL}images/leadership_doctor.png` },
  { name: 'DSDH. Trần Thị Huyền Trang', role: 'Phó Trưởng Khoa', exp: '15 năm kinh nghiệm', desc: 'Chuyên sâu Thống kê & nghiệp vụ dược.', img: `${import.meta.env.BASE_URL}images/phokhoa.png` },
];

export default function GioiThieu() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />

      {/* Hero */}
      <section className="relative pt-[120px] pb-0 min-h-[380px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={`${import.meta.env.BASE_URL}images/about_team.png`} alt="Đội ngũ Khoa Dược" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,rgba(15,23,42,0.82) 0%,rgba(22,163,74,0.45) 100%)' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-8 md:px-16 pb-16 pt-16 w-full">
          <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Giới thiệu' }]} />
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="font-serif text-white mt-4 leading-tight" style={{ fontSize: 'clamp(2.2rem,5vw,4rem)' }}>
            Giới thiệu <em style={{ background: 'linear-gradient(90deg,#86efac,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Khoa Dược</em>
          </motion.h1>
          <p className="text-white/80 text-base md:text-lg mt-3 max-w-xl font-sans font-medium">
            Đơn vị nòng cốt trong quản lý, cung ứng và tư vấn sử dụng thuốc tại TTYT Khu vực Thanh Ba
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { n: '20+', l: 'Năm hoạt động', c: 'text-blue-700', icon: <Clock className="w-5 h-5" /> },
              { n: '15+', l: 'Dược sĩ chuyên nghiệp', c: 'text-green-700', icon: <Users className="w-5 h-5" /> },
              { n: '500+', l: 'Loại thuốc quản lý', c: 'text-purple-700', icon: <FlaskConical className="w-5 h-5" /> },
              { n: 'GSP', l: 'Tiêu chuẩn kho đạt', c: 'text-red-600', icon: <Award className="w-5 h-5" /> },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="text-center p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 ${i === 0 ? 'bg-blue-100 text-blue-600' : i === 1 ? 'bg-green-100 text-green-600' : i === 2 ? 'bg-purple-100 text-purple-600' : 'bg-red-100 text-red-600'}`}>{s.icon}</div>
                <p className={`font-black text-3xl md:text-4xl ${s.c}`}>{s.n}</p>
                <p className="text-gray-600 text-xs uppercase tracking-wide mt-2 font-semibold">{s.l}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lịch sử */}
      <section id="lich-su" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-200 mb-6">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-[11px] uppercase tracking-[0.2em] text-green-700 font-bold">Lịch sử hình thành</p>
              </div>
              <h2 className="font-serif text-gray-900 text-3xl md:text-4xl leading-tight mb-6">
                Hơn <span className="text-green-700 font-black">20 năm</span> xây dựng<br />và trưởng thành
              </h2>
              <p className="text-gray-700 leading-relaxed mb-5 text-base font-medium">
                Khoa Dược – TTYT Khu vực Thanh Ba được thành lập từ những ngày đầu hoạt động của Trung tâm Y tế, là đơn vị
                chuyên trách về quản lý dược phẩm và tư vấn sử dụng thuốc hợp lý, an toàn.
              </p>
              <p className="text-gray-700 leading-relaxed text-base font-medium">
                Trải qua nhiều giai đoạn phát triển, Khoa không ngừng nâng cao năng lực đội ngũ, chuẩn hóa quy trình
                và đầu tư cơ sở vật chất để đáp ứng yêu cầu ngày càng cao của công tác khám chữa bệnh.
              </p>
            </div>
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img src={`${import.meta.env.BASE_URL}images/hero_pharmacy.png`} alt="Lịch sử Khoa Dược" className="w-full object-cover max-h-[480px]" />
            </div>
          </div>
        </div>
      </section>

      {/* Tôn chỉ - Mục đích */}
      <section id="ton-chi" className="py-20" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e3a2f 50%,#0f1f3d 100%)' }}>
        <div className="max-w-7xl mx-auto px-8 md:px-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 mb-8">
            <p className="text-[11px] uppercase tracking-[0.2em] text-green-300 font-bold">Tôn chỉ – Mục đích</p>
          </div>
          <blockquote className="font-serif text-white text-2xl md:text-4xl leading-relaxed mb-8 max-w-3xl mx-auto">
            <em>"Đảm bảo mỗi liều thuốc đến tay người bệnh là</em>
            <span style={{ background: 'linear-gradient(90deg,#86efac,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {' '}an toàn, đúng chỉ định và hiệu quả nhất{' '}
            </span>
            <em>có thể."</em>
          </blockquote>
          <p className="text-white/70 text-base max-w-2xl mx-auto font-sans font-medium leading-relaxed">
            Khoa Dược hoạt động với phương châm "Người bệnh là trung tâm", luôn đặt lợi ích và sự an toàn
            của người bệnh lên hàng đầu trong mọi quyết định chuyên môn.
          </p>
        </div>
      </section>

      {/* Chức năng */}
      <section id="chuc-nang" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 mb-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-blue-700 font-bold">Nhiệm vụ cốt lõi</p>
            </div>
            <h2 className="font-serif text-gray-900 text-3xl md:text-5xl mb-4">Chức năng <em className="text-green-700">chuyên môn</em></h2>
            <p className="text-gray-600 text-base max-w-xl mx-auto font-medium">Khoa Dược thực hiện đầy đủ 6 chức năng nghiệp vụ theo quy định Bộ Y tế</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl p-8 bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 shadow-lg" style={{ background: 'linear-gradient(135deg,#16a34a,#1d4ed8)' }}>
                  <div className="text-white">{f.icon}</div>
                </div>
                <h3 className="text-gray-900 font-black text-lg mb-3">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed font-medium">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ban lãnh đạo */}
      <section id="lanh-dao" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-200 mb-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-purple-700 font-bold">Ban lãnh đạo</p>
            </div>
            <h2 className="font-serif text-gray-900 text-3xl md:text-5xl mb-4">Những người <em className="text-blue-700">dẫn dắt</em></h2>
            <p className="text-gray-600 text-base max-w-xl mx-auto font-medium">Đội ngũ lãnh đạo giàu kinh nghiệm, tâm huyết với ngành Dược</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {leaders.map((l, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 hover:shadow-xl transition-all group">
                <div className="overflow-hidden h-60">
                  <img src={l.img} alt={l.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6">
                  <p className="text-[10px] uppercase tracking-widest text-green-600 font-bold mb-1">{l.role}</p>
                  <h3 className="font-serif text-gray-900 text-xl mb-1">{l.name}</h3>
                  <p className="text-xs text-blue-600 font-bold mb-3">{l.exp}</p>
                  <p className="text-gray-600 text-sm leading-relaxed font-medium">{l.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="nhan-vien" className="py-20 bg-gradient-to-br from-green-700 to-blue-800 text-center">
        <div className="max-w-3xl mx-auto px-8">
          <h2 className="font-serif text-white text-3xl md:text-5xl mb-6">Liên hệ với chúng tôi</h2>
          <p className="text-white/80 text-base mb-10 font-sans font-medium">Đội ngũ dược sĩ luôn sẵn sàng tư vấn và hỗ trợ bạn</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/lien-he" className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm bg-white text-green-700 hover:bg-gray-100 transition-colors shadow-2xl">
              Liên hệ ngay <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
