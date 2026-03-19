import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, type UserRole } from './store/authStore';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import NewQuote from './pages/quote/NewQuote';
import Matrix from './pages/quote/Matrix';
import Premium from './pages/quote/Premium';
import LevelSelect from './pages/quote/LevelSelect';
import Sent from './pages/quote/Sent';
import Compare from './pages/quote/Compare';
import RequestList from './pages/contractor/RequestList';
import SimpleRespond from './pages/contractor/SimpleRespond';
import DetailRespond from './pages/contractor/DetailRespond';
import Dashboard from './pages/Dashboard';

function PrivateRoute({ allowedRoles }: { allowedRoles?: UserRole[] }) {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/auth/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />

        {/* 갑 흐름 (public — MVP) */}
        <Route path="/quote/new" element={<NewQuote />} />
        <Route path="/quote/matrix/:id" element={<Matrix />} />
        <Route path="/quote/premium/:id" element={<Premium />} />
        <Route path="/quote/level/:id" element={<LevelSelect />} />
        <Route path="/quote/sent/:id" element={<Sent />} />
        <Route path="/quote/compare/:id" element={<Compare />} />

        {/* 을 흐름 (public — MVP) */}
        <Route path="/contractor/requests" element={<RequestList />} />
        <Route path="/contractor/respond/:id" element={<SimpleRespond />} />
        <Route path="/contractor/respond/simple/:id" element={<SimpleRespond />} />
        <Route path="/contractor/respond/detail/:id" element={<DetailRespond />} />

        {/* 기타 */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
