import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Header, Footer, Breadcrumb } from '../components/SharedLayout';
import {
  Search, Syringe, AlertTriangle, ChevronRight, ChevronDown,
  Loader2, FlaskConical, ShieldAlert, Pill, Beaker, Clock,
  BookOpen, FileWarning, ImageIcon, ExternalLink, TrendingUp,
  Trophy, ArrowRight, X, Activity
} from 'lucide-react';

// --- Types ---
interface DrugData {
  [key: string]: string | { value: string; url?: string; text?: string } | undefined;
}

interface SearchStat {
  term: string;
  count: number;
}

type SearchType = 'all' | 'hoat-chat' | 'biet-duoc' | 'nguy-co-cao';

// --- Constants ---
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxTyphwsmeRZVxTiZMwllRagpGX6UA21pgyZKD1uATLUeWS2Ff95epA-LAGgf_y3mWq/exec';

const DRUG_INFO_GROUPS: Record<string, { icon: React.ReactNode; fields: string[] }> = {
  'ĐẶC ĐIỂM CHUNG': {
    icon: <Pill className="w-5 h-5" />,
    fields: ['Hoạt chất', 'Biệt dược', 'Dạng bào chế', 'Đường tiêm', 'Cảnh báo thuốc'],
  },
  'CHỈ ĐỊNH & LIỀU DÙNG': {
    icon: <Activity className="w-5 h-5" />,
    fields: ['Nhóm tác dụng dược lý', 'Chống chỉ định', 'Liều tối đa', 'CÁCH DÙNG'],
  },
  'PHA CHẾ & BẢO QUẢN': {
    icon: <Beaker className="w-5 h-5" />,
    fields: ['Dung môi hoàn nguyên', 'Cách hoàn nguyên', 'Dung môi pha loãng', 'Nồng độ khuyến nghị', 'Bảo quản sau hoàn nguyên', 'Bảo quản sau pha loãng'],
  },
  'SỬ DỤNG & THEO DÕI': {
    icon: <Clock className="w-5 h-5" />,
    fields: ['Thời gian/tốc độ khuyến cáo tiêm, truyền tĩnh mạch', 'Lưu ý khi tiêm, truyền tĩnh mạch'],
  },
  'TƯƠNG TÁC - TƯƠNG HỢP - TƯƠNG KỊ': {
    icon: <ShieldAlert className="w-5 h-5" />,
    fields: ['Tương hợp', 'Tương kỵ'],
  },
  'TÀI LIỆU THAM KHẢO': {
    icon: <BookOpen className="w-5 h-5" />,
    fields: ['Biệt dược tham khảo', 'Tài liệu tham khảo', 'Hình ảnh biệt dược tại bệnh viện'],
  },
};

const SEARCH_FILTERS: { type: SearchType; label: string; icon: React.ReactNode }[] = [
  { type: 'all', label: 'Tất cả', icon: <Search className="w-3.5 h-3.5" /> },
  { type: 'hoat-chat', label: 'Hoạt chất', icon: <FlaskConical className="w-3.5 h-3.5" /> },
  { type: 'biet-duoc', label: 'Biệt dược', icon: <Pill className="w-3.5 h-3.5" /> },
  { type: 'nguy-co-cao', label: 'Nguy cơ cao', icon: <FileWarning className="w-3.5 h-3.5" /> },
];

// --- Helpers ---
const getValue = (data: DrugData, key: string): string => {
  const cell = data[key];
  if (!cell) return '';
  if (typeof cell === 'object' && cell.value !== undefined) return cell.value;
  return String(cell);
};

const getImageUrl = (url: string): string => {
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/file\/d\/([^/]+)/) || url.match(/\/d\/([^/]+)/) || url.match(/id=([^&]+)/);
    if (match?.[1]) return `https://lh3.googleusercontent.com/d/${match[1]}=w1000`;
  }
  return url;
};

// --- Sub-components ---

const WarningBanner = () => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center justify-center gap-3 py-3 px-6 rounded-2xl border border-amber-200/60 mb-8"
    style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.12) 0%, rgba(245,158,11,0.08) 100%)' }}
  >
    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
    <p className="text-amber-800 text-sm font-semibold">
      THẬN TRỌNG: Luôn kiểm tra kỹ thông tin trước khi sử dụng thuốc. Chỉ dùng cho mục đích tham khảo chuyên môn.
    </p>
  </motion.div>
);

