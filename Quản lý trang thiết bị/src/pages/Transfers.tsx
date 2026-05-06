import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Download, FileText, Loader2, RefreshCw, Repeat2, Send, XCircle } from 'lucide-react';
import { Card, CardBody, Button, Input, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Badge } from '../components/ui';
import {
  createTransfer,
  fetchDevices,
  fetchTransfers,
  receiveTransfer,
  rejectTransfer,
  cancelTransfer,
  type DeviceData,
  type TransferData,
} from '../services/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const statusText: Record<string, string> = {
  PENDING_RECEIVE: 'Chờ khoa nhận',
  COMPLETED: 'Đã nhận',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
};

const statusVariant = (status: string) => {
  if (status === 'COMPLETED') return 'success';
  if (status === 'REJECTED' || status === 'CANCELLED') return 'danger';
  if (status === 'PENDING_RECEIVE') return 'warning';
  return 'neutral';
};

const Transfers: React.FC = () => {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [transfers, setTransfers] = useState<TransferData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'incoming' | 'outgoing' | 'history'>('incoming');
  const [deviceId, setDeviceId] = useState('');
  const [toDepartment, setToDepartment] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  const username = localStorage.getItem('username') || '';
  const userDepartment = localStorage.getItem('userDepartment') || '';
  const role = localStorage.getItem('userRole') || '';
  const isAdmin = role.toLowerCase() === 'admin';

  const loadData = async () => {
    setIsLoading(true);
    const [deviceData, transferData] = await Promise.all([fetchDevices(), fetchTransfers()]);
    setDevices(deviceData);
    setTransfers(transferData.reverse());
    setIsLoading(false);
    if (!deviceId && deviceData.length > 0) {
      const first = deviceData.find(d => isAdmin || d.department === userDepartment) || deviceData[0];
      setDeviceId(first.id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const departments = useMemo(() => {
    return Array.from(new Set(devices.map(d => d.department).filter(Boolean))).sort();
  }, [devices]);

  const transferableDevices = useMemo(() => {
    return devices.filter(device => isAdmin || device.department === userDepartment);
  }, [devices, isAdmin, userDepartment]);

  const incoming = transfers.filter(t => t.status === 'PENDING_RECEIVE' && (isAdmin || t.toDepartment === userDepartment));
  const outgoing = transfers.filter(t => t.status === 'PENDING_RECEIVE' && (isAdmin || t.requestedBy === username || t.fromDepartment === userDepartment));

  const visibleTransfers = activeTab === 'incoming'
    ? incoming
    : activeTab === 'outgoing'
      ? outgoing
      : transfers;

  const selectedDevice = devices.find(device => device.id === deviceId);

  const submitTransfer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!deviceId || !toDepartment) {
      setMessage('Vui lòng chọn thiết bị và khoa/phòng nhận.');
      return;
    }
    setIsSaving(true);
    const response = await createTransfer({ deviceId, toDepartment, reason, actorUsername: username });
    setIsSaving(false);
    setMessage(response.message || '');
    if (response.success) {
      setReason('');
      setToDepartment('');
      await loadData();
      setActiveTab('outgoing');
    }
  };

  const handleReceive = async (transfer: TransferData) => {
    const note = window.prompt('Ghi chú nhận thiết bị (nếu có):') || '';
    const response = await receiveTransfer({ transferId: transfer.transferId, actorUsername: username, note });
    alert(response.message || (response.success ? 'Đã nhận.' : 'Có lỗi xảy ra.'));
    await loadData();
  };

  const handleReject = async (transfer: TransferData) => {
    const reasonText = window.prompt('Lý do từ chối nhận thiết bị:') || '';
    if (!reasonText.trim()) return;
    const response = await rejectTransfer({ transferId: transfer.transferId, actorUsername: username, reason: reasonText });
    alert(response.message || (response.success ? 'Đã từ chối.' : 'Có lỗi xảy ra.'));
    await loadData();
  };

  const handleCancel = async (transfer: TransferData) => {
    if (!window.confirm('Hủy yêu cầu luân chuyển này?')) return;
    const response = await cancelTransfer({ transferId: transfer.transferId, actorUsername: username, reason: 'Người tạo yêu cầu hủy' });
    alert(response.message || (response.success ? 'Đã hủy.' : 'Có lỗi xảy ra.'));
    await loadData();
  };

  const exportRows = visibleTransfers.map((t, index) => ({
    STT: index + 1,
    'Mã yêu cầu': t.transferId,
    'Thời gian tạo': t.createdAt,
    'Mã thiết bị': t.deviceId,
    'Tên thiết bị': t.deviceName,
    'Từ khoa/phòng': t.fromDepartment,
    'Đến khoa/phòng': t.toDepartment,
    'Trạng thái': statusText[t.status] || t.status,
    'Người chuyển': t.requestedByName,
    'Người nhận': t.receivedByName,
    'Lý do/Ghi chú': t.requestedNote || t.receivedNote || t.rejectReason,
  }));

  const exportExcel = () => {
    if (exportRows.length === 0) return alert('Không có dữ liệu để xuất.');
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'LuanChuyen');
    XLSX.writeFile(wb, `LuanChuyenThietBi_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`);
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(14);
    doc.text('BAO CAO LUAN CHUYEN THIET BI', 148, 18, { align: 'center' });
    autoTable(doc, {
      startY: 28,
      head: [['STT', 'Ma YC', 'Ma TB', 'Ten thiet bi', 'Tu khoa', 'Den khoa', 'Trang thai', 'Nguoi chuyen', 'Nguoi nhan']],
      body: exportRows.map(row => [
        row.STT,
        row['Mã yêu cầu'],
        row['Mã thiết bị'],
        row['Tên thiết bị'],
        row['Từ khoa/phòng'],
        row['Đến khoa/phòng'],
        row['Trạng thái'],
        row['Người chuyển'],
        row['Người nhận'],
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [13, 148, 136], textColor: 255 },
    });
    doc.save(`LuanChuyenThietBi_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.pdf`);
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Repeat2 size={28} style={{ color: 'var(--primary)' }} />
            Luân chuyển trang thiết bị
          </h1>
          <p className="dashboard-subtitle">
            Khoa đang giữ thiết bị tạo yêu cầu, khoa nhận xác nhận trước khi cập nhật vị trí thiết bị.
          </p>
        </div>
        <div className="action-buttons">
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={loadData}>Làm mới</Button>
          <Button variant="secondary" icon={<FileText size={16} />} onClick={exportPdf}>PDF</Button>
          <Button variant="primary" icon={<Download size={16} />} onClick={exportExcel}>Excel</Button>
        </div>
      </div>

      <div className="reports-tabs-container">
        <button className={`report-main-tab ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>Tạo yêu cầu</button>
        <button className={`report-main-tab ${activeTab === 'incoming' ? 'active' : ''}`} onClick={() => setActiveTab('incoming')}>Chờ khoa tôi nhận ({incoming.length})</button>
        <button className={`report-main-tab ${activeTab === 'outgoing' ? 'active' : ''}`} onClick={() => setActiveTab('outgoing')}>Tôi đã chuyển ({outgoing.length})</button>
        <button className={`report-main-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Lịch sử</button>
      </div>

      {activeTab === 'create' ? (
        <Card>
          <CardBody style={{ maxWidth: '760px' }}>
            <form onSubmit={submitTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="input-label">Thiết bị chuyển</label>
                <select className="filter-select" style={{ width: '100%' }} value={deviceId} onChange={e => setDeviceId(e.target.value)} required>
                  {transferableDevices.map(device => (
                    <option key={device.id} value={device.id}>{device.id} - {device.name} ({device.department})</option>
                  ))}
                </select>
              </div>
              <div className="info-grid">
                <div className="info-item"><span className="info-label">Khoa/phòng hiện tại</span><span className="info-value">{selectedDevice?.department || userDepartment || '—'}</span></div>
                <div className="info-item"><span className="info-label">Người tạo yêu cầu</span><span className="info-value">{localStorage.getItem('userName') || username}</span></div>
              </div>
              <div>
                <label className="input-label">Khoa/phòng nhận</label>
                <Input value={toDepartment} onChange={e => setToDepartment(e.target.value)} list="transfer-depts" placeholder="Nhập hoặc chọn khoa/phòng nhận" required />
                <datalist id="transfer-depts">
                  {departments.filter(dept => dept !== selectedDevice?.department).map(dept => <option key={dept} value={dept} />)}
                </datalist>
              </div>
              <div>
                <label className="input-label">Lý do luân chuyển</label>
                <textarea className="input-field" rows={4} value={reason} onChange={e => setReason(e.target.value)} placeholder="Lý do, tình trạng bàn giao, phụ kiện đi kèm..." />
              </div>
              {message && <div style={{ color: message.startsWith('Đã') ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{message}</div>}
              <Button type="submit" variant="primary" icon={isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />} disabled={isSaving}>
                {isSaving ? 'Đang gửi...' : 'Gửi yêu cầu sang khoa nhận'}
              </Button>
            </form>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody style={{ padding: 0 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Yêu cầu</TableHeader>
                  <TableHeader>Thiết bị</TableHeader>
                  <TableHeader>Luân chuyển</TableHeader>
                  <TableHeader>Người chuyển</TableHeader>
                  <TableHeader>Trạng thái</TableHeader>
                  <TableHeader>Thao tác</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</TableCell></TableRow>
                ) : visibleTransfers.length === 0 ? (
                  <TableRow><TableCell colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Không có dữ liệu.</TableCell></TableRow>
                ) : visibleTransfers.map(transfer => (
                  <TableRow key={transfer.transferId}>
                    <TableCell><strong>{transfer.transferId}</strong><br /><small>{transfer.createdAt || transfer.requestedAt}</small></TableCell>
                    <TableCell><strong>{transfer.deviceName || transfer.deviceId}</strong><br /><small>{transfer.deviceId}</small></TableCell>
                    <TableCell>{transfer.fromDepartment}<br /><strong>→ {transfer.toDepartment}</strong></TableCell>
                    <TableCell>{transfer.requestedByName || transfer.requestedBy}<br /><small>{transfer.requestedNote}</small></TableCell>
                    <TableCell><Badge variant={statusVariant(transfer.status) as any}>{statusText[transfer.status] || transfer.status}</Badge></TableCell>
                    <TableCell>
                      {transfer.status === 'PENDING_RECEIVE' && (activeTab === 'incoming' || isAdmin) ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Button size="sm" variant="success" icon={<CheckCircle size={14} />} onClick={() => handleReceive(transfer)}>Nhận</Button>
                          <Button size="sm" variant="danger" icon={<XCircle size={14} />} onClick={() => handleReject(transfer)}>Từ chối</Button>
                        </div>
                      ) : transfer.status === 'PENDING_RECEIVE' && (transfer.requestedBy === username || isAdmin) ? (
                        <Button size="sm" variant="secondary" onClick={() => handleCancel(transfer)}>Hủy</Button>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>{transfer.receivedByName || transfer.rejectReason || '—'}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default Transfers;
