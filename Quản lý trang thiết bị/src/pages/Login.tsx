import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { Input, Button } from '../components/ui';
import { fetchUsers } from '../services/api';
import { useAuth } from '../App';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const users = await fetchUsers();
      const userMatch = users.find(u => u.username === username && u.password === password);

      if (userMatch) {
        // Lưu email riêng (không nằm trong context)
        if (userMatch.email) localStorage.setItem('userEmail', userMatch.email);
        else localStorage.removeItem('userEmail');

        // login() cập nhật Context → toàn app re-render ngay lập tức
        login(userMatch.name, userMatch.role);
        navigate('/dashboard');
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
      }
    } catch (err) {
      console.error(err);
      setError('Không thể kết nối đến máy chủ xác thực.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <HeartPulse size={48} className="login-logo" />
          <h1 className="login-title">Trung tâm Y tế khu vực Thanh Ba</h1>
          <p className="login-subtitle">Hệ thống Quản lý Trang thiết bị Y tế</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          {error && (
            <div style={{ color: 'var(--danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--danger-light)', padding: '10px', borderRadius: '4px' }}>
              <AlertCircle size={16} /> <span>{error}</span>
            </div>
          )}
          
          <Input 
            type="text" 
            placeholder="Tên đăng nhập hoặc Email" 
            icon={<Mail size={18} />}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input 
            type="password" 
            placeholder="Mật khẩu" 
            icon={<Lock size={18} />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" />
              Nhớ mật khẩu
            </label>
            <a href="#" className="forgot-password">Quên mật khẩu?</a>
          </div>

          <Button type="submit" variant="primary" className="login-btn" disabled={isLoading}>
            {isLoading ? <><Loader2 size={18} className="animate-spin" /> Đang đăng nhập...</> : 'Đăng nhập'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
