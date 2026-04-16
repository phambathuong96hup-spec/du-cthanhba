import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header, Footer, Breadcrumb } from '../components/SharedLayout';
import {
  Search, AlertTriangle, Loader2, Pill, ExternalLink,
  ChevronDown, ChevronUp, SortAsc, Activity, ArrowLeft
} from 'lucide-react';

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzUCq2ocFcC8PYgxoURJ8ifXYuiIytKIsdvSzLVaBx99-_5impQ6Kh6OX3SS90uyt0p/exec";

const FIELD_GROUPS = {
  "THÔNG TIN CHUNG": ["TÊN BIỆT DƯỢC", "HOẠT CHẤT", "NHÓM DƯỢC LÝ", "HÀM LƯỢNG", "DẠNG BÀO CHẾ", "XUẤT XỨ", "GIÁ (VND)"],
  "CHỈ ĐỊNH & LIỀU DÙNG": ["CHỈ ĐỊNH", "LIỀU DÙNG", "CÁCH DÙNG", "LƯU Ý ĐỐI TƯỢNG ĐẶC BIỆT: PNCT, CCB, TRẺ EM..."],
  "AN TOÀN THUỐC": ["CHỐNG CHỈ ĐỊNH - THẬN TRỌNG", "TƯƠNG TÁC THUỐC", "TÁC DỤNG KHÔNG MONG MUỐN"],
  "THÔNG TIN KHÁC": ["DƯỢC ĐỘNG HỌC - DƯỢC LỰC HỌC", "KHO THUỐC", "TỶ LỆ THANH TOÁN BHYT-TT20", "LƯU Ý"]
};

// @ts-ignore - any for API data row
type DrugRow = Record<string, any>;

const getValue = (row: DrugRow, key: string) => {
  if (!row) return "";
  let val = row[key];
  if (typeof val === "object" && val !== null && val.value !== undefined) return val.value;
  return val ? String(val).trim() : "";
};

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

const toTitleCase = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    .replace("vnd", "VND").replace("bhyt", "BHYT").replace("tt20", "TT20")
    .replace("pnct", "PNCT").replace("ccb", "CCB");
};

