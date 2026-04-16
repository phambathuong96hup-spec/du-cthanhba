import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header, Footer, Breadcrumb } from '../components/SharedLayout';
import {
  Search, AlertTriangle, Loader2, Pill, ExternalLink, Activity, ArrowRight, X, FlaskConical, ShieldAlert
} from 'lucide-react';

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx82WBh-KxvMvuGAkDN07lsCJv3gyC059csLAm0Vn9rfe-vMcCMTWRMP6WGwwaKwPMtJw/exec";

// @ts-ignore - any for API data row
type InteractionRow = Record<string, any>;

const getVal = (cell: any) => {
  if (!cell) return '';
  if (typeof cell === 'object' && 'value' in cell) return cell.value || '';
  return cell || '';
};

const renderHtmlText = (text: string, styleConfig?: any) => {
  if (!text) return null;
  const color = styleConfig?.foreground || '#334155'; // default slate-700
  const isBold = styleConfig?.isBold;
  const isItalic = styleConfig?.isItalic;
  const isUnderlined = styleConfig?.isUnderlined;

  return (
    <div 
      className={`text-[15px] leading-relaxed mb-2 ${isBold ? 'font-black' : 'font-medium'} ${isItalic ? 'italic' : ''} ${isUnderlined ? 'underline' : ''}`}
      style={{ color: color !== '#111' && color !== '#000000' && color !== '#000' && color !== '#111111' ? color : undefined }}
      dangerouslySetInnerHTML={{ __html: String(text).replace(/\n/g, '<br/>') }}
    />
  );
};

