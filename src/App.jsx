import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// Layout
import Navbar from './components/Navbar';

// Public Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MatchesPage from './pages/MatchesPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import TournamentsPage from './pages/TournamentsPage';
import TournamentDetailPage from './pages/TournamentDetailPage';

// Admin Pages
import AdminTeams from './pages/admin/AdminTeams';
import AdminMatches from './pages/admin/AdminMatches';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSettings';
import AdminTournaments from './pages/admin/AdminTournaments';

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-900">
          <Navbar />
          
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/connexion" element={<LoginPage />} />
            <Route path="/inscription" element={<RegisterPage />} />
            <Route path="/matchs" element={<MatchesPage />} />
            <Route path="/classement" element={<LeaderboardPage />} />
            <Route path="/tournois" element={<TournamentsPage />} />
            <Route path="/tournois/:id" element={<TournamentDetailPage />} />
            
            {/* Protected Routes (logged in users) */}
            <Route path="/profil" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin/tournois" element={
              <AdminRoute>
                <AdminTournaments />
              </AdminRoute>
            } />
            <Route path="/admin/equipes" element={
              <AdminRoute>
                <AdminTeams />
              </AdminRoute>
            } />
            <Route path="/admin/matchs" element={
              <AdminRoute>
                <AdminMatches />
              </AdminRoute>
            } />
            <Route path="/admin/utilisateurs" element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            } />
            <Route path="/admin/parametres" element={
              <AdminRoute>
                <AdminSettings />
              </AdminRoute>
            } />
          </Routes>
          
          <Toaster 
            position="top-center"
            toastOptions={{
              style: {
                background: '#1f2937',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)'
              }
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
