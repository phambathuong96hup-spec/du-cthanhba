import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, CalendarDays, User, ArrowRight, ShieldAlert, Stethoscope, FileWarning, Presentation, ClipboardList, Search, Clock } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Header, Footer, Breadcrumb } from '../components/SharedLayout';
import { loadAllArticles, CHUYEN_MON_CATEGORIES } from '../data/articleLoader';

// Category image & color mapping
const CATEGORY_META: Record<string, { img: string; from: string; to: string; accent: string; badgeBg: string }> = {
  'canh-giac-duoc':   { img: '/images/articles/canh-giac-duoc.png',  from: '#dc2626', to: '#991b1b', accent: '#dc2626', badgeBg: 'bg-red-50 text-red-700 border-red-200' },
  'phac-do-dieu-tri': { img: '/images/articles/phac-do-dieu-tri.png', from: '#059669', to: '#065f46', accent: '#059669', badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'phac-do-noi-vien': { img: '/images/articles/phac-do-dieu-tri.png', from: '#0891b2', to: '#0e7490', accent: '#0891b2', badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  'cong-van':         { img: '/images/articles/cong-van.png',         from: '#d97706', to: '#92400e', accent: '#d97706', badgeBg: 'bg-amber-50 text-amber-700 border-amber-200' },
  'tap-huan':         { img: '/images/articles/tap-huan.png',         from: '#7c3aed', to: '#4c1d95', accent: '#7c3aed', badgeBg: 'bg-violet-50 text-violet-700 border-violet-200' },
};

const DEFAULT_META = { img: '', from: '#334155', to: '#1e293b', accent: '#2563eb', badgeBg: 'bg-blue-50 text-blue-700 border-blue-200' };

export const CapNhatChuyenMon = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [activeSourceType, setActiveSourceType] = useState<string>('all');
  const [searchQ, setSearchQ] = useState('');
  const articles = loadAllArticles();

  useEffect(() => { setActiveSourceType('all'); }, [activeTab]);

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && CHUYEN_MON_CATEGORIES.some(cat => cat.id === hash)) {
      setActiveTab(hash);
    } else if (!hash) {
      setActiveTab('all');
    }
  }, [location.hash]);

  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0);
    document.title = 'Cập nhật chuyên môn | Khoa Dược - TTYT Thanh Ba';
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', 'Tổng hợp các bài viết, báo cáo lâm sàng và tin tức chuyên ngành Dược nhằm nâng cao năng lực chuyên môn.');
  }, []);

  const filteredArticles = articles.filter(a => {
    if (activeTab !== 'all' && a.categoryId !== activeTab) return false;
    if (activeTab === 'phac-do-noi-vien' && activeSourceType !== 'all') {
      if (a.sourceType !== activeSourceType) return false;
    }
    if (searchQ && !a.title.toLowerCase().includes(searchQ.toLowerCase()) && !a.summary.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  const icons: Record<string, React.ReactNode> = {
    'canh-giac-duoc':   <ShieldAlert className="w-4 h-4" />,
    'phac-do-dieu-tri': <Stethoscope className="w-4 h-4" />,
    'phac-do-noi-vien': <ClipboardList className="w-4 h-4" />,
    'cong-van':         <FileWarning className="w-4 h-4" />,
    'tap-huan':         <Presentation className="w-4 h-4" />,
  };

  // Split featured (first) from rest
  const [featured, ...rest] = filteredArticles;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-grow pt-[100px] pb-16">

        {/* ── HERO HEADER ── */}
        <div className="bg-white pt-10 pb-16 relative overflow-hidden border-b border-slate-100">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#eff6ff_0%,_transparent_60%)]" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-50/80 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
            <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Cập nhật chuyên môn' }]} />

            <div className="mt-8 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8">
              <div>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-100 bg-blue-50/60 text-blue-700 text-xs font-bold uppercase tracking-widest mb-5 shadow-sm">
                  <BookOpen className="w-3.5 h-3.5" />
                  Góc Chia Sẻ & Tài Liệu
                </motion.div>
                <h1 className="font-serif text-slate-900 leading-tight" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
                  Cập Nhật{' '}
                  <span style={{ background: 'linear-gradient(90deg,#2563eb,#059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Chuyên Môn
                  </span>
                </h1>
                <p className="text-slate-500 mt-3 text-base max-w-xl leading-relaxed">
                  Tổng hợp phác đồ, báo cáo lâm sàng và tin tức chuyên ngành Dược.
                </p>
              </div>

              {/* Search box */}
              <div className="relative w-full lg:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài viết..."
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 shadow-sm transition-all font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── STICKY FILTERS ── */}
        <div className="sticky top-[100px] z-30 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm">
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-3 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => { setActiveTab('all'); window.history.replaceState(null, '', window.location.pathname); }}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  activeTab === 'all'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}>
                Tất cả ({articles.length})
              </button>

              {CHUYEN_MON_CATEGORIES.map(cat => {
                const meta = CATEGORY_META[cat.id] ?? DEFAULT_META;
                const count = articles.filter(a => a.categoryId === cat.id).length;
                return (
                  <button key={cat.id}
                    onClick={() => { setActiveTab(cat.id); window.history.replaceState(null, '', `#${cat.id}`); }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                      activeTab === cat.id
                        ? `${meta.badgeBg} border-current shadow-sm`
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}>
                    {icons[cat.id]}
                    {cat.name}
                    <span className="ml-1 opacity-60">({count})</span>
                  </button>
                );
              })}

              <span className="ml-auto text-xs text-slate-400 font-medium hidden lg:block">
                {filteredArticles.length} bài viết
              </span>
            </div>

            <AnimatePresence>
              {activeTab === 'phac-do-noi-vien' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="flex flex-wrap items-center gap-2 overflow-hidden">
                  <span className="text-xs font-bold text-slate-500 pr-1">Nguồn ban hành:</span>
                  {['all', 'Tại trung tâm', 'Bộ Y tế', 'Hiệp hội'].map(src => (
                    <button key={src} onClick={() => setActiveSourceType(src)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                        activeSourceType === src
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200'
                      }`}>
                      {src === 'all' ? 'Tất cả' : src}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── ARTICLES ── */}
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 mt-8">
          {filteredArticles.length === 0 ? (
            <div className="py-24 text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 text-lg font-semibold">Không tìm thấy bài viết nào.</p>
              <p className="text-slate-400 text-sm mt-2">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm.</p>
            </div>
          ) : (
            <motion.div layout>
              {/* ── FEATURED CARD (first article) ── */}
              {featured && (
                <motion.div
                  layout key={featured.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                  whileHover={{ y: -4 }}
                  className="group relative rounded-3xl overflow-hidden bg-white shadow-sm hover:shadow-2xl hover:shadow-slate-200/80 border border-slate-100 mb-6 transition-all duration-500 flex flex-col lg:flex-row"
                  style={{ minHeight: '340px' }}>

                  {/* Left: Image */}
                  <Link to={`/cap-nhat-chuyen-mon/${featured.id}`}
                    className="relative w-full lg:w-[45%] xl:w-[40%] shrink-0 overflow-hidden" style={{ minHeight: '220px' }}>
                    {(() => {
                      const meta = CATEGORY_META[featured.categoryId] ?? DEFAULT_META;
                      const catInfo = CHUYEN_MON_CATEGORIES.find(c => c.id === featured.categoryId);
                      return featured.image ? (
                        <img src={featured.image} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 absolute inset-0" />
                      ) : meta.img ? (
                        <img src={meta.img} alt={catInfo?.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 absolute inset-0 opacity-90" />
                      ) : (
                        <div className="w-full h-full absolute inset-0 flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${meta.from}, ${meta.to})` }}>
                          <div className="text-white flex flex-col items-center gap-2 opacity-70">
                            {icons[featured.categoryId]}
                            <span className="text-xs font-bold uppercase tracking-widest">{catInfo?.name}</span>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5" />
                    {/* Featured badge */}
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-[10px] font-black uppercase tracking-widest shadow-lg"
                        style={{ color: (CATEGORY_META[featured.categoryId] ?? DEFAULT_META).accent }}>
                        {icons[featured.categoryId]}
                        {CHUYEN_MON_CATEGORIES.find(c => c.id === featured.categoryId)?.name}
                      </span>
                    </div>
                  </Link>

                  {/* Right: Content */}
                  <div className="flex-1 p-6 lg:p-8 xl:p-10 flex flex-col justify-center">
                    <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">Bài nổi bật</span>
                      <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{new Date(featured.date).toLocaleDateString('vi-VN')}</span>
                    </div>

                    <Link to={`/cap-nhat-chuyen-mon/${featured.id}`}>
                      <h2 className="font-serif text-slate-900 font-bold leading-snug mb-4 group-hover:text-blue-700 transition-colors"
                        style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.25rem)' }}>
                        {featured.title}
                      </h2>
                    </Link>

                    <p className="text-slate-500 text-base leading-relaxed mb-6 line-clamp-3">
                      {featured.summary}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-5 border-t border-slate-100">
                      <div className="flex items-center gap-2.5 text-sm text-slate-500 font-semibold">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                        {featured.author}
                      </div>
                      <Link to={`/cap-nhat-chuyen-mon/${featured.id}`}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm text-white hover:scale-105 transition-all shadow-md"
                        style={{ background: `linear-gradient(135deg, ${(CATEGORY_META[featured.categoryId] ?? DEFAULT_META).from}, ${(CATEGORY_META[featured.categoryId] ?? DEFAULT_META).to})` }}>
                        Đọc bài viết <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── REST: 2-column wide grid ── */}
              {rest.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {rest.map((article, idx) => {
                      const catInfo = CHUYEN_MON_CATEGORIES.find(c => c.id === article.categoryId);
                      const meta = CATEGORY_META[article.categoryId] ?? DEFAULT_META;

                      return (
                        <motion.div key={article.id} layout
                          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
                          transition={{ duration: 0.22, delay: idx * 0.04 }}
                          whileHover={{ y: -5 }}
                          className="group flex flex-col sm:flex-row bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-slate-200/70 overflow-hidden transition-all duration-500 border border-slate-100">

                          {/* Thumbnail */}
                          <Link to={`/cap-nhat-chuyen-mon/${article.id}`}
                            className="relative w-full sm:w-48 xl:w-56 h-44 sm:h-auto shrink-0 overflow-hidden">
                            {article.image ? (
                              <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 absolute inset-0" />
                            ) : meta.img ? (
                              <img src={meta.img} alt={catInfo?.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 absolute inset-0 opacity-90" />
                            ) : (
                              <div className="w-full h-full absolute inset-0 flex items-center justify-center"
                                style={{ background: `linear-gradient(135deg, ${meta.from}, ${meta.to})` }}>
                                <div className="text-white flex flex-col items-center gap-2 opacity-70">
                                  {icons[article.categoryId]}
                                </div>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5" />
                          </Link>

                          {/* Content */}
                          <div className="flex-1 p-5 xl:p-6 flex flex-col min-w-0">
                            <div className="flex items-center gap-2 mb-2.5">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${meta.badgeBg}`}>
                                {icons[article.categoryId]}
                                {catInfo?.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 ml-auto shrink-0">
                                <Clock className="w-3 h-3" />
                                {new Date(article.date).toLocaleDateString('vi-VN')}
                              </span>
                            </div>

                            <Link to={`/cap-nhat-chuyen-mon/${article.id}`}>
                              <h3 className="font-serif text-slate-900 text-base xl:text-lg font-bold leading-snug mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
                                {article.title}
                              </h3>
                            </Link>

                            <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 flex-grow mb-4">
                              {article.summary}
                            </p>

                            <div className="flex items-center justify-between mt-auto pt-3.5 border-t border-slate-100">
                              <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                                  <User className="w-3 h-3 text-slate-400" />
                                </div>
                                <span className="line-clamp-1 max-w-[120px]">{article.author}</span>
                              </div>
                              <Link to={`/cap-nhat-chuyen-mon/${article.id}`}
                                className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider group-hover:gap-2 transition-all"
                                style={{ color: meta.accent }}>
                                Đọc tiếp <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
