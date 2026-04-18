import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import GioiThieu from './pages/GioiThieu';
import DuocLamSang from './pages/DuocLamSang';
import LienHe from './pages/LienHe';
import TraCuuTiemTruyen from './pages/TraCuuTiemTruyen';
import TraCuuTuongHop from './pages/TraCuuTuongHop';
import TraCuuThuoc from './pages/TraCuuThuoc';
import TuongTacThuoc from './pages/TuongTacThuoc';
import TraCuuNhanh from './pages/TraCuuNhanh';
import { CapNhatChuyenMon } from './pages/CapNhatChuyenMon';
import { CapNhatChuyenMonDetail } from './pages/CapNhatChuyenMonDetail';
import DeepMedAI from './pages/DeepMedAI';
import WebAppDuocKhoa from './pages/WebAppDuocKhoa';
import { Header, Footer } from './components/SharedLayout';
import ScrollToHash from './components/ScrollToHash';
import {
  Stethoscope, Pill, ClipboardList, Phone, Mail, MapPin, ChevronRight,
  ShieldCheck, FlaskConical, Truck, Microscope, BookOpen, ArrowRight,
  Zap, Brain, LayoutDashboard, Star, Award, Users, Clock, CheckCircle, Play
} from 'lucide-react';

// ─── DATA ─────────────────────────────────────────────────────────────────────
const features = [
  { title: 'Tư vấn xây dựng danh mục thuốc', description: 'Thiết lập tiêu chí lựa chọn thuốc, xử lý thông tin và phân tích kinh tế dược.', icon: <Truck className="w-5 h-5" />, link: '/gioi-thieu#chuc-nang', color: 'from-blue-500 to-blue-600' },
  { title: 'Giám sát kê đơn & sử dụng thuốc', description: 'Theo dõi việc kê đơn và sử dụng thuốc, phát hiện sai sót, hội chẩn lâm sàng.', icon: <Stethoscope className="w-5 h-5" />, link: '/duoc-lam-sang', color: 'from-emerald-500 to-emerald-600' },
  { title: 'Hướng dẫn sử dụng thuốc', description: 'Cung cấp, cập nhật thông tin thuốc cho cán bộ y tế và hướng dẫn người bệnh.', icon: <ShieldCheck className="w-5 h-5" />, link: '/gioi-thieu#chuc-nang', color: 'from-violet-500 to-violet-600' },
  { title: 'Quy trình & hướng dẫn chuyên môn', description: 'Phối hợp với các khoa lâm sàng soạn thảo tài liệu, quy trình chuẩn.', icon: <FlaskConical className="w-5 h-5" />, link: '/gioi-thieu#chuc-nang', color: 'from-amber-500 to-amber-600' },
  { title: 'Cảnh giác dược', description: 'Theo dõi, thu thập và báo cáo phản ứng có hại của thuốc (ADR) tại cơ sở.', icon: <Microscope className="w-5 h-5" />, link: '/gioi-thieu#chuc-nang', color: 'from-rose-500 to-rose-600' },
  { title: 'Nghiên cứu KH & đào tạo', description: 'Nghiên cứu lâm sàng, tương đương sinh học và đào tạo sử dụng thuốc hợp lý.', icon: <BookOpen className="w-5 h-5" />, link: '/cap-nhat-chuyen-mon', color: 'from-teal-500 to-teal-600' },
];



// ─── COUNTER ANIMATION HOOK ────────────────────────────────────────────────────
function useCountUp(end: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); } else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  return { count, ref };
}

