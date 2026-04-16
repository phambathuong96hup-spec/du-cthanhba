import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Pill, Phone, ClipboardList, ShieldCheck, FlaskConical,
  ChevronDown, ChevronRight, Menu, X, Search,
  Facebook, Youtube, Globe, ArrowRight, MapPin, Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropdownItem { label: string; href: string; }
interface NavMenuItem { label: string; href: string; id: string; children?: DropdownItem[]; }

export const NAV_MENU: NavMenuItem[] = [
  { label: 'TRANG CHỦ', href: '/', id: 'home' },
  {
    label: 'GIỚI THIỆU', href: '/gioi-thieu', id: 'about',
    children: [
      { label: 'Lịch sử hình thành', href: '/gioi-thieu#lich-su' },
      { label: 'Tôn chỉ – Mục đích', href: '/gioi-thieu#ton-chi' },
      { label: 'Chức năng & Nhiệm vụ', href: '/gioi-thieu#chuc-nang' },
      { label: 'Ban lãnh đạo khoa', href: '/gioi-thieu#lanh-dao' },
      { label: 'Tập thể nhân viên', href: '/gioi-thieu#nhan-vien' },
    ]
  },
  {
    label: 'DƯỢC LÂM SÀNG', href: '/duoc-lam-sang', id: 'clinical',
    children: [
      { label: 'Tư vấn phác đồ điều trị', href: '/duoc-lam-sang#tu-van' },
      { label: 'Giám sát sử dụng thuốc', href: '/duoc-lam-sang#giam-sat' },
      { label: 'Phản ứng có hại (ADR)', href: '/duoc-lam-sang#adr' },
    ]
  },
  {
    label: 'TRA CỨU NHANH', href: '/tra-cuu-nhanh', id: 'search',
    children: [
      { label: 'Tra cứu thông tin thuốc', href: '/tra-cuu-thuoc' },
      { label: 'Tra cứu thuốc tiêm truyền', href: '/tra-cuu-tiem-truyen' },
      { label: 'Tra cứu tương tác thuốc', href: '/tuong-tac-thuoc' },
      { label: 'Tra cứu tương hợp (Y-site)', href: '/tra-cuu-tuong-hop' },
    ]
  },
  {
    label: 'CẬP NHẬT CHUYÊN MÔN', href: '/cap-nhat-chuyen-mon', id: 'news',
    children: [
      { label: 'Cảnh giác dược', href: '/cap-nhat-chuyen-mon#canh-giac-duoc' },
      { label: 'Phác đồ điều trị update', href: '/cap-nhat-chuyen-mon#phac-do-dieu-tri' },
      { label: 'Phác đồ điều trị nội bộ', href: '/cap-nhat-chuyen-mon#phac-do-noi-vien' },
      { label: 'Công văn thu hồi thuốc', href: '/cap-nhat-chuyen-mon#cong-van' },
      { label: 'Tập huấn kỹ năng', href: '/cap-nhat-chuyen-mon#tap-huan' },
    ]
  },
  { label: 'LIÊN HỆ', href: '/lien-he', id: 'contact' },
];

