import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Phone, Lock, Trophy, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { teamsAPI } from '../api';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [teams, setTeams] = useState([]);
  const [formData, setFormData] = useState({ name: '', phone: '', password: '', confirmPassword: '', predicted_winner_id: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { teamsAPI.getAll().then(r => setTeams(r.data)).catch(console.error); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) { toast.error('Les mots de passe ne correspondent pas'); return; }
    if (formData.password.length < 6) { toast.error('Mot de passe: 6 caractères minimum'); return; }
    setLoading(true);
    try {
      await register({ name: formData.name, phone: formData.phone, password: formData.password, predicted_winner_id: formData.predicted_winner_id ? parseInt(formData.predicted_winner_id) : null });
      toast.success('Inscription réussie !');
      navigate('/');
    } catch (error) { toast.error(error.response?.data?.error || 'Erreur'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 text-primary-500 mx-auto mb-4" />
            <h1 className="font-display text-4xl gradient-text tracking-wider">Inscription</h1>
            <p className="text-gray-400 mt-2">Créez votre compte</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div><label className="block text-sm text-gray-300 mb-2">Nom complet</label><div className="relative"><User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input pl-10" placeholder="Votre nom" required /></div></div>
            <div><label className="block text-sm text-gray-300 mb-2">Téléphone</label><div className="relative"><Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input pl-10" placeholder="0600000000" required /></div></div>
            <div><label className="block text-sm text-gray-300 mb-2">Mot de passe</label><div className="relative"><Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="input pl-10" placeholder="••••••••" required /></div></div>
            <div><label className="block text-sm text-gray-300 mb-2">Confirmer</label><div className="relative"><Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="input pl-10" placeholder="••••••••" required /></div></div>
            <div><label className="block text-sm text-gray-300 mb-2">Vainqueur prédit</label><select value={formData.predicted_winner_id} onChange={(e) => setFormData({ ...formData, predicted_winner_id: e.target.value })} className="input"><option value="">Sélectionner</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select><p className="text-xs text-gray-500 mt-1">Points bonus si votre équipe gagne !</p></div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center space-x-2">{loading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <><UserPlus className="w-5 h-5" /><span>S'inscrire</span></>}</button>
          </form>
          <p className="text-center text-gray-400 mt-6">Déjà inscrit ? <Link to="/connexion" className="text-primary-500 hover:text-primary-400 font-semibold">Se connecter</Link></p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
