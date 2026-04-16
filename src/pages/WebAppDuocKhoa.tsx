import React from 'react';
import { Header, Footer, Breadcrumb } from '../components/SharedLayout';
import { LayoutDashboard, ClipboardList, Wrench, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

const apps = [
  {
    title: 'Quản lý công việc',
    desc: 'Theo dõi, phân công, báo cáo và đánh giá tiến độ công việc trong khoa Dược. Hỗ trợ biểu đồ, lịch và chat AI.',
    icon: <ClipboardList className="w-7 h-7" />,
    href: `${import.meta.env.BASE_URL}webapp/quan-ly-cong-viec.html`,
    color: 'from-blue-600 to-cyan-500',
    shadow: '0 20px 48px -10px rgba(29,78,216,0.4)',
  },
  {
    title: 'Quản lý trang thiết bị',
    desc: 'Quản lý hồ sơ trang thiết bị, theo dõi bảo trì, kiểm định GSP, yêu cầu sửa chữa và báo cáo thống kê.',
    icon: <Wrench className="w-7 h-7" />,
    href: `${import.meta.env.BASE_URL}webapp/quan-ly-thiet-bi/index.html`,
    color: 'from-emerald-600 to-teal-500',
    shadow: '0 20px 48px -10px rgba(5,150,105,0.4)',
  },
];

export default function WebAppDuocKhoa() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Breadcrumb items={[{ label: 'WebApp Dược Khoa' }]} />

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-200 mb-4">
              <LayoutDashboard className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-bold uppercase tracking-widest text-rose-700">WebApp Dược Khoa</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl text-gray-900 mb-3">
              Quản trị hoạt động <em className="text-rose-600">nội bộ khoa</em>
            </h1>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Hệ thống ứng dụng web hỗ trợ quản lý công việc và trang thiết bị của Khoa Dược.
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
