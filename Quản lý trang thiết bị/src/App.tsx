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

// ========== AUTH CONTEXT ==========

interface AuthState {
  isAuthenticated: boolean;
  role: string;
  name: string;
}

interface AuthContextType extends AuthState {
  login: (name: string, role: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false, role: '', name: '',
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
  }));

  const login = useCallback((name: string, role: string) => {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', name);
    setAuth({ isAuthenticated: true, role, name });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    setAuth({ isAuthenticated: false, role: '', name: '' });
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
      <BrowserRouter>
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
