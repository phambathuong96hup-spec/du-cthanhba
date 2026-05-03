import React, { useState, useRef, useEffect } from 'react';
import { Camera, AlertCircle, Clock, Send, X, ShieldAlert, ChevronDown, ScanLine } from 'lucide-react';
import { Card, CardBody, Button, Input } from '../components/ui';
import { reportRepair, fetchDevices, type DeviceData } from '../services/api';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './RepairRequest.css';

const RepairRequest: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [deviceId, setDeviceId] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [isScanning, setIsScanning] = useState(false);

  const savedEmail = localStorage.getItem('userEmail') || '';
  const userName = localStorage.getItem('userName') || 'Nhân viên vô danh';
  const [userEmail, setUserEmail] = useState(savedEmail);

  useEffect(() => {
    // Load danh sách thiết bị thực từ Google Sheets
    fetchDevices().then(data => {
      setDevices(data);
      // Đọc deviceId từ sessionStorage nếu được điều hướng từ DeviceProfile
      const prefilledId = sessionStorage.getItem('repairDeviceId');
      if (prefilledId) {
        setDeviceId(prefilledId);
        sessionStorage.removeItem('repairDeviceId');
      } else if (data.length > 0) {
        setDeviceId(data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      
      scanner.render((decodedText) => {
        let newId = '';
        try {
          // Xử lý mã QR dạng URL (chuẩn mới)
          if (decodedText.includes('/devices/')) {
            const pathParts = decodedText.split('/devices/');
            if (pathParts.length > 1) {
              const urlId = pathParts[1].split('?')[0].split('#')[0];
              newId = decodeURIComponent(urlId).trim();
            }
          } 
          // Cờ dự phòng (fallback) cho JSON hoặc Text cũ
          else {
            try {
              const parsed = JSON.parse(decodedText);
              if (parsed.id) newId = parsed.id;
            } catch(e) {
              const match = decodedText.match(/MÃ THIẾT BỊ:\s*([^\n]+)/i);
              if (match) newId = match[1].trim();
              else newId = decodedText.trim();
            }
          }
        } catch (e) {
          newId = decodedText.trim();
        }
        
        if (newId) {
          setDeviceId(newId);
          setIsScanning(false);
          scanner.clear();
          alert(`Đã nhận diện thiết bị: ${newId}`);
        }
      }, (_err) => {
        // Handle scan errors quietly
      });
      
      return () => {
        scanner.clear().catch(e => console.error("Scanner clear fail", e));
      };
    }
  }, [isScanning]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !userEmail.trim() || !deviceId.trim()) {
      alert('Vui lòng điền đầy đủ Mã thiết bị, Mô tả và Email để nhận phản hồi.');
      return;
    }
    setIsSubmitting(true);

    const response = await reportRepair({
      deviceId: priority === 'urgent' ? `[KHẨN] ${deviceId}` : deviceId,
      userName,
      userEmail,
      description,
    });

    setIsSubmitting(false);

    if (response.success) {
      alert('✅ Yêu cầu thông báo hỏng đã được gửi tới Admin xử lý kịp thời!');
      setDescription('');
      setSelectedImage(null);
      setPriority('normal');
      if (devices.length > 0) setDeviceId(devices[0].id);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      alert('❌ Có lỗi xảy ra: ' + (response.message || 'Lỗi không xác định'));
    }
  };

  return (
    <div className="repair-request-page">
      <div className="page-header">
        <h1 className="page-title">Yêu cầu Sửa chữa / Báo hỏng</h1>
      </div>

      <Card className="mobile-friendly-card">
        <CardBody>
          {/* Chọn thiết bị từ danh sách thực */}
          <div className="device-summary">
            <div className="device-summary-icon">
              <ShieldAlert size={28} style={{ color: 'var(--danger)' }} />
            </div>
            <div className="device-summary-info" style={{ flex: 1 }}>
              <h3>Chọn thiết bị báo hỏng</h3>
              <div style={{ position: 'relative' }}>
                <select
                  value={deviceId}
                  onChange={e => setDeviceId(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 36px 10px 14px',
                    border: '1.5px solid var(--border)', borderRadius: '8px',
                    fontSize: '0.95rem', background: 'white', appearance: 'none',
                    cursor: 'pointer', color: 'var(--text-primary)'
                  }}
                >
                  {devices.length === 0
                    ? <option value="">Đang tải danh sách thiết bị...</option>
                    : devices.map(d => (
                        <option key={d.id} value={d.id}>{d.id} — {d.name} ({d.department})</option>
                      ))
                  }
                </select>
                <ChevronDown size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }} />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Hoặc nhập tay mã thiết bị:
              </p>
              <input
                type="text"
                value={deviceId}
                onChange={e => setDeviceId(e.target.value)}
                placeholder="Nhập tay mã TB nếu không có trong danh sách"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.9rem', marginTop: '4px', boxSizing: 'border-box' }}
              />
              
              <div style={{ marginTop: '12px' }}>
                <Button type="button" variant={isScanning ? "danger" : "secondary"} icon={<ScanLine size={18} />} onClick={() => setIsScanning(!isScanning)}>
                  {isScanning ? 'Đóng máy quét' : 'Quét mã QR trên thiết bị'}
                </Button>
              </div>
              
              {isScanning && (
                <div style={{ marginTop: '16px', borderRadius: '8px', overflow: 'hidden', border: '2px solid var(--primary)' }}>
                  <div id="qr-reader" style={{ width: '100%' }}></div>
                </div>
              )}
            </div>
          </div>

          <form className="form-section" onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Mức độ ưu tiên</label>
              <div className="priority-options">
                <label className={`radio-card ${priority === 'normal' ? 'selected' : ''}`} onClick={() => setPriority('normal')}>
                  <input type="radio" name="priority" value="normal" checked={priority === 'normal'} onChange={() => setPriority('normal')} />
                  <div className="radio-label"><Clock size={24} /><span>Bình thường</span></div>
                </label>
                <label className={`radio-card urgent ${priority === 'urgent' ? 'selected' : ''}`} onClick={() => setPriority('urgent')}>
                  <input type="radio" name="priority" value="urgent" checked={priority === 'urgent'} onChange={() => setPriority('urgent')} />
                  <div className="radio-label"><AlertCircle size={24} /><span>Khẩn cấp</span></div>
                </label>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Mô tả tình trạng hỏng hóc</label>
              <div className="input-wrapper">
                <textarea
                  className="input-field"
                  placeholder="Mô tả chi tiết biểu hiện lỗi (VD: Máy không lên nguồn, màn hình báo lỗi E02...)"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Email của bạn (Nhận kết quả phản hồi)</label>
              <Input
                type="email"
                placeholder="VD: nhanvien@benhvien.vn"
                value={userEmail}
                onChange={e => setUserEmail(e.target.value)}
                readOnly={savedEmail !== ''}
                style={{ backgroundColor: savedEmail !== '' ? 'var(--surface-50)' : 'white' }}
                required
              />
              {savedEmail !== ''
                ? <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>* Email được đồng bộ từ tài khoản của bạn.</p>
                : <p style={{ fontSize: '0.8rem', color: 'var(--warning)', marginTop: '4px' }}>* Nhờ Admin cập nhật Email trong Sheet Users để tự động điền.</p>
              }
            </div>

            <div className="input-group">
              <label className="input-label">Hình ảnh đính kèm (tùy chọn)</label>
              {!selectedImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{ cursor: 'pointer', border: '2px dashed #c2dbe9', borderRadius: '8px', padding: '24px', textAlign: 'center', background: '#f8fbff' }}
                >
                  <Camera size={32} style={{ color: 'var(--primary)', margin: '0 auto 8px' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Nhấn để chọn ảnh tình trạng máy</span>
                </div>
              ) : (
                <div style={{ position: 'relative', width: '100%', maxWidth: '300px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={selectedImage} alt="Preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  <button type="button" onClick={handleRemoveImage}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <X size={16} />
                  </button>
                </div>
              )}
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
            </div>

            <Button type="submit" variant="primary" className="submit-btn" icon={<Send size={20} />} disabled={isSubmitting}>
              {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu sửa chữa'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default RepairRequest;
