import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Users } from 'lucide-react';
import { leaderboardAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await leaderboardAPI.getAll();
      setLeaderboard(res.data || []);
    } catch (error) {
      console.error('Error:', error);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-300" />;
    if (index === 2) return <Award className="w-6 h-6 text-orange-500" />;
    return <span className="text-gray-400 font-bold w-6 text-center">{index + 1}</span>;
  };

  const getRankBg = (index) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/30';
    if (index === 1) return 'bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/30';
    if (index === 2) return 'bg-gradient-to-r from-orange-500/20 to-orange-600/10 border-orange-500/30';
    return 'bg-white/5 border-white/10';
  };

  const userRank = user ? leaderboard.findIndex(u => u.id === user.id) + 1 : null;

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">Classement</h1>
          <p className="text-gray-400">{leaderboard.length} joueurs</p>
        </div>

        {/* Your Rank */}
        {user && userRank > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card bg-gradient-to-r from-primary-500/20 to-accent-500/20 border-primary-500/30 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-500/30 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-primary-400">#{userRank}</span>
                </div>
                <div>
                  <p className="text-white font-semibold">Votre position</p>
                  <p className="text-sm text-gray-400">{user.name}</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-primary-400">
                {leaderboard.find(u => u.id === user.id)?.total_points || 0} pts
              </div>
            </div>
          </motion.div>
        )}

        {/* Podium for top 3 */}
        {leaderboard.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center items-end space-x-4 mb-8"
          >
            {/* 2nd Place */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gray-400 flex items-center justify-center">
                <span className="text-2xl font-bold text-black">2</span>
              </div>
              <div className="bg-gray-400/20 rounded-t-lg px-4 py-6 h-24">
                <p className="text-white font-semibold text-sm truncate max-w-[80px]">{leaderboard[1]?.name}</p>
                <p className="text-gray-300 font-bold">{leaderboard[1]?.total_points || 0}</p>
              </div>
            </div>
            
            {/* 1st Place */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-yellow-500 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-black" />
              </div>
              <div className="bg-yellow-500/20 rounded-t-lg px-4 py-6 h-32">
                <p className="text-white font-semibold truncate max-w-[80px]">{leaderboard[0]?.name}</p>
                <p className="text-yellow-400 font-bold text-xl">{leaderboard[0]?.total_points || 0}</p>
              </div>
            </div>
            
            {/* 3rd Place */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-orange-500 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <div className="bg-orange-500/20 rounded-t-lg px-4 py-6 h-20">
                <p className="text-white font-semibold text-sm truncate max-w-[80px]">{leaderboard[2]?.name}</p>
                <p className="text-orange-400 font-bold">{leaderboard[2]?.total_points || 0}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Full Leaderboard */}
        <div className="card">
          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Aucun joueur inscrit</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`flex items-center justify-between p-4 rounded-xl border ${getRankBg(index)} ${
                    user && player.id === user.id ? 'ring-2 ring-primary-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-8 flex justify-center">{getRankIcon(index)}</div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-orange-500 text-white' : 'bg-white/10 text-white'
                    }`}>
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-semibold flex items-center space-x-2">
                        <span>{player.name}</span>
                        {user && player.id === user.id && (
                          <span className="text-xs text-primary-400">(Vous)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p className={`text-xl font-bold ${
                    index === 0 ? 'text-yellow-400' :
                    index === 1 ? 'text-gray-300' :
                    index === 2 ? 'text-orange-400' : 'text-primary-400'
                  }`}>
                    {player.total_points || 0}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
