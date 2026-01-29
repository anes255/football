import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// Layout
import Navbar from './components/Navbar';
import AdminLayout from './components/AdminLayout';

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
import AdminTournaments from './pages/admin/AdminTournaments';
import AdminTeams from './pages/admin/AdminTeams';
import AdminMatches from './pages/admin/AdminMatches';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSettings';

// Route Guards
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
            
            {/* Protected Routes */}
            <Route path="/profil" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes with Sidebar Layout */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }>
              <Route path="tournois" element={<AdminTournaments />} />
              <Route path="equipes" element={<AdminTeams />} />
              <Route path="matchs" element={<AdminMatches />} />
              <Route path="utilisateurs" element={<AdminUsers />} />
              <Route path="parametres" element={<AdminSettings />} />
            </Route>
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
