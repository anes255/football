import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Phone, Lock, Trophy, UserPlus, Flag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { teamsAPI } from '../api';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [teams, setTeams] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    predicted_winner_id: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    teamsAPI.getAll()
      .then(res => setTeams(res.data))
      .catch(err => console.error('Error loading teams:', err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('Mot de passe: 6 caractères minimum');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
        predicted_winner_id: formData.predicted_winner_id ? parseInt(formData.predicted_winner_id) : null
      });
      toast.success('Inscription réussie !');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const selectedTeam = teams.find(t => t.id === parseInt(formData.predicted_winner_id));

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="card">
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 text-primary-500 mx-auto mb-4" />
            <h1 className="font-display text-4xl gradient-text tracking-wider">Inscription</h1>
            <p className="text-gray-400 mt-2">Créez votre compte</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nom complet */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">Nom complet</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="Votre nom"
                  required
                />
              </div>
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="0600000000"
                  required
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Confirmer mot de passe */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Vainqueur prédit */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                <Flag className="inline w-4 h-4 mr-1" />
                Vainqueur prédit (optionnel)
              </label>
              <select
                value={formData.predicted_winner_id}
                onChange={(e) => setFormData({ ...formData, predicted_winner_id: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                <option value="" className="bg-gray-800">Sélectionner une équipe</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id} className="bg-gray-800">
                    {team.flag_url && !team.flag_url.startsWith('data:') && !team.flag_url.startsWith('http') ? team.flag_url + ' ' : ''}
                    {team.name}
                  </option>
                ))}
              </select>
              {selectedTeam && (
                <div className="mt-2 p-2 bg-white/5 rounded-lg flex items-center space-x-2">
                  {selectedTeam.flag_url && (selectedTeam.flag_url.startsWith('data:') || selectedTeam.flag_url.startsWith('http')) ? (
                    <img src={selectedTeam.flag_url} alt={selectedTeam.name} className="w-6 h-4 object-cover rounded" />
                  ) : (
                    <span className="text-lg">{selectedTeam.flag_url || '🏳️'}</span>
                  )}
                  <span className="text-white text-sm">{selectedTeam.name}</span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Points bonus si votre équipe gagne le tournoi !</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>S'inscrire</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-6">
            Déjà inscrit ?{' '}
            <Link to="/connexion" className="text-primary-500 hover:text-primary-400 font-semibold">
              Se connecter
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
