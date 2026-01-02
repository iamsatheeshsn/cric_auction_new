import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TournamentBracket from './pages/TournamentBracket';
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
import FanZone from './pages/FanZone';

import Settings from './pages/Settings';
import MatchAnalytics from './pages/MatchAnalytics';
import TransferWindow from './pages/TransferWindow';
import BroadcastView from './pages/BroadcastView';
import StrategyDashboard from './pages/StrategyDashboard';
import SocialMediaTools from './pages/SocialMediaTools';
import TournamentHistory from './pages/TournamentHistory';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';

import { SocketProvider } from './context/SocketContext';

function App() {
  return (
    <ThemeProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-white transition-colors duration-300">
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
              <Route path="/players" element={<ProtectedRoute><Players /></ProtectedRoute>} />
              <Route path="/players/:auctionId" element={<ProtectedRoute><Players /></ProtectedRoute>} />
              <Route path="/fixtures/:auctionId" element={<ProtectedRoute><Fixtures /></ProtectedRoute>} />
              <Route path="/auction-room/:auctionId" element={<ProtectedRoute><AuctionRoom /></ProtectedRoute>} />
              <Route path="/match-scoring/:fixtureId" element={<ProtectedRoute><MatchScoring /></ProtectedRoute>} />
              <Route path="/match-analytics/:fixtureId" element={<ProtectedRoute><MatchAnalytics /></ProtectedRoute>} />

              <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/points" element={<ProtectedRoute><PointsTable /></ProtectedRoute>} />
              <Route path="/auction/:id/points" element={<ProtectedRoute><PointsTable /></ProtectedRoute>} />
              <Route path="/fanzone" element={<ProtectedRoute><FanZone /></ProtectedRoute>} />
              <Route path="/compare" element={<ProtectedRoute><PlayerComparison /></ProtectedRoute>} />

              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/auction/:auctionId/transfer-window" element={<ProtectedRoute><TransferWindow /></ProtectedRoute>} />
              <Route path="/tournament-bracket/:auctionId" element={<ProtectedRoute><TournamentBracket /></ProtectedRoute>} />

              {/* Broadcast Route (Public/Protected?) - Keeping protected for now, usually would be distinct */}
              <Route path="/broadcast/:fixtureId" element={<ProtectedRoute><BroadcastView /></ProtectedRoute>} />

              {/* Strategy Dashboard */}
              <Route path="/strategy" element={<ProtectedRoute><StrategyDashboard /></ProtectedRoute>} />

              <Route path="/social-tools" element={<ProtectedRoute><SocialMediaTools /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><TournamentHistory /></ProtectedRoute>} />
            </Routes>

          </div>
        </Router>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;
