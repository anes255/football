import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, Trophy, Calendar, Award, User, LogOut, Shield, Globe, Flag, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://fotball-backend.onrender.com/api';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [headerName, setHeaderName] = useState('Prediction World');
  const [headerLogo, setHeaderLogo] = useState('');
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API_URL}/settings`);
        if (res.data.header_name) setHeaderName(res.data.header_name);
        else if (res.data.site_name) setHeaderName(res.data.site_name);
        if (res.data.header_logo) setHeaderLogo(res.data.header_logo);
        else if (res.data.site_logo) setHeaderLogo(res.data.site_logo);
      } catch (e) { console.error('Error fetching settings:', e); }
    };
    fetchSettings();
  }, []);

  const handleLogout = () => { logout(); navigate('/'); setIsOpen(false); };

  const navLinks = [
    { to: '/', label: 'Accueil', icon: Home },
    { to: '/tournois', label: 'Tournois', icon: Trophy },
    { to: '/equipes', label: 'Équipes', icon: Flag },
    { to: '/matchs', label: 'Matchs', icon: Calendar },
    { to: '/classement', label: 'Classement', icon: Award },
    { to: '/gagnants-du-jour', label: 'Du Jour', icon: Star },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 navbar-dynamic border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center overflow-hidden">
              {headerLogo ? <img src={headerLogo} alt="Logo" className="w-full h-full object-cover" /> : <Globe className="w-6 h-6 text-white" />}
            </div>
            <span className="font-display text-xl"><span className="gradient-text">{headerName}</span></span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${isActive(to) ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <Icon className="w-4 h-4" /><span>{label}</span>
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                {user.is_admin && <Link to="/admin" className="flex items-center space-x-2 px-4 py-2 rounded-lg text-yellow-400 hover:bg-yellow-500/10 transition-all"><Shield className="w-4 h-4" /><span>Admin</span></Link>}
                <Link to="/profil" className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${isActive('/profil') ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><User className="w-4 h-4" /><span>{user.name}</span></Link>
                <button onClick={handleLogout} className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"><LogOut className="w-4 h-4" /><span>Déconnexion</span></button>
              </>
            ) : (
              <><Link to="/connexion" className="btn-secondary text-sm">Connexion</Link><Link to="/inscription" className="btn-primary text-sm">Inscription</Link></>
            )}
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 rounded-lg hover:bg-white/5">
            {isOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden navbar-dynamic border-b border-white/10">
            <div className="px-4 py-4 space-y-2">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} onClick={() => setIsOpen(false)} className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${isActive(to) ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  <Icon className="w-5 h-5" /><span>{label}</span>
                </Link>
              ))}
              <div className="border-t border-white/10 pt-2 mt-2">
                {user ? (
                  <>
                    {user.is_admin && <Link to="/admin" onClick={() => setIsOpen(false)} className="flex items-center space-x-3 px-4 py-3 rounded-lg text-yellow-400 hover:bg-yellow-500/10"><Shield className="w-5 h-5" /><span>Administration</span></Link>}
                    <Link to="/profil" onClick={() => setIsOpen(false)} className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"><User className="w-5 h-5" /><span>Mon profil</span></Link>
                    <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10"><LogOut className="w-5 h-5" /><span>Déconnexion</span></button>
                  </>
                ) : (
                  <div className="flex flex-col space-y-2 px-4">
                    <Link to="/connexion" onClick={() => setIsOpen(false)} className="btn-secondary text-center">Connexion</Link>
                    <Link to="/inscription" onClick={() => setIsOpen(false)} className="btn-primary text-center">Inscription</Link>
                  </div>
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
