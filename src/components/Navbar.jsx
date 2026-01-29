import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, Menu, X, Home, Calendar, Trophy, Users, 
  LogIn, UserPlus, LogOut, User, Settings, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const navLinks = [
    { path: '/', label: 'Accueil', icon: Home },
    { path: '/tournois', label: 'Tournois', icon: Trophy },
    { path: '/matchs', label: 'Matchs', icon: Calendar },
    { path: '/classement', label: 'Classement', icon: Award },
  ];

  const adminLinks = [
    { path: '/admin/tournois', label: 'Tournois', icon: Trophy },
    { path: '/admin/equipes', label: 'Équipes', icon: Users },
    { path: '/admin/matchs', label: 'Matchs', icon: Calendar },
    { path: '/admin/utilisateurs', label: 'Utilisateurs', icon: User },
    { path: '/admin/parametres', label: 'Paramètres', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Globe className="w-8 h-8 text-primary-500" />
            <span className="font-display text-xl text-white tracking-wider">
              Prediction<span className="text-primary-500">World</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  isActive(link.path)
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <link.icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                {user.is_admin && (
                  <Link
                    to="/admin/tournois"
                    className="flex items-center space-x-2 px-4 py-2 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
                )}
                <Link
                  to="/profil"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                  <User className="w-4 h-4" />
                  <span>{user.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/connexion" className="btn-secondary flex items-center space-x-2">
                  <LogIn className="w-4 h-4" />
                  <span>Connexion</span>
                </Link>
                <Link to="/inscription" className="btn-primary flex items-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Inscription</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-gray-900 border-t border-white/10"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                    isActive(link.path)
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              ))}

              {user && user.is_admin && (
                <>
                  <div className="border-t border-white/10 my-3 pt-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wider px-4 mb-2">Administration</p>
                  </div>
                  {adminLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                        isActive(link.path)
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'text-yellow-400/70 hover:text-yellow-400 hover:bg-yellow-500/10'
                      }`}
                    >
                      <link.icon className="w-5 h-5" />
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </>
              )}

              <div className="border-t border-white/10 my-3 pt-3">
                {user ? (
                  <>
                    <Link
                      to="/profil"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg"
                    >
                      <User className="w-5 h-5" />
                      <span>{user.name}</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg w-full"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Déconnexion</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/connexion"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg"
                    >
                      <LogIn className="w-5 h-5" />
                      <span>Connexion</span>
                    </Link>
                    <Link
                      to="/inscription"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-primary-400 hover:bg-primary-500/10 rounded-lg"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span>Inscription</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
