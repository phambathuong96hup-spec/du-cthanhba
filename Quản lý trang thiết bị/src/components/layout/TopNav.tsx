import React, { useState } from 'react';
import { Menu, Search, Bell, ChevronDown, LogOut, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import './TopNav.css';

interface TopNavProps {
  toggleSidebar: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { isAuthenticated, name, role, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const initial = name ? name.charAt(0).toUpperCase() : '?';

  const handleLogout = () => {
    logout();                    // ← xóa state + localStorage → re-render toàn app
    setShowDropdown(false);
    navigate('/dashboard');
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
          />
        </div>
      </div>

      <div className="topnav-right">
        <button className="nav-action-btn">
          <Bell size={20} />
          <span className="notification-badge"></span>
        </button>

        {isAuthenticated ? (
          /* ===== ĐÃ ĐĂNG NHẬP: Hiện avatar + tên ===== */
          <div
            className="user-profile"
            onClick={() => setShowDropdown(!showDropdown)}
            style={{ position: 'relative', cursor: 'pointer' }}
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
              <div
                style={{
                  position: 'absolute', top: '100%', right: 0,
                  background: 'white', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '8px 0', marginTop: '8px',
                  zIndex: 100, minWidth: '160px', boxShadow: 'var(--shadow-md)'
                }}
              >
                <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 16px', background: 'none', border: 'none',
                    textAlign: 'left', color: 'var(--danger)', fontSize: '0.9rem', cursor: 'pointer'
                  }}
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
