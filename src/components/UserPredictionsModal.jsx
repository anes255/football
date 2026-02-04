import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Target, Calendar, TrendingUp } from 'lucide-react';
import { leaderboardAPI } from '../api';

const UserPredictionsModal = ({ userId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      const res = await leaderboardAPI.getUserPredictions(userId);
      setData(res.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderFlag = (flagUrl, name) => {
    if (!flagUrl) return <span className="text-lg">🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http')) {
      return <img src={flagUrl} alt={name} className="w-6 h-4 object-cover rounded" />;
    }
    return <span className="text-lg">{flagUrl}</span>;
  };

  if (!userId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {loading ? 'Chargement...' : data?.user?.name}
              </h2>
              {data?.user && (
                <p className="text-gray-400 text-sm">
                  Rang #{data.user.rank} • Membre depuis {new Date(data.user.created_at).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 p-6 border-b border-white/10">
                <div className="text-center">
                  <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white">{data?.user?.total_points || 0}</p>
                  <p className="text-xs text-gray-400">Points</p>
                </div>
                <div className="text-center">
                  <Target className="w-6 h-6 text-green-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white">{data?.user?.correct_predictions || 0}</p>
                  <p className="text-xs text-gray-400">Corrects</p>
                </div>
                <div className="text-center">
                  <Calendar className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white">{data?.user?.total_predictions || 0}</p>
                  <p className="text-xs text-gray-400">Pronos</p>
                </div>
                <div className="text-center">
                  <TrendingUp className="w-6 h-6 text-primary-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white">
                    {data?.user?.total_predictions > 0 
                      ? ((data?.user?.correct_predictions / data?.user?.total_predictions) * 100).toFixed(0)
                      : 0}%
                  </p>
                  <p className="text-xs text-gray-400">Réussite</p>
                </div>
              </div>

              {/* Predictions List */}
              <div className="p-6 overflow-y-auto max-h-[400px]">
                <h3 className="text-lg font-semibold text-white mb-4">Historique des pronostics</h3>
                
                {data?.predictions?.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Aucun pronostic visible</p>
                ) : (
                  <div className="space-y-3">
                    {data?.predictions?.map((pred, index) => (
                      <div 
                        key={index} 
                        className={`p-4 rounded-xl ${
                          pred.points_earned > 0 
                            ? 'bg-green-500/10 border border-green-500/30' 
                            : 'bg-white/5 border border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-400">
                            {pred.tournament_name || 'Match amical'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(pred.match_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1">
                            {renderFlag(pred.team1_flag, pred.team1_name)}
                            <span className="text-white text-sm">{pred.team1_name}</span>
                          </div>
                          
                          <div className="px-4 text-center">
                            <div className="text-sm">
                              <span className="text-primary-400 font-bold">
                                {pred.team1_score} - {pred.team2_score}
                              </span>
                            </div>
                            {pred.status === 'completed' && (
                              <div className="text-xs text-gray-500">
                                Réel: {pred.actual_team1_score} - {pred.actual_team2_score}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 flex-1 justify-end">
                            <span className="text-white text-sm">{pred.team2_name}</span>
                            {renderFlag(pred.team2_flag, pred.team2_name)}
                          </div>
                        </div>

                        {pred.points_earned > 0 && (
                          <div className="mt-2 text-right">
                            <span className="text-green-400 text-sm font-semibold">
                              +{pred.points_earned} pts
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserPredictionsModal;
