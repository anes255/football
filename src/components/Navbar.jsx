import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Trophy, Home, Calendar, Users, User, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Accueil', icon: Home },
    { path: '/matchs', label: 'Matchs', icon: Calendar },
    { path: '/classement', label: 'Classement', icon: Trophy },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Trophy className="w-8 h-8 text-primary-500" />
            <span className="font-display text-2xl tracking-wider gradient-text">CAN 2025</span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${isActive(link.path) ? 'bg-primary-500/20 text-primary-500' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}>
                <link.icon className="w-4 h-4" /><span>{link.label}</span>
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                {isAdmin && <Link to="/admin" className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${location.pathname.startsWith('/admin') ? 'bg-red-500/20 text-red-500' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}><Shield className="w-4 h-4" /><span>Admin</span></Link>}
                <Link to="/profil" className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${isActive('/profil') ? 'bg-primary-500/20 text-primary-500' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}><User className="w-4 h-4" /><span>{user?.name}</span></Link>
                <button onClick={logout} className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-500/10 transition-all duration-300"><LogOut className="w-4 h-4" /><span>Déconnexion</span></button>
              </>
            ) : (
              <>
                <Link to="/connexion" className="px-4 py-2 text-gray-300 hover:text-white transition-all duration-300">Connexion</Link>
                <Link to="/inscription" className="btn-primary">Inscription</Link>
              </>
            )}
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden glass border-t border-white/10">
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)} className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${isActive(link.path) ? 'bg-primary-500/20 text-primary-500' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}>
                  <link.icon className="w-5 h-5" /><span>{link.label}</span>
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  {isAdmin && <Link to="/admin" onClick={() => setIsOpen(false)} className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"><Shield className="w-5 h-5" /><span>Administration</span></Link>}
                  <Link to="/profil" onClick={() => setIsOpen(false)} className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"><User className="w-5 h-5" /><span>Mon Profil</span></Link>
                  <button onClick={() => { logout(); setIsOpen(false); }} className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-500/10 transition-all duration-300 w-full"><LogOut className="w-5 h-5" /><span>Déconnexion</span></button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 pt-4 border-t border-white/10">
                  <Link to="/connexion" onClick={() => setIsOpen(false)} className="px-4 py-3 text-center text-gray-300 hover:text-white transition-all duration-300">Connexion</Link>
                  <Link to="/inscription" onClick={() => setIsOpen(false)} className="btn-primary text-center">Inscription</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