// ─── HERO SECTION ─────────────────────────────────────────────────────────────
const Hero = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 150]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <section className="relative min-h-screen overflow-hidden flex items-center" style={{ paddingTop: '120px' }}>
      {/* Parallax background */}
      <motion.div style={{ y }} className="absolute inset-0 scale-110">
        <img src={`${import.meta.env.BASE_URL}images/hero_pharmacy.png`} alt="TTYT Thanh Ba" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(5,10,25,0.75) 0%, rgba(10,30,60,0.55) 50%, rgba(5,40,20,0.45) 100%)' }} />
        {/* Mesh overlay for depth */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(16,185,129,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.15) 0%, transparent 50%)' }} />
      </motion.div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text content */}
          <motion.div style={{ opacity }} initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.2 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 backdrop-blur-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 text-xs font-bold uppercase tracking-widest">Trung tâm Y tế Khu vực Thanh Ba</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.9 }}
              className="font-serif text-white leading-[1.05] mb-6"
              style={{ fontSize: 'clamp(2.8rem, 5.5vw, 5rem)' }}>
              Chăm sóc<br />dược phẩm,<br />
              <span style={{ background: 'linear-gradient(90deg, #6ee7b7, #67e8f9, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                <em>một trách nhiệm</em>
              </span>
              <br />cao cả.
            </motion.h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              className="text-white/70 text-base leading-relaxed mb-10 max-w-md font-medium">
              Đội ngũ Dược sĩ chuyên nghiệp, hệ thống kho thuốc đạt chuẩn GSP — đảm bảo an toàn tối đa cho người bệnh tại TTYT Khu vực Thanh Ba.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="flex flex-wrap gap-4">
              <Link to="/gioi-thieu"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm text-white border border-white/25 backdrop-blur-md hover:bg-white/15 hover:border-white/50 transition-all duration-300">
                Tìm hiểu thêm <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Right: floating stats cards */}
          <motion.div initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.4 }}
            className="hidden lg:grid grid-cols-2 gap-4">
            {[
              { n: '15+', label: 'Dược sĩ chuyên nghiệp', icon: <Users className="w-5 h-5" />, accent: '#10b981', border: 'rgba(16,185,129,0.35)' },
              { n: '500+', label: 'Loại thuốc quản lý', icon: <Pill className="w-5 h-5" />, accent: '#60a5fa', border: 'rgba(96,165,250,0.35)' },
              { n: '24/7', label: 'Hỗ trợ cấp cứu', icon: <Clock className="w-5 h-5" />, accent: '#fbbf24', border: 'rgba(251,191,36,0.35)' },
              { n: 'GSP', label: 'Tiêu chuẩn kho bảo quản', icon: <Award className="w-5 h-5" />, accent: '#c084fc', border: 'rgba(192,132,252,0.35)' },
            ].map((stat, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 + i * 0.15 }}
                whileHover={{ scale: 1.05, y: -4 }}
                className="rounded-2xl p-5 cursor-default border backdrop-blur-2xl"
                style={{ background: 'rgba(255,255,255,0.08)', borderColor: stat.border, boxShadow: `0 8px 32px rgba(0,0,0,0.18)` }}>
                <div className="mb-3" style={{ color: stat.accent }}>{stat.icon}</div>
                <p className="text-white font-black text-3xl mb-1 leading-none" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>{stat.n}</p>
                <p className="text-white/70 text-xs font-semibold leading-snug mt-1">{stat.label}</p>
                <div className="mt-3 h-0.5 rounded-full opacity-50" style={{ background: stat.accent }} />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Cuộn xuống</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
};

