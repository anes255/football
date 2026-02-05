import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import Navbar from './components/Navbar';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MatchesPage from './pages/MatchesPage';
import TournamentsPage from './pages/TournamentsPage';
import TournamentDetailPage from './pages/TournamentDetailPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import TeamsPage from './pages/TeamsPage';
import TeamPage from './pages/TeamPage';

// Admin Pages
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTeams from './pages/admin/AdminTeams';
import AdminMatches from './pages/admin/AdminMatches';
import AdminTournaments from './pages/admin/AdminTournaments';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSettings';
import AdminScoring from './pages/admin/AdminScoring';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div></div>;
  if (!user) return <Navigate to="/connexion" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div></div>;
  if (!user || !user.is_admin) return <Navigate to="/" />;
  return children;
};

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/inscription" element={<RegisterPage />} />
        <Route path="/matchs" element={<MatchesPage />} />
        <Route path="/tournois" element={<TournamentsPage />} />
        <Route path="/tournois/:id" element={<TournamentDetailPage />} />
        <Route path="/equipes" element={<TeamsPage />} />
        <Route path="/equipe/:id" element={<TeamPage />} />
        <Route path="/classement" element={<LeaderboardPage />} />
        <Route path="/profil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="equipes" element={<AdminTeams />} />
          <Route path="matchs" element={<AdminMatches />} />
          <Route path="tournois" element={<AdminTournaments />} />
          <Route path="utilisateurs" element={<AdminUsers />} />
          <Route path="scoring" element={<AdminScoring />} />
          <Route path="parametres" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster position="top-center" toastOptions={{ style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
