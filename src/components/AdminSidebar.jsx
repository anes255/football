import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Flag, Settings, Award, ArrowLeft, Globe } from 'lucide-react';

const AdminSidebar = () => {
  const location = useLocation();
  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/equipes', label: 'Équipes', icon: Flag },
    { path: '/admin/matchs', label: 'Matchs', icon: Calendar },
    { path: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
    { path: '/admin/scoring', label: 'Scoring', icon: Award },
    { path: '/admin/parametres', label: 'Paramètres', icon: Settings },
  ];

  const isActive = (path, exact = false) => exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="w-64 min-h-screen glass border-r border-white/10 p-4">
      <div className="flex items-center space-x-2 mb-8 px-2">
        <Globe className="w-8 h-8 text-primary-500" />
        <div><h2 className="font-display text-xl gradient-text">Admin</h2><p className="text-xs text-gray-400">Prediction World</p></div>
      </div>
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <Link key={item.path} to={item.path} className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${isActive(item.path, item.exact) ? 'bg-primary-500/20 text-primary-500 border-l-4 border-primary-500' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <item.icon className="w-5 h-5" /><span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-8 pt-8 border-t border-white/10">
        <Link to="/" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300">
          <ArrowLeft className="w-5 h-5" /><span>Retour au site</span>
        </Link>
      </div>
    </div>
  );
};

export default AdminSidebar;
