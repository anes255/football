import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Trophy, Target, Calendar, TrendingUp, Award } from 'lucide-react';
import { predictionsAPI, leaderboardAPI, authAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [profileRes, predictionsRes, leaderboardRes] = await Promise.all([authAPI.getProfile(), predictionsAPI.getMyPredictions(), leaderboardAPI.getAll()]);
      setProfile(profileRes.data);
      setPredictions(predictionsRes.data);
      const idx = leaderboardRes.data.findIndex(p => p.id === user?.id);
      setRank(idx !== -1 ? idx + 1 : null);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const stats = [
    { label: 'Points', value: profile?.total_points || 0, icon: Trophy, color: 'primary' },
    { label: 'Classement', value: rank ? `#${rank}` : '-', icon: TrendingUp, color: 'secondary' },
    { label: 'Pronostics', value: predictions.length, icon: Target, color: 'primary' },
    { label: 'Corrects', value: profile?.correct_predictions || 0, icon: Award, color: 'secondary' },
  ];

  if (loading) return <div className="min-h-screen pt-20 flex items-center justify-center"><div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center text-4xl font-bold text-white">{profile?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold text-white mb-1">{profile?.name}</h1>
              <p className="text-gray-400 flex items-center justify-center md:justify-start space-x-2"><User className="w-4 h-4" /><span>{profile?.phone}</span></p>
              {profile?.predicted_winner && <p className="text-sm text-gray-400 mt-2">Vainqueur prédit : <span className="text-primary-500 font-semibold">{profile.predicted_winner}</span></p>}
            </div>
            {rank && rank <= 3 && <div className="text-center"><div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${rank === 1 ? 'bg-yellow-500/20' : rank === 2 ? 'bg-gray-400/20' : 'bg-amber-700/20'}`}>{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</div></div>}
          </div>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card text-center">
              <stat.icon className={`w-8 h-8 mx-auto mb-2 text-${stat.color}-500`} /><p className="text-3xl font-bold text-white">{stat.value}</p><p className="text-sm text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card">
          <h2 className="font-display text-2xl text-white mb-6 tracking-wider">Historique des pronostics</h2>
          {predictions.length > 0 ? (
            <div className="space-y-4">
              {predictions.map((p) => (
                <div key={p.id} className={`p-4 rounded-xl border ${p.status === 'completed' ? (p.points_earned > 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30') : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-center"><p className="text-sm text-gray-400">{formatDate(p.match_date)}</p></div>
                      <div className="flex items-center space-x-2"><span className="font-semibold text-white">{p.team1_name}</span><span className="text-primary-500 font-bold">{p.team1_score} - {p.team2_score}</span><span className="font-semibold text-white">{p.team2_name}</span></div>
                    </div>
                    <div className="text-right">
                      {p.status === 'completed' ? <><p className="text-sm text-gray-400">Résultat: {p.actual_team1_score} - {p.actual_team2_score}</p><p className={`font-bold ${p.points_earned > 0 ? 'text-green-500' : 'text-red-500'}`}>{p.points_earned > 0 ? `+${p.points_earned} pts` : '0 pt'}</p></> : <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">En attente</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-8"><Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" /><p className="text-gray-400">Aucun pronostic</p></div>}
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
