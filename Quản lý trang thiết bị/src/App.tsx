import React, { createContext, useContext, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MasterLayout from './components/layout/MasterLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Devices from './pages/DeviceList';
import DeviceDetails from './pages/DeviceProfile';
import RepairRequest from './pages/RepairRequest';
import AdminRepairs from './pages/AdminRepairs';
import Reports from './pages/Reports';
import GspLog from './pages/GspLog';
import Transfers from './pages/Transfers';

// ========== AUTH CONTEXT ==========

interface AuthState {
  isAuthenticated: boolean;
  role: string;
  name: string;
  username: string;
  email: string;
  department: string;
}

interface AuthContextType extends AuthState {
  login: (user: { username: string; name: string; role: string; email?: string; department?: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false, role: '', name: '', username: '', email: '', department: '',
  login: () => {}, logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => ({
    isAuthenticated: localStorage.getItem('isAuthenticated') === 'true',
    role: localStorage.getItem('userRole') || '',
    name: localStorage.getItem('userName') || '',
    username: localStorage.getItem('username') || '',
    email: localStorage.getItem('userEmail') || '',
    department: localStorage.getItem('userDepartment') || '',
  }));

  const login = useCallback((user: { username: string; name: string; role: string; email?: string; department?: string }) => {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('username', user.username);
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('userName', user.name);
    localStorage.setItem('userEmail', user.email || '');
    localStorage.setItem('userDepartment', user.department || '');
    setAuth({ isAuthenticated: true, ...user, email: user.email || '', department: user.department || '' });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userDepartment');
    setAuth({ isAuthenticated: false, role: '', name: '', username: '', email: '', department: '' });
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ========== ROUTE GUARDS ==========

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

function LoginRedirect() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Login />;
}

// ========== APP ==========

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/login" element={<LoginRedirect />} />

          <Route path="/" element={<MasterLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* ✅ PUBLIC */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="devices" element={<Devices />} />
            <Route path="devices/:id" element={<DeviceDetails />} />

            {/* 🔒 PRIVATE */}
            <Route path="repairs" element={<PrivateRoute><RepairRequest /></PrivateRoute>} />
            <Route path="admin-repairs" element={<PrivateRoute><AdminRepairs /></PrivateRoute>} />
            <Route path="transfers" element={<PrivateRoute><Transfers /></PrivateRoute>} />
            <Route path="reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
            <Route path="gsp" element={<PrivateRoute><GspLog /></PrivateRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