// URL parser for values
const processTextWithLink = (text: string) => {
  if (!text) return <></>;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return (
    <>
      {parts.map((part, i) => {
        if (part.match(urlRegex)) {
          return (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1">
              <ExternalLink className="w-3.5 h-3.5" /> Xem tài liệu
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

export default function TraCuuThuoc() {
  const [data, setData] = useState<DrugRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [viewState, setViewState] = useState<'initial' | 'alpha' | 'list' | 'detail'>('initial');
  const [currentAlpha, setCurrentAlpha] = useState('');
  const [listResults, setListResults] = useState<DrugRow[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<DrugRow | null>(null);
  
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
      if (!Array.isArray(resData)) throw new Error("Invalid format");
      
      setData(resData);
      
      const suggSet = new Set<string>();
      resData.forEach(row => {
        const hc = getValue(row, "HOẠT CHẤT");
        const bd = getValue(row, "TÊN BIỆT DƯỢC");
        if (hc) suggSet.add(hc);
        if (bd) suggSet.add(bd);
      });
      setSuggestions(Array.from(suggSet).sort());
      
      setLoading(false);
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    const q = normalize(term);
    setShowSuggestions(false);
    
    if (!q) {
      setViewState('initial');
      return;
    }

    // Try to record search asynchronously
    try {
      fetch(`${WEB_APP_URL}?action=recordSearch&term=${encodeURIComponent(q)}`).catch(() => {});
    } catch (e) {}

    const results = data.filter(row => 
      normalize(String(getValue(row, "HOẠT CHẤT"))).includes(q) || 
      normalize(String(getValue(row, "TÊN BIỆT DƯỢC"))).includes(q)
    );

    if (results.length === 1) {
      setSelectedDrug(results[0]);
      setViewState('detail');
    } else {
      setListResults(results);
      setViewState('list');
    }
  };

  const handleLetterClick = (letter: string) => {
    setCurrentAlpha(letter);
    const results = data.filter(row => {
      const name = String(getValue(row, "TÊN BIỆT DƯỢC")).toUpperCase();
      return name.startsWith(letter);
    });
    setListResults(results);
    setViewState('alpha');
  };

  const goBack = () => {
    if (viewState === 'detail') {
      if (listResults.length > 1) {
        setViewState(currentAlpha ? 'alpha' : 'list');
      } else {
        setViewState('initial');
        setQuery('');
      }
    } else {
      setViewState('initial');
      setQuery('');
      setCurrentAlpha('');
    }
  };

  const filteredSuggestions = query.trim()
    ? suggestions.filter(s => normalize(s).includes(normalize(query))).slice(0, 10)
    : [];

  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ paddingTop: '88px', minHeight: '280px' }}>
        {/* Background image */}
        <div className="absolute inset-0">
          <img src="/images/tracuu_thongtinthuoc.png" alt="Tra cứu thông tin thuốc"
            className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(30,58,138,0.92) 0%, rgba(15,23,42,0.85) 60%, rgba(15,23,42,0.7) 100%)' }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 md:px-8 py-16 md:py-20">
          <Breadcrumb items={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Tra cứu nhanh', href: '/tra-cuu-nhanh' },
            { label: 'Tra cứu thông tin thuốc' },
          ]} />

          <div className="mt-8 flex items-center gap-5 mb-2">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl border border-white/20 backdrop-blur-md"
              style={{ background: 'linear-gradient(135deg, #1e40af, #2563eb)' }}>
              <Pill className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-400/30 bg-blue-400/10 text-blue-300 text-[10px] font-black uppercase tracking-widest mb-2">
                Cơ sở dữ liệu thuốc
              </div>
              <h1 className="font-serif text-white font-bold leading-tight" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 3rem)' }}>
                Tra cứu thông tin thuốc
              </h1>
              <p className="text-blue-100/70 text-sm mt-1 font-medium">
                Hệ thống dữ liệu thuốc áp dụng tại TTYT Khu vực Thanh Ba
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
            Thông tin mang tính tham khảo nội bộ theo tờ hướng dẫn sử dụng sản phẩm.
          </p>
        </div>

        {/* Loading & Error */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-2xl shadow-sm border border-slate-200">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-slate-500 font-semibold">Đang tải biểu ghi thuốc...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500" />
            <h3 className="text-xl font-bold text-slate-800">Không thể tải dữ liệu</h3>
            <p className="text-slate-500 font-medium">Vui lòng kiểm tra kết nối mạng và thử lại sau.</p>
            <button
              onClick={fetchData}
              className="mt-4 px-6 py-2.5 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Loaded Core */}
        {!loading && !error && (
          <>
            {/* Search Box - Only show if not detailing? No, keep it always available */}
            <div className="relative mb-8" ref={suggestionsRef}>
              <div className="relative shadow-lg rounded-2xl border border-slate-200 bg-white flex overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all">
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
                    if (e.key === 'Enter') handleSearch(query);
                  }}
                  onFocus={() => { if (query.trim()) setShowSuggestions(true); }}
                  placeholder="Nhập tên biệt dược hoặc hoạt chất..."
                  className="w-full px-4 py-4 text-base font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
                />
                <button
                  onClick={() => handleSearch(query)}
                  className="px-8 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
                >
                  Tìm kiếm
                </button>
              </div>

              {/* Suggestions */}
              <AnimatePresence>
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-200 rounded-b-2xl shadow-xl overflow-hidden max-h-[300px] overflow-y-auto mt-1"
                  >
                    {filteredSuggestions.map((item, i) => (
                      <button
                        key={i}
                        className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0"
                        onClick={() => {
                          setQuery(item);
                          handleSearch(item);
                        }}
                      >
                        <Search className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="text-sm font-semibold text-slate-700">{item}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* View State: Initial */}
            {viewState === 'initial' && (
              <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200 text-center">
                <SortAsc className="w-16 h-16 text-slate-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Tra cứu nhanh theo A-Z</h3>
                <p className="text-slate-500 font-medium mb-8">
                  Chọn ký tự bắt đầu của tên thuốc (Tên biệt dược) để xem danh sách tương ứng
                </p>
                
                <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
                  {ALPHABET.map(letter => (
                    <button
                      key={letter}
                      onClick={() => handleLetterClick(letter)}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all font-serif text-lg flex items-center justify-center bg-slate-50 shadow-sm hover:shadow-md"
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* View State: List or Alpha */}
            {(viewState === 'list' || viewState === 'alpha') && (
              <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 min-h-[400px]">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                  <h3 className="text-xl font-bold text-slate-800">
                    {viewState === 'alpha' ? `Thuốc bắt đầu bằng '${currentAlpha}'` : `Kết quả tìm kiếm cho '${query}'`}
                    <span className="ml-2 text-sm font-medium px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full">
                      {listResults.length} kết quả
                    </span>
                  </h3>
                  <button onClick={goBack} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> Quay lại
                  </button>
                </div>

                {listResults.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-slate-500 font-medium text-lg">Không tìm thấy thuốc nào phù hợp.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {listResults.map((drug, idx) => {
                      const bd = getValue(drug, "TÊN BIỆT DƯỢC") || "Không có tên";
                      const hc = getValue(drug, "HOẠT CHẤT") || "Chưa rõ phân loại";
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => { setSelectedDrug(drug); setViewState('detail'); }}
                          className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all text-left group"
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <Pill className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-800 text-base mb-1 group-hover:text-blue-700 transition-colors uppercase">{bd}</h4>
                            <p className="text-sm text-slate-500 font-medium">{hc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* View State: Detail */}
            {viewState === 'detail' && selectedDrug && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                
                {/* Header Card */}
                <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
                  
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tight pr-4">
                      {getValue(selectedDrug, "TÊN BIỆT DƯỢC")}
                    </h2>
                    <button onClick={goBack} className="shrink-0 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-sm font-bold flex items-center gap-2 transition-colors">
                      <ArrowLeft className="w-4 h-4" /> Đóng
                    </button>
                  </div>
                  
                  <p className="text-lg font-bold text-blue-600 mb-4">{getValue(selectedDrug, "HOẠT CHẤT")}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {getValue(selectedDrug, "NHÓM DƯỢC LÝ") && (
                      <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black rounded-lg">
                        {getValue(selectedDrug, "NHÓM DƯỢC LÝ")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Accordions */}
                <div className="space-y-4">
                  {Object.entries(FIELD_GROUPS).map(([groupName, fields]) => {
                    // Check if group has data
                    const hasData = fields.some(f => {
                      if (f === "TÊN BIỆT DƯỢC" || f === "HOẠT CHẤT") return false;
                      const val = getValue(selectedDrug, f);
                      return val && val !== "-" && val !== "0";
                    });

                    if (!hasData) return null;

                    // Detail Link logic for General Info
                    const rawLink = getValue(selectedDrug, "TÀI LIỆU THAM KHẢO");
                    const urlMatch = rawLink.match(/(https?:\/\/[^\s]+)/);
                    const detailUrl = urlMatch ? urlMatch[0] : "";

                    return (
                      <Accordion key={groupName} title={groupName} defaultOpen={groupName === "THÔNG TIN CHUNG"} extraLink={groupName === "THÔNG TIN CHUNG" ? detailUrl : ""}>
                        <div className="divide-y divide-slate-100">
                          {fields.map(field => {
                            if (field === "TÊN BIỆT DƯỢC" || field === "HOẠT CHẤT") return null;
                            const val = getValue(selectedDrug, field);
                            if (!val || val === "-" || val === "0") return null;

                            return (
                              <div key={field} className="py-4 px-5 md:px-6 flex flex-col md:flex-row gap-2 md:gap-6 hover:bg-slate-50 transition-colors">
                                <div className="md:w-1/3 shrink-0 text-slate-800 font-black text-sm uppercase tracking-wide">
                                  {toTitleCase(field)}
                                </div>
                                <div className="md:w-2/3 text-slate-600 text-[15px] leading-relaxed font-medium">
                                  {processTextWithLink(val)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Accordion>
                    );
                  })}
                </div>
              </motion.div>
            )}

          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
}

// Reusable Accordion
function Accordion({ title, children, defaultOpen = false, extraLink = "" }: { title: string, children: React.ReactNode, defaultOpen?: boolean, extraLink?: string }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div 
        className={`px-6 py-4 flex items-center justify-between cursor-pointer select-none transition-colors ${open ? 'bg-slate-50 border-b border-slate-100' : 'hover:bg-slate-50'}`}
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-4">
          <h3 className="font-black text-slate-800 tracking-wide text-base">{title}</h3>
          {extraLink && (
            <a 
              href={extraLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full hover:bg-blue-200 transition-colors inline-flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3" /> Bản gốc
            </a>
          )}
        </div>
        <div className={`p-1 rounded-full ${open ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
          {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-white">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
