import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Menu, Search, Bell, ChevronDown, LogOut, LogIn, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../authContext';
import { useRepairs } from '../../hooks/useRepairs';
import { useTransfers } from '../../hooks/useTransfers';
import { useDevices } from '../../hooks/useDevices';
import './TopNav.css';

interface TopNavProps {
  toggleSidebar: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'repair' | 'transfer';
  link: string;
}

const TopNav: React.FC<TopNavProps> = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { isAuthenticated, name, role, email, department, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const { repairs } = useRepairs();
  const { transfers } = useTransfers();
  const { devices } = useDevices();

  // Local storage for read notifications
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('qlttb.read_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const getDeviceName = (deviceId: string) => {
    return devices.find(d => d.id === deviceId)?.name || deviceId;
  };

  const notificationItems = useMemo((): NotificationItem[] => {
    if (!isAuthenticated) return [];

    const list: NotificationItem[] = [];
    const isAdmin = role?.toLowerCase() === 'admin';

    if (isAdmin) {
      // 1. Pending repairs for admin
      repairs.forEach((rep) => {
        if (rep.status === 'Chờ duyệt') {
          list.push({
            id: `repair-pending-${rep.rowId}`,
            title: 'Yêu cầu sửa chữa mới',
            message: `Thiết bị ${getDeviceName(rep.deviceId)} báo lỗi: "${rep.description}" bởi ${rep.userName}`,
            time: 'Đang chờ duyệt',
            type: 'repair',
            link: '/admin-repairs',
          });
        }
      });

      // 2. Pending transfers for admin
      transfers.forEach((tr) => {
        if (tr.status === 'PENDING_RECEIVE') {
          list.push({
            id: `transfer-pending-${tr.transferId}`,
            title: 'Yêu cầu chuyển giao',
            message: `Bàn giao ${tr.deviceName} từ khoa ${tr.fromDepartment} sang ${tr.toDepartment}`,
            time: tr.requestedAt ? new Date(tr.requestedAt).toLocaleDateString('vi-VN') : 'Đang chờ',
            type: 'transfer',
            link: '/requests?type=transfer',
          });
        }
      });
    } else {
      // For staff
      const userDept = department;

      // 1. Pending transfers to their department
      transfers.forEach((tr) => {
        if (tr.status === 'PENDING_RECEIVE' && tr.toDepartment === userDept) {
          list.push({
            id: `transfer-dept-${tr.transferId}`,
            title: 'Tiếp nhận thiết bị',
            message: `Thiết bị ${tr.deviceName} đang chờ khoa ${userDept} tiếp nhận`,
            time: tr.requestedAt ? new Date(tr.requestedAt).toLocaleDateString('vi-VN') : 'Đang chờ',
            type: 'transfer',
            link: '/requests?type=transfer',
          });
        }
      });

      // 2. Repairs updates for this user
      repairs.forEach((rep) => {
        const isMyRepair = rep.userEmail === email || rep.userName === name;
        if (isMyRepair && rep.status !== 'Chờ duyệt') {
          list.push({
            id: `repair-update-${rep.rowId}-${rep.status}`,
            title: `Cập nhật sửa chữa`,
            message: `Yêu cầu sửa chữa ${getDeviceName(rep.deviceId)} được cập nhật: ${rep.status}`,
            time: rep.status,
            type: 'repair',
            link: '/requests?type=repair',
          });
        }
      });
    }

    return list;
  }, [repairs, transfers, devices, isAuthenticated, role, name, email, department]);

  const unreadCount = useMemo(() => {
    return notificationItems.filter(item => !readIds.includes(item.id)).length;
  }, [notificationItems, readIds]);

  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const newReadIds = [...readIds, id];
      setReadIds(newReadIds);
      localStorage.setItem('qlttb.read_notifications', JSON.stringify(newReadIds));
    }
  };

  const markAllAsRead = () => {
    const unreadItemIds = notificationItems.map(item => item.id);
    const newReadIds = Array.from(new Set([...readIds, ...unreadItemIds]));
    setReadIds(newReadIds);
    localStorage.setItem('qlttb.read_notifications', JSON.stringify(newReadIds));
  };

  // Click-outside to close dropdowns
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (showDropdown && profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (showNotifications && bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown, showNotifications]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value),
    []
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && searchQuery.trim()) {
        navigate(`/devices?search=${encodeURIComponent(searchQuery.trim())}`);
        setSearchQuery('');
      }
    },
    [searchQuery, navigate]
  );

  const initial = name ? name.charAt(0).toUpperCase() : '?';

  const handleLogout = () => {
    setShowDropdown(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="topnav">
      <div className="topnav-left">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
      </div>

      <div className="topnav-center">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm theo tên thiết bị, số Serial..."
            className="search-input"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
      </div>

      <div className="topnav-right">
        {isAuthenticated && (
          <div ref={bellRef} style={{ position: 'relative' }}>
            <button 
              className="nav-action-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Thông báo"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="notification-badge-count">{unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-dropdown-header">
                  <span className="notification-dropdown-title">Thông báo</span>
                  {unreadCount > 0 && (
                    <button 
                      className="notification-dropdown-clear" 
                      onClick={markAllAsRead}
                    >
                      Đọc tất cả
                    </button>
                  )}
                </div>
                <div className="notification-dropdown-list">
                  {notificationItems.length > 0 ? (
                    notificationItems.map((item) => {
                      const isUnread = !readIds.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          className={`notification-item ${isUnread ? 'unread' : ''}`}
                          onClick={() => {
                            markAsRead(item.id);
                            setShowNotifications(false);
                            navigate(item.link);
                          }}
                        >
                          <div className="notification-item-icon-wrapper">
                            <Info size={16} />
                          </div>
                          <div className="notification-item-content">
                            <div className="notification-item-title">{item.title}</div>
                            <div className="notification-item-message">{item.message}</div>
                            <div className="notification-item-time">{item.time}</div>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="notification-empty">
                      <Bell size={24} style={{ opacity: 0.4 }} />
                      <span>Không có thông báo nào</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {isAuthenticated ? (
          /* ===== ĐÃ ĐĂNG NHẬP: Hiện avatar + tên ===== */
          <div
            ref={profileRef}
            className="user-profile"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="avatar">{initial}</div>
            <div className="user-info">
              <span className="user-name">{name}</span>
              <span className="user-role">
                {role?.toLowerCase() === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
              </span>
            </div>
            <ChevronDown size={16} color="var(--text-secondary)" />

            {showDropdown && (
              <div className="user-dropdown">
                <div className="user-dropdown-info">
                  <div className="dropdown-name">{name}</div>
                  <div className="dropdown-dept">
                    {department || (role?.toLowerCase() === 'admin' ? 'Quản trị viên' : 'Nhân viên')}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="user-dropdown-item danger"
                >
                  <LogOut size={16} /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ===== CHƯA ĐĂNG NHẬP: Nút Đăng nhập ===== */
          <button
            className="btn-login-topnav"
            onClick={() => navigate('/login')}
          >
            <LogIn size={16} />
            <span>Đăng nhập</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default TopNav;