const SearchStatsPanel = ({ title, icon, stats, onSelect, colorScheme }: {
  title: string;
  icon: React.ReactNode;
  stats: SearchStat[];
  onSelect: (term: string) => void;
  colorScheme: 'blue' | 'green';
}) => {
  if (!stats.length) return null;
  const medals = ['🥇', '🥈', '🥉'];
  const colors = colorScheme === 'blue'
    ? { bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-200/60', badge: 'bg-blue-600', hover: 'hover:bg-blue-50 hover:border-blue-300', text: 'text-blue-900' }
    : { bg: 'from-emerald-50 to-green-100/50', border: 'border-emerald-200/60', badge: 'bg-emerald-600', hover: 'hover:bg-emerald-50 hover:border-emerald-300', text: 'text-emerald-900' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border ${colors.border} p-5 bg-gradient-to-br ${colors.bg}`}
    >
      <div className={`flex items-center gap-2 mb-4 ${colors.text}`}>
        {icon}
        <h4 className="text-sm font-black uppercase tracking-wide">{title}</h4>
      </div>
      <div className="space-y-2">
        {stats.slice(0, 5).map((item, i) => (
          <button
            key={i}
            onClick={() => onSelect(item.term)}
            className={`w-full flex items-center justify-between px-4 py-2.5 bg-white/80 rounded-xl border border-transparent ${colors.hover} transition-all duration-200 group`}
          >
            <span className="font-semibold text-sm text-slate-700 flex items-center gap-2">
              <span>{i < 3 ? medals[i] : `${i + 1}.`}</span>
              {item.term}
            </span>
            <span className={`${colors.badge} text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full`}>
              {item.count}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

const DrugInfoField = ({ label, value, data }: { label: string; value: string; data: DrugData }) => {
  const isWarning = label.includes('Cảnh báo') || label.includes('Chống chỉ định');
  const isImage = label === 'Hình ảnh biệt dược tại bệnh viện';
  const isRef = label === 'Tài liệu tham khảo';

  if (isImage && value) {
    const imgUrl = getImageUrl(value);
    return (
      <div className="flex flex-col md:flex-row gap-4 px-6 py-5 border-b border-slate-100 last:border-0">
        <div className="md:w-1/3 text-sm font-bold text-slate-600 shrink-0 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-slate-400" />
          {label}
        </div>
        <div className="md:w-2/3">
          <img
            src={imgUrl}
            alt={`Hình ảnh ${getValue(data, 'Biệt dược')}`}
            className="max-w-full rounded-xl border border-slate-200 shadow-sm"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      </div>
    );
  }

  if (isRef && data[label] && typeof data[label] === 'object' && (data[label] as any).url) {
    const refData = data[label] as { value: string; url: string; text?: string };
    return (
      <div className="flex flex-col md:flex-row gap-4 px-6 py-5 border-b border-slate-100 last:border-0">
        <div className="md:w-1/3 text-sm font-bold text-slate-600 shrink-0">{label}</div>
        <div className="md:w-2/3">
          <a
            href={refData.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors"
          >
            {refData.text || refData.value}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 px-6 py-5 border-b border-slate-100 last:border-0">
      <div className="md:w-1/3 text-sm font-bold text-slate-600 shrink-0">{label}</div>
      <div className="md:w-2/3">
        {isWarning ? (
          <span className="text-red-600 font-bold text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: value.replace(/\n/g, '<br/>') }} />
        ) : (
          <span className="text-slate-700 text-sm leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: value.replace(/\n/g, '<br/>') }} />
        )}
      </div>
    </div>
  );
};

const DrugDetail = ({ drug, onBack }: { drug: DrugData; onBack: () => void }) => {
  const bietDuoc = getValue(drug, 'Biệt dược') || 'Không rõ';
  const hoatChat = getValue(drug, 'Hoạt chất') || 'Không rõ';
  const canhBao = getValue(drug, 'Cảnh báo thuốc');
  const isHighRisk = canhBao?.toLowerCase().includes('nguy cơ cao');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-green-700 transition-colors mb-6 group"
      >
        <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
        Quay lại kết quả tìm kiếm
      </button>

      {/* Drug header */}
      <div className="rounded-2xl p-6 md:p-8 mb-6 border border-slate-200 shadow-sm"
        style={{ background: isHighRisk
          ? 'linear-gradient(135deg, #fef2f2 0%, #fff1f2 50%, #fce7f3 100%)'
          : 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)'
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-1">{bietDuoc}</h2>
            <p className="text-lg font-semibold" style={{ color: '#2563eb' }}>{hoatChat}</p>
          </div>
          {isHighRisk && (
            <div className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-full shadow-lg animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-black uppercase tracking-wider">Thuốc nguy cơ cao</span>
            </div>
          )}
        </div>
      </div>

      {/* Drug info groups */}
      <div className="space-y-5">
        {Object.entries(DRUG_INFO_GROUPS).map(([groupName, { icon, fields }]) => {
          const validFields = fields.filter(f => {
            const val = getValue(drug, f);
            return val && val.trim();
          });
          if (!validFields.length) return null;

          return (
            <motion.div
              key={groupName}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white"
            >
              <div
                className="flex items-center gap-3 px-6 py-4 text-white"
                style={{ background: 'linear-gradient(135deg, #16a34a 0%, #1d4ed8 100%)' }}
              >
                {icon}
                <h3 className="text-sm font-black uppercase tracking-wider">{groupName}</h3>
              </div>
              <div>
                {validFields.map(field => (
                  <DrugInfoField
                    key={field}
                    label={field}
                    value={getValue(drug, field)}
                    data={drug}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

// --- Main Component ---
export default function TraCuuTiemTruyen() {
  const [allData, setAllData] = useState<DrugData[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [results, setResults] = useState<DrugData[] | null>(null);
  const [selectedDrug, setSelectedDrug] = useState<DrugData | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [topSearches, setTopSearches] = useState<SearchStat[]>([]);
  const [monthlySearches, setMonthlySearches] = useState<SearchStat[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch all data on mount
  useEffect(() => {
    fetchData();
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close suggestions on outside click
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

  // Set page title
  useEffect(() => {
    document.title = 'Tra cứu thuốc tiêm truyền | Khoa Dược - TTYT Thanh Ba';
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(false);
      const timestamp = Date.now();
      const response = await fetch(`${WEB_APP_URL}?t=${timestamp}`);
      if (!response.ok) throw new Error('HTTP error');
      const text = await response.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Invalid format');

      setAllData(data);

      // Build suggestions list
      const searchableColumns = Object.keys(data[0] || {}).filter(col =>
        col && (col.includes('Hoạt chất') || col.includes('Biệt dược') || col.includes('Tên') || col.includes('Thuốc'))
      );
      const allSuggestions: string[] = [];
      searchableColumns.forEach(col => {
        data.forEach((row: DrugData) => {
          const cell = row[col];
          const val = cell && typeof cell === 'object' ? (cell as any).value : cell;
          if (val && String(val).trim()) allSuggestions.push(String(val));
        });
      });
      setSuggestions([...new Set(allSuggestions)]);
      setLoading(false);
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const t = Date.now();
      const [rtRes, mtRes] = await Promise.all([
        fetch(`${WEB_APP_URL}?action=getRealTimeStats&t=${t}`).catch(() => null),
        fetch(`${WEB_APP_URL}?action=getMonthlyStats&month=${
          String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}&t=${t}`
        ).catch(() => null),
      ]);

      if (rtRes?.ok) {
        const rtData = await rtRes.json();
        if (rtData?.topSearches?.length) setTopSearches(rtData.topSearches);
      }

      if (mtRes?.ok) {
        const mtData = await mtRes.json();
        const top = mtData?.popular || mtData?.topSearches || (Array.isArray(mtData) ? mtData : []);
        if (top.length) setMonthlySearches(top.slice(0, 3));
      }
    } catch {
      // Silently fail on stats
    }
  };

  const recordSearch = async (term: string) => {
    try {
      await fetch(`${WEB_APP_URL}?action=recordSearch&term=${encodeURIComponent(term)}`);
      setTimeout(loadStats, 500);
    } catch {
      // Silently fail
    }
  };

  const performSearch = useCallback((overrideQuery?: string) => {
    const input = (overrideQuery ?? query).trim().toLowerCase();
    if (!input) {
      setResults(null);
      setSelectedDrug(null);
      return;
    }

    recordSearch(input);

    let filtered: DrugData[];

    if (searchType === 'hoat-chat') {
      filtered = allData.filter(row => getValue(row, 'Hoạt chất').toLowerCase().includes(input));
    } else if (searchType === 'biet-duoc') {
      filtered = allData.filter(row => getValue(row, 'Biệt dược').toLowerCase().includes(input));
    } else if (searchType === 'nguy-co-cao') {
      filtered = allData.filter(row => {
        const matchesSearch = getValue(row, 'Hoạt chất').toLowerCase().includes(input) ||
          getValue(row, 'Biệt dược').toLowerCase().includes(input);
        const isHighRisk = getValue(row, 'Cảnh báo thuốc').toLowerCase().includes('nguy cơ cao');
        return matchesSearch && isHighRisk;
      });
    } else {
      filtered = allData.filter(row =>
        getValue(row, 'Hoạt chất').toLowerCase().includes(input) ||
        getValue(row, 'Biệt dược').toLowerCase().includes(input)
      );
    }

    if (filtered.length === 1) {
      setSelectedDrug(filtered[0]);
      setResults(filtered);
    } else {
      setSelectedDrug(null);
      setResults(filtered);
    }
    setShowSuggestions(false);
  }, [query, searchType, allData]);

  const handleSearchFromStats = (term: string) => {
    setQuery(term);
    performSearch(term);
  };

  const filteredSuggestions = query.trim()
    ? suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-green-100 selection:text-green-900">
      <Header />

      {/* Hero Banner */}
      <section className="relative overflow-hidden" style={{ paddingTop: '88px', minHeight: '280px' }}>
        {/* Background image */}
        <div className="absolute inset-0">
          <img src={`${import.meta.env.BASE_URL}images/tracuu_tiemtruyen.png`} alt="Tra cứu thuốc tiêm truyền"
            className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(6,95,70,0.92) 0%, rgba(15,23,42,0.88) 60%, rgba(15,23,42,0.7) 100%)' }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 md:px-8 py-16 md:py-20">
          <Breadcrumb items={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Tra cứu nhanh', href: '/tra-cuu-nhanh' },
            { label: 'Tra cứu thuốc tiêm truyền' },
          ]} />

          <div className="mt-8 flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl border border-white/20 backdrop-blur-md"
              style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}>
              <Syringe className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-2">
                IV & Tiêm truyền
              </div>
              <h1 className="font-serif text-white font-bold leading-tight" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 3rem)' }}>
                Tra cứu thuốc{' '}
                <em className="not-italic" style={{ background: 'linear-gradient(90deg, #86efac, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  tiêm truyền
                </em>
              </h1>
              <p className="text-white/60 text-sm mt-1 font-medium">
                Hệ thống tra cứu thuốc tiêm truyền & thuốc nguy cơ cao — Cập nhật 2025
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 md:px-8 py-10 -mt-6 relative z-10">
        <WarningBanner />

        {/* Search Box */}
        <div className="relative mb-8">
          <div className="relative shadow-xl rounded-2xl overflow-hidden border border-slate-200 bg-white">
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
              onKeyDown={(e) => { if (e.key === 'Enter') performSearch(); }}
              onFocus={() => { if (query.trim()) setShowSuggestions(true); }}
              placeholder="Nhập tên hoạt chất, biệt dược hoặc mã thuốc..."
              className="w-full pl-14 pr-32 py-5 text-base font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
            />
            <button
              onClick={() => performSearch()}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2.5 rounded-xl text-white text-sm font-black shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              style={{ background: 'linear-gradient(135deg, #16a34a, #1d4ed8)' }}
            >
              <Search className="w-4 h-4 inline mr-2" />
              Tìm kiếm
            </button>
          </div>

          {/* Suggestions dropdown */}
          <AnimatePresence>
            {showSuggestions && filteredSuggestions.length > 0 && (
              <motion.div
                ref={suggestionsRef}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-200 rounded-b-2xl shadow-2xl overflow-hidden max-h-[300px] overflow-y-auto"
              >
                {filteredSuggestions.map((item, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-green-50 transition-colors border-b border-slate-50 last:border-0"
                    onClick={() => {
                      setQuery(item);
                      setShowSuggestions(false);
                      performSearch(item);
                    }}
                  >
                    <Search className="w-4 h-4 text-green-600 shrink-0" />
                    <span className="text-sm font-semibold text-slate-700">{item}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {SEARCH_FILTERS.map(f => (
            <button
              key={f.type}
              onClick={() => setSearchType(f.type)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 border ${
                searchType === f.type
                  ? 'text-white border-transparent shadow-lg scale-105'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-green-300 hover:text-green-700 hover:bg-green-50'
              }`}
              style={searchType === f.type ? { background: 'linear-gradient(135deg, #16a34a, #1d4ed8)' } : undefined}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>

        {/* Stats panels */}
        {!results && !loading && (topSearches.length > 0 || monthlySearches.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <SearchStatsPanel
              title="Top tìm kiếm hiện tại"
              icon={<TrendingUp className="w-4 h-4" />}
              stats={topSearches}
              onSelect={handleSearchFromStats}
              colorScheme="blue"
            />
            <SearchStatsPanel
              title="Top 3 từ khóa trong tháng"
              icon={<Trophy className="w-4 h-4" />}
              stats={monthlySearches}
              onSelect={handleSearchFromStats}
              colorScheme="green"
            />
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
            <p className="text-slate-500 font-semibold">Đang tải dữ liệu thuốc tiêm truyền...</p>
          </div>
        )}

        {/* Error state */}
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

        {/* Initial prompt */}
        {!loading && !error && !results && (
          <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-inner"
              style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)' }}>
              <Syringe className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">Bắt đầu tra cứu</h3>
            <p className="text-slate-500 font-medium max-w-md">
              Nhập tên hoạt chất, biệt dược hoặc mã thuốc vào ô tìm kiếm phía trên để tra cứu thông tin thuốc tiêm truyền
            </p>
          </div>
        )}

        {/* No results */}
        {results && results.length === 0 && !selectedDrug && (
          <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">Không tìm thấy kết quả</h3>
            <p className="text-slate-500 font-medium">Vui lòng thử lại với từ khóa tìm kiếm khác</p>
          </div>
        )}

        {/* Multiple results list */}
        {results && results.length > 1 && !selectedDrug && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-800">
                Tìm thấy <span className="text-green-600">{results.length}</span> kết quả
              </h2>
              <button
                onClick={() => { setResults(null); setQuery(''); }}
                className="text-sm text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1 transition-colors"
              >
                <X className="w-4 h-4" /> Xóa
              </button>
            </div>

            <div className="space-y-3">
              {results.map((drug, i) => {
                const bd = getValue(drug, 'Biệt dược') || 'Không rõ';
                const hc = getValue(drug, 'Hoạt chất') || 'Không rõ';
                const cb = getValue(drug, 'Cảnh báo thuốc');
                const isHR = cb?.toLowerCase().includes('nguy cơ cao');

                return (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedDrug(drug)}
                    className="w-full text-left p-5 rounded-2xl border border-slate-200 bg-white hover:shadow-lg hover:border-green-300 hover:-translate-y-0.5 transition-all duration-300 group flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-800 text-base group-hover:text-green-700 transition-colors">{bd}</h3>
                        {isHR && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-black uppercase rounded-full">
                            <AlertTriangle className="w-3 h-3" /> Nguy cơ cao
                          </span>
                        )}
                      </div>
                      <p className="text-blue-600 text-sm font-semibold mt-0.5 truncate">{hc}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-green-600 shrink-0 transition-colors" />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Single drug detail */}
        {selectedDrug && (
          <DrugDetail
            drug={selectedDrug}
            onBack={() => {
              setSelectedDrug(null);
              if (results && results.length <= 1) setResults(null);
            }}
          />
        )}
      </main>

      {/* Footer info */}
      <div className="max-w-5xl mx-auto px-6 md:px-8 pb-6">
        <div className="text-center py-6 border-t border-slate-100">
          <p className="text-slate-400 text-xs font-medium">
            Hệ thống tra cứu thuốc tiêm truyền © 2025 — Phiên bản 3.0 · Chỉ sử dụng cho mục đích tham khảo chuyên môn
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
