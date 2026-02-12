import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Trophy, Users, Calendar, Settings, Flag, Home, LayoutDashboard, Award } from 'lucide-react';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const adminLinks = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/tournois', label: 'Tournois', icon: Trophy },
    { path: '/admin/equipes', label: 'Équipes', icon: Flag },
    { path: '/admin/matchs', label: 'Matchs', icon: Calendar },
    { path: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
    { path: '/admin/scoring', label: 'Scoring', icon: Award },
    { path: '/admin/parametres', label: 'Paramètres', icon: Settings },
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    // For non-exact matches, check if current path starts with the link path
    // but avoid matching /admin for /admin/equipes etc
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen pt-16">
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-gray-800/50 border-r border-white/10 p-4">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white">Administration</h2>
          <p className="text-sm text-gray-400">Gérez votre plateforme</p>
        </div>
        
        <nav className="space-y-2">
          {adminLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                isActive(link.path, link.exact)
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <link.icon className="w-5 h-5" />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <Link
            to="/"
            className="flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <Home className="w-5 h-5" />
            <span>Retour au site</span>
          </Link>
        </div>
      </div>

      {/* Mobile Admin Nav */}
      <div className="md:hidden bg-gray-800/50 border-b border-white/10 px-4 py-3">
        <select
          value={adminLinks.find(l => isActive(l.path, l.exact))?.path || '/admin'}
          onChange={(e) => navigate(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-primary-500"
        >
          {adminLinks.map((link) => (
            <option key={link.path} value={link.path}>{link.label}</option>
          ))}
        </select>
      </div>

      {/* Main Content */}
      <div className="md:ml-64">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
