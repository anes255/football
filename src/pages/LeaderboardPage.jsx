import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, TrendingUp, Target, Users } from 'lucide-react';
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
      setLeaderboard(res.data);
    } catch (error) {
      console.error('Error:', error);
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

  // Calculate stats
  const totalPredictions = leaderboard.reduce((sum, u) => sum + (u.total_predictions || 0), 0);
  const totalPoints = leaderboard.reduce((sum, u) => sum + (u.total_points || 0), 0);
  const avgPoints = leaderboard.length > 0 ? (totalPoints / leaderboard.length).toFixed(1) : 0;

  // Find current user's rank
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
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl gradient-text">Classement</h1>
          <p className="text-gray-400 mt-2">Découvrez les meilleurs pronostiqueurs</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center"
          >
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{leaderboard.length}</p>
            <p className="text-sm text-gray-400">Joueurs</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card text-center"
          >
            <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{totalPredictions}</p>
            <p className="text-sm text-gray-400">Pronostics</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card text-center"
          >
            <TrendingUp className="w-8 h-8 text-primary-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{avgPoints}</p>
            <p className="text-sm text-gray-400">Moyenne pts</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card text-center"
          >
            <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{leaderboard[0]?.total_points || 0}</p>
            <p className="text-sm text-gray-400">Top score</p>
          </motion.div>
        </div>

        {/* Your Rank Banner */}
        {user && userRank > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card bg-gradient-to-r from-primary-500/20 to-accent-500/20 border-primary-500/30 mb-8"
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
              <div className="text-right">
                <p className="text-2xl font-bold text-primary-400">
                  {leaderboard.find(u => u.id === user.id)?.total_points || 0} pts
                </p>
                <p className="text-sm text-gray-400">
                  {leaderboard.find(u => u.id === user.id)?.correct_predictions || 0} bons pronos
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Podium for Top 3 */}
        {leaderboard.length >= 3 && (
          <div className="flex justify-center items-end space-x-4 mb-8">
            {/* 2nd Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mb-2">
                <span className="text-2xl font-bold text-white">{leaderboard[1].name.charAt(0)}</span>
              </div>
              <p className="text-white font-semibold truncate max-w-[80px]">{leaderboard[1].name}</p>
              <p className="text-gray-400 text-sm">{leaderboard[1].total_points} pts</p>
              <div className="w-20 h-16 bg-gray-500/30 rounded-t-lg mt-2 flex items-center justify-center">
                <Medal className="w-8 h-8 text-gray-300" />
              </div>
            </motion.div>

            {/* 1st Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mb-2 ring-4 ring-yellow-400/30">
                <span className="text-3xl font-bold text-white">{leaderboard[0].name.charAt(0)}</span>
              </div>
              <p className="text-white font-bold truncate max-w-[100px]">{leaderboard[0].name}</p>
              <p className="text-yellow-400 font-semibold">{leaderboard[0].total_points} pts</p>
              <div className="w-24 h-24 bg-yellow-500/30 rounded-t-lg mt-2 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-yellow-400" />
              </div>
            </motion.div>

            {/* 3rd Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-2">
                <span className="text-2xl font-bold text-white">{leaderboard[2].name.charAt(0)}</span>
              </div>
              <p className="text-white font-semibold truncate max-w-[80px]">{leaderboard[2].name}</p>
              <p className="text-gray-400 text-sm">{leaderboard[2].total_points} pts</p>
              <div className="w-20 h-12 bg-orange-500/30 rounded-t-lg mt-2 flex items-center justify-center">
                <Award className="w-8 h-8 text-orange-500" />
              </div>
            </motion.div>
          </div>
        )}

        {/* Full Leaderboard */}
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">Classement complet</h2>
          
          {leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Aucun joueur inscrit</p>
            </div>
          ) : (
            <div className="space-y-3">
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
                    <div className="flex items-center justify-center w-8">
                      {getRankIcon(index)}
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-orange-500 text-white' :
                      'bg-white/10 text-white'
                    }`}>
                      {player.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-semibold">
                        {player.name}
                        {user && player.id === user.id && (
                          <span className="text-xs text-primary-400 ml-2">(Vous)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-400">
                        {player.total_predictions || 0} pronostics • {player.correct_predictions || 0} bons
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${
                      index === 0 ? 'text-yellow-400' :
                      index === 1 ? 'text-gray-300' :
                      index === 2 ? 'text-orange-400' :
                      'text-primary-400'
                    }`}>
                      {player.total_points} pts
                    </p>
                    {player.total_predictions > 0 && (
                      <p className="text-xs text-gray-500">
                        {((player.correct_predictions / player.total_predictions) * 100).toFixed(0)}% réussite
                      </p>
                    )}
                  </div>
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
