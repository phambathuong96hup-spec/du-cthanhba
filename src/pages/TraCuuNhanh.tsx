import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Header, Footer, Breadcrumb } from '../components/SharedLayout';
import { Pill, FlaskConical, ShieldAlert, Activity, ArrowRight } from 'lucide-react';

const modules = [
  {
    title: 'Tra cứu thông tin thuốc',
    desc: 'Danh mục thuốc áp dụng tại TTYT Thanh Ba với thông tin chỉ định, liều dùng, tương tác và an toàn thuốc đầy đủ.',
    icon: <Pill className="w-7 h-7" />,
    href: '/tra-cuu-thuoc',
    image: `${import.meta.env.BASE_URL}images/tracuu_thongtinthuoc.png`,
    grad: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 60%, #2563eb 100%)',
    accent: '#60a5fa',
    tag: 'Cơ sở dữ liệu thuốc',
  },
  {
    title: 'Tra cứu thuốc tiêm truyền',
    desc: 'Hướng dẫn pha chế, tốc độ truyền, tương hợp và bảo quản thuốc tiêm truyền tĩnh mạch.',
    icon: <Activity className="w-7 h-7" />,
    href: '/tra-cuu-tiem-truyen',
    image: `${import.meta.env.BASE_URL}images/tracuu_tiemtruyen.png`,
    grad: 'linear-gradient(135deg, #065f46 0%, #047857 60%, #059669 100%)',
    accent: '#34d399',
    tag: 'IV & Tiêm truyền',
  },
  {
    title: 'Tra cứu tương tác thuốc',
    desc: 'Kiểm tra và cảnh báo tương tác, chống chỉ định giữa 2 hoặc nhiều hoạt chất dược lý.',
    icon: <ShieldAlert className="w-7 h-7" />,
    href: '/tuong-tac-thuoc',
    image: `${import.meta.env.BASE_URL}images/tracuu_tuongtac.png`,
    grad: 'linear-gradient(135deg, #9f1239 0%, #be123c 60%, #e11d48 100%)',
    accent: '#fca5a5',
    tag: 'Cảnh giác an toàn',
  },
  {
    title: 'Tương hợp Y-site',
    desc: 'Bảng tra cứu tương hợp và tương kỵ của các thuốc tiêm truyền qua chung đường truyền Y-site.',
    icon: <FlaskConical className="w-7 h-7" />,
    href: '/tra-cuu-tuong-hop',
    image: `${import.meta.env.BASE_URL}images/tracuu_tuonghop.png`,
    grad: 'linear-gradient(135deg, #92400e 0%, #b45309 60%, #d97706 100%)',
    accent: '#fcd34d',
    tag: 'Y-site Compatibility',
  },
];

export default function TraCuuNhanh() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Tra Cứu Nhanh | Khoa Dược - TTYT Thanh Ba';
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 font-sans">
      <Header />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ paddingTop: '88px', minHeight: '320px' }}>
        {/* Background */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e2d4a 50%, #0f172a 100%)' }} />
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px]"
            style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px]"
            style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24">
          <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Tra cứu nhanh' }]} />

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
            className="mt-8 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-blue-300 text-xs font-black uppercase tracking-widest">Công cụ lâm sàng</span>
            </div>
            <h1 className="font-serif text-white font-bold leading-tight mb-4"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
              Hệ thống{' '}
              <span style={{ background: 'linear-gradient(90deg, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Tra Cứu Lâm Sàng
              </span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed font-medium">
              Tổng hợp các công cụ hỗ trợ tra cứu dược lâm sàng dành riêng cho cán bộ y tế tại TTYT Khu vực Thanh Ba.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── TOOL CARDS ── */}
      <section className="relative bg-slate-50 py-16 md:py-20">
        {/* Top wave */}
        <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden -translate-y-full">
          <svg viewBox="0 0 1440 64" className="w-full h-full fill-slate-50" preserveAspectRatio="none">
            <path d="M0,64 C360,0 1080,0 1440,64 L1440,64 L0,64 Z" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-8">
            {modules.map((m, i) => (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                whileHover={{ y: -8 }}
              >
                <Link to={m.href}
                  className="group block rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 relative"
                  style={{ minHeight: '280px' }}>

                  {/* Background image */}
                  <div className="absolute inset-0">
                    <img src={m.image} alt={m.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0" style={{ background: `${m.grad.replace('135deg', '160deg').replace('100%)', '80%)')}88` }} />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)' }} />
                  </div>

                  {/* Content */}
                  <div className="relative z-10 p-8 md:p-10 flex flex-col justify-end h-full" style={{ minHeight: '280px' }}>
                    {/* Tag */}
                    <div className="flex items-center justify-between mb-auto">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 bg-white/10 backdrop-blur-sm text-white/90">
                        {m.tag}
                      </span>
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/20 bg-white/10 backdrop-blur-sm"
                        style={{ color: m.accent }}>
                        {m.icon}
                      </div>
                    </div>

                    {/* Title & desc */}
                    <div className="mt-8">
                      <h2 className="font-serif text-white font-bold leading-snug mb-3 group-hover:text-white transition-colors"
                        style={{ fontSize: 'clamp(1.25rem, 2vw, 1.75rem)' }}>
                        {m.title}
                      </h2>
                      <p className="text-white/70 text-sm leading-relaxed mb-6 font-medium max-w-md">
                        {m.desc}
                      </p>

                      <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider group-hover:gap-4 transition-all duration-300"
                        style={{ color: m.accent }}>
                        Truy cập ngay
                        <ArrowRight className="w-4 h-4 group-hover:-rotate-45 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
