import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Counters from './pages/Counters.jsx';
import MyTokens from './pages/MyTokens.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/counters'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/counters" element={<Counters />} />
        <Route path="/my-tokens" element={<MyTokens />} />
      </Route>

      <Route element={<ProtectedRoute adminOnly><Layout /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      <Route path="*" element={<Home />} />
    </Routes>
  );
}