const NavDropdownItem = ({ item, active, onActivate }: { item: NavMenuItem; active: boolean; onActivate: () => void }) => {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasChildren = item.children && item.children.length > 0;

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (hasChildren) setOpen(true);
  };
  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Link
        to={item.href}
        className={cn(
          'flex items-center gap-1 px-4 py-3.5 text-[12.5px] font-bold tracking-wide whitespace-nowrap transition-all border-b-[3px] cursor-pointer',
          active
            ? 'text-white border-white bg-white/15'
            : 'text-white/90 border-transparent hover:text-white hover:bg-white/10 hover:border-white/40'
        )}
        onClick={() => { onActivate(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
      >
        {item.label}
        {hasChildren && <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />}
      </Link>

      <AnimatePresence>
        {hasChildren && open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 min-w-[220px] z-50 shadow-2xl overflow-hidden rounded-b-xl"
            style={{ background: '#1e2a3a' }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {item.children!.map((child, i) => (
              <Link key={i} to={child.href}
                className="flex items-center gap-2 px-5 py-3.5 text-[13px] text-white/80 hover:text-white hover:bg-white/10 transition-colors border-b border-white/5 font-medium"
                onClick={() => {
                  setOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}>
                <ChevronRight className="w-3 h-3 text-green-400 shrink-0" />
                {child.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Header = () => {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  const getActiveId = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/gioi-thieu')) return 'about';
    if (path.startsWith('/duoc-lam-sang') || path.startsWith('/tra-cuu-tuong-hop')) return 'clinical';
    if (path.startsWith('/tra-cuu-tiem-truyen')) return 'search';
    if (path.startsWith('/lien-he')) return 'contact';
    return '';
  };

  const activeNav = getActiveId();

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* ── TẦNG 1: Logo + Thông tin ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between py-3 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0 hover:opacity-90 transition-opacity"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative">
              <div className="w-[48px] h-[48px] sm:w-[60px] sm:h-[60px] rounded-full flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg,#1d4ed8 0%,#0ea5e9 40%,#16a34a 100%)' }}>
                <Pill className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-500 flex items-center justify-center border-2 border-white shadow">
                <span className="text-white font-black" style={{ fontSize: '8px', lineHeight: 1 }}>+</span>
              </div>
            </div>
            <div className="border-l-2 border-gray-100 pl-2.5 sm:pl-3">
              <p className="text-[13px] sm:text-[15px] font-black uppercase tracking-wider leading-snug text-blue-700">KHOA DƯỢC</p>
              <p className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-green-600">TTYT KHU VỰC THANH BA</p>
              <p className="hidden sm:block text-[10px] text-gray-400 font-medium">Tỉnh Phú Thọ</p>
            </div>
          </Link>

          {/* Info cards */}
          <div className="hidden lg:flex items-center gap-3 flex-1 justify-center">
            {[
              { bg: 'bg-blue-600', light: 'bg-blue-50 border-blue-100 hover:bg-blue-100', Icon: Phone, label: 'ĐƯỜNG DÂY NÓNG', val: '0210 656 8197', textColor: 'text-blue-700', labelColor: 'text-blue-400' },
              { bg: 'bg-green-600', light: 'bg-green-50 border-green-100 hover:bg-green-100', Icon: ClipboardList, label: 'GIỜ LÀM VIỆC', val: '7:00 – 17:00 T2–T6', textColor: 'text-green-700', labelColor: 'text-green-500' },
              { bg: 'bg-red-500', light: 'bg-red-50 border-red-100 hover:bg-red-100', Icon: ShieldCheck, label: 'CẤP CỨU THUỐC', val: '24/7 · Luôn sẵn sàng', textColor: 'text-red-600', labelColor: 'text-red-400' },
            ].map((c, i) => (
              <div key={i} className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-colors cursor-pointer ${c.light}`}>
                <div className={`w-9 h-9 rounded-full ${c.bg} flex items-center justify-center shrink-0 shadow-md`}>
                  <c.Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className={`text-[9px] uppercase tracking-widest font-bold ${c.labelColor}`}>{c.label}</p>
                  <p className={`text-[12.5px] font-black leading-tight ${c.textColor}`}>{c.val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-1.5">
              <a href="#" className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all">
                <Facebook className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all">
                <Youtube className="w-3.5 h-3.5" />
              </a>
              <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all">
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>

            <button className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setIsMobileOpen(!isMobileOpen)}>
              {isMobileOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── TẦNG 2: Nav Bar ── */}
      <div className="hidden md:block" style={{ background: '#16a34a' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-stretch">
          {NAV_MENU.map((item) => (
            <NavDropdownItem
              key={item.id}
              item={item}
              active={activeNav === item.id}
              onActivate={() => {}}
            />
          ))}
          <div className="ml-auto flex items-center gap-2 text-white/70 text-[10px] font-medium pr-1">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-200 animate-pulse"></span>
              Hệ thống đang hoạt động
            </span>
            <span className="pl-2 border-l border-white/20">GSP ✓</span>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-white border-t border-gray-100 shadow-2xl max-h-[85vh] overflow-y-auto"
          >
            <div className="px-3 py-2 flex flex-col">
              {NAV_MENU.map((item) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between">
                    <Link to={item.href}
                      className="flex-1 px-3 py-3 text-sm font-black text-gray-800 hover:text-green-700"
                      onClick={() => { if (!item.children) setIsMobileOpen(false); }}>{item.label}</Link>
                    {item.children && (
                      <button className="px-3 py-3" onClick={() => setMobileExpanded(mobileExpanded === item.id ? null : item.id)}>
                        <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', mobileExpanded === item.id && 'rotate-180')} />
                      </button>
                    )}
                  </div>
                  <AnimatePresence>
                    {item.children && mobileExpanded === item.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-gray-50 rounded-xl mb-1">
                        {item.children.map((child, ci) => (
                          <Link key={ci} to={child.href}
                            className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-gray-700 hover:text-green-700 border-b border-gray-100"
                            onClick={() => {
                              setIsMobileOpen(false);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}>
                            <ChevronRight className="w-3 h-3 text-green-500" />{child.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!mobileExpanded || mobileExpanded !== item.id ? (
                    <div className="h-px bg-gray-100 mx-3" />
                  ) : null}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export const Footer = () => (
  <footer className="text-white py-12 md:py-16" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e3a2f 100%)' }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 lg:px-16">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="md:col-span-1">
          <Pill className="w-8 h-8 text-white/50 mb-4" />
          <h3 className="font-serif italic text-xl mb-3">Khoa Dược</h3>
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-6">TTYT Khu vực Thanh Ba</p>
          <p className="text-sm text-white/60 leading-relaxed font-sans">Đảm bảo nguồn cung ứng an toàn, chất lượng và đem niềm tin đến cộng đồng.</p>
        </div>
        {[
          { title: 'Liên kết', links: [
            { label: 'Trang chủ', href: '/' },
            { label: 'Giới thiệu', href: '/gioi-thieu' },
            { label: 'Dược lâm sàng', href: '/duoc-lam-sang' },
            { label: 'Cập nhật chuyên môn', href: '/cap-nhat-chuyen-mon' },
          ]},
          { title: 'Hỗ trợ', links: [
            { label: 'Liên hệ', href: '/lien-he' },
            { label: 'Hướng dẫn GSP', href: '/gioi-thieu#chuc-nang' },
            { label: 'Khiếu nại, góp ý', href: '/lien-he' },
          ]},
          { title: 'Liên hệ', links: [
            { label: '0210 656 8197', href: 'tel:02106568197' },
            { label: 'thuocvabietduoc.bvthanhba@gmail.com', href: 'mailto:thuocvabietduoc.bvthanhba@gmail.com' },
            { label: 'Thứ 2–6: 07:00–17:00', href: '/lien-he' },
            { label: 'Cấp cứu: 24/7', href: '/lien-he' },
          ]},
        ].map((col, i) => (
          <div key={i}>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-6 font-sans">{col.title}</p>
            <ul className="space-y-3">
              {col.links.map((l, j) => (
                <li key={j}><Link to={l.href} className="text-sm text-white/60 hover:text-white transition-colors font-sans">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[10px] text-white/30 font-sans tracking-wider uppercase">© 2024 Khoa Dược – TTYT Thanh Ba</p>
        <div className="flex gap-6">
          {[Facebook, Youtube, Globe].map((Icon, i) => (
            <a key={i} href="#" className="text-white/30 hover:text-white transition-colors"><Icon className="w-4 h-4" /></a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

// Breadcrumb component
interface BreadcrumbItem { label: string; href?: string; }
export const Breadcrumb = ({ items }: { items: BreadcrumbItem[] }) => (
  <div className="flex items-center gap-2 text-sm text-white/60 font-sans">
    {items.map((item, i) => (
      <React.Fragment key={i}>
        {i > 0 && <ChevronRight className="w-3 h-3 text-white/30" />}
        {item.href ? (
          <Link to={item.href} className="hover:text-white transition-colors">{item.label}</Link>
        ) : (
          <span className="text-white font-semibold">{item.label}</span>
        )}
      </React.Fragment>
    ))}
  </div>
);