// ─── QUICK LINKS ──────────────────────────────────────────────────────────────
const QuickLinks = () => (
  <section className="relative z-20 -mt-16 pb-0">
    <div className="max-w-[90rem] mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        {[
          { title: 'Dược lâm sàng',      desc: 'Tư vấn phác đồ, tương tác thuốc',       tag: 'Hoạt động 24/7', icon: <Stethoscope className="w-6 h-6" />, link: '/duoc-lam-sang',        grad: 'linear-gradient(135deg,#059669 0%,#0d9488 100%)', shadow: '0 20px 48px -10px rgba(5,150,105,0.55)' },
          { title: 'Tra cứu nhanh',      desc: 'Thông tin thuốc tóm tắt & tức thời',    tag: 'Miễn phí',       icon: <Zap className="w-6 h-6" />,           link: '/tra-cuu-nhanh',       grad: 'linear-gradient(135deg,#d97706 0%,#ea580c 100%)', shadow: '0 20px 48px -10px rgba(217,119,6,0.55)' },
          { title: 'DeepMed-AI',         desc: 'AI hỗ trợ ra quyết định lâm sàng',      tag: 'Hot',            icon: <Brain className="w-6 h-6" />,         link: '/deepmed-ai',          grad: 'linear-gradient(135deg,#7c3aed 0%,#6366f1 100%)', shadow: '0 20px 48px -10px rgba(124,58,237,0.55)' },
          { title: 'Cập nhật chuyên môn', desc: 'Phác đồ, báo cáo, tin nội bộ',         tag: 'Tin mới',        icon: <BookOpen className="w-6 h-6" />,      link: '/cap-nhat-chuyen-mon', grad: 'linear-gradient(135deg,#1d4ed8 0%,#0284c7 100%)', shadow: '0 20px 48px -10px rgba(29,78,216,0.55)' },
          { title: 'WebApp Dược khoa',   desc: 'Quản trị hoạt động nội bộ khoa',        tag: 'Hot',            icon: <LayoutDashboard className="w-6 h-6" />, link: '/webapp-duoc-khoa',   grad: 'linear-gradient(135deg,#be123c 0%,#9f1239 100%)', shadow: '0 20px 48px -10px rgba(190,18,60,0.55)' },
        ].map((item, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i, duration: 0.5 }}
            whileHover={{ y: -10, scale: 1.02 }}
            className="group relative rounded-2xl p-5 md:p-6 cursor-pointer overflow-hidden transition-all duration-400"
            style={{ background: item.grad, boxShadow: item.shadow }}>

            {/* Shimmer overlay on hover */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 rounded-2xl" />
            {/* Pattern dot */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/5" />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-lg">
                  {item.icon}
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/20 text-white/90 backdrop-blur-sm border border-white/20">
                  {item.tag}
                </span>
              </div>

              <h3 className="font-bold text-white text-[15px] leading-snug mb-1.5">{item.title}</h3>
              <p className="text-white/75 text-[12px] leading-relaxed mb-5">{item.desc}</p>

              <Link to={item.link}
                className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-white/90 hover:text-white group-hover:gap-3 transition-all duration-300 border-b border-white/30 pb-0.5">
                Truy cập <ArrowRight className="w-3 h-3 group-hover:-rotate-45 transition-transform duration-300" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);


// ─── ABOUT SECTION ────────────────────────────────────────────────────────────
const About = () => {
  const { count: c1, ref } = useCountUp(15);
  const { count: c2 } = useCountUp(500);
  const { count: c3 } = useCountUp(20);

  return (
    <section className="bg-white py-28 md:py-36 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Left: Image collage */}
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.9 }}
            className="relative">
            {/* Main image */}
            <div className="rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]">
              <img src={`${import.meta.env.BASE_URL}images/about_team.png`} alt="Đội ngũ Dược sĩ" className="w-full h-full object-cover" />
            </div>
            {/* Overlay card: clinical image */}
            <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
              className="absolute -bottom-10 -right-6 w-52 h-40 rounded-2xl overflow-hidden shadow-xl border-4 border-white hidden md:block">
              <img src={`${import.meta.env.BASE_URL}images/about_clinical.png`} alt="Dược lâm sàng" className="w-full h-full object-cover" />
            </motion.div>
            {/* GSP badge */}
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.6 }}
              className="absolute -top-6 -left-6 rounded-2xl p-5 shadow-2xl border-4 border-white hidden md:block"
              style={{ background: 'linear-gradient(135deg,#059669,#0284c7)' }}>
              <p className="font-black text-white text-3xl leading-none">GSP</p>
              <p className="text-emerald-200 text-[9px] uppercase tracking-widest mt-1 font-bold">Đạt chuẩn kho</p>
            </motion.div>
          </motion.div>

          {/* Right: Content */}
          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.9 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] uppercase tracking-widest text-emerald-700 font-black">Về chúng tôi</span>
            </div>

            <h2 className="font-serif text-slate-900 leading-[1.08] mb-6" style={{ fontSize: 'clamp(2rem,3.5vw,3rem)' }}>
              Chào mừng đến với<br />
              <span style={{ background: 'linear-gradient(90deg,#059669,#1d4ed8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                <em>Khoa Dược</em>
              </span>
              {' '}TTYT Thanh Ba
            </h2>

            <p className="text-slate-600 leading-relaxed mb-4 text-base">
              Khoa Dược tự hào là đơn vị nòng cốt trong quản lý, cung ứng và tư vấn sử dụng thuốc tại Trung tâm Y tế Khu vực Thanh Ba.
            </p>
            <p className="text-slate-500 leading-relaxed mb-10 text-[15px]">
              Với đội ngũ Dược sĩ tận tâm và hệ thống kho đạt chuẩn GSP, chúng tôi cam kết an toàn tối đa cho người bệnh, hỗ trợ bác sĩ ra quyết định điều trị chính xác.
            </p>

            {/* Stats */}
            <div ref={ref} className="grid grid-cols-3 gap-4 mb-10">
              {[
                { n: `${c1}+`, l: 'Dược sĩ', c: 'text-emerald-600', bg: 'bg-emerald-50' },
                { n: `${c2}+`, l: 'Loại thuốc', c: 'text-blue-600', bg: 'bg-blue-50' },
                { n: `${c3}+`, l: 'Năm kinh nghiệm', c: 'text-violet-600', bg: 'bg-violet-50' },
              ].map((s, i) => (
                <div key={i} className={`${s.bg} rounded-2xl p-4 text-center`}>
                  <p className={`font-black text-3xl ${s.c}`}>{s.n}</p>
                  <p className="text-slate-500 text-[11px] uppercase tracking-wider mt-1 font-bold">{s.l}</p>
                </div>
              ))}
            </div>

            {/* Checklist */}
            <div className="space-y-3 mb-10">
              {['Cung ứng thuốc đầy đủ, kịp thời', 'Tư vấn dược lâm sàng chuyên nghiệp', 'Kho GSP – Bảo quản tiêu chuẩn quốc tế'].map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-600 text-sm font-medium">{t}</span>
                </div>
              ))}
            </div>

            <Link to="/gioi-thieu"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm text-white shadow-lg hover:scale-105 hover:shadow-xl transition-all"
              style={{ background: 'linear-gradient(135deg,#059669,#1d4ed8)' }}>
              Khám phá thêm <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ─── FUNCTIONS SECTION ────────────────────────────────────────────────────────
