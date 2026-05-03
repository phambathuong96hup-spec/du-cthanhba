import React, { useState, useEffect } from 'react';
import { Plus, Download, Printer, Search, Eye, Edit2, X, Save, Loader2 } from 'lucide-react';
import { Card, Button, Input, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Badge } from '../components/ui';
import { fetchDevices, addDevice, editDevice, type DeviceData } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';
import './Devices.css';

interface DeviceFormData {
  serial: string;
  name: string;
  department: string;
  dateAdded: string;
  notes: string;
}

const emptyForm: DeviceFormData = {
  serial: '',
  name: '',
  department: '',
  dateAdded: new Date().toLocaleDateString('vi-VN'),
  notes: '',
};

const DeviceList: React.FC = () => {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [printingDevices, setPrintingDevices] = useState<DeviceData[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<DeviceFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const navigate = useNavigate();

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchDevices();
    setDevices(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, departmentFilter, statusFilter]);

  useEffect(() => {
    if (printingDevices.length > 0) {
      setTimeout(() => {
        window.print();
        setPrintingDevices([]);
      }, 500);
    }
  }, [printingDevices]);

  const uniqueDepartments = Array.from(new Set(devices.map(d => d.department))).filter(Boolean).sort();

  const filteredDevices = devices.filter(device => {
    const sTerm = searchTerm.toLowerCase();
    const idStr = String(device.id || '').toLowerCase();
    const nameStr = String(device.name || '').toLowerCase();
    
    const searchMatch = idStr.includes(sTerm) || nameStr.includes(sTerm);
    const deptMatch = departmentFilter === 'all' || device.department === departmentFilter;
    const statusMatch = statusFilter === 'all' || (statusFilter === 'good' ? device.status === 'O' : device.status !== 'O');
    return searchMatch && deptMatch && statusMatch;
  });

  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
  const paginatedDevices = filteredDevices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePrintSingleQR = (device: DeviceData) => setPrintingDevices([device]);
  const handlePrintBulkQR = () => {
    if (filteredDevices.length > 0) setPrintingDevices(filteredDevices.slice(0, 20));
    else alert('Không có thiết bị nào trong danh sách hiển thị để in.');
  };

  const handleExportExcel = () => {
    if (filteredDevices.length === 0) { alert('Không có dữ liệu để xuất Excel.'); return; }
    const exportData = filteredDevices.map(d => ({
      'Mã thiết bị': d.id,
      'Tên thiết bị': d.name,
      'Khoa/Phòng': d.department,
      'Trạng thái': d.status === 'O' ? 'Hoạt động tốt' : 'Báo hỏng/Khác',
      'Ngày nhập / Đăng kiểm': d.dateAdded,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachTB');
    XLSX.writeFile(wb, 'DanhSachThietBi_ThanhBa.xlsx');
  };

  const openAddModal = () => {
    setFormData(emptyForm);
    setModalMode('add');
    setSaveMsg('');
    setShowModal(true);
  };

  const openEditModal = (device: DeviceData) => {
    setFormData({
      serial: String(device.id || ''),
      name: String(device.name || ''),
      department: String(device.department || ''),
      dateAdded: device.dateAdded !== 'N/A' ? String(device.dateAdded || '') : '',
      notes: String(device['Ghi chú'] || ''),
    });
    setModalMode('edit');
    setSaveMsg('');
    setShowModal(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.department.trim()) {
      setSaveMsg('❌ Vui lòng điền đầy đủ Tên thiết bị và Khoa/Phòng.');
      return;
    }
    setIsSaving(true);
    setSaveMsg('');
    const res = modalMode === 'add'
      ? await addDevice({ name: formData.name, serial: formData.serial, department: formData.department, dateAdded: formData.dateAdded, notes: formData.notes })
      : await editDevice({ serial: formData.serial, name: formData.name, department: formData.department, dateAdded: formData.dateAdded, notes: formData.notes });
    setIsSaving(false);
    if (res.success) {
      setSaveMsg('✅ ' + (res.message || 'Thành công!'));
      await loadData();
      setTimeout(() => setShowModal(false), 1200);
    } else {
      setSaveMsg('❌ ' + (res.message || 'Có lỗi xảy ra.'));
    }
  };

  return (
    <div className="device-list-page">
      <div className="page-header">
        <h1 className="page-title">Danh sách Trang thiết bị</h1>
        <div className="action-buttons">
          <Button variant="secondary" icon={<Download size={18} />} onClick={handleExportExcel}>Xuất Excel</Button>
          <Button variant="secondary" icon={<Printer size={18} />} onClick={handlePrintBulkQR}>In QR hàng loạt</Button>
          <Button variant="primary" icon={<Plus size={18} />} onClick={openAddModal}>Thêm thiết bị mới</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <Card style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #10b981' }}>
          <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '50%', color: '#10b981' }}><Eye size={24} /></div>
          <div><h3 style={{ margin: 0, fontSize: '1.5rem', color: '#1f2937' }}>{devices.filter(d => d.alertLevel === 'ok' || !d.alertLevel).length}</h3><p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Đang hiệu lực (OK)</p></div>
        </Card>
        <Card style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '50%', color: '#f59e0b' }}><Search size={24} /></div>
          <div><h3 style={{ margin: 0, fontSize: '1.5rem', color: '#1f2937' }}>{devices.filter(d => d.alertLevel === 'warning').length}</h3><p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Cần chuẩn bị hồ sơ (&le; 45 ngày)</p></div>
        </Card>
        <Card style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '50%', color: '#ef4444' }}><Edit2 size={24} /></div>
          <div><h3 style={{ margin: 0, fontSize: '1.5rem', color: '#1f2937' }}>{devices.filter(d => d.alertLevel === 'danger').length}</h3><p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sắp / đã hết hạn (&le; 15 ngày)</p></div>
        </Card>
      </div>

      <Card>
        <div className="toolbar" style={{ padding: '20px', paddingBottom: 0 }}>
          <div className="filter-group">
            <select className="filter-select" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
              <option value="all">Tất cả Khoa/Phòng</option>
              {uniqueDepartments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="good">Hoạt động tốt</option>
              <option value="broken">Báo hỏng</option>
            </select>
          </div>
          <div className="search-box">
            <Input placeholder="Tìm kiếm mã thiết bị, tên máy..." icon={<Search size={18} />} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Mã / Seri</TableHeader>
              <TableHeader>Tên thiết bị</TableHeader>
              <TableHeader>Khoa/Phòng</TableHeader>
              <TableHeader>Trạng thái</TableHeader>
              <TableHeader>Ngày nhập</TableHeader>
              <TableHeader>Thao tác</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} /> Đang tải dữ liệu...
              </TableCell></TableRow>
            ) : paginatedDevices.length === 0 ? (
              <TableRow><TableCell colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                Không tìm thấy thiết bị nào phù hợp.
              </TableCell></TableRow>
            ) : paginatedDevices.map(device => (
              <TableRow key={device.id}>
                <TableCell><strong>{device.id}</strong></TableCell>
                <TableCell>{device.name}</TableCell>
                <TableCell>{device.department}</TableCell>
                <TableCell>
                  <Badge variant={device.status === 'O' ? 'success' : 'warning'}>
                    {device.status === 'O' ? 'Hoạt động' : 'Báo hỏng'}
                  </Badge>
                </TableCell>
                <TableCell>{device.dateAdded}</TableCell>
                <TableCell>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="secondary" size="sm" icon={<Eye size={14} />} title="Xem chi tiết" onClick={() => navigate(`/devices/${encodeURIComponent(device.id)}`)} />
                    <Button variant="secondary" size="sm" icon={<Edit2 size={14} />} title="Sửa" onClick={() => openEditModal(device)} />
                    <Button variant="secondary" size="sm" icon={<Printer size={14} />} title="In QR" onClick={() => handlePrintSingleQR(device)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="pagination" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Hiển thị {filteredDevices.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, filteredDevices.length)} / {filteredDevices.length} thiết bị
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button variant="secondary" size="sm" disabled={currentPage === 1 || totalPages === 0} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Trang trước</Button>
            <span style={{ fontSize: '0.9rem', margin: '0 8px' }}>Trang {currentPage} / {totalPages || 1}</span>
            <Button variant="secondary" size="sm" disabled={currentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Trang sau</Button>
          </div>
        </div>
      </Card>

      {/* QR Print Area */}
      {printingDevices.length > 0 && (
        <div id="print-area">
          {printingDevices.map((device, index) => {
            // Đổi mã QR thành đường dẫn URL trỏ thẳng vào web (Device Profile)
            // Khi điện thoại quét URL, nó sẽ không search Google mà mở Trình duyệt web.
            const qrUrl = `${window.location.origin}/devices/${encodeURIComponent(device.id)}`;
            return (
            <div className="print-page" key={`print-${device.id}-${index}`}>
              <h2>TTYT khu vực Thanh Ba</h2>
              <p className="subtitle">Hệ thống QLTTB</p>
              <QRCodeSVG value={qrUrl} size={120} level="M" />
              <h3>{device.id}</h3>
              <p className="device-name">{device.name}</p>
              <p className="device-dept">{device.department}</p>
            </div>
            );
          })}
        </div>
      )}

      {/* Modal Thêm / Sửa thiết bị */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--primary)', borderRadius: '12px 12px 0 0' }}>
              <h2 style={{ margin: 0, color: 'white', fontSize: '1.1rem' }}>
                {modalMode === 'add' ? '➕ Thêm thiết bị mới' : '✏️ Sửa thông tin thiết bị'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
                <X size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Tên thiết bị *</label>
                <input
                  name="name" value={formData.name} onChange={handleFormChange}
                  placeholder="VD: Máy siêu âm màu Doppler 4D"
                  required
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Seri / Mã thiết bị</label>
                <input
                  name="serial" value={formData.serial} onChange={handleFormChange}
                  placeholder="VD: TB-001 (để trống hệ thống tự tạo)"
                  readOnly={modalMode === 'edit'}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.95rem', background: modalMode === 'edit' ? '#f5f5f5' : 'white', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Khoa/Phòng sử dụng *</label>
                <input
                  name="department" value={formData.department} onChange={handleFormChange}
                  placeholder="VD: Khoa Chẩn đoán hình ảnh"
                  list="dept-list"
                  required
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box' }}
                />
                <datalist id="dept-list">
                  {uniqueDepartments.map(d => <option key={d} value={d} />)}
                </datalist>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Ngày nhập / Đăng kiểm</label>
                <input
                  name="dateAdded" value={formData.dateAdded} onChange={handleFormChange}
                  placeholder="VD: 15/03/2025"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Ghi chú thêm</label>
                <textarea
                  name="notes" value={formData.notes} onChange={handleFormChange}
                  placeholder="Nguồn vốn, nhà cung cấp, ghi chú kỹ thuật..."
                  rows={3}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              {saveMsg && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: saveMsg.startsWith('✅') ? '#d4edda' : '#f8d7da', color: saveMsg.startsWith('✅') ? '#155724' : '#721c24', fontSize: '0.9rem' }}>
                  {saveMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
                <Button type="submit" variant="primary" icon={isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />} disabled={isSaving}>
                  {isSaving ? 'Đang lưu...' : (modalMode === 'add' ? 'Thêm thiết bị' : 'Lưu thay đổi')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceList;
