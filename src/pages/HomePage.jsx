import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Calendar, Users, TrendingUp, ChevronRight, Star } from 'lucide-react';
import { matchesAPI, leaderboardAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [matchesRes, leaderboardRes] = await Promise.all([matchesAPI.getAll(), leaderboardAPI.getAll()]);
      setUpcomingMatches(matchesRes.data.filter(m => m.status === 'upcoming').slice(0, 3));
      setTopUsers(leaderboardRes.data.slice(0, 5));
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen pt-20 pb-8">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-transparent to-secondary-600/20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="inline-block mb-6">
              <Trophy className="w-20 h-20 text-primary-500 mx-auto" />
            </motion.div>
            <h1 className="font-display text-5xl md:text-7xl tracking-wider mb-4"><span className="gradient-text">PRONOSTICS</span><br /><span className="text-white">CAN 2025</span></h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">Prédisez les résultats des matchs de la Coupe d'Afrique des Nations 2025 et montrez que vous êtes le meilleur pronostiqueur !</p>
            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/inscription" className="btn-primary text-lg px-8 py-3">Commencer maintenant<ChevronRight className="inline w-5 h-5 ml-2" /></Link>
                <Link to="/connexion" className="text-gray-300 hover:text-white transition-colors">Déjà inscrit ? Se connecter</Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/matchs" className="btn-primary text-lg px-8 py-3">Faire mes pronostics<ChevronRight className="inline w-5 h-5 ml-2" /></Link>
                <p className="text-gray-300">Bienvenue, <span className="text-primary-500 font-semibold">{user?.name}</span> !</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[{ icon: Calendar, label: 'Matchs à venir', value: upcomingMatches.length, color: 'primary' }, { icon: Users, label: 'Participants', value: topUsers.length + '+', color: 'secondary' }, { icon: TrendingUp, label: 'Pronostics', value: '100+', color: 'primary' }].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card flex items-center space-x-4">
              <div className={`p-4 rounded-xl bg-${stat.color}-500/20`}><stat.icon className={`w-8 h-8 text-${stat.color}-500`} /></div>
              <div><p className="text-3xl font-bold text-white">{stat.value}</p><p className="text-gray-400">{stat.label}</p></div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-3xl text-white tracking-wider">Prochains Matchs</h2>
          <Link to="/matchs" className="text-primary-500 hover:text-primary-400 transition-colors flex items-center">Voir tout<ChevronRight className="w-5 h-5 ml-1" /></Link>
        </div>
        {loading ? <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" /></div> : upcomingMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingMatches.map((match, i) => (
              <motion.div key={match.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card hover:border-primary-500/50">
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-4">{formatDate(match.match_date)}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-center"><div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white/10 flex items-center justify-center text-2xl">{match.team1_flag || '🏳️'}</div><p className="font-semibold text-white">{match.team1_name}</p></div>
                    <div className="px-4"><span className="text-2xl font-display text-gray-500">VS</span></div>
                    <div className="flex-1 text-center"><div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white/10 flex items-center justify-center text-2xl">{match.team2_flag || '🏳️'}</div><p className="font-semibold text-white">{match.team2_name}</p></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">{match.stage}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : <div className="card text-center py-12"><Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" /><p className="text-gray-400">Aucun match à venir</p></div>}
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-3xl text-white tracking-wider">Top 5 Pronostiqueurs</h2>
          <Link to="/classement" className="text-primary-500 hover:text-primary-400 transition-colors flex items-center">Classement complet<ChevronRight className="w-5 h-5 ml-1" /></Link>
        </div>
        <div className="card">
          {topUsers.length > 0 ? (
            <div className="space-y-4">
              {topUsers.map((player, i) => (
                <motion.div key={player.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className={`flex items-center justify-between p-4 rounded-xl ${i === 0 ? 'bg-primary-500/20 border border-primary-500/30' : 'bg-white/5'}`}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${i === 0 ? 'bg-primary-500 text-dark-300' : i === 1 ? 'bg-gray-400 text-dark-300' : i === 2 ? 'bg-amber-700 text-white' : 'bg-white/10 text-gray-400'}`}>{i + 1}</div>
                    <div><p className="font-semibold text-white flex items-center">{player.name}{i === 0 && <Star className="w-4 h-4 text-primary-500 ml-2 fill-primary-500" />}</p><p className="text-sm text-gray-400">{player.correct_predictions || 0} pronostics corrects</p></div>
                  </div>
                  <div className="text-right"><p className="text-2xl font-bold gradient-text">{player.total_points || 0}</p><p className="text-sm text-gray-400">points</p></div>
                </motion.div>
              ))}
            </div>
          ) : <div className="text-center py-8"><Users className="w-16 h-16 text-gray-500 mx-auto mb-4" /><p className="text-gray-400">Pas encore de participants</p></div>}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