const Functions = () => (
  <section className="py-28 md:py-36 bg-slate-950 relative overflow-hidden">
    {/* Decorative blobs */}
    <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl pointer-events-none"
      style={{ background: 'radial-gradient(circle, #059669, transparent)' }} />
    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl pointer-events-none"
      style={{ background: 'radial-gradient(circle, #2563eb, transparent)' }} />

    <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
      <div className="text-center mb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 mb-6">
          <span className="text-[11px] uppercase tracking-widest text-emerald-400 font-black">Nhiệm vụ cốt lõi</span>
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
          className="font-serif text-white leading-tight mb-4" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)' }}>
          Chức năng{' '}
          <span style={{ background: 'linear-gradient(90deg,#6ee7b7,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            <em>chuyên môn</em>
          </span>
        </motion.h2>
        <p className="text-slate-400 text-base max-w-xl mx-auto">Khoa Dược thực hiện đầy đủ 6 chức năng nghiệp vụ theo quy định của Bộ Y tế</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            whileHover={{ y: -6 }}
            className="group rounded-2xl p-7 border border-white/[0.06] hover:border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-500 cursor-pointer">
            <Link to={f.link} className="block">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-gradient-to-br ${f.color} text-white shadow-lg`}>
                {f.icon}
              </div>
              <h3 className="text-white font-bold text-lg mb-3">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-5">{f.description}</p>
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400 group-hover:gap-3 transition-all">
                Xem chi tiết <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// ─── GSP BANNER ───────────────────────────────────────────────────────────────
const GspBanner = () => (
  <section className="relative py-0 overflow-hidden h-[480px] md:h-[520px]">
    <div className="absolute inset-0">
      <img src={`${import.meta.env.BASE_URL}images/banner_warehouse.png`} alt="Kho GSP" className="w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,rgba(5,10,30,0.88) 0%, rgba(5,80,40,0.75) 60%, rgba(5,10,60,0.80) 100%)' }} />
    </div>
    <div className="relative h-full flex items-center">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 mb-6">
              <Award className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 text-xs font-bold uppercase tracking-widest">Tiêu chuẩn GSP</span>
            </div>
            <blockquote className="font-serif text-white leading-tight mb-8" style={{ fontSize: 'clamp(1.9rem,3.5vw,3rem)' }}>
              "Một liều thuốc đúng —<br />
              <em style={{ background: 'linear-gradient(90deg,#6ee7b7,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                một cuộc đời được bảo vệ.
              </em>"
            </blockquote>
            <Link to="/cap-nhat-chuyen-mon"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm bg-white hover:bg-gray-50 transition-all shadow-2xl"
              style={{ color: '#059669' }}>
              <BookOpen className="w-4 h-4" /> Cập nhật chuyên môn
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="hidden lg:flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <ShieldCheck className="w-6 h-6" />, label: 'Kiểm soát nhiệt độ', val: '2°C – 8°C / 15°C – 25°C' },
                { icon: <CheckCircle className="w-6 h-6" />, label: 'Kiểm định định kỳ', val: 'Hàng tháng' },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl p-5 border border-white/10 bg-white/5 backdrop-blur-sm">
                  <div className="text-emerald-400 mb-2">{s.icon}</div>
                  <p className="text-white/50 text-[10px] uppercase tracking-widest font-bold">{s.label}</p>
                  <p className="text-white font-bold text-sm mt-1">{s.val}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl p-5 border border-white/10 bg-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="text-emerald-400"><Award className="w-6 h-6" /></div>
                <div>
                  <p className="text-white/50 text-[10px] uppercase tracking-widest font-bold">Chuẩn bảo quản</p>
                  <p className="text-white font-bold text-sm mt-1">GSP Quốc gia</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  </section>
);

// ─── CONTACT SECTION ──────────────────────────────────────────────────────────
// ─── HOME CONTACT FORM (functional) ──────────────────────────────────────────
const HomeContactForm = () => {
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-7 h-7 text-green-600" />
        </div>
        <h4 className="font-serif text-slate-900 text-xl mb-2">Đã gửi thành công!</h4>
        <p className="text-slate-600 text-sm font-medium">Chúng tôi sẽ liên hệ với bạn trong vòng 24 giờ.</p>
      </motion.div>
    );
  }
  return (
    <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
      {[
        { label: 'Họ và tên', placeholder: 'Nhập họ và tên của bạn', type: 'text' },
        { label: 'Điện thoại hoặc Email', placeholder: 'Để chúng tôi liên hệ lại', type: 'text' },
      ].map((f, i) => (
        <div key={i}>
          <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-black mb-2">{f.label}</label>
          <input required type={f.type} placeholder={f.placeholder}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 transition-all placeholder:text-slate-300" />
        </div>
      ))}
      <div>
        <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-black mb-2">Nội dung tư vấn</label>
        <textarea required rows={4} placeholder="Loại thuốc, số lượng, hoặc câu hỏi dược lâm sàng..."
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 transition-all resize-none placeholder:text-slate-300" />
      </div>
      <button type="submit"
        className="w-full py-4 rounded-xl font-bold text-sm text-white hover:scale-[1.02] hover:shadow-xl transition-all shadow-lg"
        style={{ background: 'linear-gradient(135deg,#059669,#1d4ed8)' }}>
        Gửi câu hỏi ngay
      </button>
    </form>
  );
};

const Contact = () => (
  <section className="bg-white py-28 md:py-36 overflow-hidden">
    <div className="max-w-7xl mx-auto px-6 lg:px-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
        {/* Left */}
        <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 mb-8">
            <span className="text-[11px] uppercase tracking-widest text-slate-600 font-black">Liên hệ với chúng tôi</span>
          </div>
          <h2 className="font-serif text-slate-900 leading-tight mb-6" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}>
            Chúng tôi<br />
            <em style={{ background: 'linear-gradient(90deg,#059669,#1d4ed8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              luôn sẵn sàng
            </em>
          </h2>
          <p className="text-slate-500 text-base leading-relaxed mb-10">
            Đội ngũ Dược sĩ của chúng tôi luôn hỗ trợ bạn 24/7 cho các tình huống khẩn cấp và trong giờ hành chính cho tư vấn dược lâm sàng.
          </p>

          <div className="space-y-6">
            {[
              { icon: <Phone className="w-5 h-5" />, label: 'Điện thoại', val: '0210 656 8197', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { icon: <Mail className="w-5 h-5" />, label: 'Email', val: 'thuocvabietduoc.bvthanhba@gmail.com', color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: <MapPin className="w-5 h-5" />, label: 'Địa chỉ', val: 'Thị trấn Thanh Ba, Huyện Thanh Ba, Phú Thọ', color: 'text-violet-600', bg: 'bg-violet-50' },
            ].map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${c.bg} ${c.color}`}>
                  {c.icon}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">{c.label}</p>
                  <p className="text-slate-700 font-semibold text-sm leading-snug">{c.val}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-10">
            <Link to="/lien-he" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm text-white hover:scale-105 transition-transform shadow-lg"
              style={{ background: 'linear-gradient(135deg,#059669,#1d4ed8)' }}>
              Đến trang liên hệ <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Right: form */}
        <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <div className="bg-slate-50 rounded-3xl p-9 border border-slate-100">
            <h3 className="font-serif text-slate-900 text-2xl font-bold mb-7">Gửi câu hỏi cho chúng tôi</h3>
            <HomeContactForm />
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