export default function TuongTacThuoc() {
  const [data, setData] = useState<InteractionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  const [results, setResults] = useState<InteractionRow[] | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchData();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
        searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await fetch(WEB_APP_URL);
      const resData = await res.json();
      
      if (resData?.error) throw new Error(resData.error);
      const arr = Array.isArray(resData) ? resData : [];
      setData(arr);
      
      const suggSet = new Set<string>();
      arr.forEach(row => {
        const hc1 = getVal(row["Thuốc 1"])?.trim();
        const hc2 = getVal(row["Thuốc 2"])?.trim();
        if (hc1) suggSet.add(hc1);
        if (hc2) suggSet.add(hc2);
      });
      setSuggestions(Array.from(suggSet).sort());
      setLoading(false);
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  const filteredSuggestions = query.trim()
    ? suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase()) && !selectedDrugs.includes(s)).slice(0, 10)
    : [];

  const addDrug = (drug: string) => {
    if (!selectedDrugs.includes(drug)) {
      setSelectedDrugs([...selectedDrugs, drug]);
      setResults(null); 
    }
    setQuery('');
    searchInputRef.current?.focus();
    setShowSuggestions(false);
  };

  const removeDrug = (drug: string) => {
    setSelectedDrugs(selectedDrugs.filter(d => d !== drug));
    setResults(null);
  };

  const handleSearch = () => {
    if (selectedDrugs.length < 2) return;

    const matched = data.filter(row => {
      const hc1 = String(getVal(row["Thuốc 1"])).toLowerCase();
      const hc2 = String(getVal(row["Thuốc 2"])).toLowerCase();
      
      for (let i = 0; i < selectedDrugs.length; i++) {
        for (let j = i + 1; j < selectedDrugs.length; j++) {
          const a = selectedDrugs[i].toLowerCase();
          const b = selectedDrugs[j].toLowerCase();
          if ((hc1 === a && hc2 === b) || (hc1 === b && hc2 === a)) {
            return true;
          }
        }
      }
      return false;
    });

    setResults(matched);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ paddingTop: '88px', minHeight: '280px' }}>
        <div className="absolute inset-0">
          <img src={`${import.meta.env.BASE_URL}images/tracuu_tuongtac.png`} alt="Tra cứu tương tác thuốc"
            className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(127,29,29,0.93) 0%, rgba(30,27,75,0.88) 60%, rgba(15,23,42,0.75) 100%)' }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 md:px-8 py-16 md:py-20">
          <Breadcrumb items={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Tra cứu nhanh', href: '/tra-cuu-nhanh' },
            { label: 'Tra cứu tương tác thuốc' },
          ]} />

          <div className="mt-8 flex items-center gap-5 mb-2">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl border border-white/20 backdrop-blur-md"
              style={{ background: 'linear-gradient(135deg, #9f1239, #7c3aed)' }}>
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-rose-400/30 bg-rose-400/10 text-rose-300 text-[10px] font-black uppercase tracking-widest mb-2">
                Cảnh giác an toàn thuốc
              </div>
              <h1 className="font-serif text-white font-bold leading-tight" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 3rem)' }}>
                Tra cứu tương tác thuốc
              </h1>
              <p className="text-rose-100/70 text-sm mt-1 font-medium">
                Phân tích chống chỉ định và tương tác thuốc theo nhóm hoạt chất
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 md:px-8 py-10 -mt-8 relative z-10">
        
        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-8 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-amber-800 text-sm font-semibold">
            Thêm tối thiểu 2 hoạt chất vào danh sách để hệ thống tiến hành kiểm tra tương tác chéo.
          </p>
        </div>

        {/* Loading & Error */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-3xl shadow-sm border border-slate-200">
            <Loader2 className="w-10 h-10 text-rose-600 animate-spin" />
            <p className="text-slate-500 font-semibold">Đang tải biểu ghi dữ liệu tương tác...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-3xl shadow-sm border border-slate-200 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500" />
            <h3 className="text-xl font-bold text-slate-800">Không thể tải dữ liệu</h3>
            <p className="text-slate-500 font-medium">Vui lòng kiểm tra kết nối mạng và thử lại sau.</p>
            <button onClick={fetchData} className="mt-4 px-6 py-2.5 rounded-full bg-rose-600 text-white font-bold hover:bg-rose-700 transition">
              Thử lại
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Search Box */}
            <div className="relative mb-6" ref={suggestionsRef}>
              <div className="relative shadow-lg rounded-2xl border border-slate-200 bg-white flex overflow-hidden focus-within:ring-2 focus-within:ring-rose-500 transition-all">
                <div className="pl-5 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredSuggestions.length > 0) {
                      addDrug(filteredSuggestions[0]);
                    }
                  }}
                  onFocus={() => { if (query.trim()) setShowSuggestions(true); }}
                  placeholder="Nhập hoạt chất để thêm vào danh sách kiểm tra..."
                  className="w-full px-4 py-4 text-base font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
                />
              </div>

              {/* Suggestions */}
              <AnimatePresence>
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-200 rounded-b-2xl shadow-xl overflow-hidden max-h-[250px] overflow-y-auto mt-1"
                  >
                    {filteredSuggestions.map((item, i) => (
                      <button
                        key={i}
                        className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-rose-50 hover:text-rose-700 transition-colors border-b border-slate-50 last:border-0"
                        onClick={() => addDrug(item)}
                      >
                        <Search className="w-4 h-4 text-rose-400 shrink-0" />
                        <span className="text-sm font-semibold">{item}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Selected Drugs Tags */}
            {selectedDrugs.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Đã chọn {selectedDrugs.length} hoạt chất
                  </p>
                  <button onClick={() => { setSelectedDrugs([]); setResults(null); }} className="text-xs font-bold text-red-500 hover:text-red-700">
                    Xóa tất cả
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {selectedDrugs.map(drug => (
                      <motion.div
                        key={drug} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} layout
                        className="flex items-center gap-2 pl-4 pr-2 py-2 rounded-xl bg-white border border-slate-200 shadow-sm"
                      >
                        <FlaskConical className="w-4 h-4 text-rose-700 shrink-0" />
                        <span className="text-sm font-bold text-slate-700">{drug}</span>
                        <button onClick={() => removeDrug(drug)} className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={handleSearch}
                    disabled={selectedDrugs.length < 2}
                    className="flexItemsCenter gap-2 px-8 py-3.5 rounded-full text-white text-sm font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                     style={{ background: selectedDrugs.length >= 2 ? 'linear-gradient(135deg, #e11d48, #9f1239)' : '#cbd5e1' }}
                  >
                    <Activity className="w-5 h-5 inline-block mr-2" />
                    Bắt đầu tra cứu tương tác
                  </button>
                </div>
              </div>
            )}

            {/* Results */}
            {results !== null && (
              <div className="mt-8">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-200 pb-4">
                  <ShieldAlert className="w-6 h-6 text-rose-600" />
                  KẾT QUẢ TƯƠNG TÁC
                  <span className="ml-auto text-sm bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-black">
                    {results.length} cặp tương tác
                  </span>
                </h3>

                {results.length === 0 ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-10 text-center shadow-sm">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Activity className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h4 className="text-xl font-black text-emerald-800 mb-2">An toàn</h4>
                    <p className="text-emerald-700 font-medium">Không tìm thấy thông tin cảnh báo tương tác nào giữa các hoạt chất đã chọn trong cơ sở dữ liệu hiện tại.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {results.map((row, idx) => {
                      const drug1 = getVal(row["Thuốc 1"]);
                      const drug2 = getVal(row["Thuốc 2"]);
                      const severity = getVal(row["Mức độ"]);
                      const isSevere = severity && String(severity).toLowerCase().includes('chống chỉ định');

                      return (
                        <div key={idx} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200">
                          <div className={`px-6 py-4 flex items-center justify-between ${isSevere ? 'bg-red-50 border-b border-red-100' : 'bg-slate-50 border-b border-slate-100'}`}>
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-slate-800 text-white font-black text-xs rounded-lg uppercase tracking-wider">Tương tác {idx + 1}</span>
                              <h4 className="font-bold text-slate-700 text-[15px]">
                                <span className={isSevere ? "text-red-600" : "text-rose-600"}>{drug1}</span>
                                <span className="mx-2 text-slate-400 font-normal">+</span>
                                <span className={isSevere ? "text-red-600" : "text-rose-600"}>{drug2}</span>
                              </h4>
                            </div>
                            {severity && (
                              <div className={`px-3 py-1 rounded-full font-bold text-xs ${isSevere ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-800'}`}>
                                {severity}
                              </div>
                            )}
                          </div>
                          <div className="p-6 md:p-8 space-y-5">
                            {[
                              { title: 'Nhóm tương tác', field: 'Nhóm tương tác' },
                              { title: 'Cơ chế', field: 'Cơ chế' },
                              { title: 'Hậu quả', field: 'Hậu quả' },
                              { title: 'Xử trí', field: 'Xử trí' },
                              { title: 'Nguồn', field: 'Nguồn' }
                            ].map(item => {
                              const val = getVal(row[item.field]);
                              if (!val) return null;
                              return (
                                <div key={item.field} className="flex flex-col md:flex-row gap-2 border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                                  <div className="md:w-1/4 shrink-0 font-black text-sm text-slate-400 uppercase tracking-widest">{item.title}</div>
                                  <div className="md:w-3/4">
                                    {renderHtmlText(val, row[item.field]?.style)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
            {/* Initial empty state */}
            {selectedDrugs.length === 0 && !results && (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <ShieldAlert className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-700 mb-2">Hệ thống phân tích tương tác</h3>
                <p className="text-slate-500 font-medium">Bắt đầu bằng cách tìm kiếm và chọn các hoạt chất phía trên.</p>
              </div>
            )}
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
