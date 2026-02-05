import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Trophy, Target, Check, XCircle } from 'lucide-react';
import { predictionsAPI } from '../api';

const UserPredictionsModal = ({ userId, userName, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserPredictions();
  }, [userId]);

  const fetchUserPredictions = async () => {
    try {
      const res = await predictionsAPI.getUserPredictions(userId);
      setData(res.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderFlag = (flagUrl, name) => {
    if (!flagUrl) return <span className="text-sm">🏳️</span>;
    if (flagUrl.startsWith('data:') || flagUrl.startsWith('http')) {
      return <img src={flagUrl} alt={name} className="w-6 h-4 object-cover rounded" />;
    }
    return <span className="text-sm">{flagUrl}</span>;
  };

  const getResultColor = (points) => {
    if (points >= 5) return 'text-green-400 bg-green-500/20';
    if (points > 0) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">{data?.user?.name || userName}</h2>
            <p className="text-primary-400 font-semibold">{data?.user?.total_points || 0} points</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-100px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : (
            <>
              {/* Tournament Winner Predictions */}
              {data?.winnerPredictions?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span>Prédictions Vainqueur</span>
                  </h3>
                  <div className="space-y-2">
                    {data.winnerPredictions.map((wp, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                        <div className="flex items-center space-x-3">
                          {renderFlag(wp.flag_url, wp.team_name)}
                          <div>
                            <p className="text-white font-medium">{wp.team_name}</p>
                            <p className="text-xs text-gray-400">{wp.tournament_name}</p>
                          </div>
                        </div>
                        {wp.points_earned > 0 && (
                          <span className="text-green-400 font-bold">+{wp.points_earned} pts</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Match Predictions */}
              <h3 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-500" />
                <span>Pronostics ({data?.predictions?.length || 0})</span>
              </h3>

              {data?.predictions?.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun pronostic terminé</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data?.predictions?.map((pred, index) => (
                    <motion.div
                      key={pred.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="p-4 bg-white/5 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">{pred.tournament_name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getResultColor(pred.points_earned)}`}>
                          {pred.points_earned > 0 ? `+${pred.points_earned} pts` : '0 pts'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        {/* Team 1 */}
                        <div className="flex-1 flex items-center space-x-2">
                          {renderFlag(pred.team1_flag, pred.team1_name)}
                          <span className="text-white text-sm truncate">{pred.team1_name}</span>
                        </div>

                        {/* Scores */}
                        <div className="flex-1 text-center">
                          <div className="text-xs text-gray-400 mb-1">Prono</div>
                          <div className="text-white font-bold">{pred.team1_score} - {pred.team2_score}</div>
                          <div className="text-xs text-gray-400 mt-1">Réel</div>
                          <div className="text-gray-300 text-sm">{pred.actual_team1_score} - {pred.actual_team2_score}</div>
                        </div>

                        {/* Team 2 */}
                        <div className="flex-1 flex items-center justify-end space-x-2">
                          <span className="text-white text-sm truncate">{pred.team2_name}</span>
                          {renderFlag(pred.team2_flag, pred.team2_name)}
                        </div>
                      </div>

                      {/* Result indicator */}
                      <div className="mt-2 flex justify-center">
                        {pred.points_earned >= 5 ? (
                          <span className="text-xs text-green-400 flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>Score exact!</span>
                          </span>
                        ) : pred.points_earned > 0 ? (
                          <span className="text-xs text-yellow-400 flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>Bon résultat</span>
                          </span>
                        ) : (
                          <span className="text-xs text-red-400 flex items-center space-x-1">
                            <XCircle className="w-3 h-3" />
                            <span>Raté</span>
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default UserPredictionsModal;
