import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, User, Clock, Share2, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Header, Footer, Breadcrumb } from '../components/SharedLayout';
import { loadAllArticles } from '../data/articleLoader';

export const CapNhatChuyenMonDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const articles = loadAllArticles();
  const article = articles.find(a => a.id === id);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Update Document Head
    if (article) {
      document.title = `${article.title} | Khoa Dược - TTYT Thanh Ba`;
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', article.summary || article.title);
    } else {
      document.title = "Không tìm thấy bài viết | Khoa Dược - TTYT Thanh Ba";
    }
  }, [id, article]);

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Header />
        <main className="flex-grow pt-[100px] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Lỗi tải bài viết</h2>
            <p className="text-slate-500 mb-6">Bài viết không tồn tại hoặc đã bị xóa.</p>
            <button onClick={() => navigate('/cap-nhat-chuyen-mon')} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">
              Quay lại danh sách
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />
      
      <main className="flex-grow pt-[88px] pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-4 pt-4">
            <Breadcrumb items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Cập nhật chuyên môn', href: '/cap-nhat-chuyen-mon' },
              { label: article.categoryName }
            ]} />
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
            {/* Header Bài Viết */}
            <div className={`px-8 py-6 md:px-10 md:py-8 border-b border-slate-100 relative overflow-hidden ${article.image ? 'text-white' : 'bg-slate-900 text-white'}`}>
               {article.image ? (
                 <div className="absolute inset-0 z-0">
                   <img src={article.image} alt="" className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />
                 </div>
               ) : (
                 <div className="absolute inset-0 bg-blue-900/20" style={{ backgroundImage: "radial-gradient(ellipse at top right, rgba(37,99,235,0.4), transparent 60%)" }} />
               )}
              
               <div className="relative z-10">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider rounded-lg border border-blue-500/30 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" /> {article.categoryName}
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-300 text-sm font-medium">
                      <CalendarDays className="w-4 h-4" /> {new Date(article.date).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <h1 className="text-2xl md:text-4xl font-black leading-tight text-white mb-4">
                    {article.title}
                  </h1>

                  <div className="flex items-center justify-between border-t border-slate-700 pt-4 mt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-300" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">{article.author}</div>
                        {article.reporter && <div className="text-xs text-slate-400">{article.reporter}</div>}
                      </div>
                    </div>
                    <button className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 transition">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
               </div>
            </div>

            {/* Nội dung Bài Viết */}
            <div className="px-8 py-6 md:px-10 md:py-8">
              <div className="prose prose-base prose-slate max-w-none
                prose-headings:font-bold prose-headings:text-slate-800
                prose-h2:text-xl prose-h2:mt-7 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-slate-100
                prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-5
                prose-a:text-blue-600 hover:prose-a:text-blue-800
                prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-4
                prose-strong:text-slate-800 prose-strong:font-bold
                prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-slate-700
                prose-img:rounded-xl prose-img:shadow-lg prose-img:my-6 prose-img:w-full prose-img:object-cover prose-img:max-h-[400px]
                [&_table]:w-full [&_table]:border-collapse [&_table]:mb-6 [&_table]:shadow-sm
                [&_th]:bg-slate-100 [&_th]:p-3 [&_th]:border [&_th]:border-slate-300 [&_th]:text-slate-800 [&_th]:font-bold [&_th]:text-left [&_th]:text-sm
                [&_td]:p-3 [&_td]:border [&_td]:border-slate-200 [&_td]:text-slate-700 [&_td]:text-sm
                [&_tr:hover]:bg-slate-50/50"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                  {article.content}
                </ReactMarkdown>
              </div>
            </div>
            
            {/* Footer Navigation */}
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
               <Link to="/cap-nhat-chuyen-mon" className="flex items-center gap-2 text-slate-600 font-semibold hover:text-blue-600 transition">
                  <ArrowLeft className="w-5 h-5" /> Quay lại danh mục
               </Link>
            </div>
          </div>

        </div>
      </main>
      
      <Footer />
    </div>
  );
};
