import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Auctions from './pages/Auctions';
import Teams from './pages/Teams';
import Players from './pages/Players';
import Fixtures from './pages/Fixtures';
import PointsTable from './pages/PointsTable';
import PlayerComparison from './pages/PlayerComparison';
import AuctionRoom from './pages/AuctionRoom';
import MatchScoring from './pages/MatchScoring';
import Stats from './pages/Stats';
import Analytics from './pages/Analytics';
import SpectatorView from './pages/SpectatorView';
import RegisterPage from './pages/RegisterPage';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/spectator/:auctionId" element={<SpectatorView />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/auctions" element={<ProtectedRoute><Auctions /></ProtectedRoute>} />
          <Route path="/teams/:auctionId" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
          <Route path="/players/:auctionId" element={<ProtectedRoute><Players /></ProtectedRoute>} />
          <Route path="/fixtures/:auctionId" element={<ProtectedRoute><Fixtures /></ProtectedRoute>} />
          <Route path="/auction-room/:auctionId" element={<ProtectedRoute><AuctionRoom /></ProtectedRoute>} />
          <Route path="/match-scoring/:fixtureId" element={<ProtectedRoute><MatchScoring /></ProtectedRoute>} />

          <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/points" element={<ProtectedRoute><PointsTable /></ProtectedRoute>} />
          <Route path="/compare" element={<ProtectedRoute><PlayerComparison /></ProtectedRoute>} />

          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
