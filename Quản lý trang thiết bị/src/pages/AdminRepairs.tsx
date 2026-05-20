import React, { useState, useEffect } from 'react';
import { fetchRepairs, approveRepair, type RepairData } from '../services/api';
import { Card, CardHeader, CardBody, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Badge, useToast, ConfirmDialog } from '../components/ui';
import { CheckCircle, Clock, Search, Wrench, Edit } from 'lucide-react';
import { useAuth } from '../authContext';
import { getRepairStatusVariant } from '../utils/statusUtils';
import './AdminRepairs.css';

const AdminRepairs: React.FC = () => {
  const { name } = useAuth();
  const toast = useToast();
  const [repairs, setRepairs] = useState<RepairData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ rowId: string; deviceId: string; newStatus: string } | null>(null);
  
  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchRepairs();
    setRepairs(data.reverse());
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const requestStatusChange = (rowId: string, deviceId: string, newStatus: string) => {
    if (!newStatus || newStatus === '') return;
    setPendingAction({ rowId, deviceId, newStatus });
    setConfirmOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingAction) return;
    const { rowId, deviceId, newStatus } = pendingAction;
    setConfirmOpen(false);
    setPendingAction(null);

    // Optimistic update
    setRepairs(prev => prev.map(r => 
      r.rowId === rowId ? { ...r, status: newStatus } : r
    ));

    const res = await approveRepair({
      rowId,
      deviceId,
      newStatus,
      approver: name,
    });

    if (!res.success) {
      toast.error('Lỗi khi cập nhật: ' + res.message);
      loadData();
    } else {
      toast.success(`Đã cập nhật trạng thái "${deviceId}" thành "${newStatus}"`);
    }
  };

  const statusOptions = ['Đang kiểm tra', 'Đang sửa chữa', 'Đã hoàn thành'];

  return (
    <div className="admin-repairs-page">
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Edit size={28} style={{ color: 'var(--primary)' }} />
          Cập nhật Tiến độ Sửa chữa
        </h1>
        <p className="dashboard-subtitle">Thay đổi trạng thái yêu cầu báo hỏng trực tiếp để mọi người cùng theo dõi</p>
      </div>

      <Card>
        <CardHeader title="Danh sách các Yêu cầu (Mới nhất nằm trên cùng)" />
        <CardBody style={{ padding: '0' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Thời gian báo</TableHeader>
                <TableHeader>Thiết bị</TableHeader>
                <TableHeader>Người báo</TableHeader>
                <TableHeader>Mô tả lỗi</TableHeader>
                <TableHeader>Trạng thái hiện tại</TableHeader>
                <TableHeader>Cập nhật trạng thái</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Đang tải danh sách yêu cầu...</TableCell></TableRow>
              ) : repairs.length === 0 ? (
                <TableRow><TableCell colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Chưa có yêu cầu báo hỏng nào.</TableCell></TableRow>
              ) : (
                repairs.map((rp, index) => {
                  const isCompleted = rp.status.toLowerCase().includes('hoàn thành');
                  return (
                    <TableRow key={index} className={isCompleted ? 'completed-row' : ''}>
                      <TableCell>
                        <span className="repair-time">{rp.rowId}</span>
                      </TableCell>
                      <TableCell>
                        <span className="repair-device-id">{rp.deviceId}</span>
                      </TableCell>
                      <TableCell>
                        <div className="repair-reporter">
                          <span>{rp.userName}</span>
                          <span className="repair-reporter-email">{rp.userEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="repair-description">{rp.description}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRepairStatusVariant(rp.status)}>
                          {isCompleted ? <CheckCircle size={12}/> : (rp.status.toLowerCase().includes('sửa') ? <Wrench size={12}/> : (rp.status.toLowerCase().includes('chờ') ? <Clock size={12}/> : <Search size={12}/>))}
                          <span style={{marginLeft: '4px'}}>{rp.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <select 
                          className="status-select"
                          value={statusOptions.includes(rp.status) ? rp.status : (isCompleted ? "Đã hoàn thành" : "")}
                          onChange={(e) => requestStatusChange(rp.rowId, rp.deviceId, e.target.value)}
                          disabled={isCompleted}
                        >
                          <option value="" disabled>-- Chọn trạng thái --</option>
                          {statusOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setPendingAction(null); }}
        onConfirm={handleConfirmStatusChange}
        title="Xác nhận cập nhật"
        message={pendingAction ? `Bạn có chắc muốn cập nhật trạng thái thiết bị "${pendingAction.deviceId}" thành "${pendingAction.newStatus}"?` : ''}
        confirmText="Cập nhật"
        variant="primary"
      />
    </div>
  );
};

export default AdminRepairs;
