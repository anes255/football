import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star, TrendingUp } from 'lucide-react';
import { leaderboardAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { leaderboardAPI.getAll().then(r => setLeaderboard(r.data)).catch(console.error).finally(() => setLoading(false)); }, []);

  const getRankStyle = (i) => i === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/50' : i === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/50' : i === 2 ? 'bg-gradient-to-r from-amber-700/20 to-amber-800/10 border-amber-700/50' : 'bg-white/5 border-white/10';

  if (loading) return <div className="min-h-screen pt-20 flex items-center justify-center"><div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-block mb-4"><Trophy className="w-16 h-16 text-primary-500" /></motion.div>
          <h1 className="font-display text-4xl md:text-5xl gradient-text tracking-wider mb-2">Classement</h1>
          <p className="text-gray-400">Les meilleurs pronostiqueurs</p>
        </div>
        {leaderboard.length >= 3 && (
          <div className="flex justify-center items-end space-x-4 mb-12">
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center"><div className="w-20 h-20 mx-auto mb-2 rounded-full bg-gray-400/20 border-2 border-gray-400 flex items-center justify-center text-3xl">🥈</div><p className="font-semibold text-white truncate max-w-24">{leaderboard[1]?.name}</p><p className="text-2xl font-bold text-gray-400">{leaderboard[1]?.total_points || 0}</p><div className="mt-2 w-24 h-20 bg-gray-400/20 rounded-t-lg" /></motion.div>
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center -mb-4"><div className="w-24 h-24 mx-auto mb-2 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center text-4xl animate-pulse-glow">🥇</div><p className="font-semibold text-white truncate max-w-28 flex items-center justify-center">{leaderboard[0]?.name}<Star className="w-4 h-4 text-yellow-500 ml-1 fill-yellow-500" /></p><p className="text-3xl font-bold gradient-text">{leaderboard[0]?.total_points || 0}</p><div className="mt-2 w-28 h-28 bg-yellow-500/20 rounded-t-lg" /></motion.div>
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center"><div className="w-20 h-20 mx-auto mb-2 rounded-full bg-amber-700/20 border-2 border-amber-700 flex items-center justify-center text-3xl">🥉</div><p className="font-semibold text-white truncate max-w-24">{leaderboard[2]?.name}</p><p className="text-2xl font-bold text-amber-700">{leaderboard[2]?.total_points || 0}</p><div className="mt-2 w-24 h-16 bg-amber-700/20 rounded-t-lg" /></motion.div>
          </div>
        )}
        <div className="card">
          <h2 className="font-display text-2xl text-white mb-6 tracking-wider">Classement complet</h2>
          {leaderboard.length > 0 ? (
            <div className="space-y-3">
              {leaderboard.map((player, i) => (
                <motion.div key={player.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${getRankStyle(i)} ${player.id === user?.id ? 'ring-2 ring-primary-500' : ''}`}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${i === 0 ? 'bg-yellow-500 text-dark-300' : i === 1 ? 'bg-gray-400 text-dark-300' : i === 2 ? 'bg-amber-700 text-white' : 'bg-white/10 text-gray-400'}`}>{i + 1}</div>
                    <div><p className="font-semibold text-white flex items-center">{player.name}{player.id === user?.id && <span className="ml-2 text-xs bg-primary-500/20 text-primary-500 px-2 py-0.5 rounded">Vous</span>}</p><p className="text-sm text-gray-400">{player.correct_predictions || 0} corrects • {player.total_predictions || 0} pronostics</p></div>
                  </div>
                  <div className="text-right"><p className={`text-2xl font-bold ${i < 3 ? 'gradient-text' : 'text-white'}`}>{player.total_points || 0}</p><p className="text-sm text-gray-400">points</p></div>
                </motion.div>
              ))}
            </div>
          ) : <div className="text-center py-12"><TrendingUp className="w-16 h-16 text-gray-500 mx-auto mb-4" /><p className="text-gray-400">Pas encore de participants</p></div>}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
