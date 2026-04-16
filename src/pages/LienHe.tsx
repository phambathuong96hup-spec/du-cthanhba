import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Header, Footer, Breadcrumb } from '../components/SharedLayout';
import { Phone, Mail, MapPin, Clock, Send, Facebook, Youtube, ChevronRight } from 'lucide-react';

export default function LienHe() {
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />

      {/* Hero */}
      <section className="relative pt-[120px] min-h-[320px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={`${import.meta.env.BASE_URL}images/hero_pharmacy.png`} alt="Liên hệ" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,rgba(15,23,42,0.88) 0%,rgba(22,163,74,0.4) 100%)' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-8 md:px-16 pb-14 pt-14 w-full">
          <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Liên hệ' }]} />
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="font-serif text-white mt-4 leading-tight" style={{ fontSize: 'clamp(2.2rem,5vw,4rem)' }}>
            Liên hệ <em style={{ background: 'linear-gradient(90deg,#86efac,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>với chúng tôi</em>
          </motion.h1>
          <p className="text-white/85 text-base md:text-lg mt-3 font-sans font-semibold">Luôn sẵn sàng hỗ trợ bạn</p>
        </div>
      </section>

      {/* Quick Contact Cards */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { Icon: Phone, title: 'Đường dây nóng', val: '(+84) 210 3XXX 888', sub: 'Thứ 2–6, 7:00–17:00', color: 'bg-blue-600', bg: 'bg-blue-50 border-blue-100', text: 'text-blue-700' },
              { Icon: Mail, title: 'Email liên hệ', val: 'khoaduoc.ttytthanhba@gmail.com', sub: 'Phản hồi trong 24 giờ', color: 'bg-green-600', bg: 'bg-green-50 border-green-100', text: 'text-green-700' },
              { Icon: Phone, title: 'Cấp cứu thuốc', val: '1900 XXX XXX', sub: 'Hỗ trợ 24/7', color: 'bg-red-500', bg: 'bg-red-50 border-red-100', text: 'text-red-700' },
            ].map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`flex items-center gap-5 p-6 rounded-2xl border ${c.bg} hover:shadow-lg transition-shadow`}>
                <div className={`w-14 h-14 rounded-2xl ${c.color} flex items-center justify-center shrink-0 shadow-lg`}>
                  <c.Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-0.5">{c.title}</p>
                  <p className={`font-black text-sm ${c.text} leading-tight mb-0.5`}>{c.val}</p>
                  <p className="text-xs text-gray-500 font-medium">{c.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content: Form + Info */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">

            {/* Contact Info */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-200 mb-6">
                <p className="text-[11px] uppercase tracking-[0.2em] text-green-700 font-bold">Thông tin liên hệ</p>
              </div>
              <h2 className="font-serif text-gray-900 text-3xl md:text-4xl mb-10 leading-tight">
                Chúng tôi <em className="text-green-700">luôn sẵn sàng</em>
              </h2>

              <div className="space-y-8 mb-12">
                {[
                  { Icon: MapPin, label: 'Địa chỉ', val: 'Thị trấn Thanh Ba, Huyện Thanh Ba, Tỉnh Phú Thọ' },
                  { Icon: Phone, label: 'Điện thoại', val: '(+84) 210 3XXX 888' },
                  { Icon: Mail, label: 'Email', val: 'khoaduoc.ttytthanhba@gmail.com' },
                  { Icon: Clock, label: 'Giờ làm việc', val: 'Thứ 2 – Thứ 6: 07:00 – 17:00 | Cấp cứu: 24/7' },
                ].map((c, i) => (
                  <div key={i} className="flex gap-5 items-start pb-8 border-b border-gray-200 last:border-0">
                    <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shrink-0 shadow">
                      <c.Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1">{c.label}</p>
                      <p className="text-gray-900 font-semibold text-sm leading-relaxed">{c.val}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-4">Mạng xã hội</p>
                <div className="flex gap-3">
                  {[
                    { Icon: Facebook, label: 'Facebook', color: 'bg-blue-600' },
                    { Icon: Youtube, label: 'YouTube', color: 'bg-red-600' },
                  ].map((s, i) => (
                    <a key={i} href="#" className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm text-white ${s.color} hover:opacity-80 transition-opacity`}>
                      <s.Icon className="w-4 h-4" /> {s.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Form */}
            <div>
              <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 mb-6">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-blue-700 font-bold">Gửi yêu cầu tư vấn</p>
                </div>
                <h3 className="font-serif text-gray-900 text-2xl mb-8">Chúng tôi sẽ <em className="text-blue-700">liên hệ lại</em> sớm nhất</h3>

                {sent ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <Send className="w-7 h-7 text-green-600" />
                    </div>
                    <h4 className="font-serif text-gray-900 text-xl mb-2">Đã gửi thành công!</h4>
                    <p className="text-gray-600 text-sm font-medium">Chúng tôi sẽ liên hệ với bạn trong vòng 24 giờ làm việc.</p>
                  </motion.div>
                ) : (
                  <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Họ và tên *', placeholder: 'Nguyễn Văn A', type: 'text' },
                        { label: 'Số điện thoại *', placeholder: '0912 345 678', type: 'tel' },
                      ].map((f, i) => (
                        <div key={i}>
                          <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">{f.label}</label>
                          <input required type={f.type}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm font-medium focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all placeholder:text-gray-300"
                            placeholder={f.placeholder} />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">Email</label>
                      <input type="email"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm font-medium focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all placeholder:text-gray-300"
                        placeholder="email@example.com" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">Chủ đề *</label>
                      <select required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm font-medium focus:outline-none focus:border-green-500 transition-all">
                        <option value="">Chọn chủ đề...</option>
                        <option>Tra cứu thông tin thuốc</option>
                        <option>Tư vấn dược lâm sàng</option>
                        <option>Thông tin kho thuốc</option>
                        <option>Phản ánh, góp ý</option>
                        <option>Khác</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">Nội dung tư vấn *</label>
                      <textarea required rows={4}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm font-medium focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all placeholder:text-gray-300 resize-none"
                        placeholder="Mô tả chi tiết câu hỏi hoặc yêu cầu tư vấn của bạn..." />
                    </div>
                    <button type="submit"
                      className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-black text-sm text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                      style={{ background: 'linear-gradient(135deg,#16a34a,#1d4ed8)' }}>
                      <Send className="w-4 h-4" /> Gửi yêu cầu tư vấn
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="h-80 bg-gray-200 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center flex-col gap-3"
          style={{ background: 'linear-gradient(135deg,#e2e8f0,#c7d2fe)' }}>
          <MapPin className="w-10 h-10 text-blue-500" />
          <p className="text-gray-700 font-bold text-lg">Thị trấn Thanh Ba, Huyện Thanh Ba, Phú Thọ</p>
          <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
            Xem trên Google Maps <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
