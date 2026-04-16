import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Thermometer, Droplets, Plus, RefreshCw, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { Card, CardHeader, CardBody, Button } from '../components/ui';
import { GOOGLE_SHEETS_API_URL } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface GspRecord {
  date: string;
  shift: string;
  tempKho: number;
  tempTuLanh: number;
  humidity: number;
  note: string;
  recorder: string;
}

const GSP_LIMITS = {
  tempKho: { min: 15, max: 30 },
  tempTuLanh: { min: 2, max: 8 },
  humidity: { min: 40, max: 75 },
};

const GspLog: React.FC = () => {
  const [records, setRecords] = useState<GspRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeView, setActiveView] = useState<'chart' | 'table'>('chart');
  const [chartPeriod, setChartPeriod] = useState(30); // days

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [form, setForm] = useState({
    shift: 'Sáng',
    tempKho: '',
    tempTuLanh: '',
    humidity: '',
    note: '',
  });

  useEffect(() => {
    fetchGspData();
  }, []);

  const fetchGspData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${GOOGLE_SHEETS_API_URL}?action=getGSP`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setRecords(data);
      }
    } catch (e) {
      console.error('GSP fetch error', e);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.name) return alert('Vui lòng đăng nhập!');
    setIsSubmitting(true);
    try {
      const payload = {
        action: 'addGSP',
        payload: {
          ...form,
          tempKho: parseFloat(form.tempKho),
          tempTuLanh: parseFloat(form.tempTuLanh),
          humidity: parseFloat(form.humidity),
          recorder: user.name,
        },
      };
      const res = await fetch(GOOGLE_SHEETS_API_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        alert('✅ Đã ghi nhận thành công!');
        setForm({ shift: 'Sáng', tempKho: '', tempTuLanh: '', humidity: '', note: '' });
        fetchGspData();
      } else {
        alert('❌ Lỗi: ' + result.message);
      }
    } catch (e) {
      alert('Lỗi kết nối mạng!');
    }
    setIsSubmitting(false);
  };

  // Lấy dữ liệu trong khoảng thời gian
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - chartPeriod);
  const filteredRecords = records
    .filter(r => new Date(r.date) >= cutoff)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const labels = filteredRecords.map(r => {
    const d = new Date(r.date);
    return `${d.getDate()}/${d.getMonth()+1} ${r.shift}`;
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Nhiệt độ Kho (°C)',
        data: filteredRecords.map(r => r.tempKho),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
      {
        label: 'Nhiệt độ Tủ lạnh (°C)',
        data: filteredRecords.map(r => r.tempTuLanh),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        tension: 0.4,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
      {
        label: 'Độ ẩm Kho (%)',
        data: filteredRecords.map(r => r.humidity),
        borderColor: '#0d9488',
        backgroundColor: 'rgba(13, 148, 136, 0.05)',
        tension: 0.4,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 7,
        yAxisID: 'y1',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { position: 'top' as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const val = ctx.parsed.y;
            const unit = ctx.datasetIndex === 2 ? '%' : '°C';
            let status = '';
            if (ctx.datasetIndex === 0) {
              status = val < GSP_LIMITS.tempKho.min || val > GSP_LIMITS.tempKho.max ? ' ⚠️ NGOÀI GIỚI HẠN' : ' ✅';
            } else if (ctx.datasetIndex === 1) {
              status = val < GSP_LIMITS.tempTuLanh.min || val > GSP_LIMITS.tempTuLanh.max ? ' ⚠️ NGOÀI GIỚI HẠN' : ' ✅';
            } else {
              status = val < GSP_LIMITS.humidity.min || val > GSP_LIMITS.humidity.max ? ' ⚠️ NGOÀI GIỚI HẠN' : ' ✅';
            }
            return `${ctx.dataset.label}: ${val}${unit}${status}`;
          },
        },
      },
    },
    scales: {
      y: {
        title: { display: true, text: 'Nhiệt độ (°C)' },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      y1: {
        position: 'right' as const,
        title: { display: true, text: 'Độ ẩm (%)' },
        grid: { drawOnChartArea: false },
        min: 0,
        max: 100,
      },
    },
  };

  // Thống kê cảnh báo
  const violations = records.filter(r => {
    return r.tempKho < GSP_LIMITS.tempKho.min || r.tempKho > GSP_LIMITS.tempKho.max ||
           r.tempTuLanh < GSP_LIMITS.tempTuLanh.min || r.tempTuLanh > GSP_LIMITS.tempTuLanh.max ||
           r.humidity < GSP_LIMITS.humidity.min || r.humidity > GSP_LIMITS.humidity.max;
  });

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Nhật ký Nhiệt độ / Độ ẩm Kho (GSP)</h1>
          <p className="dashboard-subtitle">Tiêu chuẩn: Kho thường 15-30°C | Tủ lạnh 2-8°C | Độ ẩm 40-75%</p>
        </div>
        <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={fetchGspData}>
          Làm mới
        </Button>
      </div>

      {/* KPI cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.5rem' }}>
        <Card className="stat-card gradient-teal">
          <div className="stat-icon"><Thermometer size={26} /></div>
          <div className="stat-info">
            <span className="stat-value">
              {filteredRecords.length > 0 ? filteredRecords[filteredRecords.length-1].tempKho + '°C' : '--'}
            </span>
            <span className="stat-label">Nhiệt độ Kho (mới nhất)</span>
          </div>
        </Card>
        <Card className="stat-card gradient-blue">
          <div className="stat-icon"><Thermometer size={26} /></div>
          <div className="stat-info">
            <span className="stat-value">
              {filteredRecords.length > 0 ? filteredRecords[filteredRecords.length-1].tempTuLanh + '°C' : '--'}
            </span>
            <span className="stat-label">Nhiệt độ Tủ lạnh (mới nhất)</span>
          </div>
        </Card>
        <Card className={`stat-card ${violations.length > 0 ? 'gradient-rose' : 'gradient-teal'}`}>
          <div className="stat-icon">
            {violations.length > 0 ? <AlertTriangle size={26} /> : <CheckCircle size={26} />}
          </div>
          <div className="stat-info">
            <span className="stat-value">{violations.length > 0 ? violations.length + ' lần' : 'Đạt'}</span>
            <span className="stat-label">{violations.length > 0 ? 'Vi phạm GSP' : 'Tất cả trong giới hạn'}</span>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Form nhập liệu */}
        <Card>
          <CardHeader title={<div style={{ display:'flex', gap:'8px', alignItems:'center' }}><Plus size={18} /> Ghi nhận ca mới</div>} />
          <CardBody>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display:'block', fontSize:'0.8rem', fontWeight:600, marginBottom:'6px', color:'var(--text-secondary)' }}>
                  Ca làm việc
                </label>
                <select
                  className="form-select"
                  value={form.shift}
                  onChange={e => setForm({...form, shift: e.target.value})}
                  style={{ width:'100%', padding:'8px 12px', borderRadius:'8px', border:'1px solid var(--border-color)', background:'var(--bg-primary)', color:'var(--text-primary)' }}
                >
                  <option value="Sáng">☀️ Ca Sáng (7h - 11h30)</option>
                  <option value="Chiều">🌇 Ca Chiều (13h - 16h30)</option>
                </select>
              </div>

              <div>
                <label style={{ display:'block', fontSize:'0.8rem', fontWeight:600, marginBottom:'6px', color:'var(--text-secondary)' }}>
                  <Thermometer size={14} style={{ marginRight:4 }} />
                  Nhiệt độ Kho thường (°C) <span style={{ color: 'var(--warning)', fontSize:'0.7rem' }}>15 - 30°C</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={form.tempKho}
                  onChange={e => setForm({...form, tempKho: e.target.value})}
                  placeholder="VD: 25.5"
                  style={{ width:'100%', padding:'8px 12px', borderRadius:'8px', border:'1px solid var(--border-color)', background:'var(--bg-primary)', color:'var(--text-primary)' }}
                />
                {form.tempKho && (parseFloat(form.tempKho) < 15 || parseFloat(form.tempKho) > 30) && (
                  <div style={{ color:'var(--danger)', fontSize:'0.75rem', marginTop:'4px' }}>
                    ⚠️ Ngoài giới hạn GSP! Cần báo cáo ngay.
                  </div>
                )}
              </div>

              <div>
                <label style={{ display:'block', fontSize:'0.8rem', fontWeight:600, marginBottom:'6px', color:'var(--text-secondary)' }}>
                  <Thermometer size={14} style={{ marginRight:4 }} />
                  Nhiệt độ Tủ lạnh (°C) <span style={{ color: 'var(--warning)', fontSize:'0.7rem' }}>2 - 8°C</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={form.tempTuLanh}
                  onChange={e => setForm({...form, tempTuLanh: e.target.value})}
                  placeholder="VD: 5.0"
                  style={{ width:'100%', padding:'8px 12px', borderRadius:'8px', border:'1px solid var(--border-color)', background:'var(--bg-primary)', color:'var(--text-primary)' }}
                />
                {form.tempTuLanh && (parseFloat(form.tempTuLanh) < 2 || parseFloat(form.tempTuLanh) > 8) && (
                  <div style={{ color:'var(--danger)', fontSize:'0.75rem', marginTop:'4px' }}>
                    ⚠️ Ngoài giới hạn GSP! Tủ lạnh gặp sự cố.
                  </div>
                )}
              </div>

              <div>
                <label style={{ display:'block', fontSize:'0.8rem', fontWeight:600, marginBottom:'6px', color:'var(--text-secondary)' }}>
                  <Droplets size={14} style={{ marginRight:4 }} />
                  Độ ẩm Kho (%) <span style={{ color: 'var(--warning)', fontSize:'0.7rem' }}>40 - 75%</span>
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={form.humidity}
                  onChange={e => setForm({...form, humidity: e.target.value})}
                  placeholder="VD: 60"
                  style={{ width:'100%', padding:'8px 12px', borderRadius:'8px', border:'1px solid var(--border-color)', background:'var(--bg-primary)', color:'var(--text-primary)' }}
                />
                {form.humidity && (parseFloat(form.humidity) < 40 || parseFloat(form.humidity) > 75) && (
                  <div style={{ color:'var(--danger)', fontSize:'0.75rem', marginTop:'4px' }}>
                    ⚠️ Ngoài giới hạn GSP!
                  </div>
                )}
              </div>

              <div>
                <label style={{ display:'block', fontSize:'0.8rem', fontWeight:600, marginBottom:'6px', color:'var(--text-secondary)' }}>
                  Ghi chú (nếu có)
                </label>
                <textarea
                  value={form.note}
                  onChange={e => setForm({...form, note: e.target.value})}
                  placeholder="Biện pháp xử lý nếu vượt giới hạn..."
                  rows={2}
                  style={{ width:'100%', padding:'8px 12px', borderRadius:'8px', border:'1px solid var(--border-color)', background:'var(--bg-primary)', color:'var(--text-primary)', resize:'vertical' }}
                />
              </div>

              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Đang lưu...' : '💾 Lưu Nhật Ký'}
              </Button>
            </form>

            <div style={{ marginTop: '1.5rem', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <strong>📋 Tiêu chuẩn GSP:</strong>
              <ul style={{ margin:'8px 0 0', paddingLeft:'16px', lineHeight:1.8 }}>
                <li>Kho thường: <strong>15°C – 30°C</strong></li>
                <li>Tủ lạnh bảo quản: <strong>2°C – 8°C</strong></li>
                <li>Độ ẩm: <strong>40% – 75%</strong></li>
                <li>Ghi chép: <strong>2 lần/ngày</strong> (Sáng & Chiều)</li>
              </ul>
            </div>
          </CardBody>
        </Card>

        {/* Biểu đồ + Bảng */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card>
            <CardHeader
              title={<div style={{ display:'flex', gap:'8px', alignItems:'center' }}><Calendar size={18} /> Biểu đồ theo dõi dao động</div>}
              action={
                <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                  <select
                    value={chartPeriod}
                    onChange={e => setChartPeriod(parseInt(e.target.value))}
                    style={{ padding:'4px 8px', borderRadius:'8px', border:'1px solid var(--border-color)', background:'var(--bg-primary)', color:'var(--text-primary)', fontSize:'0.8rem' }}
                  >
                    <option value={7}>7 ngày</option>
                    <option value={14}>14 ngày</option>
                    <option value={30}>30 ngày</option>
                    <option value={60}>60 ngày</option>
                  </select>
                  <div style={{ display:'flex', gap:'4px' }}>
                    <button
                      onClick={() => setActiveView('chart')}
                      style={{ padding:'4px 12px', borderRadius:'8px', border:'1px solid var(--border-color)', background: activeView === 'chart' ? 'var(--primary)' : 'var(--bg-primary)', color: activeView === 'chart' ? 'white' : 'var(--text-primary)', fontSize:'0.8rem', cursor:'pointer' }}
                    >Biểu đồ</button>
                    <button
                      onClick={() => setActiveView('table')}
                      style={{ padding:'4px 12px', borderRadius:'8px', border:'1px solid var(--border-color)', background: activeView === 'table' ? 'var(--primary)' : 'var(--bg-primary)', color: activeView === 'table' ? 'white' : 'var(--text-primary)', fontSize:'0.8rem', cursor:'pointer' }}
                    >Bảng</button>
                  </div>
                </div>
              }
            />
            <CardBody>
              {isLoading ? (
                <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-secondary)' }}>Đang tải dữ liệu...</div>
              ) : filteredRecords.length === 0 ? (
                <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-secondary)' }}>Chưa có dữ liệu trong {chartPeriod} ngày qua. Hãy bắt đầu ghi chép!</div>
              ) : activeView === 'chart' ? (
                <div style={{ height: '380px', position: 'relative' }}>
                  <Line data={chartData} options={chartOptions} />
                </div>
              ) : (
                <div style={{ overflowX: 'auto', maxHeight: '420px' }}>
                  <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
                    <thead>
                      <tr style={{ background:'var(--bg-secondary)' }}>
                        {['Ngày', 'Ca', 'Kho (°C)', 'Tủ lạnh (°C)', 'Độ ẩm (%)', 'Ghi chú', 'Người ghi'].map(h => (
                          <th key={h} style={{ padding:'10px 14px', fontSize:'0.75rem', fontWeight:700, color:'var(--text-secondary)', textAlign:'left', borderBottom:'1px solid var(--border-color)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...filteredRecords].reverse().map((r, i) => {
                        const khoOk = r.tempKho >= 15 && r.tempKho <= 30;
                        const tuLanhOk = r.tempTuLanh >= 2 && r.tempTuLanh <= 8;
                        const humOk = r.humidity >= 40 && r.humidity <= 75;
                        const hasViolation = !khoOk || !tuLanhOk || !humOk;
                        return (
                          <tr key={i} style={{ background: hasViolation ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                            <td style={{ padding:'10px 14px', fontSize:'0.85rem', borderBottom:'1px solid var(--border-color)' }}>
                              {new Date(r.date).toLocaleDateString('vi-VN')}
                            </td>
                            <td style={{ padding:'10px 14px', fontSize:'0.85rem', borderBottom:'1px solid var(--border-color)' }}>{r.shift}</td>
                            <td style={{ padding:'10px 14px', fontSize:'0.85rem', borderBottom:'1px solid var(--border-color)', color: khoOk ? 'inherit' : 'var(--danger)', fontWeight: khoOk ? 'normal' : 'bold' }}>
                              {r.tempKho}°C {!khoOk && '⚠️'}
                            </td>
                            <td style={{ padding:'10px 14px', fontSize:'0.85rem', borderBottom:'1px solid var(--border-color)', color: tuLanhOk ? 'inherit' : 'var(--danger)', fontWeight: tuLanhOk ? 'normal' : 'bold' }}>
                              {r.tempTuLanh}°C {!tuLanhOk && '⚠️'}
                            </td>
                            <td style={{ padding:'10px 14px', fontSize:'0.85rem', borderBottom:'1px solid var(--border-color)', color: humOk ? 'inherit' : 'var(--danger)', fontWeight: humOk ? 'normal' : 'bold' }}>
                              {r.humidity}% {!humOk && '⚠️'}
                            </td>
                            <td style={{ padding:'10px 14px', fontSize:'0.8rem', borderBottom:'1px solid var(--border-color)', color:'var(--text-secondary)' }}>{r.note || '--'}</td>
                            <td style={{ padding:'10px 14px', fontSize:'0.8rem', borderBottom:'1px solid var(--border-color)', color:'var(--text-secondary)' }}>{r.recorder || '--'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          {violations.length > 0 && (
            <Card>
              <CardHeader title={<div style={{ display:'flex', gap:'8px', alignItems:'center', color:'var(--danger)' }}><AlertTriangle size={18} /> Cảnh báo Vi phạm GSP ({violations.length} lần)</div>} />
              <CardBody>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {violations.slice(0, 5).map((r, i) => (
                    <div key={i} style={{ padding:'12px 16px', background:'rgba(239,68,68,0.05)', borderRadius:'10px', border:'1px solid rgba(239,68,68,0.2)', fontSize:'0.85rem' }}>
                      <strong>{new Date(r.date).toLocaleDateString('vi-VN')} - {r.shift}:</strong>
                      {r.tempKho < 15 || r.tempKho > 30 ? <span style={{ marginLeft:8, color:'var(--danger)' }}>Kho {r.tempKho}°C</span> : null}
                      {r.tempTuLanh < 2 || r.tempTuLanh > 8 ? <span style={{ marginLeft:8, color:'var(--danger)' }}>Tủ lạnh {r.tempTuLanh}°C</span> : null}
                      {r.humidity < 40 || r.humidity > 75 ? <span style={{ marginLeft:8, color:'var(--danger)' }}>Ẩm {r.humidity}%</span> : null}
                      {r.note && <span style={{ marginLeft:8, color:'var(--text-secondary)' }}>— {r.note}</span>}
                    </div>
                  ))}
                  {violations.length > 5 && (
                    <div style={{ textAlign:'center', fontSize:'0.8rem', color:'var(--text-secondary)' }}>... và {violations.length - 5} lần khác</div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default GspLog;
