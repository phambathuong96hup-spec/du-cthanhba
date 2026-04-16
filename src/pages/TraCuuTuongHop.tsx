import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Header, Footer, Breadcrumb } from '../components/SharedLayout';
import {
  Search, AlertTriangle, ChevronRight, Loader2, Plus, X, Trash2,
  FlaskConical, ShieldCheck, AlertCircle, HelpCircle, Syringe, ArrowRight
} from 'lucide-react';

// --- Types ---
interface IncompatibilityPair {
  drug1: string;
  drug2: string;
  status: 'compatible' | 'incompatible' | 'unknown' | 'controversial';
}

interface ApiData {
  incompatibilities: IncompatibilityPair[];
}

type CompatStatus = 'compatible' | 'incompatible' | 'unknown' | 'controversial' | 'self' | 'none';

// --- Constants ---
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx0Ed4XoCjGAh4wr9FoQEqQw0wcMv8JOdEdtkPxCUTQhtzPnktneIMlbS2ponjhmHTYLg/exec';

const STATUS_CONFIG: Record<CompatStatus, { label: string; code: string; bg: string; text: string; border: string }> = {
  compatible: { label: 'Tương hợp', code: 'C', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  incompatible: { label: 'Tương kỵ', code: 'I', bg: 'bg-red-500', text: 'text-white', border: 'border-red-600' },
  unknown: { label: 'Không có thông tin', code: 'N', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  controversial: { label: 'Mâu thuẫn', code: 'V', bg: 'bg-orange-400', text: 'text-white', border: 'border-orange-500' },
  self: { label: '', code: '–', bg: 'bg-slate-700', text: 'text-white', border: 'border-slate-600' },
  none: { label: '', code: '', bg: 'bg-slate-50', text: 'text-slate-300', border: 'border-slate-100' },
};

// --- Helpers ---
const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

// --- Sub-components ---

const Legend = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-wrap items-center justify-center gap-3 mt-6 mb-2"
  >
    {[
      { status: 'compatible' as CompatStatus, icon: <ShieldCheck className="w-3.5 h-3.5" /> },
      { status: 'incompatible' as CompatStatus, icon: <AlertTriangle className="w-3.5 h-3.5" /> },
      { status: 'unknown' as CompatStatus, icon: <HelpCircle className="w-3.5 h-3.5" /> },
      { status: 'controversial' as CompatStatus, icon: <AlertCircle className="w-3.5 h-3.5" /> },
    ].map(({ status, icon }) => {
      const cfg = STATUS_CONFIG[status];
      return (
        <span
          key={status}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
        >
          {icon}
          {cfg.code}: {cfg.label}
        </span>
      );
    })}
  </motion.div>
);

const CompatibilityCell = ({ status }: { status: CompatStatus }) => {
  const cfg = STATUS_CONFIG[status];
  
  if (status === 'self') {
    return (
      <td className="p-2 border border-slate-100 bg-slate-50/50 text-center align-middle">
        <div className="w-12 h-12 mx-auto rounded-xl bg-slate-200/40"></div>
      </td>
    );
  }

  if (status === 'none') {
    return (
      <td className="p-2 border border-slate-100 text-center align-middle">
        <div className="w-12 h-12 mx-auto rounded-xl"></div>
      </td>
    );
  }

  return (
    <td className="p-2 border border-slate-100 text-center align-middle">
      <div 
        title={cfg.label} 
        className={`mx-auto w-12 h-12 flex items-center justify-center rounded-xl font-bold text-base transition-transform hover:scale-110 cursor-help ${cfg.bg} ${cfg.text} ${cfg.border} border shadow-sm`}
      >
        {cfg.code}
      </div>
    </td>
  );
};

const DrugTag = ({ name, onRemove }: { name: string; onRemove: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    layout
    className="flex items-center gap-2 pl-4 pr-2 py-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow group"
  >
    <FlaskConical className="w-3.5 h-3.5 text-green-600 shrink-0" />
    <span className="text-sm font-bold text-slate-700 whitespace-nowrap">{name}</span>
    <button
      onClick={onRemove}
      className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors shrink-0"
    >
      <X className="w-3.5 h-3.5" />
    </button>
  </motion.div>
);

// --- Main Component ---
export default function TraCuuTuongHop() {
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [drugList, setDrugList] = useState<string[]>([]);
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [matrixError, setMatrixError] = useState('');
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchData();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)) {
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
      const data: ApiData = await res.json();
      setApiData(data);

      const drugs = [...new Set(
        data.incompatibilities.flatMap(item => [item.drug1, item.drug2])
      )].sort();
      setDrugList(drugs);
      setLoading(false);
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  const addDrug = (drug: string) => {
    if (!selectedDrugs.includes(drug)) {
      setSelectedDrugs(prev => [...prev, drug]);
    }
    setQuery('');
    setShowSuggestions(false);
    setShowMatrix(false);
    setMatrixError('');
    inputRef.current?.focus();
  };

  const removeDrug = (drug: string) => {
    setSelectedDrugs(prev => prev.filter(d => d !== drug));
    setShowMatrix(false);
    setMatrixError('');
  };

  const clearAll = () => {
    setSelectedDrugs([]);
    setShowMatrix(false);
    setMatrixError('');
  };

  const getCompatStatus = useCallback((drug1: string, drug2: string): CompatStatus => {
    if (drug1 === drug2) return 'self';
    if (!apiData) return 'none';

    const pair = apiData.incompatibilities.find(item =>
      (normalize(item.drug1) === normalize(drug1) && normalize(item.drug2) === normalize(drug2)) ||
      (normalize(item.drug1) === normalize(drug2) && normalize(item.drug2) === normalize(drug1))
    );

    if (!pair) return 'none';
    return pair.status;
  }, [apiData]);

  const searchCompatibility = () => {
    if (selectedDrugs.length < 2) {
      setMatrixError('Vui lòng chọn ít nhất 2 hoạt chất để tra cứu tương hợp');
      setShowMatrix(false);
      return;
    }
    setMatrixError('');
    setShowMatrix(true);
  };

  const filteredSuggestions = query.trim()
    ? drugList.filter(d =>
      normalize(d).includes(normalize(query)) && !selectedDrugs.includes(d)
    ).slice(0, 10)
    : [];

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-green-100 selection:text-green-900">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ paddingTop: '88px', minHeight: '280px' }}>
        <div className="absolute inset-0">
          <img src="/images/tracuu_tuonghop.png" alt="Tra cứu tương hợp Y-site"
            className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(120,53,15,0.93) 0%, rgba(15,23,42,0.88) 60%, rgba(15,23,42,0.75) 100%)' }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 md:px-8 py-16 md:py-20">
          <Breadcrumb items={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Tra cứu nhanh', href: '/tra-cuu-nhanh' },
            { label: 'Tra cứu tương hợp - tương kỵ' },
          ]} />

          <div className="mt-8 flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl border border-white/20 backdrop-blur-md"
              style={{ background: 'linear-gradient(135deg, #d97706, #059669)' }}>
              <FlaskConical className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 text-[10px] font-black uppercase tracking-widest mb-2">
                Y-site Compatibility
              </div>
              <h1 className="font-serif text-white font-bold leading-tight" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 3rem)' }}>
                Tra cứu{' '}
                <em className="not-italic" style={{ background: 'linear-gradient(90deg, #fcd34d, #86efac)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  tương hợp – tương kỵ
                </em>
              </h1>
              <p className="text-white/60 text-sm mt-1 font-medium">
                Tra cứu thông tin tương hợp tương kỵ thuốc theo Y-site
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 md:px-8 py-10 -mt-6 relative z-10">
        {/* Warning */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 py-3 px-6 rounded-2xl border border-emerald-200/60 mb-8"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(34,197,94,0.05) 100%)' }}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-emerald-800 text-sm font-semibold">
            Chọn ít nhất 2 hoạt chất để tra cứu bảng tương hợp – tương kỵ theo Y-site
          </p>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
            <p className="text-slate-500 font-semibold">Đang tải dữ liệu tương hợp tương kỵ...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Đã xảy ra lỗi khi tải dữ liệu</h3>
            <p className="text-slate-500 font-medium">Vui lòng kiểm tra kết nối mạng và thử lại</p>
            <button
              onClick={fetchData}
              className="mt-2 px-6 py-2.5 rounded-full text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all"
              style={{ background: 'linear-gradient(135deg, #16a34a, #1d4ed8)' }}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Loaded content */}
        {!loading && !error && (
          <>
            {/* Search Input */}
            <div className="relative mb-6">
              <div className="relative shadow-xl rounded-2xl overflow-visible border border-slate-200 bg-white">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  ref={inputRef}
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
                  placeholder="Nhập hoạt chất để thêm vào danh sách..."
                  className="w-full pl-14 pr-6 py-5 text-base font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
                />
              </div>

              {/* Suggestions */}
              <AnimatePresence>
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <motion.div
                    ref={suggestionsRef}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-200 rounded-b-2xl shadow-2xl overflow-hidden max-h-[280px] overflow-y-auto"
                  >
                    {filteredSuggestions.map((item, i) => (
                      <button
                        key={i}
                        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-green-50 transition-colors border-b border-slate-50 last:border-0"
                        onClick={() => addDrug(item)}
                      >
                        <Plus className="w-4 h-4 text-green-600 shrink-0" />
                        <span className="text-sm font-semibold text-slate-700">{item}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Selected drugs / Tags */}
            {selectedDrugs.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Đã chọn {selectedDrugs.length} hoạt chất
                  </p>
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {selectedDrugs.map(drug => (
                      <DrugTag key={drug} name={drug} onRemove={() => removeDrug(drug)} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              <button
                onClick={searchCompatibility}
                disabled={selectedDrugs.length < 2}
                className="flex items-center gap-2 px-7 py-3 rounded-full text-white text-sm font-black shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ background: 'linear-gradient(135deg, #16a34a, #1d4ed8)' }}
              >
                <Search className="w-4 h-4" />
                Tra cứu tương hợp
              </button>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {matrixError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 py-3 px-6 rounded-2xl border border-red-200 bg-red-50 mb-8"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-red-700 text-sm font-bold">{matrixError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Initial prompt */}
            {!showMatrix && selectedDrugs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-inner"
                  style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)' }}>
                  <ShieldCheck className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Bắt đầu tra cứu</h3>
                <p className="text-slate-500 font-medium max-w-md">
                  Nhập tên hoạt chất vào ô tìm kiếm phía trên để thêm vào danh sách, sau đó nhấn "Tra cứu tương hợp" để xem bảng kết quả
                </p>
                <p className="text-slate-400 text-xs font-semibold">
                  Hiện có <span className="text-green-600 font-black">{drugList.length}</span> hoạt chất trong cơ sở dữ liệu
                </p>
              </div>
            )}

            {/* Compatibility matrix */}
            {showMatrix && selectedDrugs.length >= 2 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-lg bg-white">
                  {/* Table header */}
                  <div
                    className="px-6 py-4 text-white"
                    style={{ background: 'linear-gradient(135deg, #16a34a 0%, #1d4ed8 100%)' }}
                  >
                    <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5" />
                      Bảng kết quả tương hợp – tương kỵ
                    </h3>
                  </div>

                  {/* Matrix table */}
                  <div className="overflow-x-auto pb-6 custom-scrollbar bg-white">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="text-left text-[13px] font-black uppercase tracking-wider text-slate-500 px-5 py-4 bg-slate-50 border-b-2 border-slate-200 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] align-middle w-1/3 min-w-[200px] max-w-[300px]">
                            HOẠT CHẤT
                          </th>
                          {selectedDrugs.map(drug => (
                            <th key={drug} className="px-3 py-4 bg-slate-50 border-b-2 border-slate-200 align-middle text-center min-w-[100px] w-[120px]">
                              <span className="text-xs font-bold text-slate-700 block mx-auto line-clamp-3" title={drug}>
                                {drug}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDrugs.map((drug1, idx) => (
                          <tr key={drug1} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="text-[13.5px] font-semibold text-slate-700 px-5 py-4 border-b border-slate-100 sticky left-0 z-10 bg-white group-hover:bg-slate-50/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] w-1/3 min-w-[200px] max-w-[300px] break-words">
                              {drug1}
                            </td>
                            {selectedDrugs.map(drug2 => (
                               <CompatibilityCell
                                key={`${drug1}-${drug2}`}
                                status={getCompatStatus(drug1, drug2)}
                              />
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Legend */}
                <Legend />
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* Footer info */}
      <div className="max-w-5xl mx-auto px-6 md:px-8 pb-6">
        <div className="text-center py-6 border-t border-slate-100">
          <p className="text-slate-400 text-xs font-medium">
            Tra cứu tương hợp – tương kỵ thuốc theo Y-site · Chỉ sử dụng cho mục đích tham khảo chuyên môn
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
