import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Activity,
  AlertTriangle,
  Download,
  ShieldAlert
} from 'lucide-react';
import { Pie, Bar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody, Badge, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Button } from '../components/ui';
import { updateDocumentStatus, type DeviceData, type RepairData } from '../services/api';
import { useDevices } from '../hooks/useDevices';
import { useRepairs } from '../hooks/useRepairs';
import { useAuth } from '../authContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Dashboard.css';



const Dashboard: React.FC = () => {
  const { devices, isLoading: isLoadingDevices, mutate: mutateDevices } = useDevices();
  const { repairs, isLoading: isLoadingRepairs } = useRepairs();
  const isLoading = isLoadingDevices || isLoadingRepairs;
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const activeRepairs = repairs.filter(r => {
    const status = r.status.toLowerCase();
    return !status.includes('hoàn') && !status.includes('từ chối');
  });
  const repairCount = activeRepairs.length;

  const getDepartmentStats = () => {
    const deptCount: Record<string, number> = {};
    devices.forEach(d => {
      let dept = d.department ? d.department.trim() : 'Chưa phân bổ';
      if (dept === '') dept = 'Chưa phân bổ';
      deptCount[dept] = (deptCount[dept] || 0) + 1;
    });
    const sorted = Object.entries(deptCount).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(item => item[0]);
    const data = sorted.map(item => item[1]);
    return { labels, data };
  };

  // Helper: Tính toán lịch bảo dưỡng/đăng kiểm theo yêu cầu
  const parseVietnameseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const processedDevices = devices.map(d => {
    let daysRemaining = 999;
    let warningLevel = 'safe'; // safe, warning, danger, critical
    let alertText = '';
    let urgentDocType = '';

    // Quét tất cả tài liệu, tìm tài liệu khẩn cấp nhất
    const docs = d.documents || [];
    if (docs.length > 0) {
      let bestDeadline: Date | null = null;
      let bestPrepDays = 45;
      let bestDocType = '';

      for (const doc of docs) {
        if (doc.status === 'Đã gửi' || doc.status === 'Đã phê duyệt') continue;
        const parsed = parseVietnameseDate(doc.expiryDate);
        if (parsed) {
          if (!bestDeadline || parsed.getTime() < bestDeadline.getTime()) {
            bestDeadline = parsed;
            const match = String(doc.prepTime || '').match(/\d+/);
            bestPrepDays = match ? parseInt(match[0], 10) : 45;
            bestDocType = doc.docType;
          }
        }
      }

      if (bestDeadline) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadlineTime = (bestDeadline as Date).getTime();
        const prepStartTime = deadlineTime - (bestPrepDays * 24 * 60 * 60 * 1000);
        const diffStart = Math.ceil((prepStartTime - today.getTime()) / (1000 * 60 * 60 * 24));
        const diffDeadline = Math.ceil((deadlineTime - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDeadline < 0) {
          warningLevel = 'critical';
          alertText = `Quá hạn ${bestDocType} ${Math.abs(diffDeadline)} ngày`;
        } else if (diffStart <= 0) {
          warningLevel = 'danger';
          alertText = `Tới hạn chuẩn bị hồ sơ ${bestDocType} (còn ${diffDeadline} ngày)`;
        } else if (diffStart <= 5) {
          warningLevel = 'warning';
          alertText = `Còn ${diffStart} ngày bắt đầu làm hồ sơ ${bestDocType}`;
        }
        daysRemaining = diffStart <= 5 ? diffStart : diffDeadline;
        urgentDocType = bestDocType;
      }
    } else {
      // Tương thích ngược với dữ liệu cũ (không có documents[])
      const deadlineStr = String(d['Thời hạn cấp lại/ Hạn đăng kiểm'] || d['Ngày bảo dưỡng tiếp theo'] || '');
      const prepDaysStr = String(d['Thời gian  chuẩn bị Hồ sơ'] || d['Thời gian chuẩn bị Hồ sơ'] || '');
      const parsedDeadline = parseVietnameseDate(deadlineStr);
      if (parsedDeadline) {
        const match = prepDaysStr.match(/\d+/);
        const prepDays = match ? parseInt(match[0], 10) : 45;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadlineTime = parsedDeadline.getTime();
        const prepStartTime = deadlineTime - (prepDays * 24 * 60 * 60 * 1000);
        const diffStart = Math.ceil((prepStartTime - today.getTime()) / (1000 * 60 * 60 * 24));
        const diffDeadline = Math.ceil((deadlineTime - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDeadline < 0) {
          warningLevel = 'critical';
          alertText = `Quá hạn Đăng kiểm ${Math.abs(diffDeadline)} ngày`;
        } else if (diffStart <= 0) {
          warningLevel = 'danger';
          alertText = `Tới hạn chuẩn bị hồ sơ (còn ${diffDeadline} ngày đăng kiểm)`;
        } else if (diffStart <= 5) {
          warningLevel = 'warning';
          alertText = `Còn ${diffStart} ngày bắt đầu làm hồ sơ`;
        }
        daysRemaining = diffStart <= 5 ? diffStart : diffDeadline;
      }
    }

    const docStatus = d['Trạng thái Hồ sơ'] || '';
    if (docStatus === 'Đã gửi' && warningLevel !== 'safe') {
      warningLevel = 'success';
      alertText = 'Đã gửi hồ sơ';
    }

    const deadlineStr2 = String(d['Thời hạn cấp lại/ Hạn đăng kiểm'] || d['Hạn đăng kiểm'] || '');
    const parsedDeadline2 = parseVietnameseDate(deadlineStr2);

    return {
      ...d,
      deadlineDate: parsedDeadline2 ? parsedDeadline2.toLocaleDateString('vi-VN') : 'Không rõ',
      warningLevel,
      alertText,
      daysRemaining,
      urgentDocType,
    };
  });

  const handleDocStatusUpdate = async (serial: string, docType?: string) => {
    if (!isAdmin) {
      alert('Chỉ tài khoản Admin được cập nhật trạng thái hồ sơ.');
      return;
    }
    setUpdatingId(serial);
    const res = await updateDocumentStatus(serial, 'Đã gửi', docType);
    if (res && res.success) {
      mutateDevices(devices.map(d => d.id === serial ? { ...d, 'Trạng thái Hồ sơ': 'Đã gửi' } : d));
    } else {
      alert('Có lỗi xảy ra: ' + (res?.message || ''));
    }
    setUpdatingId(null);
  };

  const maintenanceAlerts = processedDevices
    .filter(d => d.warningLevel !== 'safe')
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const { labels: pieLabels, data: pieDataValues } = getDepartmentStats();
  const departmentColors = [
    '#0d9488', '#3b82f6', '#f59e0b', '#e11d48', '#64748b',
    '#7c3aed', '#0891b2', '#84cc16', '#ea580c', '#be123c',
    '#2563eb', '#16a34a', '#9333ea', '#ca8a04', '#475569',
  ];

  const pieDataConfig = {
    labels: pieLabels.length > 0 ? pieLabels : ['Chưa có dữ liệu'],
    datasets: [{
      data: pieDataValues.length > 0 ? pieDataValues : [1],
      backgroundColor: (pieLabels.length > 0 ? pieLabels : ['Chưa có dữ liệu']).map((_, index) =>
        departmentColors[index % departmentColors.length]
      ),
      borderWidth: 0,
    }],
  };

  const getRepairStatsByMonth = () => {
    const monthStats = new Array(12).fill(0);
    const thisYear = new Date().getFullYear();
    repairs.forEach(r => {
      if (!r.rowId) return;
      const parts = r.rowId.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (parts) {
        const month = parts[2];
        const year = parts[3];
        if (parseInt(year) === thisYear) {
          monthStats[parseInt(month) - 1]++;
        }
      }
    });

    return {
      labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
      datasets: [
        {
          label: `Số ca báo hỏng/sửa chữa năm ${thisYear}`,
          data: monthStats,
          backgroundColor: '#0d9488',
          borderRadius: 6
        }
      ]
    };
  };

  const barData = getRepairStatsByMonth();
  const barOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' as const } } };

  const handleExportPDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('BAO CAO TONG QUAN HE THONG QLTTB', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Trung tam Y te khu vuc Thanh Ba', 105, 28, { align: 'center' });
    doc.text(`Ngay xuat: ${new Date().toLocaleString('vi-VN')}`, 105, 35, { align: 'center' });

    autoTable(doc, {
      startY: 42,
      head: [['Chi so', 'So lieu']],
      body: [
        ['Tổng số TB quản lý', `${devices.length} máy`],
        ['Đang hoạt động tốt', `${devices.length - repairCount} máy`],
        ['Báo hỏng / chờ sửa', `${repairCount} yêu cầu`],
        ['Cảnh báo đăng kiểm', `${maintenanceAlerts.length} thiết bị`],
      ],
      styles: { fontSize: 11, cellPadding: 4 },
      headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: 'bold' },
    });

    const deptStats = getDepartmentStats();
    autoTable(doc, {
      startY: (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12,
      head: [['Khoa/Phòng', 'Số lượng thiết bị']],
      body: deptStats.labels.map((l, i) => [l, deptStats.data[i]]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [13, 148, 136], textColor: 255 },
    });

    doc.save(`TongQuan_QLTTB_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.pdf`);
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Tổng quan Hệ thống</h1>
          <p className="dashboard-subtitle">Cập nhật lúc: {new Date().toLocaleTimeString('vi-VN')}, {new Date().toLocaleDateString('vi-VN')}</p>
        </div>
        <Button variant="secondary" icon={<Download size={18} />} onClick={handleExportPDF}>Xuất báo cáo PDF</Button>
      </div>

      <div className="stats-grid">
        <Card className="stat-card gradient-blue">
          <div className="stat-icon"><Stethoscope size={28} /></div>
          <div className="stat-info">
            <span className="stat-value">{isLoading ? '...' : devices.length}</span>
            <span className="stat-label">Thiết bị quản lý</span>
          </div>
        </Card>
        <Card className="stat-card gradient-teal">
          <div className="stat-icon"><Activity size={28} /></div>
          <div className="stat-info">
            <span className="stat-value">{isLoading ? '...' : Math.max(0, devices.length - repairCount)}</span>
            <span className="stat-label">Hoạt động ổn định</span>
          </div>
        </Card>
        <Card className="stat-card gradient-orange">
          <div className="stat-icon"><AlertTriangle size={28} /></div>
          <div className="stat-info">
            <span className="stat-value">{isLoading ? '...' : repairCount}</span>
            <span className="stat-label">Đang báo hỏng/chờ sửa</span>
          </div>
        </Card>
        <Card className="stat-card gradient-rose">
          <div className="stat-icon"><ShieldAlert size={28} /></div>
          <div className="stat-info">
            <span className="stat-value">{isLoading ? '...' : maintenanceAlerts.length}</span>
            <span className="stat-label">Cảnh báo Đăng kiểm</span>
          </div>
        </Card>
      </div>

      <div className="charts-grid">
        <Card>
          <CardHeader title="Phân bổ thiết bị theo Khoa/Phòng" />
          <CardBody>
            <div className="chart-container">
              {isLoading
                ? <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>Đang tải biểu đồ...</div>
                : <Pie data={pieDataConfig} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
              }
            </div>
            {!isLoading && pieLabels.length > 0 && (
              <div className="department-detail-list">
                {pieLabels.map((label, index) => (
                  <div className="department-detail-item" key={label}>
                    <span className="department-detail-dot" style={{ backgroundColor: departmentColors[index % departmentColors.length] }} />
                    <span className="department-detail-name">{label}</span>
                    <span className="department-detail-count">{pieDataValues[index]}</span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Thống kê báo hỏng & sửa chữa năm nay" />
          <CardBody>
            <div className="chart-container">
              {isLoading
                ? <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>Đang tải biểu đồ...</div>
                : <Bar data={barData} options={barOptions} />
              }
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="lists-grid">
        <Card>
          <CardHeader
            title={<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>Yêu cầu báo hỏng {repairCount > 0 && <Badge variant="danger">{repairCount} đang chờ</Badge>}</div>}
            action={<Button variant="secondary" size="sm" onClick={() => navigate(isAdmin ? '/admin-repairs' : '/requests?type=repair')}>Xem tất cả</Button>}
          />
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Mã thiết bị</TableHeader>
                <TableHeader>Khoa/Phòng</TableHeader>
                <TableHeader>Trạng thái</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading
                ? <TableRow><TableCell colSpan={3} style={{ textAlign: 'center', padding: '1rem' }}>Đang tải...</TableCell></TableRow>
                : repairCount === 0
                  ? <TableRow><TableCell colSpan={3} style={{ textAlign: 'center', padding: '1rem', color: 'var(--success)' }}>Không có yêu cầu nào đang chờ.</TableCell></TableRow>
                  : activeRepairs.slice(0, 5).map((repair) => (
                    <TableRow key={`${repair.rowId}-${repair.deviceId}`}>
                      <TableCell>{repair.deviceId}</TableCell>
                      <TableCell>{devices.find(device => device.id === repair.deviceId)?.department || 'Chưa rõ'}</TableCell>
                      <TableCell><Badge variant="warning">{repair.status}</Badge></TableCell>
                    </TableRow>
                  ))
              }
            </TableBody>
          </Table>
        </Card>

        <Card>
          <CardHeader
            title={<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>Cảnh báo Hồ sơ / Đăng kiểm {maintenanceAlerts.length > 0 && <Badge variant="danger">{maintenanceAlerts.length}</Badge>}</div>}
            action={<Button variant="secondary" size="sm" onClick={() => navigate('/devices')}>Tất cả thiết bị</Button>}
          />
          <CardBody>
            {isLoading
              ? <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>Đang tải...</div>
              : maintenanceAlerts.length === 0
                ? <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--success)', fontWeight: 'bold' }}>Mọi thiết bị đều đang trong hạn an toàn.</div>
                : (() => {
                    const groups: Record<string, typeof maintenanceAlerts> = {};
                    maintenanceAlerts.forEach(d => {
                      const key = d.warningLevel;
                      if (!groups[key]) groups[key] = [];
                      groups[key].push(d);
                    });
                    const levelOrder = ['critical', 'danger', 'warning', 'success'];
                    const levelConfig: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
                      critical: { label: 'Quá hạn', icon: '🔴', color: '#fff', bg: '#7f1d1d', border: '#991b1b' },
                      danger: { label: 'Tới hạn chuẩn bị hồ sơ', icon: '🟠', color: '#9a3412', bg: '#fee2e2', border: '#fca5a5' },
                      warning: { label: 'Sắp tới hạn', icon: '🟡', color: '#92400e', bg: '#fef3c7', border: '#fcd34d' },
                      success: { label: 'Đã gửi hồ sơ', icon: '🟢', color: '#166534', bg: '#dcfce7', border: '#86efac' },
                    };
                    return (
                      <div className="alert-groups">
                        {levelOrder.filter(lv => groups[lv]?.length).map(lv => {
                          const cfg = levelConfig[lv];
                          const items = groups[lv];
                          return (
                            <div key={lv} className="alert-group" style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '12px', padding: '12px 16px', marginBottom: '12px' }}>
                              <div className="alert-group-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: cfg.color }}>
                                <span>{cfg.icon}</span>
                                <strong style={{ fontSize: '0.95rem' }}>{cfg.label}</strong>
                                <Badge variant={lv === 'critical' ? 'danger' : lv === 'danger' ? 'danger' : lv === 'warning' ? 'warning' : 'success'}>{items.length}</Badge>
                              </div>
                              <div className="alert-group-list" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {items.map(device => (
                                  <div
                                    key={device.id}
                                    className="alert-group-item"
                                    style={{
                                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                                      background: lv === 'critical' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)',
                                      borderRadius: '8px', padding: '8px 12px', cursor: 'pointer',
                                      fontSize: '0.88rem', color: cfg.color
                                    }}
                                    onClick={() => navigate(`/device/${device.id}`)}
                                  >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
                                      <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{device.name}</strong>
                                      <small style={{ opacity: 0.8 }}>{device.id} • {device.department}</small>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0, fontSize: '0.82rem' }}>
                                      <div>{device.alertText}</div>
                                      <div style={{ opacity: 0.7, fontSize: '0.78rem' }}>Hạn: {device.deadlineDate}</div>
                                    </div>
                                    {isAdmin && lv !== 'success' && (
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={(e) => { e.stopPropagation(); handleDocStatusUpdate(device.id, device.urgentDocType); }}
                                        disabled={updatingId === device.id}
                                        style={{ flexShrink: 0, fontSize: '0.78rem' }}
                                      >
                                        {updatingId === device.id ? '...' : '✓ Đã gửi'}
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
            }
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
