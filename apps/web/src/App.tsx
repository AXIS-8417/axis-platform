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
import QuoteHistory from './pages/QuoteHistory';
import QuoteView from './pages/QuoteView';
import QuoteMerge from './pages/QuoteMerge';
import PlatformLayout from './components/PlatformLayout';
import PlatformLogin from './pages/platform/PlatformLogin';
import PlatformSignup from './pages/platform/PlatformSignup';
import MemberManage from './pages/platform/MemberManage';
import GapHome from './pages/platform/gap/GapHome';
import GapSites from './pages/platform/gap/GapSites';
import GapWorkRecords from './pages/platform/gap/GapWorkRecords';
import GapDocuments from './pages/platform/gap/GapDocuments';
import GapBilling from './pages/platform/gap/GapBilling';
import GapDesignChange from './pages/platform/gap/GapDesignChange';
import GapContractProgress from './pages/platform/gap/GapContractProgress';
import EulHome from './pages/platform/eul/EulHome';
import EulWorkOrders from './pages/platform/eul/EulWorkOrders';
import EulCalls from './pages/platform/eul/EulCalls';
import EulGate from './pages/platform/eul/EulGate';
import EulSettlement from './pages/platform/eul/EulSettlement';
import EulContractProgress from './pages/platform/eul/EulContractProgress';
import EulReputation from './pages/platform/eul/EulReputation';
import EulEquipment from './pages/platform/eul/EulEquipment';
import EulContracts from './pages/platform/eul/EulContracts';
import EulRemicon from './pages/platform/eul/EulRemicon';
import ByeongHome from './pages/platform/byeong/ByeongHome';
import ByeongCalls from './pages/platform/byeong/ByeongCalls';
import ByeongReports from './pages/platform/byeong/ByeongReports';
import ByeongSafety from './pages/platform/byeong/ByeongSafety';
import ByeongGrade from './pages/platform/byeong/ByeongGrade';
import ByeongContracts from './pages/platform/byeong/ByeongContracts';
import PlatformDash from './pages/platform/PlatformDash';
import GPSView from './pages/platform/GPSView';
import RiskView from './pages/platform/RiskView';
import SealView from './pages/platform/SealView';
import PartyDocManage from './pages/platform/PartyDocManage';

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
        <Route path="/quotes" element={<QuoteHistory />} />
        <Route path="/quotes/view/:id" element={<QuoteView />} />
        <Route path="/quotes/merge" element={<QuoteMerge />} />

        {/* Platform */}
        <Route path="/platform/login" element={<PlatformLogin />} />
        <Route path="/platform/signup" element={<PlatformSignup />} />
        <Route path="/platform/members" element={<PlatformLayout role="갑"><MemberManage /></PlatformLayout>} />
        <Route path="/platform/gap" element={<PlatformLayout role="갑"><GapHome /></PlatformLayout>} />
        <Route path="/platform/gap/sites" element={<PlatformLayout role="갑"><GapSites /></PlatformLayout>} />
        <Route path="/platform/gap/records" element={<PlatformLayout role="갑"><GapWorkRecords /></PlatformLayout>} />
        <Route path="/platform/gap/documents" element={<PlatformLayout role="갑"><GapDocuments /></PlatformLayout>} />
        <Route path="/platform/gap/billing" element={<PlatformLayout role="갑"><GapBilling /></PlatformLayout>} />
        <Route path="/platform/gap/design-change" element={<PlatformLayout role="갑"><GapDesignChange /></PlatformLayout>} />
        <Route path="/platform/gap/contract/:id" element={<PlatformLayout role="갑"><GapContractProgress /></PlatformLayout>} />
        <Route path="/platform/eul" element={<PlatformLayout role="을"><EulHome /></PlatformLayout>} />
        <Route path="/platform/eul/work-orders" element={<PlatformLayout role="을"><EulWorkOrders /></PlatformLayout>} />
        <Route path="/platform/eul/calls" element={<PlatformLayout role="을"><EulCalls /></PlatformLayout>} />
        <Route path="/platform/eul/gate" element={<PlatformLayout role="을"><EulGate /></PlatformLayout>} />
        <Route path="/platform/eul/settlement" element={<PlatformLayout role="을"><EulSettlement /></PlatformLayout>} />
        <Route path="/platform/eul/contract/:id" element={<PlatformLayout role="을"><EulContractProgress /></PlatformLayout>} />
        <Route path="/platform/eul/reputation" element={<PlatformLayout role="을"><EulReputation /></PlatformLayout>} />
        <Route path="/platform/eul/equipment" element={<PlatformLayout role="을"><EulEquipment /></PlatformLayout>} />
        <Route path="/platform/eul/contracts" element={<PlatformLayout role="을"><EulContracts /></PlatformLayout>} />
        <Route path="/platform/eul/remicon" element={<PlatformLayout role="을"><EulRemicon /></PlatformLayout>} />
        <Route path="/platform/byeong" element={<PlatformLayout role="병"><ByeongHome /></PlatformLayout>} />
        <Route path="/platform/byeong/calls" element={<PlatformLayout role="병"><ByeongCalls /></PlatformLayout>} />
        <Route path="/platform/byeong/reports" element={<PlatformLayout role="병"><ByeongReports /></PlatformLayout>} />
        <Route path="/platform/byeong/safety" element={<PlatformLayout role="병"><ByeongSafety /></PlatformLayout>} />
        <Route path="/platform/byeong/grade" element={<PlatformLayout role="병"><ByeongGrade /></PlatformLayout>} />
        <Route path="/platform/byeong/contracts" element={<PlatformLayout role="병"><ByeongContracts /></PlatformLayout>} />
        <Route path="/platform/dashboard" element={<PlatformLayout role="갑"><PlatformDash /></PlatformLayout>} />
        <Route path="/platform/gps" element={<PlatformLayout role="을"><GPSView /></PlatformLayout>} />
        <Route path="/platform/risk" element={<PlatformLayout role="을"><RiskView /></PlatformLayout>} />
        <Route path="/platform/seal" element={<PlatformLayout role="을"><SealView /></PlatformLayout>} />
        <Route path="/platform/docs" element={<PartyDocManage />} />
        <Route path="/platform/gap/docs" element={<PlatformLayout role="갑"><PartyDocManage /></PlatformLayout>} />
        <Route path="/platform/eul/docs" element={<PlatformLayout role="을"><PartyDocManage /></PlatformLayout>} />
        <Route path="/platform/byeong/docs" element={<PlatformLayout role="병"><PartyDocManage /></PlatformLayout>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
