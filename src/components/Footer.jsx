import { Trophy, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="glass mt-auto">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center space-x-2 mb-4 md:mb-0">
          <Trophy className="w-6 h-6 text-primary-500" />
          <span className="font-display text-xl tracking-wider gradient-text">CAN 2025</span>
        </div>
        <div className="flex items-center space-x-6 text-gray-400 text-sm">
          <Link to="/" className="hover:text-primary-500 transition-colors">Accueil</Link>
          <Link to="/matchs" className="hover:text-primary-500 transition-colors">Matchs</Link>
          <Link to="/classement" className="hover:text-primary-500 transition-colors">Classement</Link>
        </div>
        <div className="flex items-center space-x-1 text-gray-400 text-sm mt-4 md:mt-0">
          <span>Fait avec</span><Heart className="w-4 h-4 text-red-500 fill-red-500" /><span>pour la CAN 2025</span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