// ─── SCROLL TO TOP ────────────────────────────────────────────────────────────
const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const fn = () => setVisible(window.scrollY > 500);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 w-12 h-12 rounded-full text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform z-50"
          style={{ background: 'linear-gradient(135deg,#059669,#1d4ed8)' }}>
          <ArrowRight className="w-5 h-5 -rotate-90" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
const Home = () => (
  <div className="min-h-screen bg-white font-sans">
    <Header />
    <main>
      <Hero />
      <QuickLinks />
      <About />
      <Functions />
      <GspBanner />
      <Contact />
    </main>
    <Footer />
    <ScrollToTop />
  </div>
);

// ─── APP ROUTER ───────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/gioi-thieu" element={<GioiThieu />} />
        <Route path="/duoc-lam-sang" element={<DuocLamSang />} />

        <Route path="/tra-cuu-nhanh" element={<TraCuuNhanh />} />
        <Route path="/tra-cuu-tiem-truyen" element={<TraCuuTiemTruyen />} />
        <Route path="/tra-cuu-tuong-hop" element={<TraCuuTuongHop />} />
        <Route path="/tra-cuu-thuoc" element={<TraCuuThuoc />} />
        <Route path="/tuong-tac-thuoc" element={<TuongTacThuoc />} />
        <Route path="/cap-nhat-chuyen-mon" element={<CapNhatChuyenMon />} />
        <Route path="/cap-nhat-chuyen-mon/:id" element={<CapNhatChuyenMonDetail />} />
        <Route path="/webapp-duoc-khoa" element={<WebAppDuocKhoa />} />
        <Route path="/deepmed-ai" element={<DeepMedAI />} />
        <Route path="/lien-he" element={<LienHe />} />
      </Routes>
    </Router>
  );
}
