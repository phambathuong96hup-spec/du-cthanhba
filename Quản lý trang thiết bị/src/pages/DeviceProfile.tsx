import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, RefreshCw, FileText, X, Save } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardBody, Button, Badge, Tabs, Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui';
import { createTransfer, fetchDevices, fetchTransfers, fetchRepairs, type DeviceData, type TransferData, type RepairData } from '../services/api';
import { useAuth } from '../authContext';
import './Devices.css';

const DeviceProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, username } = useAuth();
  const [device, setDevice] = useState<DeviceData | null>(null);
  const [transfers, setTransfers] = useState<TransferData[]>([]);
  const [repairs, setRepairs] = useState<RepairData[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal điều chuyển khoa
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [newDept, setNewDept] = useState('');
  const [transferNote, setTransferNote] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [data, transferData, repairData] = await Promise.all([fetchDevices(), fetchTransfers(), fetchRepairs()]);
      const decodedId = decodeURIComponent(id || '');
      const found = data.find(d => d.id === decodedId);
      if (found) setDevice(found);
      setDepartments(Array.from(new Set(data.map(d => d.department).filter(Boolean))).sort());
      setTransfers(transferData.filter(t => t.deviceId === decodedId).reverse());
      setRepairs(repairData.filter(r => r.deviceId === decodedId));
      setIsLoading(false);
    };
    if (id) loadData();
  }, [id]);

  const handleReportBroken = () => {
    // Lưu deviceId vào sessionStorage để báo hỏng trang tự điền sẵn
    if (device) sessionStorage.setItem('repairDeviceId', device.id);
    navigate('/requests?type=repair');
  };

  const handleTransfer = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/devices/${id}` } } });
      return;
    }
    if (!newDept.trim()) { alert('Vui lòng nhập Khoa/Phòng đích.'); return; }
    if (!device) return;
    const res = await createTransfer({
      deviceId: device.id,
      toDepartment: newDept,
      reason: transferNote,
      actorUsername: username,
    });
    alert((res.success ? '✅ ' : '❌ ') + (res.message || 'Có lỗi xảy ra.'));
    if (res.success) {
      const transferData = await fetchTransfers();
      setTransfers(transferData.filter(t => t.deviceId === device.id).reverse());
      setShowTransferModal(false);
      setNewDept('');
      setTransferNote('');
    }
  };

  const generalInfoTab = (
    <div className="info-grid">
      <div className="info-item"><span className="info-label">Tên thiết bị</span><span className="info-value">{device?.name || '—'}</span></div>
      <div className="info-item"><span className="info-label">Khoa/Phòng sử dụng</span><span className="info-value">{device?.department || '—'}</span></div>
      <div className="info-item"><span className="info-label">Số Serial / Mã TB</span><span className="info-value">{device?.id || '—'}</span></div>
      <div className="info-item"><span className="info-label">Ngày cấp / Đăng kiểm</span><span className="info-value">{device?.dateAdded || '—'}</span></div>
      <div className="info-item"><span className="info-label">Năm sản xuất</span><span className="info-value">{String(device?.['Năm SX'] || '—')}</span></div>
      <div className="info-item"><span className="info-label">Nhà cung cấp</span><span className="info-value">{String(device?.['Hãng sản xuất/ Xuất xứ'] || '—')}</span></div>
      <div className="info-item"><span className="info-label">Nguồn vốn</span><span className="info-value">{String(device?.['Ghi chú'] || '—')}</span></div>
    </div>
  );

  const movementHistoryTab = (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>Khoa/Phòng</TableHeader>
          <TableHeader>Từ ngày</TableHeader>
          <TableHeader>Đến ngày</TableHeader>
          <TableHeader>Người bàn giao</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {transfers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
              Chưa có lịch sử luân chuyển.
            </TableCell>
          </TableRow>
        ) : transfers.map(transfer => (
          <TableRow key={transfer.transferId}>
            <TableCell>{transfer.fromDepartment} → <strong>{transfer.toDepartment}</strong></TableCell>
            <TableCell>{transfer.requestedAt || transfer.createdAt}</TableCell>
            <TableCell>{transfer.receivedAt || transfer.status}</TableCell>
            <TableCell>{transfer.requestedByName || transfer.requestedBy}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const maintenanceHistoryTab = (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>Ngày</TableHeader>
          <TableHeader>Mô tả lỗi</TableHeader>
          <TableHeader>Trạng thái</TableHeader>
          <TableHeader>Người báo</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {repairs.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
              Chưa có lịch sử sửa chữa cho thiết bị này.
            </TableCell>
          </TableRow>
        ) : repairs.map((repair, idx) => (
          <TableRow key={repair.rowId || idx}>
            <TableCell>{repair.rowId || '—'}</TableCell>
            <TableCell>{repair.description || '—'}</TableCell>
            <TableCell>
              <Badge variant={repair.status === 'Đã xử lý' ? 'success' : repair.status === 'Từ chối' ? 'danger' : 'warning'}>
                {repair.status}
              </Badge>
            </TableCell>
            <TableCell>{repair.userName || '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const documentsTab = (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
      <FileText size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
      <p>Tính năng quản lý tài liệu sẽ được cập nhật trong phiên bản tới.</p>
    </div>
  );

  const tabsData = [
    { id: 'general', label: 'Thông tin chung', content: generalInfoTab },
    { id: 'movement', label: 'Lịch sử luân chuyển', content: movementHistoryTab },
    { id: 'maintenance', label: 'Sửa chữa & Bảo dưỡng', content: maintenanceHistoryTab },
    { id: 'docs', label: 'Tài liệu đính kèm', content: documentsTab },
  ];

  return (
    <div className="device-profile-page">
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <Button variant="secondary" size="sm" icon={<ArrowLeft size={16} />} onClick={() => navigate('/devices')}>Quay lại</Button>
      </div>

      <Card>
        <CardBody>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải thông tin thiết bị...</div>
          ) : !device ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--danger)' }}>
              Không tìm thấy thiết bị với mã: <strong>{id}</strong>
            </div>
          ) : (
            <>
              <div className="profile-header">
                <div className="device-main-info">
                  <div className="qr-code-box">
                    <QRCodeSVG
                      value={`${window.location.origin}${import.meta.env.BASE_URL}devices/${encodeURIComponent(device.id)}`}
                      size={160}
                      level="M"
                      includeMargin
                    />
                  </div>
                  <div className="device-details">
                    <h1>{device.name}</h1>
                    <div className="device-id">{device.id}</div>
                    <div>
                      <Badge variant={device.status === 'O' ? 'success' : 'warning'}>
                        {device.status === 'O' ? 'Đang hoạt động tốt' : 'Báo hỏng / Khác'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="action-buttons">
                  <Button variant="danger" icon={<AlertTriangle size={18} />} onClick={handleReportBroken}>Báo hỏng</Button>
                  <Button variant="secondary" icon={<RefreshCw size={18} />} onClick={() => setShowTransferModal(true)}>Điều chuyển Khoa</Button>
                </div>
              </div>

              <div style={{ marginTop: '32px' }}>
                <Tabs tabs={tabsData} defaultTab="general" />
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Modal điều chuyển khoa */}
      {showTransferModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>🔄 Yêu cầu điều chuyển thiết bị</h2>
              <button onClick={() => setShowTransferModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={22} /></button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Thiết bị: <strong>{device?.name}</strong> ({device?.id})</p>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>Khoa/Phòng đích *</label>
                <input value={newDept} onChange={e => setNewDept(e.target.value)} placeholder="VD: Khoa Phẫu thuật"
                  list="profile-transfer-depts"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box' }} />
                <datalist id="profile-transfer-depts">
                  {departments.filter(dept => dept !== device?.department).map(dept => <option key={dept} value={dept} />)}
                </datalist>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>Ghi chú</label>
                <textarea value={transferNote} onChange={e => setTransferNote(e.target.value)} rows={3} placeholder="Lý do điều chuyển..."
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => setShowTransferModal(false)}>Hủy</Button>
                <Button variant="primary" icon={<Save size={16} />} onClick={handleTransfer}>Ghi nhận điều chuyển</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceProfile;
