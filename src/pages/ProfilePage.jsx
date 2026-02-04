import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Trophy, Target, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { predictionsAPI } from '../api';

const ProfilePage = () => {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await predictionsAPI.getMyPredictions();
      setPredictions(res.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderFlag = (flagUrl, name) => {
    if (!flagUrl) return <span className="text-xl">🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http')) {
      return <img src={flagUrl} alt={name} className="w-8 h-6 object-cover rounded" />;
    }
    return <span className="text-xl">{flagUrl}</span>;
  };

  const completedPredictions = predictions.filter(p => p.status === 'completed');
  const correctPredictions = completedPredictions.filter(p => p.points_earned > 0);
  const totalPoints = completedPredictions.reduce((sum, p) => sum + (p.points_earned || 0), 0);
  const successRate = completedPredictions.length > 0 
    ? ((correctPredictions.length / completedPredictions.length) * 100).toFixed(0) 
    : 0;

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
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card mb-8">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-white">{user?.name?.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{user?.name}</h1>
              <p className="text-gray-400">{user?.phone}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="text-center">
              <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{totalPoints}</p>
              <p className="text-xs text-gray-400">Points</p>
            </div>
            <div className="text-center">
              <Target className="w-6 h-6 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{correctPredictions.length}</p>
              <p className="text-xs text-gray-400">Corrects</p>
            </div>
            <div className="text-center">
              <Calendar className="w-6 h-6 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{predictions.length}</p>
              <p className="text-xs text-gray-400">Pronos</p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-6 h-6 text-primary-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{successRate}%</p>
              <p className="text-xs text-gray-400">Réussite</p>
            </div>
          </div>
        </motion.div>

        {/* Predictions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
          <h2 className="text-xl font-bold text-white mb-4">Mes Pronostics</h2>

          {predictions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Aucun pronostic</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {predictions.map((pred, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl ${
                    pred.status === 'completed'
                      ? pred.points_earned > 0
                        ? 'bg-green-500/10 border border-green-500/30'
                        : 'bg-red-500/10 border border-red-500/30'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">{pred.tournament_name || 'Match amical'}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      pred.status === 'completed' ? 'bg-gray-500/20 text-gray-400' :
                      pred.status === 'live' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {pred.status === 'completed' ? 'Terminé' : pred.status === 'live' ? 'En cours' : 'À venir'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1">
                      {renderFlag(pred.team1_flag, pred.team1_name)}
                      <span className="text-white text-sm">{pred.team1_name}</span>
                    </div>
                    <div className="px-4 text-center">
                      <div className="text-primary-400 font-bold">{pred.team1_score} - {pred.team2_score}</div>
                      {pred.status === 'completed' && (
                        <div className="text-xs text-gray-500">Réel: {pred.actual_team1_score} - {pred.actual_team2_score}</div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 flex-1 justify-end">
                      <span className="text-white text-sm">{pred.team2_name}</span>
                      {renderFlag(pred.team2_flag, pred.team2_name)}
                    </div>
                  </div>

                  {pred.status === 'completed' && pred.points_earned > 0 && (
                    <div className="mt-2 text-right">
                      <span className="text-green-400 text-sm font-semibold">+{pred.points_earned} pts</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
