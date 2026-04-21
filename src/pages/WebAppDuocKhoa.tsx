import React, { useEffect } from 'react';
import { Header, Footer, Breadcrumb } from '../components/SharedLayout';
import { LayoutDashboard, ClipboardList, Wrench, ExternalLink, Shield, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

const apps = [
  {
    title: 'Quản lý công việc',
    desc: 'Theo dõi, phân công, báo cáo và đánh giá tiến độ công việc trong khoa Dược. Hỗ trợ biểu đồ, lịch và chat AI.',
    icon: <ClipboardList className="w-7 h-7" />,
    href: `${import.meta.env.BASE_URL}webapp/quan-ly-cong-viec/index.html`,
    color: 'from-blue-600 to-cyan-500',
    shadow: '0 20px 48px -10px rgba(29,78,216,0.4)',
    features: ['Kanban Board', 'Giao việc & nhắc nhở', 'Báo cáo tự động'],
  },
  {
    title: 'Quản lý trang thiết bị',
    desc: 'Quản lý hồ sơ trang thiết bị, theo dõi bảo trì, kiểm định GSP, yêu cầu sửa chữa và báo cáo thống kê.',
    icon: <Wrench className="w-7 h-7" />,
    href: `${import.meta.env.BASE_URL}webapp/quan-ly-thiet-bi/index.html`,
    color: 'from-emerald-600 to-teal-500',
    shadow: '0 20px 48px -10px rgba(5,150,105,0.4)',
    features: ['Hồ sơ thiết bị', 'Lịch bảo trì GSP', 'Báo cáo thống kê'],
  },
];

export default function WebAppDuocKhoa() {
  useEffect(() => {
    document.title = 'WebApp Dược Khoa | Khoa Dược - TTYT Thanh Ba';
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />

      {/* Hero */}
      <section className="relative pt-[120px] min-h-[340px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={`${import.meta.env.BASE_URL}images/hero_pharmacy.png`} alt="WebApp Dược Khoa" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,rgba(15,23,42,0.88) 0%,rgba(159,18,57,0.5) 100%)' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-8 md:px-16 pb-14 pt-14 w-full">
          <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'WebApp Dược Khoa' }]} />
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="font-serif text-white mt-4 leading-tight" style={{ fontSize: 'clamp(2.2rem,5vw,4rem)' }}>
            WebApp <em style={{ background: 'linear-gradient(90deg,#fda4af,#fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Dược Khoa</em>
          </motion.h1>
          <p className="text-white/85 text-base md:text-lg mt-3 max-w-xl font-sans font-semibold">
            Hệ thống ứng dụng web quản trị hoạt động nội bộ Khoa Dược
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-8 md:px-16">
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Ứng dụng', val: '2', color: 'text-rose-600 bg-rose-50' },
              { icon: <Shield className="w-5 h-5" />, label: 'Bảo mật', val: 'SSL', color: 'text-blue-600 bg-blue-50' },
              { icon: <Sparkles className="w-5 h-5" />, label: 'Truy cập', val: '24/7', color: 'text-emerald-600 bg-emerald-50' },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>{s.icon}</div>
                <p className="font-black text-2xl text-gray-900">{s.val}</p>
                <p className="text-gray-500 text-xs uppercase tracking-wider font-bold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Cards */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-200 mb-4">
              <LayoutDashboard className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-bold uppercase tracking-widest text-rose-700">Ứng dụng nội bộ</span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl text-gray-900 mb-3">
              Quản trị hoạt động <em className="text-rose-600">nội bộ khoa</em>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Chọn ứng dụng bạn muốn sử dụng để bắt đầu
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {apps.map((app, i) => (
              <motion.a
                key={i}
                href={app.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group rounded-2xl overflow-hidden bg-white border border-gray-100 hover:shadow-2xl transition-all cursor-pointer block"
                style={{ boxShadow: app.shadow }}
              >
                <div className={`h-2 bg-gradient-to-r ${app.color}`} />
                <div className="p-8">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${app.color} flex items-center justify-center text-white shadow-lg mb-5`}>
                    {app.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 text-xl mb-2 group-hover:text-blue-700 transition-colors">
                    {app.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-5">{app.desc}</p>

                  {/* Feature tags */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {app.features.map((f, fi) => (
                      <span key={fi} className="px-2.5 py-1 bg-gray-50 rounded-lg text-[11px] font-bold text-gray-500 border border-gray-100">
                        {f}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-sm font-bold text-blue-600 group-hover:text-blue-800 transition-colors">
                    Mở ứng dụng <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
